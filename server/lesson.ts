import { GoogleGenerativeAI } from "@google/generative-ai";
import pool from './db';

async function getGeminiModel() {
  let apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  
  try {
    const result = await pool.query("SELECT setting_value FROM admin_settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
    if (result.rows.length > 0 && result.rows[0].setting_value) {
      apiKey = result.rows[0].setting_value.trim().replace(/^['"]|['"]$/g, '');
      console.log('[Gemini] Using API Key from database (cleaned)');
    } else {
      console.log('[Gemini] Using API Key from environment variables');
    }
  } catch (error) {
    console.error('Error fetching Gemini API key from database:', error);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro"
  });
}

export async function generateLessonScript(
  topic: string,
  gradeLevel: string,
  duration: number,
  objectives: string[]
): Promise<string> {
  console.log(`[Gemini] Generating script for topic: ${topic}, grade: ${gradeLevel}`);
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

  try {
    const model = await getGeminiModel();
    const result = await (model as any).generateContent(prompt);
    const response = await result.response;
    return response.text() || '';
  } catch (error) {
    console.error('[Gemini] Error generating script:', error);
    throw error;
  }
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

  try {
    const model = await getGeminiModel();
    const result = await (model as any).generateContent(prompt);
    const response = await result.response;

    const text = response.text() || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    console.error('Error parsing slides:', error);
    throw error;
  }
}

export async function generateImagePrompts(slideContent: any[]): Promise<string[]> {
  const imagePrompts = slideContent.map((slide) => slide.imagePrompt || `Illustration for: ${slide.title}`);
  return imagePrompts;
}

export async function createLesson(
  userId: any,
  title: string,
  subject: string,
  gradeLevel: string,
  duration: number,
  objectives: string[],
  teachingStyle: string
) {
  console.log('[Lesson Service] Creating lesson with userId:', { userId, type: typeof userId });
  const result = await pool.query(
    `INSERT INTO lessons (user_id, title, subject, grade_level, duration_minutes, learning_objectives, teaching_style, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
     RETURNING *`,
    [userId, title, subject, gradeLevel, duration, JSON.stringify(objectives), teachingStyle]
  );

  console.log('[Lesson Service] Created lesson:', result.rows[0]);
  return result.rows[0];
}

export async function getLessonById(lessonId: string) {
  const result = await pool.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
  return result.rows[0];
}

export async function getLessonsByUser(userId: any) {
  console.log('[Lesson Service] Getting lessons for user:', { userId, type: typeof userId });
  const result = await pool.query(
    'SELECT * FROM lessons WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  console.log('[Lesson Service] Found lessons:', result.rows.length);
  return result.rows;
}

export async function createWorkflow(lessonId: string, name: string, workflowJson: any) {
  const result = await pool.query(
    `INSERT INTO workflows (lesson_id, name, workflow_json, status)
     VALUES ($1, $2, $3, 'inactive')
     RETURNING *`,
    [lessonId, name, JSON.stringify(workflowJson)]
  );

  return result.rows[0];
}

export async function getWorkflowsByLesson(lessonId: string) {
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

// Create Word document from lesson script
export async function generateLessonWordDoc(
  lessonTitle: string,
  script: string,
  subject: string,
  gradeLevel: string,
  duration: number
): Promise<string> {
  // Create formatted content as base64 encoded Word content
  const content = `Title: ${lessonTitle}
Subject: ${subject}
Grade Level: ${gradeLevel}
Duration: ${duration} minutes

Teaching Script:
${script}`;
  
  return Buffer.from(content).toString('base64');
}

// Generate video using Flaton Video V1
export async function generateLessonVideo(
  script: string,
  lessonTitle: string
): Promise<string> {
  console.log('[Flaton Video] Generating video for lesson:', lessonTitle);
  
  // Use KIE API for Flaton Video V1
  const apiKeyManager = require('./apiKeyManager');
  const apiKey = await apiKeyManager.getCurrentApiKey();
  
  const KIE_API_BASE = 'https://api.kie.ai/api/v1';
  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'flaton-video-v1',
      prompt: script,
      title: lessonTitle,
    }),
  });

  if (!response.ok) {
    throw new Error(`Video generation failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.taskId || result.url || 'Video queued for generation';
}

// Generate images using Flaton Image V1
export async function generateLessonImages(
  prompts: string[]
): Promise<string[]> {
  console.log('[Flaton Image] Generating images for prompts:', prompts.length);
  
  const apiKeyManager = require('./apiKeyManager');
  const apiKey = await apiKeyManager.getCurrentApiKey();
  
  const KIE_API_BASE = 'https://api.kie.ai/api/v1';
  const images: string[] = [];
  
  for (const prompt of prompts) {
    const response = await fetch(`${KIE_API_BASE}/playground/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        model: 'flaton-image-v1',
      }),
    });

    if (!response.ok) {
      console.error(`Image generation failed for prompt: ${prompt}`);
      continue;
    }

    const result = await response.json();
    images.push(result.taskId || result.url || 'Image queued for generation');
  }
  
  return images;
}

// Execute PowerPoint with auto-execution
export async function generateAndExecutePowerPoint(
  lessonId: string
): Promise<string> {
  const { execSync } = require('child_process');
  const fs = require('fs');
  const os = require('os');
  
  const lesson = await getLessonById(lessonId);
  if (!lesson) throw new Error('Lesson not found');

  console.log('[PowerPoint] Generating code with Gemini...');
  const prompt = `Generate Python code using python-pptx library to create a professional PowerPoint presentation.
The presentation should be based on this teaching script:

${lesson.script_content}

Requirements:
1. Title slide with lesson title="${lesson.title}", subject="${lesson.subject}", grade="${lesson.grade_level}"
2. Content slides (5-7 slides) with key points from the script
3. Professional formatting with consistent styling
4. Bullet points for readability
5. Save to file: /tmp/lesson_presentation_${lessonId}.pptx

Return ONLY the Python code, no explanations or markdown formatting.`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const response = await result.response;

  const pythonCode = response.text() || '';
  console.log('[PowerPoint] Generated code, executing...');

  // Write to temp file and execute
  const tmpFile = `/tmp/pptx_gen_${lessonId}.py`;
  fs.writeFileSync(tmpFile, pythonCode);

  try {
    execSync(`python3 ${tmpFile}`, { stdio: 'pipe' });
    const outputFile = `/tmp/lesson_presentation_${lessonId}.pptx`;
    console.log('[PowerPoint] Execution complete, saved to:', outputFile);
    return outputFile;
  } catch (error: any) {
    console.error('[PowerPoint] Execution failed:', error.message);
    throw new Error(`PowerPoint generation failed: ${error.message}`);
  }
}

// Execute complete workflow
export async function executeWorkflow(
  lessonId: string,
  steps: any[],
  config: any
): Promise<any> {
  console.log('[Workflow] Starting execution for lesson:', lessonId);
  console.log('[Workflow] Steps received:', JSON.stringify(steps, null, 2));
  
  const lesson = await getLessonById(lessonId);
  console.log('[Workflow] Lesson retrieved:', lesson?.id);
  
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  const results: Record<string, any> = {};
  console.log('[Workflow] Steps array length:', steps.length);
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`[Workflow] Step ${i + 1}: ${step.type}`);

    try {
      switch (step.type) {
        case 'word':
          results.word = await generateLessonWordDoc(
            lesson.title,
            lesson.script_content || 'No script yet',
            lesson.subject,
            lesson.grade_level,
            lesson.duration_minutes
          );
          console.log('[Workflow] Word document generated');
          break;

        case 'image':
          const prompts = step.config?.prompts || [lesson.title];
          results.images = await generateLessonImages(prompts);
          console.log('[Workflow] Images generated:', results.images?.length);
          break;

        case 'video':
          results.video = await generateLessonVideo(
            lesson.script_content || 'Default script',
            lesson.title
          );
          console.log('[Workflow] Video generated');
          break;

        case 'powerpoint':
          results.powerpoint = await generateAndExecutePowerPoint(lessonId);
          console.log('[Workflow] PowerPoint generated and executed');
          break;
      }
    } catch (error: any) {
      console.error(`[Workflow] Step ${i + 1} failed:`, error.message);
      results[step.type] = { error: error.message };
    }
  }

  return results;
}
