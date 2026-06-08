import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreateCompatibilityDto } from './dto/create-compatibility.dto';
import { CompatibilityResultDto } from './dto/compatibility-result.dto';
import CHARACTERS_META, { CharacterMeta } from './characters.metadata';
import { User } from '@/user/entities/user.entity';
import { Saju } from '@/saju/entities/saju.entity';
import { Physiognomy } from '@/physiognomy/entities/physiognomy.entity';
import { Compatibility } from './entities/compatibility.entity';

type Sections = {
    destiny: string;
    personality: string;
    elemental: string;
    dating: string;
    growth: string;
};

const normalizeElement = (value: string | undefined | null): string | null => {
    if (!value) return null;

    const normalized = value.toLowerCase();
    if (normalized.includes('wood') || normalized.includes('목') || normalized.includes('木')) return 'wood';
    if (normalized.includes('fire') || normalized.includes('화') || normalized.includes('火')) return 'fire';
    if (normalized.includes('earth') || normalized.includes('토') || normalized.includes('土')) return 'earth';
    if (normalized.includes('metal') || normalized.includes('금') || normalized.includes('金')) return 'metal';
    if (normalized.includes('water') || normalized.includes('수') || normalized.includes('水')) return 'water';

    return null;
};

const resolveSajuData = (payload: any) => payload?.data?.saju ?? payload?.saju ?? payload?.data ?? payload ?? null;
const resolvePhysiognomyData = (payload: any) => payload?.data?.physiognomy ?? payload?.physiognomy ?? payload?.data ?? payload ?? null;

const resolveFiveElements = (sajuData: any): any[] => {
    if (Array.isArray(sajuData?.five_elements)) return sajuData.five_elements;
    if (Array.isArray(sajuData?.five_elements?.elements)) return sajuData.five_elements.elements;
    return [];
};

const extractUserElement = (sajuData: any, physiognomyData: any): string | null => {
    const sajuElement =
        normalizeElement(sajuData?.dominantElement) ||
        normalizeElement(sajuData?.profile?.dominantElement) ||
        normalizeElement(sajuData?.profile?.nickname) ||
        normalizeElement(sajuData?.profile?.soul_title);
    if (sajuElement) return sajuElement;

    const list = resolveFiveElements(sajuData);
    const topElement = list.length > 0
        ? [...list].sort((left: any, right: any) => Number(right?.ratio_percent ?? 0) - Number(left?.ratio_percent ?? 0))[0]
        : null;
    const extractedSajuElement = normalizeElement(topElement?.type) || normalizeElement(topElement?.name_ko);
    if (extractedSajuElement) return extractedSajuElement;

    return (
        normalizeElement(physiognomyData?.overall_analysis?.five_elements) ||
        normalizeElement(physiognomyData?.five_elements)
    );
};

const normalizeTag = (t: string | undefined | null) =>
    !t ? '' : String(t).toLowerCase().replace(/[^a-z0-9가-힣]/g, '').trim();

const toCanonicalTag = (t: string | undefined | null): string => {
    const commonSuffixes = ['표정', '눈매', '입술', '미소', '인상', '얼굴', '헤어스타일', '표현', '얼굴선'];
    let v = String(t || '');
    for (const s of commonSuffixes) v = v.replace(new RegExp(s, 'g'), '');
    return normalizeTag(v);
};

// 한국어 형용사/동사 어간 추출 (활용형 → 원형 stem)
const koreanStem = (word: string): string =>
    word
        .replace(/하고$|하며$|하게$|하여$|하면$|하지$|하는$|하다$|함$|해$|한$|하$/, '')
        .replace(/스러운$|스럽고$|스럽게$|스러워$/, '스러')
        .replace(/로운$|롭고$|롭게$|로워$/, '로')
        .replace(/[은는운]$/, '')
        .trim();

// 텍스트를 어간 토큰 배열로 분해
const extractStems = (text: string): string[] =>
    text
        .split(/[\s,.·!?~\-/]+/)
        .map((w) => normalizeTag(koreanStem(w)))
        .filter((s) => s.length >= 2);

const buildElementRatioMap = (sajuData: any): Record<string, number> => {
    const ratios: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    const list = resolveFiveElements(sajuData);
    for (const item of list) {
        const key = normalizeElement(item?.type) || normalizeElement(item?.name_ko);
        if (!key) continue;
        const v = Number(item?.ratio_percent ?? 0);
        if (!Number.isNaN(v) && v > ratios[key]) ratios[key] = v;
    }
    return ratios;
};

const normalizeGender = (value: string | undefined | null): 'male' | 'female' | null => {
    if (!value) return null;
    const v = String(value).toLowerCase().trim();
    if (v === 'male' || v === 'm' || v === '남성' || v === '남자' || v === '남') return 'male';
    if (v === 'female' || v === 'f' || v === '여성' || v === '여자' || v === '여') return 'female';
    return null;
};

const oppositeGender = (g: 'male' | 'female' | null): 'male' | 'female' | null => {
    if (g === 'male') return 'female';
    if (g === 'female') return 'male';
    return null;
};

const extractPhysiognomyTags = (physiognomyData: any): string[] => {
    const rawText = [
        physiognomyData?.summary_advice,
        physiognomyData?.overall_analysis?.impression,
        physiognomyData?.overall_analysis?.element_description,
        physiognomyData?.facial_features?.eyes?.shape,
        physiognomyData?.facial_features?.nose?.shape,
        physiognomyData?.facial_features?.mouth?.shape,
        physiognomyData?.facial_features?.forehead?.shape,
    ]
        .filter(Boolean)
        .join(' ');

    const userStems = extractStems(rawText);

    const candidateMetaTags = Array.from(
        new Set(CHARACTERS_META.flatMap((m) => m.physiognomyTags || []).map((t) => toCanonicalTag(t))),
    ).filter(Boolean);

    const matches: string[] = [];
    for (const mt of candidateMetaTags) {
        if (!mt) continue;
        const mtStem = normalizeTag(koreanStem(mt));
        if (!mtStem || mtStem.length < 2) continue;
        const matched = userStems.some(
            (us) =>
                us === mtStem ||
                us.includes(mtStem) ||
                mtStem.includes(us) ||
                (mtStem.length >= 2 && us.startsWith(mtStem.slice(0, 2))) ||
                (us.length >= 2 && mtStem.startsWith(us.slice(0, 2))),
        );
        if (matched && !matches.includes(mt)) matches.push(mt);
    }

    return matches;
};

@Injectable()
export class CharacterService {
    private ai: GoogleGenAI;

    private getApiKey(): string | undefined {
        return this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('GOOGLE_API_KEY');
    }

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(Saju) private readonly sajuRepository: Repository<Saju>,
        @InjectRepository(Physiognomy) private readonly physiognomyRepository: Repository<Physiognomy>,
        @InjectRepository(Compatibility) private readonly compatibilityRepository: Repository<Compatibility>,
    ) {
        this.ai = new GoogleGenAI({ apiKey: this.getApiKey() });
    }

    // 기존 캐릭터 생성은 이제 호환성 분석용 POST로 재사용됩니다.
    async create(createCompatibilityDto: CreateCompatibilityDto): Promise<CompatibilityResultDto | any> {
        console.log('CharacterService.create 호출됨, dto:', JSON.stringify(createCompatibilityDto));
        const userId = createCompatibilityDto.userId;

        if (!userId) {
            console.error('CharacterService.create 실패: userId 없음');
            throw new BadRequestException('userId가 필요합니다.');
        }

        // 1. 기존 분석 결과가 있는지 먼저 확인
        const existing = await this.findCompatibilityByUserId(userId);
        if (existing) {
            return {
                characterId: existing.characterId,
                characterName: existing.characterName,
                overallScore: existing.overallScore,
                badgeScores: existing.badgeScores,
                sections: existing.sections,
            };
        }

        // 2. 분석 중인 상태를 나타내는 레코드 즉시 생성 (이미 있으면 덮어씌움 - upsert)
        const pendingRecord = {
            userId: userId,
            characterId: 'pending',
            characterName: '분석 중...',
            overallScore: 0,
            badgeScores: { sajuCompatibility: 0, datingStyle: 0, preferencePersonality: 0 },
            sections: { destiny: '', personality: '', elemental: '', dating: '', growth: '' }
        };
        await this.compatibilityRepository.upsert(pendingRecord, ['userId']);

        // 3. 백그라운드에서 분석 실행
        this.runAnalysisInBackground(userId);

        return pendingRecord;
    }

    private async runAnalysisInBackground(userId: string) {
        try {
            const [physiognomyRecord, sajuRecord] = await Promise.all([
                this.physiognomyRepository.findOne({
                    where: { user: { uuid: userId } },
                    order: { createdAt: 'DESC' },
                }),
                this.sajuRepository.findOne({
                    where: { user: { uuid: userId } },
                    order: { createdAt: 'DESC' },
                }),
            ]);

            const physiognomy = physiognomyRecord ? resolvePhysiognomyData(physiognomyRecord) : null;
            const saju = sajuRecord ? resolveSajuData(sajuRecord) : null;

            if (!saju && !physiognomy) {
                console.error(`분석 실패: 사주/관상 데이터 없음, userId: ${userId}`);
                return;
            }

            let userGender = normalizeGender(saju?.gender) || normalizeGender(saju?.profile?.gender);

            if (!userGender && userId) {
                const userRow = await this.userRepository.findOne({ where: { uuid: userId } });
                userGender = normalizeGender(userRow?.gender);
            }

            const targetGender = oppositeGender(userGender);
            const candidateCharacters = targetGender
                ? CHARACTERS_META.filter((meta) => meta.gender === targetGender)
                : CHARACTERS_META;

            const userElement = extractUserElement(saju, physiognomy);
            const userElementRatios = buildElementRatioMap(saju);
            const physTags: string[] = extractPhysiognomyTags(physiognomy);

            const nextElement: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
            const prevElement: Record<string, string> = { wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal' };

            const scored: Array<{ meta: CharacterMeta; score: number; sajuScore: number; datingScore: number; personalityScore: number; reasons: string[] }> = candidateCharacters.map((meta) => {
                let sajuScore = 0;
                let datingScore = 0;
                let personalityScore = 0;
                const reasons: string[] = [];

                if (userElement && meta.dominantElement) {
                    if (userElement === meta.dominantElement) {
                        sajuScore += 30;
                    } else if (nextElement[userElement] === meta.dominantElement) {
                        sajuScore += 20;
                    } else if (prevElement[userElement] === meta.dominantElement) {
                        sajuScore += 8;
                    }
                }

                const dominantRatio = userElementRatios[meta.dominantElement] ?? 0;
                if (dominantRatio > 0) {
                    sajuScore += Math.min(20, Math.round(dominantRatio * 0.5));
                }

                const metaTagsNorm = (meta.physiognomyTags || []).map(toCanonicalTag).filter(Boolean);
                const physTagsNorm = (physTags || []).map(normalizeTag).filter(Boolean);
                const overlap = metaTagsNorm.filter((t) => physTagsNorm.includes(t) || physTagsNorm.some((p) => p.includes(t) || t.includes(p))).length;
                if (overlap > 0) {
                    datingScore += Math.min(30, overlap * 10);
                }

                const fiveElementsChars = resolveFiveElements(saju).map((e: any) => e?.characteristics).filter(Boolean);
                const userPersonalityText = [
                    saju?.profile?.core_description,
                    saju?.profile?.nickname,
                    saju?.profile?.soul_title,
                    ...(Array.isArray(saju?.profile?.matching_mbti) ? saju.profile.matching_mbti : []),
                    saju?.career?.work_style,
                    saju?.career?.warning_note,
                    ...(Array.isArray(saju?.career?.recommended_jobs) ? saju.career.recommended_jobs : []),
                    saju?.fortune?.best_partner,
                    saju?.fortune?.worst_partner,
                    ...(Array.isArray(saju?.stats) ? saju.stats.map((s: any) => s.status_description) : []),
                    saju?.notes,
                    physiognomy?.summary_advice,
                    physiognomy?.overall_analysis?.impression,
                    ...fiveElementsChars,
                ].filter(Boolean).join(' ');

                const userPersonalityStems = extractStems(userPersonalityText);
                const charPersonalityStems = extractStems([meta.personality, meta.sajuNotes].filter(Boolean).join(' '));

                const personalityMatchCount = charPersonalityStems.filter((cs) => userPersonalityStems.some((us) => us === cs || us.includes(cs) || cs.includes(us) || (cs.length >= 2 && us.startsWith(cs.slice(0, 2))) || (us.length >= 2 && cs.startsWith(us.slice(0, 2))))).length;

                if (personalityMatchCount >= 1) {
                    personalityScore += Math.min(20, personalityMatchCount * 4);
                }

                return { meta, score: sajuScore + datingScore + personalityScore, sajuScore, datingScore, personalityScore, reasons };
            });

            scored.sort((a, b) => b.score - a.score);
            const best = scored[0];
            
            const userSummary = `사용자 사주: ${saju ? JSON.stringify({ dominantElement: extractUserElement(saju, physiognomy), profile: saju.profile, five_elements: saju.five_elements }) : '없음'}; 관상: ${physiognomy ? JSON.stringify({ tags: extractPhysiognomyTags(physiognomy), summary: physiognomy.summary_advice, overall_analysis: physiognomy.overall_analysis }) : '없음'}`;
            const prompt = `당신은 한국어 궁합 문구를 쓰는 작가입니다. 아래 캐릭터와 사용자 정보를 바탕으로, 반드시 JSON 객체만 출력하세요.
반드시 포함할 키: destiny, personality, elemental, dating, growth
각 값은 3~5문장 정도의 자연스러운 문단이어야 합니다.
출력에는 설명 문장, 코드블록, 마크다운, 추가 텍스트를 절대 넣지 마세요.
캐릭터: ${JSON.stringify(best.meta)}
사용자 요약: ${userSummary}`;

            console.log('캐릭터 궁합 - AI 요청 시작 시간:', new Date().toISOString());
            const aiResp = await this.ai.models.generateContent({
                model: 'gemma-4-26b-a4b-it',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });
            console.log('캐릭터 궁합 - AI 응답 수신 시간:', new Date().toISOString());

            const parsed = JSON.parse((aiResp.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim());
            
            const MAX_SAJU = 50;
            const MAX_DATING = 30;
            const MAX_PERSONALITY = 20;
            const BASE = 72;
            const RANGE = 28;

            const normSaju = BASE + Math.round((Math.min(best.sajuScore, MAX_SAJU) / MAX_SAJU) * RANGE);
            const normDating = BASE + Math.round((Math.min(best.datingScore, MAX_DATING) / MAX_DATING) * RANGE);
            const normPersonality = BASE + Math.round((Math.min(best.personalityScore, MAX_PERSONALITY) / MAX_PERSONALITY) * RANGE);

            const overall = Math.round((normSaju + normDating + normPersonality) / 3);

            await this.compatibilityRepository.save({
                userId: userId,
                characterId: best.meta.id,
                characterName: best.meta.name,
                overallScore: overall,
                badgeScores: {
                    sajuCompatibility: normSaju,
                    datingStyle: normDating,
                    preferencePersonality: normPersonality,
                },
                sections: {
                    destiny: parsed.destiny,
                    personality: parsed.personality,
                    elemental: parsed.elemental,
                    dating: parsed.dating,
                    growth: parsed.growth,
                },
            });
            console.log(`분석 완료: userId ${userId}`);
        } catch (err) {
            console.error(`분석 에러: userId ${userId}`, err);
        }
    }

    async findCompatibilityByUserId(userId: string) {
        return await this.compatibilityRepository.findOne({ where: { userId } });
    }

    findAll() {
        return `This action returns all character`;
    }

    findOne(id: number) {
        return `This action returns a #${id} character`;
    }

    update(id: number, updateCharacterDto: UpdateCharacterDto) {
        return `This action updates a #${id} character`;
    }

    remove(id: number) {
        return `This action removes a #${id} character`;
    }
}
