-- GitaGPT Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Create index on firebase_uid for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Conversation sessions table
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    interaction_mode VARCHAR(20) DEFAULT 'wisdom' CHECK (interaction_mode IN ('socratic', 'wisdom', 'story')),
    summary TEXT,
    message_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_started_at ON conversation_sessions(started_at);

-- Conversation messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    emotion_label VARCHAR(50),
    emotion_confidence DECIMAL(3,2) CHECK (emotion_confidence >= 0.0 AND emotion_confidence <= 1.0),
    emotion_emoji VARCHAR(10),
    emotion_color VARCHAR(20),
    verse_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sequence_number INTEGER NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sequence ON conversation_messages(session_id, sequence_number);

-- Emotion logs table for analytics
CREATE TABLE IF NOT EXISTS emotion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
    emotion_label VARCHAR(50) NOT NULL,
    emotion_confidence DECIMAL(3,2) NOT NULL,
    emotion_emoji VARCHAR(10),
    emotion_color VARCHAR(20),
    user_input TEXT,
    verse_ids TEXT[], -- Array of verse IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_emotion_logs_user_id ON emotion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_created_at ON emotion_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_emotion_label ON emotion_logs(emotion_label);

-- Verse metadata table (for tracking verse usage)
CREATE TABLE IF NOT EXISTS verse_metadata (
    id VARCHAR(20) PRIMARY KEY, -- e.g., "BG2.47"
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    shloka TEXT NOT NULL,
    transliteration TEXT,
    eng_meaning TEXT,
    hin_meaning TEXT,
    theme VARCHAR(100),
    emotion_tags TEXT[], -- Array of emotions this verse addresses
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for verse queries
CREATE INDEX IF NOT EXISTS idx_verse_metadata_chapter_verse ON verse_metadata(chapter, verse);
CREATE INDEX IF NOT EXISTS idx_verse_metadata_theme ON verse_metadata(theme);
CREATE INDEX IF NOT EXISTS idx_verse_metadata_usage_count ON verse_metadata(usage_count);

-- Function to update message count in conversation_sessions
CREATE OR REPLACE FUNCTION update_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversation_sessions 
        SET message_count = message_count + 1 
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversation_sessions 
        SET message_count = message_count - 1 
        WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update message count
DROP TRIGGER IF EXISTS trigger_update_message_count ON conversation_messages;
CREATE TRIGGER trigger_update_message_count
    AFTER INSERT OR DELETE ON conversation_messages
    FOR EACH ROW EXECUTE FUNCTION update_message_count();

-- Function to update verse usage count
CREATE OR REPLACE FUNCTION update_verse_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verse_id IS NOT NULL THEN
        INSERT INTO verse_metadata (id, chapter, verse, shloka, eng_meaning, usage_count)
        VALUES (NEW.verse_id, 0, 0, '', '', 1)
        ON CONFLICT (id) 
        DO UPDATE SET 
            usage_count = verse_metadata.usage_count + 1,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update verse usage
DROP TRIGGER IF EXISTS trigger_update_verse_usage ON conversation_messages;
CREATE TRIGGER trigger_update_verse_usage
    AFTER INSERT ON conversation_messages
    FOR EACH ROW EXECUTE FUNCTION update_verse_usage();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = firebase_uid);

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON conversation_sessions
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can create own conversations" ON conversation_sessions
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Users can only see their own messages
CREATE POLICY "Users can view own messages" ON conversation_messages
    FOR SELECT USING (session_id IN (
        SELECT cs.id FROM conversation_sessions cs
        JOIN users u ON cs.user_id = u.id
        WHERE u.firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can create own messages" ON conversation_messages
    FOR INSERT WITH CHECK (session_id IN (
        SELECT cs.id FROM conversation_sessions cs
        JOIN users u ON cs.user_id = u.id
        WHERE u.firebase_uid = auth.uid()::text
    ));

-- Users can only see their own emotion logs
CREATE POLICY "Users can view own emotion logs" ON emotion_logs
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can create own emotion logs" ON emotion_logs
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Verse metadata is public (read-only for users)
ALTER TABLE verse_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view verse metadata" ON verse_metadata
    FOR SELECT USING (true);

-- Insert some sample verses
INSERT INTO verse_metadata (id, chapter, verse, shloka, transliteration, eng_meaning, theme, emotion_tags) VALUES
('BG2.47', 2, 47, 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥', 'karmaṇy-evādhikāras te mā phaleṣu kadācana mā karma-phala-hetur bhūr mā te saṅgo ''stv akarmaṇi', 'You have a right to perform your prescribed duty, but not to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.', 'Karma Yoga', ARRAY['anxiety', 'stress', 'attachment']),
('BG2.13', 2, 13, 'देहिनोऽस्मिन्यथा देहे कौमारं यौवनं जरा। तथा देहान्तरप्राप्तिर्धीरस्तत्र न मुह्यति॥', 'dehino ''smin yathā dehe kaumāraṁ yauvanaṁ jarā tathā dehāntara-prāptir dhīras tatra na muhyati', 'As the embodied soul continuously passes through childhood, youth, and old age in this body, so does it pass into another body at death. The wise are not deluded by this.', 'Soul and Death', ARRAY['grief', 'sadness', 'loss']),
('BG6.35', 6, 35, 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्। अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥', 'asaṁśayaṁ mahā-bāho mano durnigrahaṁ calam abhyāsena tu kaunteya vairāgyeṇa ca gṛhyate', 'O mighty-armed son of Kunti, it is undoubtedly very difficult to curb the restless mind, but it is possible by suitable practice and detachment.', 'Mind Control', ARRAY['restlessness', 'anxiety', 'confusion']);

-- Create a function to get user spiritual progress
CREATE OR REPLACE FUNCTION get_user_spiritual_progress(user_firebase_uid TEXT)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    progress_data JSON;
BEGIN
    -- Get user ID
    SELECT id INTO user_record FROM users WHERE firebase_uid = user_firebase_uid;
    
    IF user_record.id IS NULL THEN
        RETURN '{"error": "User not found"}'::JSON;
    END IF;
    
    -- Calculate spiritual progress metrics
    SELECT json_build_object(
        'total_conversations', (
            SELECT COUNT(*) FROM conversation_sessions WHERE user_id = user_record.id
        ),
        'total_messages', (
            SELECT COUNT(*) FROM conversation_messages cm
            JOIN conversation_sessions cs ON cm.session_id = cs.id
            WHERE cs.user_id = user_record.id AND cm.role = 'user'
        ),
        'verses_explored', (
            SELECT COUNT(DISTINCT verse_id) FROM conversation_messages cm
            JOIN conversation_sessions cs ON cm.session_id = cs.id
            WHERE cs.user_id = user_record.id AND verse_id IS NOT NULL
        ),
        'favorite_emotion', (
            SELECT emotion_label FROM emotion_logs
            WHERE user_id = user_record.id
            GROUP BY emotion_label
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        'recent_activity', (
            SELECT json_agg(
                json_build_object(
                    'date', DATE(started_at),
                    'conversations', COUNT(*)
                )
            )
            FROM conversation_sessions
            WHERE user_id = user_record.id
            AND started_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(started_at)
            ORDER BY DATE(started_at) DESC
        )
    ) INTO progress_data;
    
    RETURN progress_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'GitaGPT database setup completed successfully!' as message;