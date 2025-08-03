// Email Service for Korea Promise Tracker
// Phase 4 Implementation - Email notification handling

import { supabase } from './supabase';

// Email templates
const EMAIL_TEMPLATES = {
  PROMISE_UPDATE: 'promise_update',
  NEW_COMMENT: 'new_comment',
  NEW_RATING: 'new_rating',
  NEW_REPORT: 'new_report',
  WEEKLY_DIGEST: 'weekly_digest',
  WELCOME: 'welcome',
  RESET_PASSWORD: 'reset_password',
  EMAIL_VERIFICATION: 'email_verification'
};

// Email priority levels
const EMAIL_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

class EmailService {
  constructor() {
    this.apiKey = process.env.REACT_APP_EMAIL_API_KEY;
    this.fromEmail = process.env.REACT_APP_FROM_EMAIL || 'noreply@promise-tracker.kr';
    this.fromName = process.env.REACT_APP_FROM_NAME || '대한민국 공약 추적기';
    this.baseUrl = process.env.REACT_APP_BASE_URL || 'https://promise-tracker.vercel.app';
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  // Send email using Supabase Edge Function
  async sendEmail(emailData) {
    try {
      const { to, subject, html, text, templateId, templateData, priority = EMAIL_PRIORITY.NORMAL } = emailData;

      // Validate required fields
      if (!to || (!subject && !templateId)) {
        throw new Error('Missing required email fields');
      }

      // Prepare email payload
      const payload = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        html,
        text,
        templateId,
        templateData,
        priority,
        timestamp: new Date().toISOString()
      };

      // Send via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: payload
      });

      if (error) {
        throw error;
      }

      console.log('Email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send bulk emails
  async sendBulkEmails(emails, options = {}) {
    try {
      const { batchSize = 50, delayBetweenBatches = 1000 } = options;
      const results = [];
      
      // Split into batches
      const batches = this.chunkArray(emails, batchSize);
      
      for (const batch of batches) {
        const batchPromises = batch.map(email => 
          this.sendEmail(email).catch(error => ({
            success: false,
            error: error.message,
            email: email.to
          }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Delay between batches to avoid rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.delay(delayBetweenBatches);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Failed to send bulk emails:', error);
      return [];
    }
  }

  // Send promise update email
  async sendPromiseUpdateEmail(userEmail, userName, promiseData, updateData) {
    try {
      const templateData = {
        userName,
        promiseTitle: promiseData.title,
        promiseId: promiseData.id,
        updateType: updateData.type,
        updateMessage: updateData.message,
        updateDate: updateData.date || new Date().toISOString(),
        promiseUrl: `${this.baseUrl}/?promise=${promiseData.id}`,
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&promise=${promiseData.id}`
      };

      const subject = `공약 업데이트: ${promiseData.title}`;
      const html = this.generatePromiseUpdateHTML(templateData);
      const text = this.generatePromiseUpdateText(templateData);

      return await this.sendEmail({
        to: userEmail,
        subject,
        html,
        text,
        priority: EMAIL_PRIORITY.NORMAL
      });
    } catch (error) {
      console.error('Failed to send promise update email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send weekly digest email
  async sendWeeklyDigestEmail(userEmail, userName, digestData) {
    try {
      const { promises, statistics, period } = digestData;
      
      const templateData = {
        userName,
        period,
        totalPromises: promises.length,
        totalUpdates: statistics.totalUpdates,
        newComments: statistics.newComments,
        newRatings: statistics.newRatings,
        newReports: statistics.newReports,
        promises: promises.slice(0, 10), // Limit to top 10 for email
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&type=digest`
      };

      const subject = `주간 공약 업데이트 - ${period}`;
      const html = this.generateWeeklyDigestHTML(templateData);
      const text = this.generateWeeklyDigestText(templateData);

      return await this.sendEmail({
        to: userEmail,
        subject,
        html,
        text,
        priority: EMAIL_PRIORITY.LOW
      });
    } catch (error) {
      console.error('Failed to send weekly digest email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(userEmail, userName) {
    try {
      const templateData = {
        userName,
        appUrl: this.baseUrl,
        preferencesUrl: `${this.baseUrl}/preferences`,
        helpUrl: `${this.baseUrl}/help`
      };

      const subject = '대한민국 공약 추적기에 오신 것을 환영합니다!';
      const html = this.generateWelcomeHTML(templateData);
      const text = this.generateWelcomeText(templateData);

      return await this.sendEmail({
        to: userEmail,
        subject,
        html,
        text,
        priority: EMAIL_PRIORITY.NORMAL
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate promise update HTML template
  generatePromiseUpdateHTML(data) {
    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.promiseTitle} - 공약 업데이트</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .content { padding: 30px 20px; }
          .update-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #1e40af; }
          .update-type { display: inline-block; background: #1e40af; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px; }
          .promise-title { font-size: 20px; font-weight: 700; color: #1e40af; margin-bottom: 15px; }
          .update-message { font-size: 16px; margin-bottom: 15px; }
          .cta-button { display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .cta-button:hover { background: #1d4ed8; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
          .footer a { color: #1e40af; text-decoration: none; }
          .footer a:hover { text-decoration: underline; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; }
          .stat-number { font-size: 24px; font-weight: 700; color: #1e40af; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🇰🇷 대한민국 공약 추적기</h1>
            <p>투명한 정치, 신뢰할 수 있는 미래</p>
          </div>
          
          <div class="content">
            <h2>안녕하세요 ${data.userName}님,</h2>
            <p>구독하신 공약에 새로운 업데이트가 있어 알려드립니다.</p>
            
            <div class="update-card">
              <span class="update-type">${data.updateType}</span>
              <div class="promise-title">${data.promiseTitle}</div>
              <div class="update-message">${data.updateMessage}</div>
              <small style="color: #64748b;">업데이트 일시: ${new Date(data.updateDate).toLocaleDateString('ko-KR')}</small>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.promiseUrl}" class="cta-button">공약 상세보기</a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <h3>공약 추적기의 다른 기능들</h3>
              <ul style="padding-left: 20px;">
                <li>실시간 공약 진행상황 모니터링</li>
                <li>시민 참여를 통한 투명한 정치</li>
                <li>지역별 공약 비교 분석</li>
                <li>공약 달성도 평가 시스템</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>이 이메일은 대한민국 공약 추적기에서 발송되었습니다.</p>
            <p>
              <a href="${this.baseUrl}/preferences">알림 설정</a> | 
              <a href="${data.unsubscribeUrl}">구독 해지</a> | 
              <a href="${this.baseUrl}/contact">문의하기</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px;">
              © 2024 대한민국 공약 추적기. 모든 권리 보유.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate promise update text template
  generatePromiseUpdateText(data) {
    return `
      대한민국 공약 추적기
      
      안녕하세요 ${data.userName}님,
      
      구독하신 공약에 새로운 업데이트가 있어 알려드립니다.
      
      공약: ${data.promiseTitle}
      업데이트 유형: ${data.updateType}
      내용: ${data.updateMessage}
      업데이트 일시: ${new Date(data.updateDate).toLocaleDateString('ko-KR')}
      
      공약 상세보기: ${data.promiseUrl}
      
      ────────────────────────────────────────
      
      공약 추적기는 투명한 정치와 신뢰할 수 있는 미래를 위해 
      시민들에게 정확한 정보를 제공합니다.
      
      알림 설정: ${this.baseUrl}/preferences
      구독 해지: ${data.unsubscribeUrl}
      
      © 2024 대한민국 공약 추적기
    `;
  }

  // Generate weekly digest HTML template
  generateWeeklyDigestHTML(data) {
    const promiseCards = data.promises.map(promise => `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 10px 0; background: white;">
        <h4 style="margin: 0 0 10px 0; color: #1e40af;">${promise.title}</h4>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">${promise.category} | ${promise.level}</p>
        <div style="background: #f1f5f9; padding: 8px; border-radius: 4px; font-size: 14px;">
          진행률: <strong>${promise.progress}%</strong> | 
          평점: <strong>${promise.rating}/5.0</strong> |
          댓글: <strong>${promise.comments}개</strong>
        </div>
        <a href="${this.baseUrl}/?promise=${promise.id}" style="display: inline-block; margin-top: 10px; color: #1e40af; text-decoration: none; font-size: 14px;">자세히 보기 →</a>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>주간 공약 업데이트 - ${data.period}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .content { padding: 30px 20px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
          .stat-number { font-size: 24px; font-weight: 700; color: #1e40af; display: block; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 5px; }
          .section-title { font-size: 18px; font-weight: 700; color: #1e40af; margin: 25px 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
          .footer a { color: #1e40af; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 주간 공약 업데이트</h1>
            <p>${data.period}</p>
          </div>
          
          <div class="content">
            <h2>안녕하세요 ${data.userName}님,</h2>
            <p>지난 주 구독하신 공약들의 활동 요약을 전해드립니다.</p>
            
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-number">${data.totalUpdates}</span>
                <div class="stat-label">총 업데이트</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${data.newComments}</span>
                <div class="stat-label">새 댓글</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${data.newRatings}</span>
                <div class="stat-label">새 평가</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${data.newReports}</span>
                <div class="stat-label">시민 보고서</div>
              </div>
            </div>
            
            <div class="section-title">🔥 활발한 공약들</div>
            ${promiseCards}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}" style="display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">모든 공약 보기</a>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #1e40af;">💡 알고 계셨나요?</h3>
              <p>공약 추적기를 통해 시민들이 직접 공약 이행을 모니터링하고 평가할 수 있습니다. 여러분의 참여가 더 투명한 정치를 만듭니다!</p>
            </div>
          </div>
          
          <div class="footer">
            <p>이 이메일은 대한민국 공약 추적기에서 발송되었습니다.</p>
            <p>
              <a href="${this.baseUrl}/preferences">알림 설정</a> | 
              <a href="${data.unsubscribeUrl}">구독 해지</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate weekly digest text template
  generateWeeklyDigestText(data) {
    const promiseList = data.promises.map(promise => 
      `• ${promise.title} (${promise.progress}% 완료, 평점: ${promise.rating}/5.0)`
    ).join('\n');

    return `
      대한민국 공약 추적기 - 주간 업데이트
      ${data.period}
      
      안녕하세요 ${data.userName}님,
      
      지난 주 구독하신 공약들의 활동 요약을 전해드립니다.
      
      📊 주간 통계
      • 총 업데이트: ${data.totalUpdates}개
      • 새 댓글: ${data.newComments}개  
      • 새 평가: ${data.newRatings}개
      • 시민 보고서: ${data.newReports}개
      
      🔥 활발한 공약들
      ${promiseList}
      
      모든 공약 보기: ${this.baseUrl}
      
      💡 공약 추적기를 통해 시민들이 직접 공약 이행을 
      모니터링하고 평가할 수 있습니다. 여러분의 참여가 
      더 투명한 정치를 만듭니다!
      
      ────────────────────────────────────────
      알림 설정: ${this.baseUrl}/preferences
      구독 해지: ${data.unsubscribeUrl}
      
      © 2024 대한민국 공약 추적기
    `;
  }

  // Generate welcome HTML template
  generateWelcomeHTML(data) {
    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>대한민국 공약 추적기에 오신 것을 환영합니다!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px 20px; }
          .welcome-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
          .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0; }
          .feature { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
          .feature-icon { font-size: 32px; margin-bottom: 10px; }
          .cta-button { display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; margin: 15px 10px; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 환영합니다!</h1>
            <p>대한민국 공약 추적기에 가입해주셔서 감사합니다</p>
          </div>
          
          <div class="content">
            <div class="welcome-card">
              <h2>안녕하세요 ${data.userName}님!</h2>
              <p>투명한 정치와 신뢰할 수 있는 미래를 위한 여정에 함께해주셔서 감사합니다. 공약 추적기를 통해 정치인들의 공약 이행을 실시간으로 모니터링하고 시민의 목소리를 낼 수 있습니다.</p>
            </div>
            
            <h3 style="color: #1e40af; margin-bottom: 20px;">🚀 주요 기능들</h3>
            <div class="feature-grid">
              <div class="feature">
                <div class="feature-icon">📊</div>
                <h4>실시간 추적</h4>
                <p>공약 진행상황을 실시간으로 확인하세요</p>
              </div>
              <div class="feature">
                <div class="feature-icon">💬</div>
                <h4>시민 참여</h4>
                <p>댓글과 평가로 목소리를 내세요</p>
              </div>
              <div class="feature">
                <div class="feature-icon">📍</div>
                <h4>지역별 비교</h4>
                <p>우리 지역 공약을 쉽게 찾아보세요</p>
              </div>
              <div class="feature">
                <div class="feature-icon">📧</div>
                <h4>맞춤 알림</h4>
                <p>관심 공약의 업데이트를 받아보세요</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.appUrl}" class="cta-button">공약 둘러보기</a>
              <a href="${data.preferencesUrl}" class="cta-button" style="background: #64748b;">알림 설정</a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="margin-top: 0; color: #92400e;">💡 시작하기 팁</h4>
              <ul style="margin-bottom: 0; padding-left: 20px; color: #92400e;">
                <li>관심있는 공약을 구독하여 업데이트를 받아보세요</li>
                <li>공약에 대한 평가와 댓글로 의견을 표현하세요</li>
                <li>시민 보고서를 통해 공약 이행 현황을 공유하세요</li>
                <li>지역별 필터로 우리 지역 공약을 확인하세요</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>궁금한 점이 있으시면 언제든 <a href="${data.helpUrl}">도움말</a>을 확인하거나 문의해주세요.</p>
            <p>투명한 정치, 함께 만들어가요! 🇰🇷</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate welcome text template
  generateWelcomeText(data) {
    return `
      대한민국 공약 추적기에 오신 것을 환영합니다!
      
      안녕하세요 ${data.userName}님!
      
      투명한 정치와 신뢰할 수 있는 미래를 위한 여정에 
      함께해주셔서 감사합니다.
      
      🚀 주요 기능들
      • 📊 실시간 공약 진행상황 추적
      • 💬 시민 참여를 통한 댓글과 평가
      • 📍 지역별 공약 비교 분석
      • 📧 맞춤형 알림 서비스
      
      💡 시작하기 팁
      1. 관심있는 공약을 구독하여 업데이트를 받아보세요
      2. 공약에 대한 평가와 댓글로 의견을 표현하세요
      3. 시민 보고서를 통해 공약 이행 현황을 공유하세요
      4. 지역별 필터로 우리 지역 공약을 확인하세요
      
      서비스 이용하기: ${data.appUrl}
      알림 설정: ${data.preferencesUrl}
      도움말: ${data.helpUrl}
      
      투명한 정치, 함께 만들어가요! 🇰🇷
      
      © 2024 대한민국 공약 추적기
    `;
  }

  // Utility functions
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate email address
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get email delivery statistics
  async getEmailStats(dateRange = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const { data, error } = await supabase
        .from('email_logs')
        .select('status, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        delivered: data.filter(log => log.status === 'delivered').length,
        failed: data.filter(log => log.status === 'failed').length,
        pending: data.filter(log => log.status === 'pending').length
      };

      return stats;
    } catch (error) {
      console.error('Failed to get email stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

export { EMAIL_TEMPLATES, EMAIL_PRIORITY };
export default emailService;