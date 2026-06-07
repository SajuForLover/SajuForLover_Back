import { Injectable } from '@nestjs/common';
import { CreateSajuDto } from './dto/create-saju.dto';
import { UpdateSajuDto } from './dto/update-saju.dto';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { v1 as uuid } from 'uuid';
import { Saju } from './entities/saju.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { User } from '@/user/entities/user.entity';

@Injectable()
export class SajuService {
  private ai: GoogleGenAI;

  constructor(@InjectRepository(Saju) private readonly sajuRepository: Repository<Saju>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService) {
    this.ai = new GoogleGenAI({ apiKey: this.configService.get<string>('GOOGLE_API_KEY') });
  }


  async create(userInput: any) {
    const user_id = uuid();

    await this.userRepository.save({
      uuid: user_id,
      ...userInput,
    });

    await this.sajuRepository.save({
      user: { uuid: user_id },
      isDone: false,
      data: {},
    });

    // AI로 생성 시간을 줄이기 위해 사주 데이터 생성과 저장을 분리
    this.createSajuData(user_id, userInput);

    return { user_id: user_id };
  }

  async findOne(uuid: string) {
    console.log('SajuService.findOne uuid:', uuid);

    const result = await this.sajuRepository.findOne({ where: { user: { uuid: uuid } } });

    if (!result) {
      throw new NotFoundException(`해당 ID에 해당하는 사주 분석 결과를 찾을 수 없습니다.`);
    }

    return { saju: result?.data, isDone: result?.isDone };
  }

  async createSajuData(user_id: string, userInput: any) {
    const prompt = `
      당시은 사주를 분석하는 전문가입니다. 다음은 사주 분석에 필요한 정보입니다. 아래 정보를 바탕으로 사주 분석을 해주세요.
      이름: ${userInput.name}
      성별: ${userInput.gender}
      생년월일: ${userInput.birthDate}
      태어난 장소: ${userInput.location}
      달력 종류: ${userInput.calendar}
      태어난 시간: ${userInput.birthTime}
      사주를 분석한 후 아래의 형식처럼 무조건 JSON 형태로 결과를 제공해. 순수한 JSON 중괄호 { 로 시작해서 }로 끝나야 해.
      { 
        "profile": {
          "nickname": "듬직한바위산_무토",
          "soul_title": "흔들리지 않는 대지",
          "core_description": "어떤 시련에도 묵묵히 자리를 지키는 듬직한 리더 타입",
          "matching_mbti": ["ISTJ", "ESTJ"],
        },
        "five_elements": [
          {
            "type": "Metal",
            "name_ko": "금",
            "ratio_percent": 16.7,
            "characteristics": "단호한 결단력과 강한 자존심, 정의로움"
          },
          {
              "type": "Earth",
              "name_ko": "토",
              ...
          },
          {
              "type": "Water",
              "name_ko": "수",
              ...
          },
          {
              "type": "Fire",
              "name_ko": "화",
              ...
          },
          {
              "type": "Wood",
              "name_ko": "목",
              ...
          }
        ],
        "stats": [
          {
            "type": "Patience",
            "name_ko": "인내심",
            "score": 95,
            "status": "MAX",
            "status_description": "최상급 맷집"
          },
          {
            "type": "Execution",
            "name_ko": "실행력",
            ...
          },
          {
            "type": "Money_Luck",
            "name_ko": "재물운",
            ...
          },
          {
            "type": "Social_Power",
            "name_ko": "사회성",
            ...
          },
          {
            "type": "Creative",
            "name_ko": "창의력",
            ...
          }
        ],
        "career": {
          "recommended_jobs": ["부동산 자산운용가", "플랫폼 운영 기획자"],
          "work_style": "혼자서 묵묵히 목표를 달성하는 '고독한 사냥꾼' 스타일",
          "warning_note": "고집이 너무 세서 팀원들이 숨막혀 할 수 있음!"
        },
        "fortune": {
          "lucky_colors": ["Red", "White"],
          "lucky_food": "매콤한 낙지볶음 (부족한 화 기운 보강)",
          "lucky_numbers": [2, 7],
          "best_partner": "따뜻한 햇살 같은 캐릭터 (화 기운)",
          "worst_partner": "나를 자꾸 베어내려는 예리한 캐릭터 (금 기운)"
        }
      }
    }`;

    const start = new Date();
    console.log('사주 - AI 요청 시작 시간:', start.toISOString());
    const response = await this.ai.models.generateContent({
      model: 'gemma-4-26b-a4b-it',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
          ],
        },
      ],
    });
    const end = new Date();
    console.log('사주 - AI 응답 완료 시간:', end.toISOString());
    console.log(`사주 - AI 응답 시간: ${(end.getTime() - start.getTime()) / 1000}초`);

    const data = response.text ? JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim()) : null;

    if (await this.sajuRepository.findOne({ where: { user: { uuid: user_id } } })) {
      await this.sajuRepository.update({ user: { uuid: user_id } }, { data: data, isDone: true });
    } else {
      await this.sajuRepository.save({ data: data, isDone: true, ...userInput, user: { uuid: user_id } });
    }
  }
}