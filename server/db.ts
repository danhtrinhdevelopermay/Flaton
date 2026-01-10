import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_fhTopO0XsNI2@ep-wandering-thunder-a1sup1mc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: true
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        credits DECIMAL(10, 2) DEFAULT 50,
        last_checkin DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add credits and last_checkin columns if they don't exist (for existing databases)
    const creditsColumnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'credits'
    `);
    if (creditsColumnCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN credits DECIMAL(10, 2) DEFAULT 50`);
    }

    const lastCheckinColumnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'last_checkin'
    `);
    if (lastCheckinColumnCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN last_checkin DATE`);
    }

    const isProColumnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_pro'
    `);
    if (isProColumnCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN is_pro BOOLEAN DEFAULT false`);
    }

    // Create generated_images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS generated_images (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        prompt TEXT,
        model VARCHAR(100),
        aspect_ratio VARCHAR(20),
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_public column if it doesn't exist
    const imagesPublicCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'generated_images' AND column_name = 'is_public'
    `);
    if (imagesPublicCheck.rows.length === 0) {
      await client.query(`ALTER TABLE generated_images ADD COLUMN is_public BOOLEAN DEFAULT false`);
    }

    // Create generated_videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS generated_videos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        video_url TEXT NOT NULL,
        prompt TEXT,
        image_url TEXT,
        model VARCHAR(100),
        aspect_ratio VARCHAR(20),
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_public column if it doesn't exist
    const videosPublicCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'generated_videos' AND column_name = 'is_public'
    `);
    if (videosPublicCheck.rows.length === 0) {
      await client.query(`ALTER TABLE generated_videos ADD COLUMN is_public BOOLEAN DEFAULT false`);
    }

    // Create generated_music table
    await client.query(`
      CREATE TABLE IF NOT EXISTS generated_music (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        audio_url TEXT NOT NULL,
        title VARCHAR(255),
        prompt TEXT,
        style VARCHAR(100),
        model VARCHAR(100),
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_public column if it doesn't exist
    const musicPublicCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'generated_music' AND column_name = 'is_public'
    `);
    if (musicPublicCheck.rows.length === 0) {
      await client.query(`ALTER TABLE generated_music ADD COLUMN is_public BOOLEAN DEFAULT false`);
    }

    // Create api_keys table for managing multiple KIE API keys
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        key_value TEXT NOT NULL,
        credits DECIMAL(10, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_current BOOLEAN DEFAULT false,
        last_checked TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Log table structure for debugging
    const columns = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'api_keys'
    `);
    console.log('[Database] api_keys columns:', columns.rows.map(r => r.column_name).join(', '));

    // Create admin_settings table for admin password
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin_alerts table for low credit alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_alerts (
        id SERIAL PRIMARY KEY,
        alert_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create lessons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id BIGINT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(100),
        grade_level VARCHAR(50),
        duration_minutes INTEGER,
        learning_objectives TEXT,
        target_audience VARCHAR(255),
        teaching_style VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        script_content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create workflows table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id SERIAL PRIMARY KEY,
        lesson_id BIGINT REFERENCES lessons(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        workflow_json JSONB,
        status VARCHAR(50) DEFAULT 'inactive',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create workflow_steps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflow_steps (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
        step_order INTEGER,
        step_type VARCHAR(50),
        step_config JSONB,
        input_data JSONB,
        output_data JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
        schedule_type VARCHAR(50),
        cron_expression VARCHAR(255),
        scheduled_datetime TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        last_run TIMESTAMP,
        next_run TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create lesson_content table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_content (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        content_type VARCHAR(50),
        content_data JSONB,
        order_index INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create lesson_assets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_assets (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        asset_type VARCHAR(50),
        asset_url TEXT,
        asset_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create lesson_approvals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_approvals (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        step_type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        approver_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create upgrade_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS upgrade_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        approved_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create flagent_tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS flagent_tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_id TEXT NOT NULL,
        status TEXT NOT NULL,
        prompt TEXT NOT NULL,
        result JSONB,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add indexes for flagent_tasks
    await client.query(`CREATE INDEX IF NOT EXISTS idx_flagent_tasks_user_id ON flagent_tasks(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_flagent_tasks_task_id ON flagent_tasks(task_id)`);

    const flagentApiKeyColumnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'flagent_api_key'
    `);
    if (flagentApiKeyColumnCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN flagent_api_key TEXT`);
    }

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
