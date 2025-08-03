-- Seed data for testing Korea Promise Tracker database
-- This file creates test data for development and testing purposes

-- Insert test profiles (these would normally be created via auth triggers)
-- Note: In production, these would be created automatically when users sign up

INSERT INTO profiles (id, username, full_name, avatar_url, region) VALUES
-- Admin/Moderator users
('550e8400-e29b-41d4-a716-446655440001', 'admin_kim', '김관리자', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '서울특별시'),
('550e8400-e29b-41d4-a716-446655440002', 'moderator_lee', '이조정자', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '경기도'),

-- Regular test users
('550e8400-e29b-41d4-a716-446655440003', 'citizen_park', '박시민', 'https://images.unsplash.com/photo-1494790108755-2616b612b890?w=150', '서울특별시'),
('550e8400-e29b-41d4-a716-446655440004', 'reporter_choi', '최기자', 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150', '부산광역시'),
('550e8400-e29b-41d4-a716-446655440005', 'activist_jung', '정활동가', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '대구광역시'),
('550e8400-e29b-41d4-a716-446655440006', 'student_kang', '강학생', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', '인천광역시'),
('550e8400-e29b-41d4-a716-446655440007', 'teacher_yoon', '윤선생', 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150', '광주광역시'),
('550e8400-e29b-41d4-a716-446655440008', 'worker_shin', '신노동자', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150', '대전광역시'),
('550e8400-e29b-41d4-a716-446655440009', 'elder_han', '한어르신', 'https://images.unsplash.com/photo-1485206412256-701ccc5b93ca?w=150', '울산광역시'),
('550e8400-e29b-41d4-a716-446655440010', 'youth_oh', '오청년', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150', '강원도');

-- Insert test promise ratings
INSERT INTO promise_ratings (promise_id, user_id, rating, comment) VALUES
-- Ratings for "250만호 주택 공급" (nat-001)
('nat-001', '550e8400-e29b-41d4-a716-446655440003', 4, '진행 속도가 예상보다 빠르고 구체적인 계획이 보여서 만족합니다.'),
('nat-001', '550e8400-e29b-41d4-a716-446655440004', 3, '좋은 방향이지만 실제 서민들이 구매할 수 있는 가격대인지 의문입니다.'),
('nat-001', '550e8400-e29b-41d4-a716-446655440005', 5, '주택 공급 확대는 반드시 필요한 정책입니다. 적극 지지합니다.'),
('nat-001', '550e8400-e29b-41d4-a716-446655440006', 2, '수도권 집중만 더 심화시킬 것 같아 우려됩니다.'),
('nat-001', '550e8400-e29b-41d4-a716-446655440007', 4, '지역별 균형 발전도 함께 고려해주시면 좋겠습니다.'),

-- Ratings for "기초연금 확대" (nat-002)  
('nat-002', '550e8400-e29b-41d4-a716-446655440008', 5, '어르신들께 정말 필요한 정책입니다. 빠른 시행을 바랍니다.'),
('nat-002', '550e8400-e29b-41d4-a716-446655440009', 5, '생활에 실질적인 도움이 되고 있습니다. 감사합니다.'),
('nat-002', '550e8400-e29b-41d4-a716-446655440010', 4, '좋은 정책이지만 재원 마련 방안이 지속가능한지 궁금합니다.'),
('nat-002', '550e8400-e29b-41d4-a716-446655440003', 4, '부모님께서 많은 도움을 받고 계십니다.'),

-- Ratings for "반도체 메가클러스터" (nat-003)
('nat-003', '550e8400-e29b-41d4-a716-446655440004', 5, '미래 먹거리 산업을 위한 필수적인 투자라고 생각합니다.'),
('nat-003', '550e8400-e29b-41d4-a716-446655440005', 3, '좋은 취지지만 환경 영향에 대한 검토가 더 필요할 것 같습니다.'),
('nat-003', '550e8400-e29b-41d4-a716-446655440008', 4, '일자리 창출 효과가 기대됩니다.'),

-- Ratings for local promises
('seoul-001', '550e8400-e29b-41d4-a716-446655440003', 3, '대중교통 요금 인상이 부담스럽긴 하지만 서비스 개선이 우선되어야 할 것 같습니다.'),
('seoul-001', '550e8400-e29b-41d4-a716-446655440001', 4, '교통 인프라 개선을 위해 필요한 조치라고 봅니다.'),

('busan-001', '550e8400-e29b-41d4-a716-446655440004', 5, '부산 북항 재개발은 도시 발전에 꼭 필요한 프로젝트입니다.'),

('gyeonggi-001', '550e8400-e29b-41d4-a716-446655440002', 4, '청년 일자리 확대는 지역 발전의 핵심입니다.');

-- Insert test citizen reports
INSERT INTO citizen_reports (promise_id, user_id, report_type, title, content, location, verified) VALUES
-- Reports for 주택 공급 promise
('nat-001', '550e8400-e29b-41d4-a716-446655440004', 'news', '신규 택지지구 개발 계획 발표', 
 '국토교통부가 수도권 3기 신도시에 이어 추가 택지지구 개발 계획을 발표했습니다. 총 15만호 규모의 주택이 공급될 예정입니다.',
 '경기도 하남시', true),

('nat-001', '550e8400-e29b-41d4-a716-446655440005', 'photo', '건설 현장 진행 상황', 
 '위례신도시 건설 현장의 최신 진행 상황입니다. 상당한 진전이 있어 보입니다.',
 '경기도 성남시 위례동', false),

('nat-001', '550e8400-e29b-41d4-a716-446655440006', 'progress_update', '분양가 정보 업데이트', 
 '신규 분양 단지의 분양가가 예상보다 높게 책정되어 실제 서민 주거 안정에 도움이 될지 의문입니다.',
 '인천광역시 송도동', false),

-- Reports for 기초연금 promise  
('nat-002', '550e8400-e29b-41d4-a716-446655440009', 'progress_update', '기초연금 인상액 확인', 
 '이번 달부터 기초연금이 월 32만원으로 인상되었습니다. 실제로 계좌에 입금되었습니다.',
 '서울특별시 종로구', true),

('nat-002', '550e8400-e29b-41d4-a716-446655440008', 'concern', '신청 절차 복잡성', 
 '기초연금 신청 절차가 여전히 복잡하여 어르신들이 어려움을 겪고 있습니다. 간소화가 필요합니다.',
 '부산광역시 해운대구', false),

-- Reports for 반도체 클러스터
('nat-003', '550e8400-e29b-41d4-a716-446655440007', 'news', '삼성 파운드리 투자 확정', 
 '삼성전자가 용인 반도체 클러스터에 추가 투자를 확정했다고 발표했습니다.',
 '경기도 용인시', true),

-- Reports for local promises
('seoul-001', '550e8400-e29b-41d4-a716-446655440003', 'concern', '요금 인상 반대 시위', 
 '지하철 요금 인상에 반대하는 시민들의 시위가 시청 앞에서 열렸습니다.',
 '서울특별시 중구 시청역', false),

('busan-001', '550e8400-e29b-41d4-a716-446655440004', 'photo', '북항 재개발 부지 현황', 
 '북항 재개발 부지의 현재 모습입니다. 기존 시설들의 철거가 진행 중입니다.',
 '부산광역시 중구 북항동', true);

-- Insert test subscriptions
INSERT INTO subscriptions (user_id, promise_id, notification_type) VALUES
-- Promise-specific subscriptions
('550e8400-e29b-41d4-a716-446655440003', 'nat-001', 'both'),
('550e8400-e29b-41d4-a716-446655440003', 'seoul-001', 'email'),
('550e8400-e29b-41d4-a716-446655440004', 'nat-001', 'email'),
('550e8400-e29b-41d4-a716-446655440004', 'busan-001', 'both'),
('550e8400-e29b-41d4-a716-446655440005', 'nat-001', 'push'),
('550e8400-e29b-41d4-a716-446655440005', 'nat-003', 'both'),
('550e8400-e29b-41d4-a716-446655440008', 'nat-002', 'email'),
('550e8400-e29b-41d4-a716-446655440009', 'nat-002', 'both'),
('550e8400-e29b-41d4-a716-446655440010', 'nat-002', 'email');

-- Insert region-specific subscriptions
INSERT INTO subscriptions (user_id, region, notification_type) VALUES
('550e8400-e29b-41d4-a716-446655440001', '서울특별시', 'both'),
('550e8400-e29b-41d4-a716-446655440002', '경기도', 'email'),
('550e8400-e29b-41d4-a716-446655440004', '부산광역시', 'both'),
('550e8400-e29b-41d4-a716-446655440007', '광주광역시', 'email');

-- Insert test comments
INSERT INTO comments (promise_id, user_id, content) VALUES
-- Comments on nat-001 (주택 공급)
('nat-001', '550e8400-e29b-41d4-a716-446655440003', '주택 공급 확대는 정말 필요한 정책이라고 생각합니다. 특히 신혼부부와 청년층을 위한 주택이 절실해요.'),
('nat-001', '550e8400-e29b-41d4-a716-446655440004', '공급만 늘리면 되는 건 아니죠. 실제로 서민들이 살 수 있는 가격대여야 의미가 있을 텐데요.'),
('nat-001', '550e8400-e29b-41d4-a716-446655440005', '지역별 균형도 중요합니다. 수도권만 집중하지 말고 지방에도 양질의 주택을 공급해주세요.'),

-- Comments on nat-002 (기초연금)
('nat-002', '550e8400-e29b-41d4-a716-446655440009', '기초연금 인상 덕분에 생활이 많이 나아졌습니다. 감사드립니다.'),
('nat-002', '550e8400-e29b-41d4-a716-446655440008', '어르신들을 위한 좋은 정책입니다. 앞으로도 지속적으로 확대되었으면 좋겠어요.'),

-- Comments on seoul-001 (지하철 요금)
('seoul-001', '550e8400-e29b-41d4-a716-446655440003', '요금 인상은 반대합니다. 서민들의 교통비 부담이 너무 커요.');

-- Insert replies to comments
INSERT INTO comments (promise_id, user_id, parent_comment_id, content) VALUES
('nat-001', '550e8400-e29b-41d4-a716-446655440006', 
 (SELECT id FROM comments WHERE promise_id = 'nat-001' AND user_id = '550e8400-e29b-41d4-a716-446655440003' LIMIT 1),
 '동감합니다. 저도 신혼부부인데 내 집 마련이 정말 어려워요.'),

('nat-001', '550e8400-e29b-41d4-a716-446655440007', 
 (SELECT id FROM comments WHERE promise_id = 'nat-001' AND user_id = '550e8400-e29b-41d4-a716-446655440004' LIMIT 1),
 '맞습니다. 분양가 상한제 같은 제도적 보완도 필요할 것 같아요.'),

('nat-002', '550e8400-e29b-41d4-a716-446655440010', 
 (SELECT id FROM comments WHERE promise_id = 'nat-002' AND user_id = '550e8400-e29b-41d4-a716-446655440009' LIMIT 1),
 '우리 할머니도 많은 도움을 받고 계십니다. 정말 좋은 정책이에요.');

-- Insert some votes for reports and comments
INSERT INTO report_votes (report_id, user_id, vote_type) VALUES
((SELECT id FROM citizen_reports WHERE title = '신규 택지지구 개발 계획 발표' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', 'up'),
((SELECT id FROM citizen_reports WHERE title = '신규 택지지구 개발 계획 발표' LIMIT 1), '550e8400-e29b-41d4-a716-446655440005', 'up'),
((SELECT id FROM citizen_reports WHERE title = '기초연금 인상액 확인' LIMIT 1), '550e8400-e29b-41d4-a716-446655440008', 'up'),
((SELECT id FROM citizen_reports WHERE title = '기초연금 인상액 확인' LIMIT 1), '550e8400-e29b-41d4-a716-446655440010', 'up'),
((SELECT id FROM citizen_reports WHERE title = '요금 인상 반대 시위' LIMIT 1), '550e8400-e29b-41d4-a716-446655440001', 'down');

INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES
((SELECT id FROM comments WHERE promise_id = 'nat-001' AND user_id = '550e8400-e29b-41d4-a716-446655440003' LIMIT 1), '550e8400-e29b-41d4-a716-446655440004', 'up'),
((SELECT id FROM comments WHERE promise_id = 'nat-001' AND user_id = '550e8400-e29b-41d4-a716-446655440003' LIMIT 1), '550e8400-e29b-41d4-a716-446655440005', 'up'),
((SELECT id FROM comments WHERE promise_id = 'nat-001' AND user_id = '550e8400-e29b-41d4-a716-446655440004' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', 'up'),
((SELECT id FROM comments WHERE promise_id = 'nat-002' AND user_id = '550e8400-e29b-41d4-a716-446655440009' LIMIT 1), '550e8400-e29b-41d4-a716-446655440008', 'up'),
((SELECT id FROM comments WHERE promise_id = 'nat-002' AND user_id = '550e8400-e29b-41d4-a716-446655440009' LIMIT 1), '550e8400-e29b-41d4-a716-446655440010', 'up');