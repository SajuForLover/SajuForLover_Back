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
        const userId = createCompatibilityDto.userId;

        if (!userId) {
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
            throw new NotFoundException('해당 사용자의 사주 또는 관상 정보를 찾을 수 없습니다.');
        }

        let userGender = normalizeGender(createCompatibilityDto.gender)
            || normalizeGender(saju?.gender)
            || normalizeGender(saju?.profile?.gender);

        if (!userGender && userId) {
            const userRow = await this.userRepository.findOne({ where: { uuid: userId } });
            userGender = normalizeGender(userRow?.gender);
        }

        const targetGender = oppositeGender(userGender);
        const candidateCharacters = targetGender
            ? CHARACTERS_META.filter((meta) => meta.gender === targetGender)
            : CHARACTERS_META;

        // 사용자 정보에서 가능한 필드 추출
        const userElement = extractUserElement(saju, physiognomy);
        const userElementRatios = buildElementRatioMap(saju);
        const physTags: string[] = extractPhysiognomyTags(physiognomy);

        // 간단한 점수화: 오행 일치/상생/상극 및 관상 태그 겹침
        const nextElement: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
        const prevElement: Record<string, string> = { wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal' };

        const scored: Array<{ meta: CharacterMeta; score: number; sajuScore: number; datingScore: number; personalityScore: number; reasons: string[] }> = candidateCharacters.map((meta) => {
            let sajuScore = 0;
            let datingScore = 0;
            let personalityScore = 0;
            const reasons: string[] = [];

            // sajuCompatibility: 오행 일치 + 오행 비율 보정
            if (userElement && meta.dominantElement) {
                if (userElement === meta.dominantElement) {
                    sajuScore += 30;
                    reasons.push('비슷한 오행을 가져 공감대가 큽니다.');
                } else if (nextElement[userElement] === meta.dominantElement) {
                    sajuScore += 20;
                    reasons.push('유저의 기운이 캐릭터의 기운을 자연스럽게 보완합니다.');
                } else if (prevElement[userElement] === meta.dominantElement) {
                    sajuScore += 8;
                    reasons.push('오행상 보완이 필요한 관계로 천천히 맞춰갈 수 있습니다.');
                }
            }

            const dominantRatio = userElementRatios[meta.dominantElement] ?? 0;
            if (dominantRatio > 0) {
                const ratioScore = Math.min(20, Math.round(dominantRatio * 0.5));
                if (ratioScore > 0) {
                    sajuScore += ratioScore;
                    reasons.push(`주 오행 비율(${meta.dominantElement}) 반영 점수 ${ratioScore}점이 부여되었습니다.`);
                }
            }

            // datingStyle: 관상 태그 매칭
            const metaTagsNorm = (meta.physiognomyTags || []).map(toCanonicalTag).filter(Boolean);
            const physTagsNorm = (physTags || []).map(normalizeTag).filter(Boolean);
            const overlap = metaTagsNorm.filter((t) => {
                if (physTagsNorm.includes(t)) return true;
                return physTagsNorm.some((p) => p.includes(t) || t.includes(p));
            }).length;
            if (overlap > 0) {
                datingScore += Math.min(30, overlap * 10);
                reasons.push(`${overlap}개의 관상 태그가 일치해 친밀감이 빠르게 형성됩니다.`);
            }

            // preferencePersonality: 성격 키워드 어간 매칭 (sajuNotes + personality + 오행 특성 포함)
            const fiveElementsChars = resolveFiveElements(saju)
                .map((e: any) => e?.characteristics)
                .filter(Boolean);

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
            ]
                .filter(Boolean)
                .join(' ');

            const userPersonalityStems = extractStems(userPersonalityText);
            const charPersonalityStems = extractStems([meta.personality, meta.sajuNotes].filter(Boolean).join(' '));

            const personalityMatchCount = charPersonalityStems.filter((cs) =>
                userPersonalityStems.some(
                    (us) =>
                        us === cs ||
                        us.includes(cs) ||
                        cs.includes(us) ||
                        (cs.length >= 2 && us.startsWith(cs.slice(0, 2))) ||
                        (us.length >= 2 && cs.startsWith(us.slice(0, 2))),
                ),
            ).length;

            if (personalityMatchCount >= 1) {
                personalityScore += Math.min(20, personalityMatchCount * 4);
                reasons.push(`성격 키워드 ${personalityMatchCount}개가 일치해 소통이 원활할 가능성이 있습니다.`);
            }

            const score = sajuScore + datingScore + personalityScore;

            // 기본 보정: 모든 가중치가 0일 때, 사주/관상 정보가 있으면 최소 점수 부여
            if (score <= 0) {
                if (userElement) {
                    sajuScore += 15;
                    reasons.push('사주 요소 정보 기반으로 기본 점수가 부여되었습니다.');
                }
                if (physTagsNorm && physTagsNorm.length > 0) {
                    const add = Math.min(20, physTagsNorm.length * 7);
                    datingScore += add;
                    reasons.push(`${physTagsNorm.length}개의 관상 단서로 보정 점수 ${add}점이 부여되었습니다.`);
                }
            }

            return { meta, score: sajuScore + datingScore + personalityScore, sajuScore, datingScore, personalityScore, reasons };
        });

        // 디버그 로그: 사용자 추출 요소와 관상 태그 및 각 캐릭터별 점수
        try {
            // eslint-disable-next-line no-console
            console.log('CHARACTER SCORING DEBUG', {
                userGender,
                targetGender,
                candidateCount: candidateCharacters.length,
                userElement,
                physTags,
                scored: scored.map((s) => ({ id: s.meta.id, name: s.meta.name, score: s.score, reasons: s.reasons })),
            });
        } catch (e) {
            // ignore logging errors
        }

        // 모든 캐릭터에 대해 점수 기준으로 정렬한 뒤, AI가 5개 섹션 문단을 생성합니다.
        scored.sort((a, b) => b.score - a.score);

        const best = scored[0];
        if (!best) {
            throw new NotFoundException('적합한 캐릭터를 찾을 수 없습니다.');
        }

        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new NotFoundException('GEMINI_API_KEY 또는 GOOGLE_API_KEY가 없어 문단을 생성할 수 없습니다.');
        }

        const userSummary = `사용자 사주: ${saju ? JSON.stringify({ dominantElement: extractUserElement(saju, physiognomy), profile: saju.profile, five_elements: saju.five_elements }) : '없음'}; 관상: ${physiognomy ? JSON.stringify({ tags: extractPhysiognomyTags(physiognomy), summary: physiognomy.summary_advice, overall_analysis: physiognomy.overall_analysis }) : '없음'}`;
        const prompt = `당신은 한국어 궁합 문구를 쓰는 작가입니다. 아래 캐릭터와 사용자 정보를 바탕으로, 반드시 JSON 객체만 출력하세요.

반드시 포함할 키: destiny, personality, elemental, dating, growth
각 값은 3~5문장 정도의 자연스러운 문단이어야 합니다.
문장 톤은 과장된 점괘 말투가 아니라, 실제 서비스 결과처럼 부드럽고 설득력 있게 써주세요.
출력에는 설명 문장, 코드블록, 마크다운, 추가 텍스트를 절대 넣지 마세요.

캐릭터: ${JSON.stringify(best.meta)}
사용자 요약: ${userSummary}`;

        console.log('캐릭터 분석 시작:', new Date().toISOString());
        try {
            const aiResp = await this.ai.models.generateContent({
                model: 'gemma-4-26b-a4b-it',
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
            });
            console.log('캐릭터 분석 완료:', new Date().toISOString());

            const parsed = JSON.parse((aiResp.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim());
            if (!parsed?.destiny || !parsed?.personality || !parsed?.elemental || !parsed?.dating || !parsed?.growth) {
                throw new Error('AI response is missing required sections');
            }

            // 각 배지를 0~100으로 정규화 후 기본 72점 부여 (데이터가 있는 것 자체가 궁합 근거)
            const MAX_SAJU = 50;
            const MAX_DATING = 30;
            const MAX_PERSONALITY = 20;
            const BASE = 72;
            const RANGE = 28;

            const normSaju = BASE + Math.round((Math.min(best.sajuScore, MAX_SAJU) / MAX_SAJU) * RANGE);
            const normDating = BASE + Math.round((Math.min(best.datingScore, MAX_DATING) / MAX_DATING) * RANGE);
            const normPersonality = BASE + Math.round((Math.min(best.personalityScore, MAX_PERSONALITY) / MAX_PERSONALITY) * RANGE);

            const overall = Math.round((normSaju + normDating + normPersonality) / 3);
            const badges = {
                sajuCompatibility: normSaju,
                datingStyle: normDating,
                preferencePersonality: normPersonality,
            };

            const compatibilityResult = {
                characterId: best.meta.id,
                characterName: best.meta.name,
                overallScore: overall,
                badgeScores: badges,
                sections: {
                    destiny: parsed.destiny,
                    personality: parsed.personality,
                    elemental: parsed.elemental,
                    dating: parsed.dating,
                    growth: parsed.growth,
                },
            };

            // DB에 저장 (사용자 uuid를 PK로 사용하므로 기존 데이터가 있으면 덮어씌움)
            await this.compatibilityRepository.save({
                userId: userId,
                ...compatibilityResult,
            });

            return compatibilityResult as any;
        } catch (err) {
            throw new NotFoundException('AI로 문단을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
    }

    async findCompatibilityByUserId(userId: string) {
        const existing = await this.compatibilityRepository.findOne({ where: { userId } });
        if (existing) return existing;
        else throw new NotFoundException('해당 사용자의 캐릭터 궁합 분석 결과를 찾을 수 없습니다. 현재 분석 중이거나, 아직 분석되지 않았습니다.');
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
