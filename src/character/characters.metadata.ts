export interface CharacterMeta {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:MM
  age?: number;
  dominantElement: 'wood' | 'fire' | 'earth' | 'metal' | 'water' | 'mixed';
  yinYang: 'yin' | 'yang' | 'mixed';
  sajuNotes: string;
  physiognomyTags: string[];
  personality: string;
}

export const CHARACTERS_META: CharacterMeta[] = [
  {
    id: 'yunseah',
    name: '윤세아',
    birthDate: '2009-04-12',
    birthTime: '06:20',
    age: 17,
    dominantElement: 'water',
    yinYang: 'yin',
    sajuNotes: '차분하고 안정적인 기운이 강함. 감정 표현은 절제된 편이며 신중한 판단을 선호함.',
    physiognomyTags: ['차분한표정', '부드러운눈매', '작은입술'],
    personality: '내향적이고 신중하며 깊은 신뢰를 중시함',
  },
  {
    id: 'choiharam',
    name: '최하람',
    birthDate: '2008-08-05',
    birthTime: '14:10',
    age: 18,
    dominantElement: 'fire',
    yinYang: 'yang',
    sajuNotes: '활기차고 적극적인 기운. 대외활동에 강하고 분위기 메이커 역할을 함.',
    physiognomyTags: ['밝은미소', '활발한표정', '큰눈'],
    personality: '외향적이고 낙천적이며 사람들에게 에너지를 주는 타입',
  },
  {
    id: 'kwaknayun',
    name: '곽나연',
    birthDate: '2007-11-21',
    birthTime: '09:45',
    age: 19,
    dominantElement: 'metal',
    yinYang: 'yin',
    sajuNotes: '절제된 품위와 정제된 성품이 돋보임. 규범과 품격을 중시함.',
    physiognomyTags: ['고급스러운인상', '단정한얼굴선', '예의바른표정'],
    personality: '신중하고 우아하며 자기관리 능력이 뛰어남',
  },
  {
    id: 'ansuho',
    name: '안수호',
    birthDate: '2009-06-18',
    birthTime: '12:30',
    age: 17,
    dominantElement: 'wood',
    yinYang: 'yang',
    sajuNotes: '친화력 있고 활동적인 기운. 관계 형성에 능하고 신뢰감이 빨리 쌓임.',
    physiognomyTags: ['호감형얼굴', '활발한표정', '넉넉한미소'],
    personality: '친근하고 사교적이며 신뢰를 주는 타입',
  },
  {
    id: 'kimjaehyun',
    name: '김재현',
    birthDate: '2008-02-02',
    birthTime: '07:50',
    age: 18,
    dominantElement: 'earth',
    yinYang: 'mixed',
    sajuNotes: '안정감 있고 책임감 있는 기운이 강함. 신뢰를 중시하는 성향.',
    physiognomyTags: ['차분한인상', '단정한헤어스타일', '온화한미소'],
    personality: '성실하고 듬직하며 감정기복이 적음',
  },
  {
    id: 'seongchanyeong',
    name: '성찬영',
    birthDate: '2007-10-09',
    birthTime: '22:15',
    age: 19,
    dominantElement: 'metal',
    yinYang: 'mixed',
    sajuNotes: '겉으로는 절제되어 보이지만 내면에 보호심과 열정이 공존함. 반전 매력이 있음.',
    physiognomyTags: ['쿨한인상', '짧은미소', '강한눈빛'],
    personality: '겉은 쿨하지만 속은 다정한 츤데레형',
  },
];

export default CHARACTERS_META;
