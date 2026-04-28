import { Injectable } from '@nestjs/common';
import { CreateSajuDto } from './dto/create-saju.dto';
import { UpdateSajuDto } from './dto/update-saju.dto';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from 'node_modules/@nestjs/config';
import { BirthTimeDescription } from './enums/birth-time.enum';
import { CalendarTypeDescription } from './enums/calendar-type.enum';
import { GenderDescription } from './enums/gender.enum';

@Injectable()
export class SajuService {
  private ai: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    this.ai = new GoogleGenAI({ apiKey: this.configService.get<string>('GOOGLE_API_KEY') });
  }


  async create(userInput: any) {
    const prompt = `
      당시은 사주를 분석하는 전문가입니다. 다음은 사주 분석에 필요한 정보입니다. 
      아래 정보를 바탕으로 사주 분석을 해주세요.
      이름: ${userInput.name}
      성별: ${userInput.gender}
      생년월일: ${userInput.birthDate}
      태어난 장소: ${userInput.location}
      달력 종류: ${userInput.calendar}
      태어난 시간: ${userInput.birthTime}
      사주를 분석한 후 아래의 형식처럼 무조건 JSON 형태로 결과를 제공해주세요. 순수한 JSON 중괄호 { 로 시작해서 }로 끝나야 합니다. 
      "data": 
        { 
          "profile": {
            "description": "대충 설명 : 5줄",
            "nickname": "듬직한바위산_무토",
            "soul_title": "흔들리지 않는 대지",
            "core_description": "어떤 시련에도 묵묵히 자리를 지키는 듬직한 리더 타입",
            "matching_mbti": [
              "ISTJ",
              "ESTJ"
            ]
          },
          "five_elements": {
            "description": "대충 설명 : 5줄",
            "elements": [
              {
                "type": "Earth",
                "name_ko": "흙",
                "ratio_percent": 66.7,
                "characteristics": "압도적인 자존감과 고집, 듬직함"
              },
              ...
            ]
          },
          "stats": {
            "description": "대충 설명 : 5줄",
            "attributes": [
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
            ]
          },
          "career": {
            "recommended_jobs": [
              "부동산 자산운용가",
              "플랫폼 운영 기획자",
              "전통 장인"
            ],
            "work_style": "혼자서 묵묵히 목표를 달성하는 '고독한 사냥꾼' 스타일",
            "warning_note": "고집이 너무 세서 팀원들이 숨막혀 할 수 있음!"
          },
          "fortune": {
            "lucky_colors": [
              "Red",
              "White"
            ],
            "lucky_direction": "South",
            "lucky_food": "매콤한 낙지볶음 (부족한 화 기운 보강)",
            "lucky_numbers": [
              2,
              7
            ],
            "best_partner": "따뜻한 햇살 같은 캐릭터 (화 기운)",
            "worst_partner": "나를 자꾸 베어내려는 예리한 캐릭터 (금 기운)"
          }
        }
      }
    `;

    const start = new Date();
    const response = await this.ai.models.generateContent({
      model: 'gemma-3-12b-it',
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
    console.log(`AI 응답 시간: ${(end.getTime() - start.getTime()) / 1000}초`);

    const data = response.text ? JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim()).data : null;

    data.profile.name = userInput.name;
    data.profile.gender = userInput.gender;
    data.profile.birthDate = userInput.birthDate;
    data.profile.location = userInput.location;
    data.profile.calendar = userInput.calendar;
    data.profile.birthTime = userInput.birthTime;

    return data;
  }

  findOne(id: number) {
    return `This action returns a #${id} saju`;
  }
}
