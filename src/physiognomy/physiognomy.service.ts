import { Injectable } from '@nestjs/common';
import { CreatePhysiognomyDto } from './dto/create-physiognomy.dto';
import { UpdatePhysiognomyDto } from './dto/update-physiognomy.dto';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { Physiognomy } from './entities/physiognomy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { User } from '@/user/entities/user.entity';
@Injectable()
export class PhysiognomyService {
  private ai: GoogleGenAI;

  constructor(private readonly configService: ConfigService,
    @InjectRepository(Physiognomy) private readonly physiognomyRepository: Repository<Physiognomy>,
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {
    this.ai = new GoogleGenAI({ apiKey: this.configService.get<string>('GOOGLE_API_KEY') });
  }

  async create(createPhysiognomyDto: CreatePhysiognomyDto, image: Express.Multer.File) {
    const base64Data = image.buffer.toString('base64');
    const mimeType = image.mimetype;

    const user = await this.userRepository.findOne({ where: { uuid: createPhysiognomyDto.uuid } });
    if (!user) {
      throw new NotFoundException('해당 ID에 해당하는 사용자를 찾을 수 없습니다.');
    }

    const prompt = `
        당신은 30년 경력의 현대적인 관상 전문가입니다. 
        사용자의 정보는 다음과 같습니다:
        이름: ${user.name}
        성별: ${user.gender}
        생년월일: ${user.birthDate}
        태어난 장소: ${user.location}
        달력 종류: ${user.calendar}
        태어난 시간: ${user.birthTime}
        제공된 인물 사진을 분석하여 다음 항목을 설명해주세요:
        1. 전체적인 인상과 오행(木, 火, 土, 金, 水) 분류
        2. 눈, 코, 입, 이마의 특징
        3. 재물운, 연애운, 직장운, 학업운, 건강운
        그리고 다음과 같은 JSON 형식으로 결과를 제공해주세요:
        {
          "overall_analysis": {
            "impression": "전체적으로 골격이 뚜렷하고 신뢰감을 주는 인상",
            "five_elements": "金 (금)",
            "element_description": "단단하고 곧은 성품을 상징하며 결단력이 강한 유형"
          },
          "facial_features": {
            "forehead": {
              "shape": "넓고 평평한 이마",
              "meaning": "초년운이 좋고 학문적 성취가 높을 상"
            }, "eyes": {...}, "nose": {...}, "mouth": {...}
          },
          "fortune_prediction": {
            "wealth": {
              "score": 85,
              "description": "꾸준한 근로 소득과 더불어 부동산 운이 따름"
            },
            "romance": {...}, "career": {...}, "academic": {...}, "health": {...}
          },
          "summary_advice": "전반적으로 강직한 금(金)의 기운을 타고났으므로, 유연한 태도를 기른다면 대성할 관상임"
        }
      `;

    const start = new Date();
    const response = await this.ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType, data: base64Data } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });
    const end = new Date();
    console.log(`AI 응답 시간: ${(end.getTime() - start.getTime()) / 1000}초`);

    const data = response.text || '{}';
    const dataObj = JSON.parse(data);
    if (await this.physiognomyRepository.findOne({ where: { user: { uuid: createPhysiognomyDto.uuid } } })) {
      await this.physiognomyRepository.update({ user: { uuid: createPhysiognomyDto.uuid } }, { data: dataObj });
    } else {
      await this.physiognomyRepository.save({ data: dataObj, user: { uuid: createPhysiognomyDto.uuid } });
    }

    return dataObj;
  }
  async findOne(uuid: string) {
    console.log('PhysiognomyService.findOne uuid:', uuid);

    const result = await this.physiognomyRepository.findOne({ where: { user: { uuid: uuid } } });

    if (!result) {
      throw new NotFoundException(`해당 ID에 해당하는 관상 분석 결과를 찾을 수 없습니다.`);
    }

    return { physiognomy: result?.data };
  }
}
