# 개발 로드맵 (Development Roadmap)

## 📍 현재 상태 (2025-10-06)

### ✅ 완료된 작업
- Phase 1~4 완료 (기초 구현 → 클라우드 마이그레이션)
- Supabase PostgreSQL 완전 마이그레이션
- 254명 후보자, 7,414개 공약 데이터 클라우드 저장
- 추상화된 DataSource 패턴으로 SQLite ↔ Supabase 전환 가능
- 검색, 필터, 페이지네이션, 다크모드 구현

---

## 🚀 Phase 5: 배포 및 기본 최적화 (우선순위: 높음)

### 목표
프로덕션 환경에서 안정적으로 서비스 제공

### 작업 목록

#### 5.1 Vercel 배포 ✅
- [x] Vercel 프로젝트 생성 및 GitHub 연동
- [x] 환경 변수 설정 (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY)
- [x] 첫 배포 및 동작 확인
- [ ] 도메인 연결 (선택사항)
- [x] SSL/TLS 인증서 확인

**예상 소요 시간**: 1-2시간
**난이도**: 쉬움
**완료일**: 2025-10-06

#### 5.2 성능 최적화 ✅
- [x] React.lazy()를 사용한 코드 스플리팅
  - OfficialsList, OfficialDetail 컴포넌트 lazy loading
  - Suspense fallback UI 구현
- [x] 번들 크기 분석 도구 추가
  - source-map-explorer 설치
  - `npm run analyze` 스크립트 추가
- [x] Memoization 개선
  - React.memo로 OfficialsList, OfficialDetail, StaticMapSelector 최적화
  - 불필요한 리렌더링 방지

**예상 소요 시간**: 3-4시간
**난이도**: 중간
**완료일**: 2025-10-06

#### 5.3 SEO 최적화 ✅
- [x] meta tags 개선
  - Primary meta tags (title, description, keywords)
  - Open Graph tags (Facebook)
  - Twitter Card tags
  - Canonical URL
- [x] robots.txt 생성
  - Allow all crawlers
  - Sitemap reference
- [x] sitemap.xml 생성
  - Homepage, main sections
  - 17개 지역별 페이지
  - Update frequency 설정
- [x] 구조화된 데이터 (JSON-LD)
  - WebApplication schema
  - Organization info

**예상 소요 시간**: 2-3시간
**난이도**: 쉬움
**완료일**: 2025-10-06

#### 5.4 모니터링 설정
- [ ] Vercel Analytics 활성화
- [ ] 에러 트래킹 (Sentry 또는 Vercel Error Logging)
- [ ] 성능 모니터링 (Web Vitals)

**예상 소요 시간**: 1-2시간
**난이도**: 쉬움

---

## 📊 Phase 6: 데이터 시각화 (우선순위: 중간)

### 목표
사용자가 공약 이행 현황을 시각적으로 이해하기 쉽게 만들기

### 작업 목록

#### 6.1 Chart.js 통합
- [ ] Chart.js 및 react-chartjs-2 설치
- [ ] 공약 상태별 파이 차트 구현
- [ ] 정당별 이행률 비교 막대 차트
- [ ] 지역별 이행률 히트맵

**예상 소요 시간**: 4-5시간
**난이도**: 중간

#### 6.2 통계 대시보드
- [ ] StatsOverview 컴포넌트 확장
- [ ] 시간별 진행률 추세 그래프
- [ ] 분야별 공약 분포 차트
- [ ] 필터링 가능한 인터랙티브 차트

**예상 소요 시간**: 3-4시간
**난이도**: 중간

---

## 🔐 Phase 7: 사용자 인증 및 개인화 (우선순위: 중간)

### 목표
사용자별 맞춤 기능 제공

### 작업 목록

#### 7.1 Supabase Auth 연동
- [ ] Supabase Auth 설정
- [ ] 이메일/비밀번호 로그인 구현
- [ ] 소셜 로그인 (Google, Kakao) 추가
- [ ] 로그인 UI/UX 개선

**예상 소요 시간**: 5-6시간
**난이도**: 중간

#### 7.2 사용자 기능
- [ ] 공약 북마크 기능
  - Supabase user_bookmarks 테이블 생성
  - 북마크 추가/삭제 UI
- [ ] 관심 지역 설정
- [ ] 알림 설정 (이메일, 푸시)
- [ ] 사용자 프로필 페이지

**예상 소요 시간**: 6-8시간
**난이도**: 중간~높음

---

## 🔔 Phase 8: 실시간 기능 (우선순위: 낮음)

### 목표
공약 상태 변경 시 실시간 업데이트

### 작업 목록

#### 8.1 Supabase Realtime 구독
- [ ] Supabase Realtime 채널 설정
- [ ] pledges 테이블 변경 감지
- [ ] 실시간 UI 업데이트

**예상 소요 시간**: 3-4시간
**난이도**: 중간

#### 8.2 알림 시스템
- [ ] 공약 상태 변경 알림
- [ ] 이메일 알림 (Supabase Edge Functions)
- [ ] 브라우저 푸시 알림 (Web Push API)
- [ ] 알림 센터 UI

**예상 소요 시간**: 8-10시간
**난이도**: 높음

---

## 📱 Phase 9: PWA 지원 (우선순위: 낮음)

### 목표
모바일 앱처럼 설치 및 오프라인 사용 가능

### 작업 목록

#### 9.1 Service Worker
- [ ] Workbox 설정
- [ ] 캐싱 전략 구현
  - API 응답 캐싱
  - 정적 리소스 캐싱
- [ ] 오프라인 페이지

**예상 소요 시간**: 4-5시간
**난이도**: 중간~높음

#### 9.2 PWA 기능
- [ ] manifest.json 개선
- [ ] 앱 아이콘 생성 (다양한 크기)
- [ ] Splash screen
- [ ] 설치 프롬프트 UI

**예상 소요 시간**: 3-4시간
**난이도**: 쉬움

---

## 🎨 Phase 10: UI/UX 개선 (우선순위: 낮음)

### 목표
사용자 경험 향상

### 작업 목록

#### 10.1 애니메이션
- [ ] Framer Motion 통합
- [ ] 페이지 전환 애니메이션
- [ ] 카드 hover 효과
- [ ] 스켈레톤 로딩 UI

**예상 소요 시간**: 4-5시간
**난이도**: 중간

#### 10.2 접근성 개선
- [ ] ARIA 라벨 추가
- [ ] 키보드 네비게이션 개선
- [ ] 스크린 리더 지원
- [ ] 색상 대비 검증

**예상 소요 시간**: 3-4시간
**난이도**: 중간

---

## 🔧 Phase 11: 관리자 기능 (우선순위: 낮음)

### 목표
공약 데이터 관리 효율화

### 작업 목록

#### 11.1 Admin Dashboard
- [ ] 관리자 전용 페이지
- [ ] 공약 상태 업데이트 UI
- [ ] 새 공약 추가 기능
- [ ] 후보자 정보 수정

**예상 소요 시간**: 8-10시간
**난이도**: 높음

#### 11.2 데이터 관리
- [ ] CSV Import/Export
- [ ] 데이터 검증 로직
- [ ] 변경 이력 추적
- [ ] 백업/복원 기능

**예상 소요 시간**: 6-8시간
**난이도**: 중간~높음

---

## 📋 우선순위 요약

### 즉시 시작 (Phase 5)
1. ✅ **Vercel 배포** - 가장 중요! 실제 서비스 시작
2. 성능 최적화 - 사용자 경험 개선
3. SEO 최적화 - 검색 노출 향상

### 단기 목표 (1-2주)
- Phase 6: 데이터 시각화 (차트 추가)
- Phase 7: 사용자 인증 (로그인, 북마크)

### 중기 목표 (1개월)
- Phase 8: 실시간 기능 (알림)
- Phase 9: PWA 지원

### 장기 목표 (2-3개월)
- Phase 10: UI/UX 개선
- Phase 11: 관리자 기능

---

## 📌 다음 작업

**즉시 진행할 작업 (Phase 5.1):**

1. **Vercel 배포 준비**
   ```bash
   # 로컬에서 빌드 테스트
   npm run build

   # 빌드 결과 확인
   npx serve -s build
   ```

2. **환경 변수 체크**
   - `.env.local`이 Git에 포함되지 않았는지 확인 ✅
   - Vercel에 설정할 환경 변수 준비:
     - `REACT_APP_USE_SUPABASE=true`
     - `REACT_APP_SUPABASE_URL`
     - `REACT_APP_SUPABASE_ANON_KEY`

3. **Vercel 배포**
   - https://vercel.com 접속
   - GitHub 연동
   - 프로젝트 Import
   - 환경 변수 설정
   - Deploy!

---

## 🌟 Phase 6: 사용자 평가 시스템 (핵심 기능 - 최우선)

### 목표
정치인과 공약에 대한 사용자 평가 및 댓글 시스템 구축

### Week 1: 인증 및 기본 평가 시스템
**예상 소요 시간**: 13-17시간

#### 6.1 Supabase Auth 구현 ✨ NEW
- [ ] Google OAuth 2.0 설정
  - Google Cloud Console에서 OAuth 클라이언트 생성
  - Supabase에서 Google Provider 활성화
- [ ] AuthContext 생성
  - 로그인/로그아웃 함수
  - 사용자 세션 관리
- [ ] LoginButton 컴포넌트
  - Google 로그인 버튼
  - 사용자 프로필 드롭다운
- [ ] user_profiles 테이블 생성

**난이도**: 중간
**우선순위**: 🔴 최우선

#### 6.2 평가 시스템 DB 및 API ✨ NEW
- [ ] Database 테이블 생성
  - candidate_ratings (정치인 평가)
  - pledge_ratings (공약 평가)
  - rating_likes (공감 기능)
  - rating_reports (신고 시스템)
- [ ] SupabaseDataSource에 평가 CRUD 메서드
  - createCandidateRating, getCandidateRatings
  - createPledgeRating, getPledgeRatings
  - likeRating, reportRating
- [ ] RLS 정책 설정 (1인 1표, 본인만 수정)

**난이도**: 중간
**우선순위**: 🟠 높음

#### 6.3 평가 UI 컴포넌트 ✨ NEW
- [ ] RatingStars 컴포넌트 (별점 입력)
- [ ] CandidateRatingSection (정치인 평가 섹션)
  - 평균 평점 표시
  - 평가 작성 폼
  - 평가 목록 (페이지네이션)
- [ ] PledgeRatingSection (공약 평가 섹션)
- [ ] RatingCard (개별 평가 카드)
  - 공감 버튼
  - 신고 버튼

**난이도**: 중간~높음
**우선순위**: 🟡 중간

### Week 2: 통계 및 고급 기능 (선택)
**예상 소요 시간**: 10-14시간

#### 6.4 통계 및 시각화
- [ ] 평가 통계 API
  - 정치인별 평균 평점
  - 시간별 평점 추이
  - 지역별/정당별 비교
- [ ] RatingStats 컴포넌트
  - 평점 분포 차트
  - 시간별 추이 그래프
- [ ] LeaderBoard 컴포넌트

**난이도**: 중간~높음
**우선순위**: 🟢 낮음

#### 6.5 조작 방지 및 품질 관리
- [ ] 신고 검토 Admin 페이지
- [ ] 신뢰도 점수 시스템
- [ ] 평가 작성 제한 (Rate Limiting)
- [ ] reCAPTCHA 통합

**난이도**: 높음
**우선순위**: 🔵 낮음

**상세 계획**: [USER_RATING_SYSTEM_PLAN.md](./docs/USER_RATING_SYSTEM_PLAN.md)

---

**업데이트**: 2025-10-06
**버전**: 1.1.0
**현재 Phase**: 6 (사용자 평가 시스템 - 기획 완료)
