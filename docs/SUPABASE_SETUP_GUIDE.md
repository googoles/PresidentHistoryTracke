# Supabase 설정 가이드 (Step by Step)

## 📚 목차
1. [Supabase 프로젝트 생성](#step-1-supabase-프로젝트-생성)
2. [API Keys 확인 및 복사](#step-2-api-keys-확인-및-복사)
3. [데이터베이스 테이블 생성](#step-3-데이터베이스-테이블-생성)
4. [환경 변수 설정](#step-4-환경-변수-설정)
5. [데이터 마이그레이션 실행](#step-5-데이터-마이그레이션-실행)
6. [마이그레이션 검증](#step-6-마이그레이션-검증)

---

## Step 1: Supabase 프로젝트 생성

### 1.1 Supabase 회원가입/로그인
1. 브라우저에서 https://supabase.com 접속
2. 우측 상단 **"Start your project"** 클릭
3. GitHub 계정으로 로그인 (또는 이메일로 가입)

### 1.2 새 프로젝트 생성
1. Dashboard에서 **"New Project"** 버튼 클릭
2. 다음 정보 입력:
   ```
   Organization: (기본값 또는 새로 만들기)
   Project name: korea-promise-tracker
   Database Password: [강력한 비밀번호 입력 - 반드시 저장하세요!]
   Region: Northeast Asia (Seoul) - 한국 사용자용
   Pricing Plan: Free
   ```
3. **"Create new project"** 클릭
4. ⏳ 프로젝트 생성 대기 (약 2분 소요)

---

## Step 2: API Keys 확인 및 복사

### 2.1 API Keys 페이지 이동
1. 왼쪽 사이드바에서 **⚙️ Settings** 클릭
2. **API** 메뉴 클릭
3. 다음 정보를 확인하고 복사하세요:

### 2.2 복사할 정보
```
📍 Project URL:
https://[your-project-id].supabase.co

🔑 anon public (공개용 키):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔐 service_role (관리자용 키):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 메모장에 임시 저장
위 3가지 정보를 메모장에 복사해두세요. 나중에 `.env.local` 파일에 사용합니다.

⚠️ **중요**: `service_role` 키는 절대 공개하지 마세요!

---

## Step 3: 데이터베이스 테이블 생성

### 3.1 SQL Editor 열기
1. 왼쪽 사이드바에서 **🔨 SQL Editor** 클릭
2. **"New query"** 버튼 클릭

### 3.2 테이블 생성 SQL 실행

⚠️ **중요**: 스키마가 SQLite 데이터베이스와 정확히 일치하도록 업데이트되었습니다.
- `pledges` 테이블 컬럼명: `pledge_realm`, `pledge_title`, `pledge_content`, `last_updated`

#### 방법 1: 파일에서 복사 (권장)
1. 프로젝트 폴더에서 `scripts/create_supabase_tables.sql` 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)
3. Supabase SQL Editor에 붙여넣기 (Ctrl+V)
4. 우측 하단 **"Run"** 버튼 클릭 ▶️

#### 방법 2: 아래 SQL 직접 복사

<details>
<summary>📋 SQL 스크립트 보기 (클릭하여 펼치기)</summary>

```sql
-- Drop existing tables
DROP TABLE IF EXISTS pledges CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;

-- Create Candidates table
CREATE TABLE candidates (
    hubo_id BIGINT PRIMARY KEY,
    sg_id TEXT,
    name TEXT NOT NULL,
    party_name TEXT,
    sgg_name TEXT,
    gender TEXT,
    age INTEGER,
    job TEXT,
    edu TEXT,
    career1 TEXT,
    career2 TEXT,
    is_winner BOOLEAN DEFAULT false,
    votes_won INTEGER,
    vote_percentage REAL,
    metro_city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Pledges table
CREATE TABLE pledges (
    pledge_id INTEGER PRIMARY KEY,
    hubo_id BIGINT REFERENCES candidates(hubo_id) ON DELETE CASCADE,
    pledge_order INTEGER,
    category TEXT,
    title TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_candidates_metro_city ON candidates(metro_city);
CREATE INDEX idx_candidates_is_winner ON candidates(is_winner);
CREATE INDEX idx_candidates_party ON candidates(party_name);
CREATE INDEX idx_pledges_hubo_id ON pledges(hubo_id);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_pledges_category ON pledges(category);

-- Full Text Search
ALTER TABLE candidates ADD COLUMN search_vector tsvector;
CREATE INDEX idx_candidates_search ON candidates USING GIN(search_vector);

CREATE OR REPLACE FUNCTION candidates_search_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.sgg_name, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.party_name, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_search_vector_update
    BEFORE INSERT OR UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION candidates_search_update();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pledges_updated_at
    BEFORE UPDATE ON pledges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public candidates are viewable by everyone"
    ON candidates FOR SELECT
    USING (true);

CREATE POLICY "Public pledges are viewable by everyone"
    ON pledges FOR SELECT
    USING (true);

-- Grant permissions
GRANT SELECT ON candidates TO anon;
GRANT SELECT ON pledges TO anon;
GRANT SELECT ON candidates TO authenticated;
GRANT SELECT ON pledges TO authenticated;
```

</details>

### 3.3 실행 결과 확인
- ✅ **Success. No rows returned** 메시지가 표시되면 성공!
- ❌ 에러 발생 시: 에러 메시지를 복사하고 다시 시도

### 3.4 테이블 생성 확인
1. 왼쪽 사이드바 **📊 Table Editor** 클릭
2. `candidates`와 `pledges` 테이블이 보이는지 확인
3. 각 테이블을 클릭하여 컬럼 구조 확인

---

## Step 4: 환경 변수 설정

### 4.1 .env.local 파일 편집
1. VS Code에서 프로젝트 루트의 `.env.local` 파일 열기
2. Step 2에서 복사한 정보로 아래 내용 수정:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://[your-project-id].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[your-anon-public-key]
SUPABASE_SERVICE_KEY=[your-service-role-key]
```

### 4.2 실제 예시
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://kwxisnnhonijmllwmwfa.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGlzbm5ob25pam1sbHdtd2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTc0OTEsImV4cCI6MjA3NTIzMzQ5MX0.rubCl7qZ83zDBb-xC3ELEAzF0jpTtsKmftzsn_UqHGI
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGlzbm5ob25pam1sbHdtd2ZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1NzQ5MSwiZXhwIjoyMDc1MjMzNDkxfQ.VOvt9aezCWUj-fq4DQo4TpbjMvpSyr9K0uPbQG1or58
```

### 4.3 저장
- Ctrl+S (또는 Cmd+S) 눌러서 저장
- ⚠️ **중요**: `.env.local`은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다

---

## Step 5: 데이터 마이그레이션 실행

### 5.1 필수 패키지 설치 확인
터미널에서 다음 명령어 실행:

```bash
npm install dotenv @supabase/supabase-js
```

### 5.2 마이그레이션 스크립트 실행
터미널에서 다음 명령어 실행:

```bash
node scripts/migrate_to_supabase.js
```

### 5.3 예상 출력
```
🚀 Starting data migration to Supabase...

📂 Loading SQLite database...

📊 Migrating candidates...
  Found 254 winners to migrate
  ✅ Successfully migrated 254 candidates

📋 Migrating pledges...
  Found 7414 pledges to migrate
  ✅ Migrated pledges 1 to 1000 (13%)
  ✅ Migrated pledges 1001 to 2000 (27%)
  ✅ Migrated pledges 2001 to 3000 (40%)
  ✅ Migrated pledges 3001 to 4000 (54%)
  ✅ Migrated pledges 4001 to 5000 (67%)
  ✅ Migrated pledges 5001 to 6000 (81%)
  ✅ Migrated pledges 6001 to 7000 (94%)
  ✅ Migrated pledges 7001 to 7414 (100%)
  ✅ Successfully migrated 7414 pledges

🔍 Verifying migration...
  📊 Candidates in Supabase: 254
  📋 Pledges in Supabase: 7414

✅ Migration completed successfully!

📝 Next steps:
  1. Verify data in Supabase Dashboard
  2. Update .env.local with your Supabase credentials
  3. Switch to SupabaseDataSource in the app
```

### 5.4 에러 발생 시 대처

#### 에러 1: "Could not find the column"
- **원인**: 테이블 스키마가 올바르지 않음
- **해결**: Step 3로 돌아가 SQL을 다시 실행

#### 에러 2: "Missing Supabase credentials"
- **원인**: .env.local 파일이 잘못 설정됨
- **해결**: Step 4로 돌아가 환경 변수 확인

#### 에러 3: "Connection timeout"
- **원인**: 네트워크 문제 또는 Supabase 서버 응답 지연
- **해결**: 잠시 후 다시 시도

---

## Step 6: 마이그레이션 검증

### 6.1 Supabase Dashboard에서 확인

#### 방법 1: Table Editor
1. 왼쪽 사이드바 **📊 Table Editor** 클릭
2. **candidates** 테이블 클릭
3. 데이터 행 확인 (254개 있어야 함)
4. **pledges** 테이블 클릭
5. 데이터 행 확인 (7414개 있어야 함)

#### 방법 2: SQL Query
SQL Editor에서 다음 쿼리 실행:

```sql
-- 데이터 개수 확인
SELECT
    (SELECT COUNT(*) FROM candidates WHERE is_winner = true) as candidates_count,
    (SELECT COUNT(*) FROM pledges) as pledges_count;

-- 샘플 데이터 확인
SELECT * FROM candidates WHERE is_winner = true LIMIT 5;
SELECT * FROM pledges LIMIT 5;

-- 지역별 후보자 수
SELECT metro_city, COUNT(*) as count
FROM candidates
WHERE is_winner = true
GROUP BY metro_city
ORDER BY count DESC;
```

### 6.2 예상 결과
```
candidates_count: 254
pledges_count: 7414

지역별 분포:
경기: 60
서울: 48
부산: 18
...
```

### 6.3 체크리스트
- [ ] candidates 테이블에 254개 데이터 존재
- [ ] pledges 테이블에 7414개 데이터 존재
- [ ] metro_city 컬럼에 한글 지역명 있음
- [ ] 모든 is_winner가 true
- [ ] hubo_id로 candidates와 pledges 조인 가능

---

## 🎉 완료!

축하합니다! Supabase 설정과 데이터 마이그레이션이 완료되었습니다.

### 다음 단계
이제 프론트엔드 코드를 Supabase용으로 변경해야 합니다:

1. **SupabaseDataSource 구현** (다음 가이드 참조)
2. **Context Provider 수정**
3. **Custom Hooks 업데이트**
4. **테스트 및 배포**

---

## 🔧 문제 해결 (Troubleshooting)

### 자주 발생하는 문제

#### 1. "Invalid API key" 에러
```
해결:
1. .env.local 파일에서 키가 올바른지 확인
2. 키 앞뒤에 공백이 없는지 확인
3. Supabase Dashboard에서 키를 다시 복사
```

#### 2. "Row Level Security policy violation"
```
해결:
1. SQL Editor에서 RLS 정책 확인
2. 다음 SQL 실행:
   ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Public candidates" ON candidates FOR SELECT USING (true);
```

#### 3. "Database connection failed"
```
해결:
1. Supabase 프로젝트가 정상 실행 중인지 확인
2. Project URL이 올바른지 확인
3. 방화벽/VPN 설정 확인
```

#### 4. 마이그레이션 중 중단됨
```
해결:
1. 테이블 비우기: TRUNCATE pledges; TRUNCATE candidates;
2. 마이그레이션 스크립트 재실행
```

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL 튜토리얼](https://www.postgresql.org/docs/current/tutorial.html)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

---

## 💡 팁

### 개발 중 유용한 SQL 쿼리

```sql
-- 모든 데이터 삭제
TRUNCATE pledges;
TRUNCATE candidates;

-- 특정 후보자 검색
SELECT * FROM candidates WHERE name LIKE '%이재명%';

-- 공약 개수 확인
SELECT c.name, COUNT(p.pledge_id) as pledge_count
FROM candidates c
LEFT JOIN pledges p ON c.hubo_id = p.hubo_id
WHERE c.is_winner = true
GROUP BY c.name
ORDER BY pledge_count DESC
LIMIT 10;

-- 정당별 후보자 수
SELECT party_name, COUNT(*) as count
FROM candidates
WHERE is_winner = true
GROUP BY party_name
ORDER BY count DESC;
```

---

## ⚠️ 보안 주의사항

1. ✅ **service_role 키는 절대 프론트엔드 코드에 사용 금지**
2. ✅ **anon 키만 React 앱에서 사용**
3. ✅ **.env.local은 절대 Git에 커밋하지 마세요**
4. ✅ **프로덕션 배포 시 환경 변수를 Vercel/Netlify에 설정**

---

문제가 발생하면 이 가이드를 참고하거나 Supabase Discord 커뮤니티에 질문하세요!
