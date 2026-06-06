import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { CreateTransmissionDto } from './dto/create-transmission.dto';
import { User } from '@/user/entities/user.entity';
import { Saju } from '@/saju/entities/saju.entity';
import { Physiognomy } from '@/physiognomy/entities/physiognomy.entity';
import axios from 'axios';

@Injectable()
export class TransmissionService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Saju) private readonly sajuRepository: Repository<Saju>,
    @InjectRepository(Physiognomy)
    private readonly physiognomyRepository: Repository<Physiognomy>,
  ) {
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPassword = this.configService.get<string>('MAIL_PASSWORD');

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: mailUser,
        pass: mailPassword,
      },
    });
  }

  async create(createTransmissionDto: CreateTransmissionDto) {
    const { userId, email } = createTransmissionDto;

    // 사용자 정보 조회
    const user = await this.userRepository.findOne({ where: { uuid: userId } });
    if (!user) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
    }

    // 사주 정보 조회
    const saju = await this.sajuRepository.findOne({
      where: { user: { uuid: userId } },
    });

    // 관상 정보 조회
    const physiognomy = await this.physiognomyRepository.findOne({
      where: { user: { uuid: userId } },
    });

    // 캐릭터(궁합) 정보 생성/조회
    let character: any = null;
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    try {
      const response = await axios.post(`${baseUrl}/api/character`, {
        userId: userId,
      });
      character = response.data?.data || response.data;
    } catch (err) {
      character = null;
    }

    // 이메일 본문 생성
    const htmlContent = this.generateEmailHtml(
      user,
      saju || null,
      physiognomy || null,
      character,
    );

    // 이메일 전송
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_USER'),
        to: email,
        subject: `[애인사주오!] ${user.name}님의 궁합 분석 결과입니다 💕`,
        html: htmlContent,
      });

      return { success: true, message: '이메일이 정상적으로 전송되었습니다.' };
    } catch (err) {
      console.error('이메일 전송 실패:', err);
      throw new InternalServerErrorException(
        '이메일 전송 중 오류가 발생했습니다.',
      );
    }
  }

  private generateEmailHtml(
    user: User,
    saju: Saju | null,
    physiognomy: Physiognomy | null,
    character: any,
  ): string {
    const sajuData: any = saju?.data || {};
    const physiognomyData: any = physiognomy?.data || {};
    const characterData = character?.data || character || {};

    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 10px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .content { padding: 30px 20px; }
          .section { margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; }
          .section-title { font-size: 18px; font-weight: bold; color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
          .user-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .info-label { font-weight: bold; color: #666; }
          .saju-section, .physiognomy-section, .character-section { margin-bottom: 20px; }
          .saju-section p, .physiognomy-section p, .character-section p { margin: 10px 0; font-size: 14px; line-height: 1.8; }
          .badge { display: inline-block; background: #667eea; color: white; padding: 8px 12px; border-radius: 20px; font-size: 12px; margin-right: 8px; margin-bottom: 8px; }
          .score { font-size: 24px; font-weight: bold; color: #764ba2; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💕 애인사주오!</h1>
            <p>당신의 특별한 인연을 찾아보세요</p>
          </div>

          <div class="content">
            <!-- 사용자 정보 -->
            <div class="user-info">
              <div class="info-row">
                <span class="info-label">이름:</span>
                <span>${user.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">생년월일:</span>
                <span>${user.birthDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">성별:</span>
                <span>${user.gender === 'male' ? '남성' : '여성'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">태어난 장소:</span>
                <span>${user.location}</span>
              </div>
              <div class="info-row">
                <span class="info-label">태어난 시간:</span>
                <span>${user.birthTime}</span>
              </div>
            </div>

            <!-- 사주 분석 -->
            ${
              saju
                ? `
              <div class="section">
                <div class="section-title">🔮 사주 분석</div>
                <div class="saju-section">
                  ${
                    sajuData.profile
                      ? `
                    <p><strong>${sajuData.profile.nickname || '사주 프로필'}</strong></p>
                    <p>${sajuData.profile.soul_title || ''}</p>
                    <p>${sajuData.profile.core_description || ''}</p>
                  `
                      : ''
                  }

                  ${
                    sajuData.stats
                      ? `
                    <p><strong>주요 특성:</strong></p>
                    ${
                      sajuData.stats.attributes
                        ? sajuData.stats.attributes
                            .map(
                              (attr: any) => `
                      <div class="badge">${attr.name_ko}: ${attr.score}점</div>
                    `,
                            )
                            .join('')
                        : ''
                    }
                  `
                      : ''
                  }
                </div>
              </div>
            `
                : ''
            }

            <!-- 관상 분석 -->
            ${
              physiognomy
                ? `
              <div class="section">
                <div class="section-title">👤 관상 분석</div>
                <div class="physiognomy-section">
                  ${
                    physiognomyData.overall_analysis
                      ? `
                    <p><strong>인상:</strong> ${physiognomyData.overall_analysis.impression || ''}</p>
                    <p><strong>오행:</strong> ${physiognomyData.overall_analysis.five_elements || ''}</p>
                  `
                      : ''
                  }
                  ${
                    physiognomyData.summary_advice
                      ? `
                    <p><strong>조언:</strong> ${physiognomyData.summary_advice}</p>
                  `
                      : ''
                  }
                </div>
              </div>
            `
                : ''
            }

            <!-- 궁합 분석 -->
            ${
              characterData.characterName
                ? `
              <div class="section">
                <div class="section-title">💕 당신의 최고 궁합</div>
                <div class="character-section">
                  <p><strong>캐릭터:</strong> ${characterData.characterName || ''}</p>
                  <p><strong>총점:</strong> <span class="score">${characterData.overallScore || 0}/100</span></p>

                  ${
                    characterData.badgeScores
                      ? `
                    <p><strong>세부 점수:</strong></p>
                    <div class="badge">사주 궁합: ${characterData.badgeScores.sajuCompatibility || 0}점</div>
                    <div class="badge">데이팅 스타일: ${characterData.badgeScores.datingStyle || 0}점</div>
                    <div class="badge">성격 호응: ${characterData.badgeScores.preferencePersonality || 0}점</div>
                  `
                      : ''
                  }

                  ${
                    characterData.sections
                      ? `
                    <p style="margin-top: 15px;"><strong>운명:</strong></p>
                    <p>${characterData.sections.destiny || ''}</p>
                    <p><strong>성격:</strong></p>
                    <p>${characterData.sections.personality || ''}</p>
                    <p><strong>오행:</strong></p>
                    <p>${characterData.sections.elemental || ''}</p>
                    <p><strong>데이팅:</strong></p>
                    <p>${characterData.sections.dating || ''}</p>
                    <p><strong>성장:</strong></p>
                    <p>${characterData.sections.growth || ''}</p>
                  `
                      : ''
                  }
                </div>
              </div>
            `
                : ''
            }
          </div>

          <div class="footer">
            <p>© 2024 애인사주오! | 당신의 특별한 인연을 찾아보세요</p>
            <p>이 이메일은 자동으로 생성되었습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
