import { GoogleGenAI } from '@google/genai';
import pool from './db';

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: '',
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function generateLessonScript(
  topic: string,
  gradeLevel: string,
  duration: number,
  objectives: string[]
): Promise<string> {
  const prompt = `
    Create a comprehensive lesson script for teaching ${topic} to ${gradeLevel} students.
    Duration: ${duration} minutes
    Learning Objectives:
    ${objectives.map((obj) => `- ${obj}`).join('\n')}
    
    The script should:
    1. Have clear sections (Introduction, Main Content, Examples, Conclusion)
    2. Include engagement strategies
    3. Include key talking points
    4. Include transition phrases between sections
    5. Be age-appropriate and engaging
    
    Format as a structured lesson plan with clear section headers.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  return response.text || '';
}

export async function generateLessonSlides(
  script: string,
  numberOfSlides: number
): Promise<any[]> {
  const prompt = `
    Based on the following lesson script, generate ${numberOfSlides} slide contents for a presentation.
    Each slide should have:
    - A clear title
    - 3-5 bullet points of key content
    - Suggestions for images/visuals
    - Speaker notes
    
    Script:
    ${script}
    
    Return as JSON array of slide objects with keys: title, bullets, imagePrompt, speakerNotes
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  try {
    const text = response.text || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    console.error('Error parsing slides:', error);
    return [];
  }
}

export async function generateImagePrompts(slideContent: any[]): Promise<string[]> {
  const imagePrompts = slideContent.map((slide) => slide.imagePrompt || `Illustration for: ${slide.title}`);
  return imagePrompts;
}

export async function createLesson(
  userId: number,
  title: string,
  subject: string,
  gradeLevel: string,
  duration: number,
  objectives: string[],
  teachingStyle: string
) {
  const result = await pool.query(
    `INSERT INTO lessons (user_id, title, subject, grade_level, duration_minutes, learning_objectives, teaching_style, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
     RETURNING *`,
    [userId, title, subject, gradeLevel, duration, JSON.stringify(objectives), teachingStyle]
  );

  return result.rows[0];
}

export async function getLessonById(lessonId: number) {
  const result = await pool.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
  return result.rows[0];
}

export async function getLessonsByUser(userId: number) {
  const result = await pool.query(
    'SELECT * FROM lessons WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function createWorkflow(lessonId: number, name: string, workflowJson: any) {
  const result = await pool.query(
    `INSERT INTO workflows (lesson_id, name, workflow_json, status)
     VALUES ($1, $2, $3, 'inactive')
     RETURNING *`,
    [lessonId, name, JSON.stringify(workflowJson)]
  );

  return result.rows[0];
}

export async function getWorkflowsByLesson(lessonId: number) {
  const result = await pool.query(
    'SELECT * FROM workflows WHERE lesson_id = $1 ORDER BY created_at DESC',
    [lessonId]
  );
  return result.rows;
}

export async function createSchedule(
  workflowId: number,
  scheduleType: string,
  cronOrDatetime: string
) {
  const result = await pool.query(
    `INSERT INTO schedules (workflow_id, schedule_type, cron_expression, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING *`,
    [workflowId, scheduleType, cronOrDatetime]
  );

  return result.rows[0];
}
