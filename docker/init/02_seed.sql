-- =====================================================
-- Learn App — Seed Data (dev only)
-- Badges mặc định cho study-service
-- =====================================================

INSERT INTO study.badges (id, code, name, description, badge_type, condition_value) VALUES
    (uuid_generate_v4(), 'STREAK_7',    '7 Day Streak',    'Học liên tục 7 ngày',   'STREAK',    7),
    (uuid_generate_v4(), 'STREAK_30',   '30 Day Streak',   'Học liên tục 30 ngày',  'STREAK',    30),
    (uuid_generate_v4(), 'STREAK_100',  '100 Day Streak',  'Học liên tục 100 ngày', 'STREAK',    100),
    (uuid_generate_v4(), 'SESSION_10',  'Session Master',  'Hoàn thành 10 session', 'SESSION',   10),
    (uuid_generate_v4(), 'SESSION_50',  'Focus Champion',  'Hoàn thành 50 session', 'SESSION',   50),
    (uuid_generate_v4(), 'CARD_50',     'Card Creator',    'Tạo 50 flashcard',      'FLASHCARD', 50),
    (uuid_generate_v4(), 'CARD_200',    'Knowledge Builder','Tạo 200 flashcard',    'FLASHCARD', 200),
    (uuid_generate_v4(), 'FIRST_STUDY', 'First Step',      'Session đầu tiên',      'SPECIAL',   1);
