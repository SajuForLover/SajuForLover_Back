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
import { Compatibility } from '@/character/entities/compatibility.entity';

@Injectable()
export class TransmissionService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Saju) private readonly sajuRepository: Repository<Saju>,
    @InjectRepository(Physiognomy)
    private readonly physiognomyRepository: Repository<Physiognomy>,
    @InjectRepository(Compatibility)
    private readonly compatibilityRepository: Repository<Compatibility>,
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
    const { userId, email, photo } = createTransmissionDto;

    // 사용자 정보 조회
    const user = await this.userRepository.findOne({ where: { uuid: userId } });
    if (!user) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
    }

    // 사주, 관상, 궁합 정보 조회
    const [saju, physiognomy, compatibility] = await Promise.all([
      this.sajuRepository.findOne({
        where: { user: { uuid: userId } },
        order: { createdAt: 'DESC' },
      }),
      this.physiognomyRepository.findOne({
        where: { user: { uuid: userId } },
        order: { createdAt: 'DESC' },
      }),
      this.compatibilityRepository.findOne({
        where: { userId },
      }),
    ]);
    console.log('TransmissionService.create user:', user);

    // 이메일 본문 생성 (photo 인자 추가)
    const htmlContent = this.generateEmailHtml(
      user,
      saju || null,
      physiognomy || null,
      compatibility || null,
      !!photo,
    );

    const attachments: any[] = [];
    if (photo) {
      // Base64 데이터에서 실제 내용 추출
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      attachments.push({
        filename: 'four-cut-photo.png',
        content: base64Data,
        encoding: 'base64',
        cid: 'four_cut_photo', // HTML 본문에서 참조할 ID
      });
    }

    // 이메일 전송
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_USER'),
        to: email,
        subject: `[애인사주오!] ${user.name}님의 궁합 분석 결과입니다 💕`,
        html: htmlContent,
        attachments,
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
    compatibility: Compatibility | null,
    hasPhoto: boolean = false,
  ): string {
    const sajuData: any = saju?.data || {};
    const physiognomyData: any = physiognomy?.data || {};

    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; }
          .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 32px; margin-bottom: 8px; letter-spacing: -1px; }
          .header p { font-size: 16px; opacity: 0.9; font-weight: 300; }
          .content { padding: 30px 20px; }
          
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: 800; color: #ff758c; margin-bottom: 15px; display: flex; align-items: center; }
          .section-title::after { content: ''; flex: 1; height: 1px; background: #eee; margin-left: 10px; }
          
          .card { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
          .user-info { background: #fff5f7; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px dashed #ffb2c1; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { font-size: 14px; margin-bottom: 8px; }
          .info-label { font-weight: bold; color: #ff758c; width: 80px; display: inline-block; }
          
          /* Saju Profile */
          .profile-header { text-align: center; margin-bottom: 20px; }
          .nickname { font-size: 22px; font-weight: bold; color: #333; margin-bottom: 5px; }
          .soul-title { font-size: 16px; color: #ff758c; font-weight: 600; margin-bottom: 10px; }
          .hashtags { margin: 10px 0; }
          .tag { display: inline-block; background: #f0f0f0; color: #666; padding: 4px 10px; border-radius: 15px; font-size: 12px; margin: 2px; }
          .mbti-box { display: inline-block; background: #ff758c; color: white; padding: 5px 15px; border-radius: 8px; font-weight: bold; margin-top: 10px; }
          
          /* Five Elements */
          .element-row { margin-bottom: 12px; }
          .element-info { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; font-weight: 600; gap: 10px; }
          .progress-bg { background: #eee; height: 8px; border-radius: 4px; overflow: hidden; }
          .progress-bar { height: 100%; border-radius: 4px; }
          
          /* Stats */
          .stat-item { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f9f9f9; }
          .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
          .stat-name { font-weight: bold; font-size: 15px; }
          .stat-score { color: #ff758c; font-weight: 800; font-size: 18px; }
          .stat-desc { font-size: 13px; color: #777; line-height: 1.4; }
          
          /* List items */
          .list-item { margin-bottom: 8px; font-size: 14px; display: flex; align-items: flex-start; }
          .list-bullet { color: #ff758c; margin-right: 8px; font-weight: bold; }
          
          .footer { background: #333; color: #999; padding: 30px 20px; text-align: center; font-size: 12px; }
          .footer p { margin-bottom: 5px; }
          
          .highlight-card { background: #fffaf0; border-left: 4px solid #f39c12; padding: 15px; border-radius: 8px; margin-top: 15px; }
          .warning-text { color: #e74c3c; font-size: 13px; margin-top: 10px; display: block; border-top: 1px solid #fee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💕 애인사주오!</h1>
            <p>당신의 소중한 인연, 사주로 풀어보는 이야기</p>
          </div>

          <div class="content">
            <!-- 사용자 정보 -->
            <div class="user-info">
              <div class="info-grid">
                <div class="info-item"><span class="info-label">이름</span> ${user.name}</div>
                <div class="info-item"><span class="info-label">성별</span> ${user.gender}</div>
                <div class="info-item"><span class="info-label">생년월일</span> ${user.birthDate}</div>
                <div class="info-item"><span class="info-label">장소</span> ${user.location}</div>
                <div class="info-item"><span class="info-label">시간</span> ${user.birthTime || '모름'}</div>
              </div>
            </div>

            <!-- 사주 분석 -->
            ${
              saju
                ? `
              <div class="section">
                <div class="section-title">🔮 사주 종합 분석</div>
                
                <!-- 프로필 -->
                <div class="card" style="text-align: center;">
                  <div class="soul-title">${sajuData.profile?.soul_title || '운명의 발견'}</div>
                  <div class="nickname">${sajuData.profile?.nickname || user.name + '님'}</div>
                  <div class="hashtags">
                    ${(sajuData.profile?.hash_tags || []).map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
                  </div>
                  <p style="font-size: 14px; color: #555; margin: 15px 0;">${sajuData.profile?.core_description || ''}</p>
                  ${
                    sajuData.profile?.matching_mbti
                      ? `<div><span style="font-size: 12px; color: #999; display: block;">어울리는 MBTI</span>
                         ${sajuData.profile.matching_mbti.map((m: string) => `<span class="mbti-box">${m}</span>`).join(' ')}</div>`
                      : ''
                  }
                </div>

                <!-- 오행 분석 -->
                <div class="card">
                  <h4 style="margin-bottom: 15px; font-size: 16px;">☯️ 오행 분포</h4>
                  ${(sajuData.five_elements || [])
                    .map((el: any) => {
                      const colors: any = {
                        물: '#3498db',
                        불: '#e74c3c',
                        나무: '#2ecc71',
                        쇠: '#95a5a6',
                        흙: '#f39c12',
                        Water: '#3498db',
                        Fire: '#e74c3c',
                        Wood: '#2ecc71',
                        Metal: '#95a5a6',
                        Earth: '#f39c12',
                      };
                      const color = colors[el.name_ko] || colors[el.type] || '#ff758c';
                      return `
                      <div class="element-row">
                        <div class="element-info">
                          <span>${el.name_ko}</span>
                          <span>${el.ratio_percent}%</span>
                        </div>
                        <div class="progress-bg">
                          <div class="progress-bar" style="width: ${el.ratio_percent}%; background-color: ${color};"></div>
                        </div>
                        <p style="font-size: 11px; color: #999; margin-top: 3px;">${el.characteristics || ''}</p>
                      </div>
                    `;
                    })
                    .join('')}
                </div>

                <!-- 주요 능력치 -->
                <div class="card">
                  <h4 style="margin-bottom: 15px; font-size: 16px;">📊 성향 분석</h4>
                  ${(sajuData.stats || sajuData.stats?.attributes || [])
                    .map(
                      (stat: any) => `
                    <div class="stat-item">
                      <div class="stat-header">
                        <span class="stat-name">${stat.name_ko}</span>
                        <span class="stat-score">${stat.score}점</span>
                      </div>
                      <p class="stat-desc">${stat.status_description || ''}</p>
                    </div>
                  `,
                    )
                    .join('')}
                </div>

                <!-- 커리어 -->
                <div class="card">
                  <h4 style="margin-bottom: 10px; font-size: 16px;">💼 사회적 성취 & 커리어</h4>
                  <p style="font-size: 14px; margin-bottom: 15px;">${sajuData.career?.work_style || ''}</p>
                  <div style="background: #f9f9f9; padding: 12px; border-radius: 8px;">
                    <span style="font-size: 12px; font-weight: bold; color: #777; display: block; margin-bottom: 8px;">추천 직업군</span>
                    ${(sajuData.career?.recommended_jobs || [])
                      .map(
                        (job: string) => `
                      <div class="list-item"><span class="list-bullet">•</span> ${job}</div>
                    `,
                      )
                      .join('')}
                  </div>
                  ${sajuData.career?.warning_note ? `<span class="warning-text">⚠️ 주의: ${sajuData.career.warning_note}</span>` : ''}
                </div>

                <!-- 행운의 팁 -->
                <div class="card" style="background: #fff5f7; border-color: #ffdae1;">
                  <h4 style="margin-bottom: 15px; font-size: 16px; color: #ff758c;">🍀 행운을 부르는 팁</h4>
                  <div class="info-item"><span class="info-label" style="width: 100px;">행운의 음식</span> ${sajuData.fortune?.lucky_food || '-'}</div>
                  <div class="info-item"><span class="info-label" style="width: 100px;">행운의 컬러</span> ${(sajuData.fortune?.lucky_colors || []).join(', ') || '-'}</div>
                  <div class="info-item"><span class="info-label" style="width: 100px;">행운의 숫자</span> ${(sajuData.fortune?.lucky_numbers || []).join(', ') || '-'}</div>
                  
                  <div class="highlight-card" style="margin-top: 15px;">
                    <span style="font-size: 12px; font-weight: bold; color: #d35400; display: block; margin-bottom: 5px;">최고의 파트너</span>
                    <p style="font-size: 14px;">${sajuData.fortune?.best_partner || '-'}</p>
                  </div>
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
                <div class="section-title">👤 관상(인상) 분석</div>
                <div class="card">
                  ${
                    physiognomyData.overall_analysis
                      ? `
                    <p style="font-size: 15px; margin-bottom: 10px;"><strong>전체적인 인상:</strong> ${physiognomyData.overall_analysis.impression || ''}</p>
                    <p style="font-size: 14px; color: #666;"><strong>오행적 특징:</strong> ${physiognomyData.overall_analysis.five_elements || ''}</p>
                  `
                      : ''
                  }
                  ${
                    physiognomyData.summary_advice
                      ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                      <span style="font-size: 12px; font-weight: bold; color: #ff758c; display: block; margin-bottom: 5px;">조언</span>
                      <p style="font-size: 14px;">${physiognomyData.summary_advice}</p>
                    </div>
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
              compatibility
                ? `
              <div class="section">
                <div class="section-title">💖 당신의 운명적 캐릭터</div>
                <div class="card" style="border: 2px solid #ff758c; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; right: 0; background: #ff758c; color: white; padding: 5px 15px; font-weight: bold; border-bottom-left-radius: 12px;">MATCH!</div>
                  <div style="text-align: center; margin-bottom: 20px;">
                    <p style="font-size: 14px; color: #999; margin-bottom: 5px;">가장 잘 어울리는 상대는</p>
                    <h2 style="font-size: 28px; color: #ff758c; margin-bottom: 10px;">${compatibility.characterName}</h2>
                    <div style="font-size: 48px; font-weight: 800; color: #ff758c;">${compatibility.overallScore}<span style="font-size: 20px;">점</span></div>
                  </div>

                  <div style="display: flex; justify-content: space-between; margin: 0 10px 25px 10px;">
                    <div style="text-align: center; flex: 1;">
                      <div style="font-size: 11px; color: #999; margin-bottom: 3px;">사주 궁합</div>
                      <div style="font-weight: bold; color: #333; font-size: 15px;">${compatibility.badgeScores?.sajuCompatibility || 0}점</div>
                    </div>
                    <div style="text-align: center; flex: 1; border-left: 1px solid #eee; border-right: 1px solid #eee;">
                      <div style="font-size: 11px; color: #999; margin-bottom: 3px;">연애 스타일</div>
                      <div style="font-weight: bold; color: #333; font-size: 15px;">${compatibility.badgeScores?.datingStyle || 0}점</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                      <div style="font-size: 11px; color: #999; margin-bottom: 3px;">가치관 호응</div>
                      <div style="font-weight: bold; color: #333; font-size: 15px;">${compatibility.badgeScores?.preferencePersonality || 0}점</div>
                    </div>
                  </div>

                  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                    ${
                      compatibility.sections
                        ? `
                      <p style="font-size: 14px; margin-bottom: 10px;"><strong>✨ 운명적 만남:</strong> ${compatibility.sections.destiny || ''}</p>
                      <p style="font-size: 14px; margin-bottom: 10px;"><strong>🤝 성격 궁합:</strong> ${compatibility.sections.personality || ''}</p>
                      <p style="font-size: 14px;"><strong>🔥 연애 텐션:</strong> ${compatibility.sections.dating || ''}</p>
                    `
                        : ''
                    }
                  </div>
                </div>
              </div>
            `
                : ''
            }

            <!-- 네컷 사진 -->
            ${
              hasPhoto
                ? `
              <div class="section">
                <div class="section-title">📸 추억의 네컷사진</div>
                <div style="text-align: center; background: #fdfdfd; padding: 20px; border-radius: 12px; border: 1px solid #f0f0f0;">
                  <img src="cid:four_cut_photo" alt="네컷사진" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
                  <p style="font-size: 12px; color: #999; margin-top: 10px;">당신과 캐릭터의 소중한 순간입니다 💕</p>
                </div>
              </div>
            `
                : ''
            }
          </div>

          <div class="footer">
            <p>본 분석 결과는 인공지능 기술을 활용하여 생성되었습니다.</p>
            <p>© 2024 애인사주오! | ALL RIGHTS RESERVED</p>
            <p style="margin-top: 15px; opacity: 0.5;">이 메일은 수신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
