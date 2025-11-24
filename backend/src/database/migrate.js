/**
 * Database Migration Script
 * Creates all tables for the Luxio platform
 */
require('dotenv').config();
const { pool } = require('./pool');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('Starting database migration...');

    // Read SQL schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSQL;

    if (fs.existsSync(schemaPath)) {
      schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    } else {
      // Generate schema from DATABASE_SCHEMA.md
      schemaSQL = generateSchemaFromMarkdown();
    }

    // Split by semicolon and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log('✓ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists')) {
            console.log('⚠ Skipped (already exists):', statement.substring(0, 50) + '...');
          } else {
            console.error('✗ Error executing:', statement.substring(0, 50));
            console.error('Error:', error.message);
            throw error;
          }
        }
      }
    }

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

function generateSchemaFromMarkdown() {
  // This is a simplified version - in production, parse DATABASE_SCHEMA.md
  // For now, return the SQL directly
  return `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      birth_date DATE NOT NULL,
      gender VARCHAR(20) NOT NULL,
      looking_for TEXT[] NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      phone_verified BOOLEAN DEFAULT FALSE,
      email_verification_token VARCHAR(255),
      phone_verification_code VARCHAR(6),
      phone_verification_expires TIMESTAMP,
      password_reset_token VARCHAR(255),
      password_reset_expires TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      is_banned BOOLEAN DEFAULT FALSE,
      ban_reason TEXT,
      ban_expires TIMESTAMP,
      last_active TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

    -- User settings table
    CREATE TABLE IF NOT EXISTS user_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      notifications_matches BOOLEAN DEFAULT TRUE,
      notifications_messages BOOLEAN DEFAULT TRUE,
      notifications_likes BOOLEAN DEFAULT TRUE,
      notifications_super_likes BOOLEAN DEFAULT TRUE,
      notifications_top_picks BOOLEAN DEFAULT FALSE,
      notifications_promotions BOOLEAN DEFAULT FALSE,
      quiet_hours_enabled BOOLEAN DEFAULT FALSE,
      quiet_hours_start TIME,
      quiet_hours_end TIME,
      show_distance BOOLEAN DEFAULT TRUE,
      show_last_active BOOLEAN DEFAULT TRUE,
      incognito_mode BOOLEAN DEFAULT FALSE,
      biometric_enabled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id)
    );

    -- User consents table (GDPR)
    CREATE TABLE IF NOT EXISTS user_consents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      consent_type VARCHAR(50) NOT NULL,
      accepted BOOLEAN NOT NULL,
      accepted_at TIMESTAMP DEFAULT NOW(),
      ip_address VARCHAR(45),
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);

    -- Profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bio TEXT,
      interests TEXT[],
      relationship_goal VARCHAR(20),
      communication_style VARCHAR(20),
      height INTEGER,
      work VARCHAR(100),
      education VARCHAR(100),
      exercise VARCHAR(50),
      smoking VARCHAR(50),
      drinking VARCHAR(50),
      children VARCHAR(50),
      religion VARCHAR(50),
      politics VARCHAR(50),
      zodiac_sign VARCHAR(20),
      mbti VARCHAR(10),
      location_latitude DECIMAL(10, 8),
      location_longitude DECIMAL(11, 8),
      location_city VARCHAR(100),
      location_country VARCHAR(100),
      is_verified BOOLEAN DEFAULT FALSE,
      verification_photo_url TEXT,
      verification_status VARCHAR(20) DEFAULT 'pending',
      verification_requested_at TIMESTAMP,
      verification_approved_at TIMESTAMP,
      is_premium BOOLEAN DEFAULT FALSE,
      premium_tier VARCHAR(20) DEFAULT 'free',
      premium_expires_at TIMESTAMP,
      is_sugar_dating BOOLEAN DEFAULT FALSE,
      completion_percentage INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location_latitude, location_longitude);
    CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified);
    CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium);
    CREATE INDEX IF NOT EXISTS idx_profiles_sugar_dating ON profiles(is_sugar_dating);

    -- Profile photos table
    CREATE TABLE IF NOT EXISTS profile_photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      is_private BOOLEAN DEFAULT FALSE,
      is_primary BOOLEAN DEFAULT FALSE,
      order_index INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      size BIGINT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_profile_photos_profile_id ON profile_photos(profile_id);
    CREATE INDEX IF NOT EXISTS idx_profile_photos_order ON profile_photos(profile_id, order_index);

    -- Swipes table
    CREATE TABLE IF NOT EXISTS swipes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      swiper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      swiped_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(swiper_id, swiped_id)
    );

    CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
    CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes(swiped_id);
    CREATE INDEX IF NOT EXISTS idx_swipes_action ON swipes(action);
    CREATE INDEX IF NOT EXISTS idx_swipes_created_at ON swipes(created_at);

    -- Matches table
    CREATE TABLE IF NOT EXISTS matches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      matched_at TIMESTAMP DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE,
      unmatched_at TIMESTAMP,
      unmatched_by UUID REFERENCES users(id),
      UNIQUE(user1_id, user2_id)
    );

    CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
    CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
    CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON matches(matched_at);

    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL,
      text TEXT,
      media_url TEXT,
      thumbnail_url TEXT,
      duration INTEGER,
      read_status VARCHAR(20) DEFAULT 'sent',
      read_at TIMESTAMP,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_read_status ON messages(read_status);

    -- Media files table
    CREATE TABLE IF NOT EXISTS media_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      type VARCHAR(20) NOT NULL,
      size BIGINT NOT NULL,
      width INTEGER,
      height INTEGER,
      duration INTEGER,
      mime_type VARCHAR(100),
      storage_path TEXT NOT NULL,
      is_nsfw BOOLEAN DEFAULT FALSE,
      nsfw_score DECIMAL(5, 4),
      virus_scan_status VARCHAR(20) DEFAULT 'pending',
      virus_scan_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
    CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(type);
    CREATE INDEX IF NOT EXISTS idx_media_files_nsfw ON media_files(is_nsfw);

    -- Reports table
    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason VARCHAR(100) NOT NULL,
      description TEXT,
      evidence_urls TEXT[],
      status VARCHAR(20) DEFAULT 'pending',
      reviewed_by UUID REFERENCES users(id),
      reviewed_at TIMESTAMP,
      resolution TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
    CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

    -- Blocks table
    CREATE TABLE IF NOT EXISTS blocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(blocker_id, blocked_id)
    );

    CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
    CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

    -- Subscriptions table
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tier VARCHAR(20) NOT NULL,
      platform VARCHAR(20) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      auto_renew BOOLEAN DEFAULT TRUE,
      cancelled_at TIMESTAMP,
      cancelled_reason TEXT,
      original_transaction_id VARCHAR(255),
      latest_receipt TEXT,
      purchase_token TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

    -- Payments table
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_id UUID REFERENCES subscriptions(id),
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'HUF',
      platform VARCHAR(20) NOT NULL,
      transaction_id VARCHAR(255) UNIQUE,
      receipt_data TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      refunded_at TIMESTAMP,
      refund_reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

    -- Data export requests table (GDPR)
    CREATE TABLE IF NOT EXISTS data_export_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending',
      file_url TEXT,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      UNIQUE(user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);

    -- Data deletion requests table (GDPR)
    CREATE TABLE IF NOT EXISTS data_deletion_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending',
      scheduled_deletion_date TIMESTAMP,
      deleted_at TIMESTAMP,
      cancelled_at TIMESTAMP,
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
    CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_scheduled_date ON data_deletion_requests(scheduled_deletion_date);

    -- Audit logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50),
      resource_id UUID,
      details JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

    -- Push tokens table
    CREATE TABLE IF NOT EXISTS push_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      platform VARCHAR(20) NOT NULL,
      device_id VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, device_id)
    );

    CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

    -- User statistics table
    CREATE TABLE IF NOT EXISTS user_statistics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      swipes_sent INTEGER DEFAULT 0,
      likes_sent INTEGER DEFAULT 0,
      passes_sent INTEGER DEFAULT 0,
      super_likes_sent INTEGER DEFAULT 0,
      matches_received INTEGER DEFAULT 0,
      messages_sent INTEGER DEFAULT 0,
      messages_received INTEGER DEFAULT 0,
      profile_views INTEGER DEFAULT 0,
      likes_received INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON user_statistics(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_statistics_date ON user_statistics(date);
  `;
}

// Run migration
migrate();

