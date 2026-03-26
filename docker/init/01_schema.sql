-- =====================================================
-- Learn App — Database Schema (Microservices version)
-- PostgreSQL 15 — 4 schemas: auth / study / flashcard / notification
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────
-- CREATE SCHEMAS
-- ─────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS study;
CREATE SCHEMA IF NOT EXISTS flashcard;
CREATE SCHEMA IF NOT EXISTS notification;

-- Grant full access to app user
GRANT ALL ON SCHEMA auth         TO learn_user;
GRANT ALL ON SCHEMA study        TO learn_user;
GRANT ALL ON SCHEMA flashcard    TO learn_user;
GRANT ALL ON SCHEMA notification TO learn_user;

-- =====================================================
-- SCHEMA: auth  (owned by auth-service)
-- =====================================================

CREATE TABLE auth.users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255),
    display_name        VARCHAR(100) NOT NULL,
    avatar_url          TEXT,
    timezone            VARCHAR(50)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    role                VARCHAR(20)  NOT NULL DEFAULT 'USER',
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    email_verify_token  VARCHAR(255),
    oauth_provider      VARCHAR(50),
    oauth_provider_id   VARCHAR(255),
    xp_total            INT NOT NULL DEFAULT 0,
    coin_balance        INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_users_email ON auth.users(email);

CREATE TABLE auth.refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_refresh_tokens_user ON auth.refresh_tokens(user_id);

CREATE TABLE auth.push_subscriptions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint    TEXT NOT NULL,
    p256dh      TEXT NOT NULL,
    auth        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth.user_settings (
    user_id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notify_daily_reminder       BOOLEAN NOT NULL DEFAULT TRUE,
    notify_reminder_time        TIME    NOT NULL DEFAULT '08:00:00',
    notify_streak_warning       BOOLEAN NOT NULL DEFAULT TRUE,
    notify_review_reminder      BOOLEAN NOT NULL DEFAULT TRUE,
    reward_xp_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
    reward_coin_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    reward_badge_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    reward_time_window_start    TIME,
    reward_time_window_end      TIME,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- auto updated_at trigger for auth schema
CREATE OR REPLACE FUNCTION auth.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auth.set_updated_at();

-- =====================================================
-- SCHEMA: study  (owned by study-service)
-- =====================================================

CREATE TABLE study.study_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL,
    duration_secs   INT  NOT NULL,
    session_type    VARCHAR(20) NOT NULL DEFAULT 'POMODORO',
    completed       BOOLEAN NOT NULL DEFAULT TRUE,
    study_date      DATE NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL,
    ended_at        TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_study_sessions_user_date ON study.study_sessions(user_id, study_date);

CREATE TABLE study.streaks (
    user_id         UUID PRIMARY KEY,
    current_streak  INT  NOT NULL DEFAULT 0,
    longest_streak  INT  NOT NULL DEFAULT 0,
    last_study_date DATE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE study.badges (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code             VARCHAR(50)  NOT NULL UNIQUE,
    name             VARCHAR(100) NOT NULL,
    description      TEXT,
    badge_type       VARCHAR(20)  NOT NULL,
    condition_value  INT
);

CREATE TABLE study.user_badges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL,
    badge_id    UUID NOT NULL REFERENCES study.badges(id) ON DELETE CASCADE,
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE study.reward_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL,
    session_id   UUID,
    reward_type  VARCHAR(20) NOT NULL,
    reward_value INT,
    badge_code   VARCHAR(50),
    rewarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_study_reward_logs_user ON study.reward_logs(user_id);

CREATE TABLE study.user_goals (
    user_id                     UUID PRIMARY KEY,
    goal_study_minutes_per_day  INT NOT NULL DEFAULT 60,
    goal_cards_per_day          INT NOT NULL DEFAULT 20,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE study.proof_of_study (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL,
    session_id  UUID,
    image_url   TEXT NOT NULL,
    study_date  DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SCHEMA: flashcard  (owned by flashcard-service)
-- =====================================================

-- Subjects (môn học / thư mục) — parent of decks
CREATE TABLE flashcard.subjects (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL,
    name             VARCHAR(200) NOT NULL,
    emoji            VARCHAR(10)  NOT NULL DEFAULT '📚',
    color            VARCHAR(7)   NOT NULL DEFAULT '#6366f1',
    reminder_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_type     VARCHAR(20),            -- "MINUTES" | "HOURS" | "DAILY" | "WEEKLY"
    reminder_interval INTEGER,               -- for MINUTES/HOURS: interval value
    reminder_time     TIME,                  -- for DAILY/WEEKLY: e.g. 20:00
    reminder_days     VARCHAR(50),           -- for WEEKLY: "MON,WED,FRI"
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcard_subjects_user ON flashcard.subjects(user_id);

CREATE TABLE flashcard.decks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL,
    subject_id  UUID REFERENCES flashcard.subjects(id) ON DELETE SET NULL,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    cover_color VARCHAR(7) DEFAULT '#6366f1',
    card_count  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcard_decks_user    ON flashcard.decks(user_id);
CREATE INDEX idx_flashcard_decks_subject ON flashcard.decks(subject_id);

CREATE TABLE flashcard.tags (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name    VARCHAR(100) NOT NULL,
    UNIQUE(user_id, name)
);

CREATE TABLE flashcard.cards (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id             UUID NOT NULL REFERENCES flashcard.decks(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL,
    front_text          TEXT,
    front_image_url     TEXT,
    back_text           TEXT,
    back_image_url      TEXT,
    fsrs_stability      DOUBLE PRECISION DEFAULT 0,
    fsrs_difficulty     DOUBLE PRECISION DEFAULT 0,
    fsrs_elapsed_days   INT DEFAULT 0,
    fsrs_scheduled_days INT DEFAULT 0,
    fsrs_reps           INT DEFAULT 0,
    fsrs_lapses         INT DEFAULT 0,
    fsrs_state          INTEGER DEFAULT 0,
    next_review_date    DATE,
    last_review_date    DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source              VARCHAR(500),
    content_format      VARCHAR(20) NOT NULL DEFAULT 'plain'
);

CREATE INDEX idx_flashcard_cards_user        ON flashcard.cards(user_id);
CREATE INDEX idx_flashcard_cards_deck        ON flashcard.cards(deck_id);
CREATE INDEX idx_flashcard_cards_next_review ON flashcard.cards(user_id, next_review_date);

CREATE TABLE flashcard.card_tags (
    card_id UUID NOT NULL REFERENCES flashcard.cards(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES flashcard.tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (card_id, tag_id)
);

CREATE TABLE flashcard.card_reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id             UUID NOT NULL REFERENCES flashcard.cards(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL,
    rating              VARCHAR(10) NOT NULL,
    review_duration_ms  INT,
    stability_after     DOUBLE PRECISION,
    difficulty_after    DOUBLE PRECISION,
    scheduled_days      INT,
    reviewed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_date         DATE NOT NULL
);

CREATE INDEX idx_flashcard_reviews_user ON flashcard.card_reviews(user_id);
CREATE INDEX idx_flashcard_reviews_date ON flashcard.card_reviews(user_id, review_date);

-- Trigger: auto update deck.card_count
CREATE OR REPLACE FUNCTION flashcard.sync_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE flashcard.decks SET card_count = card_count + 1 WHERE id = NEW.deck_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE flashcard.decks SET card_count = card_count - 1 WHERE id = OLD.deck_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_card_count_sync
    AFTER INSERT OR DELETE ON flashcard.cards
    FOR EACH ROW EXECUTE FUNCTION flashcard.sync_deck_card_count();

-- =====================================================
-- SCHEMA: notification  (owned by notification-service)
-- =====================================================

CREATE TABLE notification.notification_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT,
    reference_id    UUID,
    sent_via        VARCHAR(20) NOT NULL DEFAULT 'WS',
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_logs_user ON notification.notification_logs(user_id, sent_at DESC);
