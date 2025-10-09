-- ============================================
-- Admin System Tables for Korea Promise Tracker
-- Created: 2025-10-06
-- ============================================

-- 1. pledge_news 테이블 (공약별 관련 뉴스)
-- ============================================
CREATE TABLE IF NOT EXISTS pledge_news (
    news_id SERIAL PRIMARY KEY,
    pledge_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    source VARCHAR(100),          -- 출처 (한겨레, 조선일보, etc.)
    published_date TIMESTAMP,
    summary TEXT,                 -- 뉴스 요약
    sentiment VARCHAR(20),        -- positive/neutral/negative
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),      -- admin 또는 bot
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pledge_id) REFERENCES pledges(pledge_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pledge_news_pledge_id ON pledge_news(pledge_id);
CREATE INDEX IF NOT EXISTS idx_pledge_news_published_date ON pledge_news(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_pledge_news_created_at ON pledge_news(created_at DESC);

-- ============================================
-- 2. admin_users 테이블 (관리자 사용자)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'editor',  -- admin, editor, viewer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ============================================
-- 3. audit_log 테이블 (감사 로그)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id SERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(50) NOT NULL,      -- CREATE, UPDATE, DELETE
    table_name VARCHAR(50) NOT NULL,  -- pledges, pledge_news
    record_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(user_id) ON DELETE SET NULL
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all admin tables
ALTER TABLE pledge_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read pledge_news (public data)
CREATE POLICY "Public can read pledge_news"
ON pledge_news
FOR SELECT
TO public
USING (true);

-- Policy: Only authenticated admin users can insert pledge_news
CREATE POLICY "Admin can insert pledge_news"
ON pledge_news
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'editor')
    )
);

-- Policy: Only authenticated admin users can update pledge_news
CREATE POLICY "Admin can update pledge_news"
ON pledge_news
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'editor')
    )
);

-- Policy: Only admins can delete pledge_news
CREATE POLICY "Admin can delete pledge_news"
ON pledge_news
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy: Authenticated users can read admin_users (to check roles)
CREATE POLICY "Authenticated can read admin_users"
ON admin_users
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can modify admin_users
CREATE POLICY "Admin can modify admin_users"
ON admin_users
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy: Anyone can read audit_log (transparency)
CREATE POLICY "Public can read audit_log"
ON audit_log
FOR SELECT
TO public
USING (true);

-- Policy: Only system can insert audit_log
CREATE POLICY "System can insert audit_log"
ON audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pledge_news
CREATE TRIGGER update_pledge_news_updated_at
BEFORE UPDATE ON pledge_news
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample admin user (optional - remove in production)
-- ============================================

-- Insert a sample admin user (you'll need to replace with real Supabase Auth UUID)
-- IMPORTANT: This is just a placeholder. Real admin users should be added via Supabase Auth.
-- INSERT INTO admin_users (user_id, email, role)
-- VALUES (
--     'your-supabase-auth-uuid-here',
--     'admin@example.com',
--     'admin'
-- );

-- ============================================
-- Verification Queries
-- ============================================

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pledge_news', 'admin_users', 'audit_log');

-- Check indexes
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('pledge_news', 'admin_users', 'audit_log');

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('pledge_news', 'admin_users', 'audit_log');
