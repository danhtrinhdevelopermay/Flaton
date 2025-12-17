import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db';
import pool from './db';
import { hashPassword, verifyPassword, generateToken, authMiddleware, optionalAuthMiddleware, AuthRequest } from './auth';
import * as apiKeyManager from './apiKeyManager';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const KIE_API_BASE = 'https://api.kie.ai/api/v1';

async function getActiveApiKey(): Promise<string> {
  const dbKey = await apiKeyManager.getCurrentApiKey();
  if (dbKey) {
    return dbKey;
  }
  const envKey = process.env.KIE_API_KEY;
  if (!envKey) {
    throw new Error('No API key available. Please add API keys in admin panel.');
  }
  return envKey;
}

async function callKieApi(endpoint: string, data: any) {
  const apiKey = await getActiveApiKey();

  console.log(`Calling KIE API: ${endpoint}`, JSON.stringify(data, null, 2));
  
  const response = await fetch(`${KIE_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log(`KIE API response for ${endpoint}:`, JSON.stringify(result, null, 2));
  
  if (result.code !== 200) {
    const errorMsg = result.msg || result.message || result.error || 'API request failed';
    console.error(`API Error: ${errorMsg}`, result);
    throw new Error(errorMsg);
  }

  return result;
}

async function checkTaskStatus(taskId: string, taskType: string) {
  const apiKey = await getActiveApiKey();

  let endpoint = '';
  switch (taskType) {
    case 'veo3':
      endpoint = `/veo/record-info?taskId=${taskId}`;
      break;
    case 'midjourney':
    case 'midjourney-video':
      endpoint = `/mj/record-info?taskId=${taskId}`;
      break;
    case 'playground':
      endpoint = `/playground/recordInfo?taskId=${taskId}`;
      break;
    case 'seedream':
      endpoint = `/seedream/recordInfo?taskId=${taskId}`;
      break;
    case 'grok':
      endpoint = `/jobs/recordInfo?taskId=${taskId}`;
      break;
    case 'suno':
      endpoint = `/generate/record-info?taskId=${taskId}`;
      break;
    default:
      throw new Error('Unknown task type');
  }

  const response = await fetch(`${KIE_API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  const result = await response.json();
  console.log(`Task status check for ${taskType}/${taskId}:`, JSON.stringify(result, null, 2));
  
  if (taskType === 'playground' || taskType === 'seedream') {
    if (result.code !== 200) {
      const errorMsg = result.msg || result.message || 'Failed to check task status';
      throw new Error(errorMsg);
    }
    
    const data = result.data;
    if (data.state === 'success') {
      let images: string[] = [];
      if (data.resultJson) {
        try {
          const resultData = JSON.parse(data.resultJson);
          images = resultData.resultUrls || [];
        } catch (e) {
          console.error('Failed to parse resultJson:', e);
        }
      }
      return {
        status: 'completed',
        imageUrl: images[0],
        images: images,
      };
    } else if (data.state === 'failed') {
      return {
        status: 'failed',
        error: data.failMsg || 'Generation failed',
      };
    } else {
      return {
        status: 'processing',
        progress: data.progress,
      };
    }
  }
  
  if (result.code !== 200) {
    const errorMsg = result.msg || result.message || result.error || 'Failed to check task status';
    console.error(`API Error: ${errorMsg}`, result);
    throw new Error(errorMsg);
  }

  const data = result.data;

  // Handle Midjourney status-based responses (some endpoints use status strings instead of successFlag)
  if ((taskType === 'midjourney' || taskType === 'midjourney-video') && data.status) {
    if (data.status === 'completed' || data.status === 'success') {
      if (taskType === 'midjourney-video') {
        let videos: string[] = [];
        // Try videos array first
        if (data.videos && Array.isArray(data.videos)) {
          videos = data.videos.map((v: any) => v.url || v);
        }
        // Try resultInfoJson
        if (videos.length === 0 && data.resultInfoJson) {
          const resultInfo = typeof data.resultInfoJson === 'string' 
            ? JSON.parse(data.resultInfoJson) 
            : data.resultInfoJson;
          if (resultInfo.resultUrls && Array.isArray(resultInfo.resultUrls)) {
            videos = resultInfo.resultUrls.map((item: any) => item.resultUrl || item);
          }
        }
        // Fallback: response.result_urls
        if (videos.length === 0 && data.response?.result_urls) {
          videos = data.response.result_urls;
        }
        // Fallback: resultUrls directly
        if (videos.length === 0 && data.resultUrls) {
          try {
            const urls = typeof data.resultUrls === 'string' ? JSON.parse(data.resultUrls) : data.resultUrls;
            videos = Array.isArray(urls) ? urls : [urls];
          } catch (e) {
            console.error('Failed to parse midjourney-video resultUrls:', e);
          }
        }
        return {
          status: 'completed',
          videoUrl: videos[0],
          videos: videos,
        };
      } else {
        let images: string[] = [];
        // Try resultInfoJson first
        if (data.resultInfoJson) {
          const resultInfo = typeof data.resultInfoJson === 'string' 
            ? JSON.parse(data.resultInfoJson) 
            : data.resultInfoJson;
          if (resultInfo.resultUrls && Array.isArray(resultInfo.resultUrls)) {
            images = resultInfo.resultUrls.map((item: any) => item.resultUrl || item);
          }
        }
        // Fallback: response.result_urls
        if (images.length === 0 && data.response?.result_urls) {
          images = data.response.result_urls;
        }
        // Fallback: resultUrls directly
        if (images.length === 0 && data.resultUrls) {
          try {
            const urls = typeof data.resultUrls === 'string' ? JSON.parse(data.resultUrls) : data.resultUrls;
            images = Array.isArray(urls) ? urls : [urls];
          } catch (e) {
            console.error('Failed to parse midjourney resultUrls:', e);
          }
        }
        return {
          status: 'completed',
          imageUrl: images[0],
          images: images,
        };
      }
    } else if (data.status === 'failed' || data.status === 'error') {
      return {
        status: 'failed',
        error: data.errorMessage || data.error || 'Generation failed',
      };
    } else {
      return {
        status: 'processing',
        progress: data.progress,
      };
    }
  }
  
  if (taskType === 'grok') {
    if (data.state === 'success') {
      let videoUrl = null;
      if (data.resultJson) {
        try {
          const resultData = JSON.parse(data.resultJson);
          videoUrl = resultData.resultUrls?.[0] || resultData.videoUrl;
        } catch (e) {
          console.error('Failed to parse Grok resultJson:', e);
        }
      }
      return {
        status: 'completed',
        videoUrl: videoUrl,
      };
    } else if (data.state === 'failed') {
      return {
        status: 'failed',
        error: data.failMsg || 'Grok generation failed',
      };
    } else {
      return {
        status: 'processing',
        progress: data.progress,
      };
    }
  }

  // Handle Suno music generation
  if (taskType === 'suno') {
    if (data.status === 'SUCCESS' || data.status === 'FIRST_SUCCESS') {
      let audioUrls: string[] = [];
      if (data.response?.sunoData && Array.isArray(data.response.sunoData)) {
        audioUrls = data.response.sunoData.map((track: any) => track.audioUrl || track.audio_url).filter(Boolean);
      }
      return {
        status: 'completed',
        audioUrl: audioUrls[0],
        audioUrls: audioUrls,
        title: data.response?.sunoData?.[0]?.title,
      };
    } else if (data.status === 'CREATE_TASK_FAILED' || data.status === 'GENERATE_AUDIO_FAILED' || data.status === 'SENSITIVE_WORD_ERROR') {
      return {
        status: 'failed',
        error: data.errorMessage || 'Music generation failed',
      };
    } else if (data.status === 'TEXT_SUCCESS' || data.status === 'PENDING') {
      return {
        status: 'processing',
        progress: data.status,
      };
    } else {
      return {
        status: 'processing',
        progress: data.status || 'unknown',
      };
    }
  }

  if (data.successFlag === 1) {
    if (taskType === 'veo3') {
      let videoUrl = null;
      
      // Check data.response.resultUrls first (this is where Veo3 actually returns the URL)
      if (data.response?.resultUrls && Array.isArray(data.response.resultUrls)) {
        videoUrl = data.response.resultUrls[0];
      }
      // Fallback: check data.resultUrls
      else if (data.resultUrls) {
        try {
          const urls = typeof data.resultUrls === 'string' ? JSON.parse(data.resultUrls) : data.resultUrls;
          videoUrl = Array.isArray(urls) ? urls[0] : urls;
        } catch (e) {
          console.error('Failed to parse veo3 resultUrls:', e);
        }
      }
      
      return {
        status: 'completed',
        videoUrl: videoUrl,
      };
    } else if (taskType === 'midjourney') {
      // Midjourney returns resultInfoJson with resultUrls array containing objects with resultUrl
      let images: string[] = [];
      if (data.resultInfoJson) {
        const resultInfo = typeof data.resultInfoJson === 'string' 
          ? JSON.parse(data.resultInfoJson) 
          : data.resultInfoJson;
        if (resultInfo.resultUrls && Array.isArray(resultInfo.resultUrls)) {
          images = resultInfo.resultUrls.map((item: any) => item.resultUrl || item);
        }
      }
      // Fallback: check for direct response structure
      if (images.length === 0 && data.response?.result_urls) {
        images = data.response.result_urls;
      }
      // Fallback: check for resultUrls directly
      if (images.length === 0 && data.resultUrls) {
        try {
          const urls = typeof data.resultUrls === 'string' ? JSON.parse(data.resultUrls) : data.resultUrls;
          images = Array.isArray(urls) ? urls : [urls];
        } catch (e) {
          console.error('Failed to parse midjourney resultUrls:', e);
        }
      }
      return {
        status: 'completed',
        imageUrl: images[0],
        images: images,
      };
    } else if (taskType === 'midjourney-video') {
      // Midjourney video returns video URLs
      let videos: string[] = [];
      if (data.resultInfoJson) {
        const resultInfo = typeof data.resultInfoJson === 'string' 
          ? JSON.parse(data.resultInfoJson) 
          : data.resultInfoJson;
        if (resultInfo.resultUrls && Array.isArray(resultInfo.resultUrls)) {
          videos = resultInfo.resultUrls.map((item: any) => item.resultUrl || item);
        }
      }
      // Fallback: check for videos array in response
      if (videos.length === 0 && data.videos && Array.isArray(data.videos)) {
        videos = data.videos.map((v: any) => v.url || v);
      }
      // Fallback: check for response.result_urls
      if (videos.length === 0 && data.response?.result_urls) {
        videos = data.response.result_urls;
      }
      // Fallback: check for resultUrls directly
      if (videos.length === 0 && data.resultUrls) {
        try {
          const urls = typeof data.resultUrls === 'string' ? JSON.parse(data.resultUrls) : data.resultUrls;
          videos = Array.isArray(urls) ? urls : [urls];
        } catch (e) {
          console.error('Failed to parse midjourney-video resultUrls:', e);
        }
      }
      return {
        status: 'completed',
        videoUrl: videos[0],
        videos: videos,
      };
    } else {
      const responseData = data.response || {};
      return {
        status: 'completed',
        imageUrl: responseData.result_urls?.[0],
        images: responseData.result_urls,
      };
    }
  } else if (data.successFlag === 2 || data.successFlag === 3) {
    return {
      status: 'failed',
      error: data.errorMessage || 'Generation failed',
    };
  } else {
    return {
      status: 'processing',
      progress: data.progress,
    };
  }
}

const MODEL_CREDITS: Record<string, number> = {
  'nano-banana': 4,
  'seedream': 6.5,
  'midjourney': 8,
  'veo3-fast': 60,
  'veo3': 100,
  'midjourney-video': 40,
  'grok-i2v': 20,
  'grok-t2v': 20,
  'suno': 10,
};

const MAX_CREDITS = 70;
const DAILY_CHECKIN_CREDITS = 60;
const DEFAULT_CREDITS = 50;

async function getUserCredits(userId: number): Promise<number> {
  const result = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
  return parseFloat(result.rows[0]?.credits || 0);
}

async function deductCredits(userId: number, amount: number): Promise<boolean> {
  const currentCredits = await getUserCredits(userId);
  if (currentCredits < amount) {
    return false;
  }
  await pool.query('UPDATE users SET credits = credits - $1 WHERE id = $2', [amount, userId]);
  return true;
}

async function addCredits(userId: number, amount: number): Promise<number> {
  const currentCredits = await getUserCredits(userId);
  const newCredits = Math.min(currentCredits + amount, MAX_CREDITS);
  await pool.query('UPDATE users SET credits = $1 WHERE id = $2', [newCredits, userId]);
  return newCredits;
}

app.get('/api/user/credits', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT credits, last_checkin FROM users WHERE id = $1',
      [req.userId]
    );
    const user = result.rows[0];
    const today = new Date().toISOString().split('T')[0];
    const canCheckin = !user.last_checkin || user.last_checkin.toISOString().split('T')[0] !== today;
    
    res.json({
      credits: parseFloat(user.credits || 0),
      canCheckin,
      maxCredits: MAX_CREDITS,
      dailyCredits: DAILY_CHECKIN_CREDITS,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/checkin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT credits, last_checkin FROM users WHERE id = $1',
      [req.userId]
    );
    const user = result.rows[0];
    const today = new Date().toISOString().split('T')[0];
    
    if (user.last_checkin && user.last_checkin.toISOString().split('T')[0] === today) {
      return res.status(400).json({ error: 'Bạn đã điểm danh hôm nay rồi!' });
    }
    
    const currentCredits = parseFloat(user.credits || 0);
    const newCredits = Math.min(currentCredits + DAILY_CHECKIN_CREDITS, MAX_CREDITS);
    const creditsAdded = newCredits - currentCredits;
    
    await pool.query(
      'UPDATE users SET credits = $1, last_checkin = CURRENT_DATE WHERE id = $2',
      [newCredits, req.userId]
    );
    
    res.json({
      success: true,
      credits: newCredits,
      creditsAdded,
      message: `Điểm danh thành công! +${creditsAdded} credits`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/nano-banana', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const modelCredits = MODEL_CREDITS['nano-banana'];
    const hasCredits = await deductCredits(req.userId!, modelCredits);
    if (!hasCredits) {
      return res.status(400).json({ error: 'Không đủ credits. Vui lòng điểm danh để nhận thêm credits.' });
    }
    
    const { prompt, aspectRatio = '1:1' } = req.body;
    const result = await callKieApi('/playground/createTask', {
      model: 'google/nano-banana',
      input: {
        prompt,
        image_size: aspectRatio,
        output_format: 'png',
      },
    });
    res.json({ taskId: result.task_id || result.data?.taskId, taskType: 'playground' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/seedream', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const modelCredits = MODEL_CREDITS['seedream'];
    const hasCredits = await deductCredits(req.userId!, modelCredits);
    if (!hasCredits) {
      return res.status(400).json({ error: 'Không đủ credits. Vui lòng điểm danh để nhận thêm credits.' });
    }
    
    const { prompt, aspectRatio = '1:1' } = req.body;
    const result = await callKieApi('/seedream/createTask', {
      model: 'bytedance/seedream-4.0',
      input: {
        prompt,
        image_size: aspectRatio,
      },
    });
    res.json({ taskId: result.task_id || result.data?.taskId, taskType: 'seedream' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/midjourney', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const modelCredits = MODEL_CREDITS['midjourney'];
    const hasCredits = await deductCredits(req.userId!, modelCredits);
    if (!hasCredits) {
      return res.status(400).json({ error: 'Không đủ credits. Vui lòng điểm danh để nhận thêm credits.' });
    }
    
    const { prompt, aspectRatio = '1:1' } = req.body;
    const result = await callKieApi('/mj/txt2img', {
      taskType: 'mj_txt2img',
      prompt,
      aspectRatio,
      speed: 'fast',
      version: '7',
    });
    res.json({ taskId: result.data.taskId, taskType: 'midjourney' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/veo3-fast', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const modelCredits = MODEL_CREDITS['veo3-fast'];
    const hasCredits = await deductCredits(req.userId!, modelCredits);
    if (!hasCredits) {
      return res.status(400).json({ error: 'Không đủ credits. Vui lòng điểm danh để nhận thêm credits.' });
    }
    
    const { prompt, aspectRatio = '16:9' } = req.body;
    const result = await callKieApi('/veo/generate', {
      prompt,
      model: 'veo3_fast',
      aspectRatio,
    });
    res.json({ taskId: result.data.taskId, taskType: 'veo3' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Veo 3 Quality - Higher quality but slower
app.post('/api/generate/veo3', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const modelCredits = MODEL_CREDITS['veo3'];
    const hasCredits = await deductCredits(req.userId!, modelCredits);
    if (!hasCredits) {
      return res.status(400).json({ error: 'Không đủ credits. Vui lòng điểm danh để nhận thêm credits.' });
    }
    
    const { prompt, aspectRatio = '16:9' } = req.body;
    const result = await callKieApi('/veo/generate', {
      prompt,
      model: 'veo3',
      aspectRatio,
    });
    res.json({ taskId: result.data.taskId, taskType: 'veo3' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get 1080P video for Veo3
app.get('/api/veo3/1080p/:taskId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const index = parseInt(req.query.index as string) || 0;
    const apiKey = await getActiveApiKey();

    const response = await fetch(`${KIE_API_BASE}/veo/get-1080p-video?taskId=${taskId}&index=${index}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const result = await response.json();
    console.log(`1080P video request for ${taskId}:`, JSON.stringify(result, null, 2));
    
    if (result.code === 200) {
      res.json({ 
        success: true, 
        videoUrl: result.data,
        message: 'Video 1080P ready'
      });
    } else {
      res.json({ 
        success: false, 
        message: result.msg || 'Video 1080P not ready yet, please try again later'
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/midjourney-video', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const modelCredits = MODEL_CREDITS['midjourney-video'];
    const hasCredits = await deductCredits(req.userId!, modelCredits);
    if (!hasCredits) {
      return res.status(400).json({ error: 'Không đủ credits. Vui lòng điểm danh để nhận thêm credits.' });
    }
    
    const { imageUrl, prompt } = req.body;
    const result = await callKieApi('/mj/img2video', {
      taskType: 'mj_video',
      imageUrl,
      prompt,
      speed: 'fast',
    });
    res.json({ taskId: result.data.taskId, taskType: 'midjourney-video' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sora 2 - Image to Video
app.post('/api/generate/grok-i2v', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const modelCredits = MODEL_CREDITS['grok-i2v'];
    const hasCredits = await deductCredits(req.userId!, modelCredits);
    if (!hasCredits) {
      return res.status(400).json({ error: 'Không đủ credits. Vui lòng điểm danh để nhận thêm credits.' });
    }
    
    const { imageUrl, prompt, aspectRatio = 'landscape', duration = '10' } = req.body;
    const result = await callKieApi('/jobs/createTask', {
      model: 'sora-2-image-to-video',
      input: {
        image_urls: [imageUrl],
        prompt,
        aspect_ratio: aspectRatio,
        n_frames: duration,
        remove_watermark: true,
      },
    });
    res.json({ taskId: result.data?.taskId, taskType: 'grok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Grok Imagenia - Text to Video
app.post('/api/generate/grok-t2v', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const modelCredits = MODEL_CREDITS['grok-t2v'];
    const hasCredits = await deductCredits(req.userId!, modelCredits);
    if (!hasCredits) {
      return res.status(400).json({ error: 'Không đủ credits. Vui lòng điểm danh để nhận thêm credits.' });
    }
    
    const { prompt, aspectRatio = '3:2', mode = 'normal' } = req.body;
    const result = await callKieApi('/jobs/createTask', {
      model: 'grok-imagine/text-to-video',
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        mode,
      },
    });
    res.json({ taskId: result.data?.taskId, taskType: 'grok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Suno AI - Generate Music
app.post('/api/generate/suno', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const modelCredits = MODEL_CREDITS['suno'];
    const hasCredits = await deductCredits(req.userId!, modelCredits);
    if (!hasCredits) {
      return res.status(400).json({ error: 'Không đủ credits. Vui lòng điểm danh để nhận thêm credits.' });
    }
    
    const { 
      prompt, 
      songDescription,
      customMode = false, 
      instrumental = false, 
      model = 'V4', 
      style, 
      title,
      negativeTags,
      vocalGender
    } = req.body;
    
    // Map prompt theo tài liệu KIE API:
    // - customMode = false: dùng songDescription làm prompt (mô tả chung)
    // - customMode = true: dùng prompt (lời bài hát hoặc mô tả)
    let finalPrompt = '';
    if (customMode) {
      finalPrompt = prompt || '';
    } else {
      finalPrompt = songDescription || '';
    }
    
    const payload: any = {
      model,
      customMode,
      instrumental,
      prompt: finalPrompt,
      callBackUrl: 'https://example.com/callback',
    };
    
    if (customMode) {
      payload.title = title || '';
      payload.style = style || '';
      if (vocalGender) payload.vocalGender = vocalGender;
    }
    
    if (negativeTags) payload.negativeTags = negativeTags;
    
    console.log('Suno payload:', JSON.stringify(payload, null, 2));
    
    const result = await callKieApi('/generate', payload);
    res.json({ taskId: result.data?.taskId, taskType: 'suno' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/task/:taskType/:taskId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { taskType, taskId } = req.params;
    const result = await checkTaskStatus(taskId, taskType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/credits', async (req: Request, res: Response) => {
  try {
    const apiKey = await getActiveApiKey();

    const response = await fetch(`${KIE_API_BASE}/chat/credit`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const apiKey = await apiKeyManager.getCurrentApiKey();
    res.json({ status: 'ok', apiKeyConfigured: !!(apiKey || process.env.KIE_API_KEY) });
  } catch {
    res.json({ status: 'ok', apiKeyConfigured: !!process.env.KIE_API_KEY });
  }
});

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'flaton-admin-2024';

function generateAdminToken(): string {
  return jwt.sign({ isAdmin: true, timestamp: Date.now() }, JWT_SECRET, { expiresIn: '24h' });
}

function verifyAdminToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.isAdmin === true;
  } catch {
    return false;
  }
}

async function adminAuthMiddleware(req: Request, res: Response, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  next();
}

app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const isValid = await apiKeyManager.verifyAdminPassword(password);
    
    if (isValid) {
      const token = generateAdminToken();
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/change-password', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const isValid = await apiKeyManager.verifyAdminPassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    await apiKeyManager.setAdminPassword(newPassword);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/api-keys', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const keys = await apiKeyManager.getAllApiKeys();
    const maskedKeys = keys.map(key => ({
      ...key,
      api_key: key.api_key.length > 12 
        ? key.api_key.substring(0, 8) + '...' + key.api_key.substring(key.api_key.length - 4)
        : '****'
    }));
    res.json(maskedKeys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/api-keys', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { apiKey, name } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    const newKey = await apiKeyManager.addApiKey(apiKey, name || '');
    res.json({
      ...newKey,
      api_key: newKey.api_key.length > 12 
        ? newKey.api_key.substring(0, 8) + '...' + newKey.api_key.substring(newKey.api_key.length - 4)
        : '****'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/api-keys/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await apiKeyManager.removeApiKey(parseInt(id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/api-keys/:id/refresh', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const credits = await apiKeyManager.refreshApiKey(parseInt(id));
    res.json({ success: true, credits });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/api-keys/:id/set-current', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await apiKeyManager.setCurrentApiKey(parseInt(id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/status', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const status = await apiKeyManager.getSystemStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/alerts', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const alerts = await apiKeyManager.getAdminAlerts();
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/alerts/:id/read', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await apiKeyManager.markAlertAsRead(parseInt(id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/check-switch', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await apiKeyManager.checkAndSwitchApiKeyIfNeeded();
    res.json({ success: true, hasActiveKey: !!result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/refresh-all', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    await apiKeyManager.updateAllApiKeyCredits();
    const keys = await apiKeyManager.getAllApiKeys();
    const maskedKeys = keys.map(key => ({
      ...key,
      api_key: key.api_key.length > 12 
        ? key.api_key.substring(0, 8) + '...' + key.api_key.substring(key.api_key.length - 4)
        : '****'
    }));
    res.json({ success: true, keys: maskedKeys });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name || null]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await verifyPassword(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    res.json({ user: req.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/image', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl, prompt, model, aspectRatio } = req.body;
    
    const result = await pool.query(
      'INSERT INTO generated_images (user_id, image_url, prompt, model, aspect_ratio) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, imageUrl, prompt, model, aspectRatio]
    );

    res.json({ success: true, product: result.rows[0] });
  } catch (error: any) {
    console.error('Save image error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/video', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { videoUrl, prompt, imageUrl, model, aspectRatio } = req.body;
    
    const result = await pool.query(
      'INSERT INTO generated_videos (user_id, video_url, prompt, image_url, model, aspect_ratio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, videoUrl, prompt, imageUrl, model, aspectRatio]
    );

    res.json({ success: true, product: result.rows[0] });
  } catch (error: any) {
    console.error('Save video error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/music', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { audioUrl, title, prompt, style, model } = req.body;
    
    const result = await pool.query(
      'INSERT INTO generated_music (user_id, audio_url, title, prompt, style, model) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, audioUrl, title, prompt, style, model]
    );

    res.json({ success: true, product: result.rows[0] });
  } catch (error: any) {
    console.error('Save music error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const images = await pool.query(
      'SELECT * FROM generated_images WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    
    const videos = await pool.query(
      'SELECT * FROM generated_videos WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    
    const music = await pool.query(
      'SELECT * FROM generated_music WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );

    res.json({
      images: images.rows,
      videos: videos.rows,
      music: music.rows
    });
  } catch (error: any) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

let cpuHistory: { time: string; cpu: number }[] = [];
let latencyHistory: { time: string; latency: number }[] = [];
const serverStartTime = Date.now();

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (idle / total * 100);
    resolve(Math.round(usage * 100) / 100);
  });
}

app.get('/api/system-stats', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    const cpuUsage = await getCpuUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = Math.round((usedMem / totalMem) * 100 * 100) / 100;
    
    const latency = Date.now() - startTime;
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    cpuHistory.push({ time: now, cpu: cpuUsage });
    if (cpuHistory.length > 20) cpuHistory.shift();
    
    latencyHistory.push({ time: now, latency });
    if (latencyHistory.length > 20) latencyHistory.shift();
    
    res.json({
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown'
      },
      memory: {
        total: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100,
        used: Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100,
        free: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100,
        usage: memUsage
      },
      latency,
      uptime,
      cpuHistory,
      latencyHistory,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('System stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
    } else {
      next();
    }
  });
}

function startKeepAlive() {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (!RENDER_URL) {
    console.log('Keep-alive disabled: RENDER_EXTERNAL_URL not set');
    return;
  }
  
  const INTERVAL = 14 * 60 * 1000;
  
  async function ping() {
    try {
      const response = await fetch(`${RENDER_URL}/api/health`);
      console.log(`[Keep-Alive] Ping at ${new Date().toISOString()}: Status ${response.status}`);
    } catch (error: any) {
      console.error(`[Keep-Alive] Ping failed at ${new Date().toISOString()}:`, error.message);
    }
  }
  
  setInterval(ping, INTERVAL);
  console.log(`[Keep-Alive] Started - pinging ${RENDER_URL} every ${INTERVAL / 1000}s`);
}

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Database initialized successfully');
      
      if (process.env.NODE_ENV === 'production') {
        startKeepAlive();
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
