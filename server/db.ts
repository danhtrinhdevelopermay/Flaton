import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create generated_images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS generated_images (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        prompt TEXT,
        model VARCHAR(100),
        aspect_ratio VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
