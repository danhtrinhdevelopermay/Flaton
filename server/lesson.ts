import { ai } from './replit_integrations/image/client';
import pool from './db';

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
    console.log(`[Gemini] API Key exists: ${!!process.env.AI_INTEGRATIONS_GEMINI_API_KEY}`);
    console.log(`[Gemini] Base URL: ${process.env.AI_INTEGRATIONS_GEMINI_BASE_URL}`);
    const response = await ai.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    console.log(`[Gemini] Response received, text length: ${response.response.text()?.length || 0}`);
    return response.response.text() || '';
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
    const response = await ai.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = response.response.text() || '[]';
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
  lessonId: string,
  ai: any
): Promise<string> {
  const { execSync } = require('child_process');
  const fs = require('fs');
  
  const lesson = await getLessonById(lessonId);
  if (!lesson) throw new Error('Lesson not found');

  console.log('[PowerPoint] Generating Gamma-style code with Gemini...');
  const prompt = `Generate advanced Python code using python-pptx to create a high-quality presentation similar to Gamma AI.
Presentation Topic: "${lesson.title}"
Subject: "${lesson.subject}"
Grade: "${lesson.grade_level}"
Script: ${lesson.script_content}

Requirements for the Python Code:
1. DESIGN SYSTEM:
   - Use a modern color palette (e.g., Deep Navy #1E293B, Accent Orange #F97316, Soft Slate #F1F5F9).
   - Set consistent fonts (Heading: Arial, Body: Calibri).
   - Use 'slide_layouts[6]' (Blank) for custom positioning to mimic Gamma's flexible layouts.

2. SLIDE TYPES (Generate 6-8 slides):
   - Title Slide: Large centered title with a subtitle and a colored accent shape.
   - Agenda Slide: Use a series of formatted shapes or a table to show the flow.
   - Content Slides: 
     * Mix layouts: some with text on left and visual placeholders on right.
     * Use rounded rectangles (shapes) with light fills as "Cards" to group content.
     * Add simple icons using shapes or Wingdings font.
   - Conclusion: Summary slide with key takeaways in a prominent card.

3. TECHNICAL:
   - Save to: /tmp/lesson_presentation_${lessonId}.pptx
   - Ensure all imports are included: from pptx import Presentation; from pptx.util import Inches, Pt; from pptx.dml.color import RGBColor; from pptx.enum.text import PP_ALIGN; from pptx.enum.shapes import MSO_SHAPE

Return ONLY the Python code without any markdown or explanations.`;

  const response = await ai.getGenerativeModel({ model: 'gemini-2.5-flash' }).generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const pythonCode = (response.response.text() || '').replace(/```python/g, '').replace(/```/g, '').trim();
  const tmpFile = `/tmp/pptx_gen_${lessonId}.py`;
  fs.writeFileSync(tmpFile, pythonCode);

  try {
    execSync(`python3 ${tmpFile}`, { stdio: 'pipe' });
    const outputFile = `/tmp/lesson_presentation_${lessonId}.pptx`;
    return outputFile;
  } catch (error: any) {
    console.error('[PowerPoint] Gamma-style generation failed:', error.message);
    throw new Error(`Gamma-style generation failed: ${error.message}`);
  }
}

// Execute complete workflow
export async function executeWorkflow(
  lessonId: string,
  steps: any[],
  config: any,
  ai?: any
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
          if (ai) {
            results.powerpoint = await generateAndExecutePowerPoint(lessonId, ai);
            console.log('[Workflow] PowerPoint generated and executed');
          } else {
            results.powerpoint = { status: 'skipped', message: 'AI not available' };
          }
          break;
      }
    } catch (error: any) {
      console.error(`[Workflow] Step ${i + 1} failed:`, error.message);
      results[step.type] = { error: error.message };
    }
  }

  return results;
}
