# 사용자 평가 시스템 계획

## 🎯 핵심 기능

### 1. 사용자 인증
- Google 소셜 로그인 (Supabase Auth)
- 익명 사용자는 평가 불가 (조작 방지)
- 1인 1표 원칙

### 2. 정치인 평가
- **공약별 평가**: 각 공약에 대한 만족도 (1-5점)
- **정치인 종합 평가**: 전체적인 평가 (1-5점)
- **댓글/리뷰**: 평가 이유 작성

### 3. 통계 및 시각화
- 정치인별 평균 평점
- 공약별 만족도
- 시간별 평점 추이
- 지역별/정당별 비교

---

## 📊 데이터베이스 스키마

### 1. user_profiles 테이블
```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    provider VARCHAR(50),        -- google, kakao, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    reputation_score INTEGER DEFAULT 0  -- 신뢰도 점수
);
```

### 2. candidate_ratings 테이블 (정치인 종합 평가)
```sql
CREATE TABLE candidate_ratings (
    rating_id SERIAL PRIMARY KEY,
    hubo_id BIGINT NOT NULL REFERENCES candidates(hubo_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hubo_id, user_id)  -- 1인 1표
);

CREATE INDEX idx_candidate_ratings_hubo_id ON candidate_ratings(hubo_id);
CREATE INDEX idx_candidate_ratings_user_id ON candidate_ratings(user_id);
CREATE INDEX idx_candidate_ratings_created_at ON candidate_ratings(created_at DESC);
```

### 3. pledge_ratings 테이블 (공약별 평가)
```sql
CREATE TABLE pledge_ratings (
    rating_id SERIAL PRIMARY KEY,
    pledge_id INTEGER NOT NULL REFERENCES pledges(pledge_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pledge_id, user_id)  -- 1인 1표
);

CREATE INDEX idx_pledge_ratings_pledge_id ON pledge_ratings(pledge_id);
CREATE INDEX idx_pledge_ratings_user_id ON pledge_ratings(user_id);
CREATE INDEX idx_pledge_ratings_rating ON pledge_ratings(rating);
```

### 4. rating_reports 테이블 (신고 시스템)
```sql
CREATE TABLE rating_reports (
    report_id SERIAL PRIMARY KEY,
    rating_type VARCHAR(20) NOT NULL,  -- 'candidate' or 'pledge'
    rating_id INTEGER NOT NULL,
    reporter_user_id UUID NOT NULL REFERENCES user_profiles(user_id),
    reason VARCHAR(50) NOT NULL,       -- spam, offensive, fake, etc.
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, reviewed, resolved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES user_profiles(user_id)
);

CREATE INDEX idx_rating_reports_status ON rating_reports(status);
```

### 5. rating_likes 테이블 (평가에 대한 공감)
```sql
CREATE TABLE rating_likes (
    like_id SERIAL PRIMARY KEY,
    rating_type VARCHAR(20) NOT NULL,  -- 'candidate' or 'pledge'
    rating_id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rating_type, rating_id, user_id)
);

CREATE INDEX idx_rating_likes_rating ON rating_likes(rating_type, rating_id);
```

---

## 🎨 UI/UX 설계

### 1. 로그인 버튼 (헤더)
```
┌─────────────────────────────────────────────────────┐
│ 🏛 대한민국 공약 추적 시스템         [🌙] [로그인] │
└─────────────────────────────────────────────────────┘
```

### 2. 정치인 상세 페이지 - 평가 섹션
```
┌─────────────────────────────────────────────────────┐
│ 김철수 (서울 강남구갑) - 국민의힘                    │
├─────────────────────────────────────────────────────┤
│                                                       │
│ 📊 종합 평가                                         │
│ ★★★★☆ 4.2 / 5.0 (1,234명 평가)                      │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 이 정치인을 평가해주세요                          │ │
│ │ ☆☆☆☆☆                                            │ │
│ │ [댓글 작성하기...]                                │ │
│ │                              [평가 제출]          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ 최근 평가 (평가 높은 순)                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 👤 user123 ★★★★★ 5.0  👍 45                     │ │
│ │ "공약 이행률이 높고 적극적으로 소통합니다"        │ │
│ │ 2025-10-05                    [👍 공감] [🚫 신고] │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 👤 voter456 ★★☆☆☆ 2.0  👍 12                    │ │
│ │ "공약 이행이 느리고 설명이 부족합니다"            │ │
│ │ 2025-10-04                    [👍 공감] [🚫 신고] │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3. 공약 카드 - 평가 섹션
```
┌─────────────────────────────────────────────────────┐
│ 공약 #1: 250만호 주택 공급                           │
│ 분야: 부동산정책 | 상태: 진행중 (35%)                │
├─────────────────────────────────────────────────────┤
│ 📊 공약 평가: ★★★☆☆ 3.5 / 5.0 (456명)              │
│                                                       │
│ 만족도: ★ 10% ★★ 15% ★★★ 40% ★★★★ 25% ★★★★★ 10%    │
│                                                       │
│ [이 공약 평가하기]                                    │
└─────────────────────────────────────────────────────┘
```

---

## 🛠 구현 계획

### Phase 1: Supabase Auth 구현 (최우선)
**목표**: Google 로그인 구현

1. **Supabase Auth 설정**
   - [ ] Supabase Dashboard에서 Google OAuth 설정
   - [ ] Google Cloud Console에서 OAuth 클라이언트 생성
   - [ ] 환경변수 설정

2. **Auth Context 생성**
   - [ ] `src/contexts/AuthContext.jsx` 생성
   - [ ] 로그인/로그아웃 함수
   - [ ] 사용자 세션 관리

3. **로그인 UI**
   - [ ] `src/components/LoginButton.jsx` 생성
   - [ ] Google 로그인 버튼
   - [ ] 사용자 프로필 드롭다운

4. **User Profile 테이블**
   - [ ] Supabase에서 user_profiles 테이블 생성
   - [ ] 로그인 시 자동으로 프로필 생성 (Trigger)

**예상 소요 시간**: 3-4시간
**난이도**: 중간

---

### Phase 2: 평가 시스템 DB 및 API (우선)
**목표**: 평가 저장 및 조회 기능

1. **Database 테이블 생성**
   - [ ] `candidate_ratings` 테이블
   - [ ] `pledge_ratings` 테이블
   - [ ] `rating_likes` 테이블
   - [ ] `rating_reports` 테이블

2. **SupabaseDataSource에 메서드 추가**
   - [ ] `createCandidateRating(hubo_id, user_id, rating, comment)`
   - [ ] `getCandidateRatings(hubo_id)` - 평균 및 목록
   - [ ] `createPledgeRating(pledge_id, user_id, rating, comment)`
   - [ ] `getPledgeRatings(pledge_id)`
   - [ ] `getUserRating(user_id, hubo_id or pledge_id)` - 이미 평가했는지 확인
   - [ ] `updateRating(rating_id, new_rating, new_comment)`
   - [ ] `deleteRating(rating_id)`

3. **RLS (Row Level Security) 정책**
   - [ ] 누구나 평가 읽기 가능
   - [ ] 인증된 사용자만 평가 작성
   - [ ] 자신의 평가만 수정/삭제 가능

**예상 소요 시간**: 4-5시간
**난이도**: 중간

---

### Phase 3: 평가 UI 컴포넌트 (우선)
**목표**: 사용자가 평가를 작성하고 볼 수 있는 UI

1. **RatingStars 컴포넌트**
   - [ ] `src/components/RatingStars.jsx`
   - [ ] 별점 입력 (1-5점)
   - [ ] 읽기 전용 모드

2. **CandidateRatingSection 컴포넌트**
   - [ ] `src/components/CandidateRatingSection.jsx`
   - [ ] 종합 평점 표시
   - [ ] 평가 작성 폼
   - [ ] 평가 목록 (페이지네이션)
   - [ ] 정렬 (최신순, 평점 높은 순, 공감 많은 순)

3. **PledgeRatingSection 컴포넌트**
   - [ ] `src/components/PledgeRatingSection.jsx`
   - [ ] 공약별 평점 표시
   - [ ] 간단한 평가 작성 (모달)

4. **RatingCard 컴포넌트**
   - [ ] `src/components/RatingCard.jsx`
   - [ ] 사용자 평가 카드
   - [ ] 공감 버튼
   - [ ] 신고 버튼

**예상 소요 시간**: 6-8시간
**난이도**: 중간~높음

---

### Phase 4: 통계 및 시각화 (선택)
**목표**: 평가 데이터 분석 및 시각화

1. **평가 통계 API**
   - [ ] 정치인별 평균 평점
   - [ ] 시간별 평점 추이
   - [ ] 지역별 평균 비교
   - [ ] 정당별 평균 비교

2. **RatingStats 컴포넌트**
   - [ ] `src/components/RatingStats.jsx`
   - [ ] 평점 분포 차트 (1점~5점)
   - [ ] 시간별 추이 그래프

3. **LeaderBoard 컴포넌트**
   - [ ] 평점 높은 정치인 TOP 10
   - [ ] 평점 낮은 정치인 TOP 10
   - [ ] 지역별 순위

**예상 소요 시간**: 6-8시간
**난이도**: 중간~높음

---

### Phase 5: 조작 방지 및 품질 관리 (선택)
**목표**: 악의적 평가 방지

1. **신고 시스템**
   - [ ] 평가 신고 기능
   - [ ] 신고 검토 Admin 페이지

2. **평가 품질 관리**
   - [ ] 신뢰도 점수 (Reputation Score)
   - [ ] 평가 작성 제한 (1일 N개)
   - [ ] 스팸 필터링

3. **Captcha 통합**
   - [ ] 평가 작성 시 reCAPTCHA

**예상 소요 시간**: 4-6시간
**난이도**: 높음

---

## 📅 전체 로드맵

### Week 1: 인증 및 기본 평가 (최우선)
- ✅ Phase 1: Supabase Auth 구현 (3-4시간)
- ✅ Phase 2: 평가 시스템 DB 및 API (4-5시간)
- ✅ Phase 3: 평가 UI 컴포넌트 (6-8시간)

**예상 총 소요 시간**: 13-17시간

### Week 2: 통계 및 고급 기능 (선택)
- Phase 4: 통계 및 시각화 (6-8시간)
- Phase 5: 조작 방지 (4-6시간)

**예상 총 소요 시간**: 10-14시간

---

## 🔐 보안 고려사항

### 1. 인증
- Google OAuth 2.0 사용
- Supabase Auth로 세션 관리
- JWT 토큰 자동 갱신

### 2. 데이터 무결성
- 1인 1표 제약 (UNIQUE constraint)
- 평점 범위 제한 (CHECK constraint)
- Foreign Key로 데이터 일관성 보장

### 3. RLS (Row Level Security)
- 읽기: 누구나 가능
- 쓰기: 인증된 사용자만
- 수정/삭제: 작성자 본인만

### 4. Rate Limiting
- Supabase Edge Functions로 요청 제한
- 1일 평가 개수 제한

---

## 💡 다음 단계

**즉시 시작할 작업:**

1. **Supabase Google OAuth 설정**
   - Google Cloud Console에서 OAuth 클라이언트 생성
   - Supabase Dashboard에서 Google Provider 활성화

2. **AuthContext 구현**
   - `src/contexts/AuthContext.jsx` 생성
   - 로그인/로그아웃 함수 구현

3. **평가 테이블 생성**
   - `scripts/create_rating_tables.sql` 작성
   - Supabase에서 실행

---

**우선순위:**
1. 🔴 **Phase 1** (인증) - 가장 중요! 다른 기능의 기반
2. 🟠 **Phase 2** (평가 DB/API) - 핵심 기능
3. 🟡 **Phase 3** (평가 UI) - 사용자 경험
4. 🟢 **Phase 4** (통계) - 부가 가치
5. 🔵 **Phase 5** (조작 방지) - 장기적 품질

---

**Last Updated**: 2025-10-06
**Status**: Planning Complete - Ready to Implement
