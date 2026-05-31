import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreateCompatibilityDto } from './dto/create-compatibility.dto';
import { CompatibilityResultDto } from './dto/compatibility-result.dto';
import CHARACTERS_META, { CharacterMeta } from './characters.metadata';

type Sections = {
  destiny: string;
  personality: string;
  elemental: string;
  dating: string;
  growth: string;
};

@Injectable()
export class CharacterService {
  // 기존 캐릭터 생성은 이제 호환성 분석용 POST로 재사용됩니다.
  async create(createCompatibilityDto: CreateCompatibilityDto, limit = 1): Promise<CompatibilityResultDto[] | any> {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const userId =
      createCompatibilityDto.userId || createCompatibilityDto.saju?.user_uuid || createCompatibilityDto.physiognomy?.user_uuid;

    if (!userId) {
      throw new BadRequestException('userId가 필요합니다.');
    }

    let physiognomy: any = null;
    try {
      const r = await axios.get(`${baseUrl}/physiognomy/${userId}`);
      physiognomy = r.data;
    } catch (err) {
      physiognomy = null;
    }

    let saju: any = null;
    try {
      // 우선 특정 사용자 조회 엔드포인트가 있는지 시도합니다.
      const r = await axios.get(`${baseUrl}/saju/${userId}`);
      saju = r.data || null;
    } catch (err) {
      // 없으면 전체 목록에서 찾아봅니다.
      try {
        const r2 = await axios.get(`${baseUrl}/saju`);
        const list = r2.data;
        if (Array.isArray(list)) saju = list.find((s: any) => s.user_uuid === userId) || null;
      } catch (err2) {
        saju = null;
      }
    }

    if (!saju && !physiognomy) {
      throw new NotFoundException('해당 사용자의 사주 또는 관상 정보를 찾을 수 없습니다.');
    }

    // 사용자 정보에서 가능한 필드 추출
    const userElement = saju?.dominantElement || physiognomy?.overall_analysis?.five_elements || null;
    const physTags: string[] = physiognomy?.tags || physiognomy?.physiognomyTags || [];

    // 간단한 점수화: 오행 일치/상생/상극 및 관상 태그 겹침
    const nextElement: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
    const prevElement: Record<string, string> = { wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal' };

    const scored: Array<{ meta: CharacterMeta; score: number; reasons: string[] }> = CHARACTERS_META.map((meta) => {
      let score = 0;
      const reasons: string[] = [];

      if (userElement && meta.dominantElement) {
        if (userElement === meta.dominantElement) {
          score += 30;
          reasons.push('비슷한 오행을 가져 공감대가 큽니다.');
        } else if (nextElement[userElement] === meta.dominantElement) {
          score += 20;
          reasons.push('유저의 기운이 캐릭터의 기운을 자연스럽게 보완합니다.');
        } else if (prevElement[userElement] === meta.dominantElement) {
          score -= 10;
          reasons.push('오행상 주의가 필요합니다.');
        }
      }

      if (physTags && physTags.length) {
        const overlap = meta.physiognomyTags.filter((t) => physTags.includes(t)).length;
        if (overlap > 0) {
          score += Math.min(30, overlap * 10);
          reasons.push(`${overlap}개의 관상 태그가 일치해 친밀감이 빠르게 형성됩니다.`);
        }
      }

      // 성격 키워드 간단 비교
      const userKeywords = (saju?.notes || physiognomy?.summary || '') .toString().toLowerCase();
      const personaOverlap = meta.personality.toLowerCase().split(/[^a-zA-Z가-힣]+/).filter(Boolean).some((kw) => userKeywords.includes(kw));
      if (personaOverlap) {
        score += 10;
        reasons.push('성격의 연결점이 보여 소통이 원활할 가능성이 있습니다.');
      }

      return { meta, score, reasons };
    });

    // 모든 캐릭터에 대해 점수 기준으로 정렬한 뒤, 각 캐릭터마다 이미지 카드 스타일의
    // 5개 섹션(각 섹션 3~5문장 내외의 문단)을 생성하여 반환합니다.
    scored.sort((a, b) => b.score - a.score);

    const generateParagraphs = (m: CharacterMeta, score: number, reasons: string[]): Sections => {
      const scoreLabel = score >= 30 ? '매우 높음' : score >= 15 ? '높음' : score >= 5 ? '보통' : '주의';

      const destiny = `${m.name}과의 운명적 인연 및 종합 합치도: ${scoreLabel}입니다. ${reasons.join(' ')} 첫 만남에서 느껴지는 편안함과 자연스러운 끌림이 특징입니다. 서로가 서로의 삶에 활력을 불어넣어 주는 경우가 많으며, 작은 오해는 대화로 풀어가면 더 단단해집니다.`;

      const personality = `${m.name}의 성격은 ${m.personality}입니다. 성향이 서로를 보완하는 부분이 많아 소통에서 안정감이 느껴집니다. 감정 표현 방식의 차이는 있을 수 있으나, 배려로 충분히 조율 가능한 수준입니다. 일상에서의 작은 공감이 관계를 깊게 만듭니다.`;

      const elemental = `사주 오행 및 에너지 보완: ${m.dominantElement} 중심의 기운을 가진 편입니다. 당신의 사주와 만나서는 상생 또는 보완 관계를 이루어 균형을 맞추기 쉽습니다. 만약 특정 상황에서 에너지 불균형이 생기면 휴식과 대화로 조정해 보세요. 전반적으로 서로의 성장을 돕는 배치입니다.`;

      const dating = `연애 스타일 및 데이트 궁합: 함께할 때 편안함과 즐거움을 주는 스타일입니다. 가벼운 외출이나 취미 활동에서 큰 시너지가 나며, 새로운 경험을 함께하는 것을 즐깁니다. 감정 표현은 솔직한 편이라 오해를 줄이기 쉽습니다. 서로의 페이스를 맞추면 더 깊은 신뢰를 쌓을 수 있습니다.`;

      const growth = `관계 성장 및 특별 버프: 장기적으로 서로의 목표를 응원하고 지지하는 좋은 파트너가 될 가능성이 큽니다. 작은 습관이나 루틴을 공유하면 유대감이 빠르게 강화됩니다. 어려움이 와도 함께 해결해 나가는 과정에서 결속력이 더 강해집니다.`;

      return { destiny, personality, elemental, dating, growth };
    };

    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    const callGeminiForJson = async (promptText: string): Promise<any> => {
      if (!GEMINI_KEY) throw new Error('No GEMINI_API_KEY');
      const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${GEMINI_KEY}`;
      try {
        const payload = {
          prompt: {
            text: promptText,
          },
          temperature: 0.6,
          maxOutputTokens: 500,
        };
        const r = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
        return r.data;
      } catch (err) {
        throw err;
      }
    };

    const resultsPromises = scored.map(async (s) => {
      // AI 연동이 가능하면 JSON 형식으로 5개 섹션을 생성 요청
      if (GEMINI_KEY) {
        const userSummary = `사용자 사주: ${saju ? JSON.stringify({ dominantElement: saju.dominantElement, notes: saju.notes }) : '없음'}; 관상: ${physiognomy ? JSON.stringify({ tags: physiognomy.tags || physiognomy.physiognomyTags, summary: physiognomy.summary }) : '없음'}`;
        const aiPrompt = `아래 정보를 바탕으로 한국어로 유효한 JSON 객체만 출력하세요. AI는 점수 계산을 하지 말고, 5개의 섹션 텍스트만 생성하세요. 반환 JSON은 반드시 다음 키들을 포함해야 합니다: destiny, personality, elemental, dating, growth. 각 값은 3~5개의 문장으로 된 단락(이미지 카드 스타일)이어야 하며, 출력 외의 다른 텍스트는 포함하지 마세요.\n\n캐릭터: ${JSON.stringify(s.meta)}\n\n사용자 요약: ${userSummary}\n\n예시 출력 형식: {"destiny":"...","personality":"...","elemental":"...","dating":"...","growth":"..."}`;

        try {
          const aiResp = await callGeminiForJson(aiPrompt);
          // Gemini 응답에서 text는 aiResp.candidates[0].output ?? aiResp.outputText 등 다양한 위치에 존재할 수 있음
          let textOut = '';
          if (aiResp?.candidates && aiResp.candidates[0]?.content) {
            // 일부 API 버전
            textOut = aiResp.candidates[0].content[0]?.text || '';
          }
          if (!textOut && aiResp?.output?.[0]?.content) {
            textOut = aiResp.output[0].content.map((c: any) => c.text || '').join('\n');
          }
          if (!textOut && aiResp?.candidates && aiResp.candidates[0]?.output) textOut = aiResp.candidates[0].output;
          if (!textOut && typeof aiResp === 'string') textOut = aiResp;

          // AI가 JSON 문자열을 반환했을 것으로 기대하고 파싱 시도
          let parsed: any = null;
          try {
            const firstJson = textOut.trim().match(/\{[\s\S]*\}/);
            parsed = firstJson ? JSON.parse(firstJson[0]) : JSON.parse(textOut);
          } catch (e) {
            parsed = null;
          }

          if (parsed && parsed.destiny) {
            // AI는 텍스트 섹션만 생성하도록 변경: 점수는 서버의 rule-based scoring(s.score)을 사용
            const overall = Math.round(s.score);
            const badges = {
              datingStyle: Math.round(s.score),
              sajuCompatibility: Math.round(s.score),
              preferencePersonality: Math.round(s.score),
            };

            return {
              characterId: s.meta.id,
              characterName: s.meta.name,
              overallScore: overall,
              badgeScores: badges,
              sections: {
                destiny: parsed.destiny,
                personality: parsed.personality,
                elemental: parsed.elemental,
                dating: parsed.dating,
                growth: parsed.growth,
              },
            } as any;
          }
        } catch (err) {
          // AI 실패 시 폴백으로 템플릿 사용
          // console.error('AI generation failed', err);
        }
      }

      // AI가 없거나 실패한 경우 템플릿 기반 반환
      const sectionsDetailed = generateParagraphs(s.meta, s.score, s.reasons);
      return {
        characterId: s.meta.id,
        characterName: s.meta.name,
        overallScore: Math.round(s.score),
        badgeScores: {
          datingStyle: Math.round(s.score),
          sajuCompatibility: Math.round(s.score),
          preferencePersonality: Math.round(s.score),
        },
        sections: sectionsDetailed,
      } as any;
    });

    const results = await Promise.all(resultsPromises);
    // 기본적으로 최상위 1개만 반환. limit이 지정되면 상위 limit개 반환
    if (typeof limit === 'number' && limit > 0) return results.slice(0, limit);
    return results;
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
