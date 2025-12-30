import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import os from 'os';
import { fileURLToPath } from 'url';
import { initDatabase } from './db';
import pool from './db';
import { hashPassword, verifyPassword, generateToken, authMiddleware, optionalAuthMiddleware, AuthRequest } from './auth';
import * as apiKeyManager from './apiKeyManager';
import * as cloudinaryUtil from './cloudinaryUtil';
import jwt from 'jsonwebtoken';
import * as lessonService from './lesson';
import { ai } from './replit_integrations/image/client';

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun } from 'docx';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-2024';

dotenv.config();

const app = express();
const PORT = 3001;

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
  const envKey = '91c279a652aa73025b6beab73aadfbd8';
  if (!envKey) {
    throw new Error('No API key available. Please add API keys in admin panel.');
  }
  return envKey;
}

async function checkApiKeyCredits(): Promise<number> {
  try {
    const apiKey = await getActiveApiKey();
    const response = await fetch(`${KIE_API_BASE}/chat/credit`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    const result = await response.json();
    if (result.code === 200 && typeof result.data === 'number') {
      return result.data;
    }
    return 0;
  } catch (error) {
    console.error('Error checking API key credits:', error);
    return 0;
  }
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
    
    // Check if error is due to insufficient API credits
    const apiCredits = await checkApiKeyCredits();
    if (apiCredits <= 0) {
      const error = new Error(`API key không đủ credits (${apiCredits}). Vui lòng liên hệ admin để thêm API keys!`);
      (error as any).isApiCreditsError = true;
      throw error;
    }
    
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
      endpoint = `/jobs/recordInfo?taskId=${taskId}`;
      break;
    case 'grok':
      endpoint = `/jobs/recordInfo?taskId=${taskId}`;
      break;
    case 'sora2':
      endpoint = `/jobs/recordInfo?taskId=${taskId}`;
      break;
    case 'suno':
      endpoint = `/generate/record-info?taskId=${taskId}`;
      break;
    case 'gpt4o-image':
      endpoint = `/gpt4o-image/record-info?taskId=${taskId}`;
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
          const originalImages = resultData.resultUrls || [];
          images = await Promise.all(originalImages.map((url: string) => cloudinaryUtil.uploadImageToCloudinary(url)));
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

  // Handle GPT-4o Image generation
  if (taskType === 'gpt4o-image') {
    if (result.code !== 200) {
      const errorMsg = result.msg || result.message || 'Failed to check task status';
      throw new Error(errorMsg);
    }
    
    const data = result.data;
    if (data.status === 'SUCCESS' || data.successFlag === 1) {
      let images: string[] = [];
      if (data.response?.resultUrls && Array.isArray(data.response.resultUrls)) {
        images = await Promise.all(data.response.resultUrls.map((url: string) => cloudinaryUtil.uploadImageToCloudinary(url)));
      }
      return {
        status: 'completed',
        imageUrl: images[0],
        images: images,
      };
    } else if (data.status === 'GENERATE_FAILED' || data.status === 'CREATE_TASK_FAILED' || data.successFlag === 0) {
      if (data.successFlag === 0 && data.status === 'GENERATING') {
        return {
          status: 'processing',
          progress: data.progress || '0.00',
        };
      }
      return {
        status: 'failed',
        error: data.errorMessage || 'Image generation failed',
      };
    } else if (data.status === 'GENERATING') {
      return {
        status: 'processing',
        progress: data.progress || '0.00',
      };
    } else {
      return {
        status: 'processing',
        progress: data.progress || '0.00',
      };
    }
  }

  // Handle Sora 2 video generation
  if (taskType === 'sora2') {
    if (result.code !== 200) {
      const errorMsg = result.msg || result.message || 'Failed to check task status';
      throw new Error(errorMsg);
    }
    
    const data = result.data;
    if (data.state === 'success') {
      let videoUrl = null;
      if (data.resultJson) {
        try {
          const resultData = JSON.parse(data.resultJson);
          const originalUrl = resultData.resultUrls?.[0] || null;
          if (originalUrl) {
            videoUrl = await cloudinaryUtil.uploadVideoToCloudinary(originalUrl);
          }
        } catch (e) {
          console.error('Failed to parse resultJson:', e);
        }
      }
      return {
        status: 'completed',
        videoUrl: videoUrl,
      };
    } else if (data.state === 'fail' || data.state === 'failed') {
      return {
        status: 'failed',
        error: data.failMsg || 'Video generation failed',
      };
    } else {
      return {
        status: 'processing',
        progress: data.state || 'waiting',
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
  'nano-banana': 0,
  'seedream': 0,
  'veo3-fast': 0,
  'suno': 0,
  'sora2-text': 0,
  'sora2-image': 0,
  'gpt4o-image': 0,
};

const MAX_CREDITS = 999999;
const DAILY_CHECKIN_CREDITS = 0;
const DEFAULT_CREDITS = 999999;

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

async function refundCredits(userId: number, amount: number): Promise<number> {
  return await addCredits(userId, amount);
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
    await refundCredits(req.userId!, MODEL_CREDITS['nano-banana']);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/seedream', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1', resolution = '1K' } = req.body;
    const imageSizeMap: Record<string, string> = {
      '1:1': 'square_hd',
      '16:9': 'landscape_16_9',
      '9:16': 'portrait_16_9',
      '4:3': 'landscape_4_3',
      '3:4': 'portrait_4_3',
      '3:2': 'landscape_3_2',
      '2:3': 'portrait_3_2',
    };
    const result = await callKieApi('/jobs/createTask', {
      model: 'bytedance/seedream-v4-text-to-image',
      input: {
        prompt,
        image_size: imageSizeMap[aspectRatio] || 'square_hd',
        image_resolution: resolution,
        max_images: 1,
      },
    });
    res.json({ taskId: result.task_id || result.data?.taskId, taskType: 'seedream' });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['seedream']);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/gpt4o-image', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    const sizeMap: Record<string, string> = {
      '1:1': '1:1',
      '3:2': '3:2',
      '2:3': '2:3',
      '16:9': '3:2',
      '9:16': '2:3',
      '4:3': '3:2',
      '3:4': '2:3',
    };
    const result = await callKieApi('/gpt4o-image/generate', {
      prompt,
      size: sizeMap[aspectRatio] || '1:1',
      nVariants: 1,
      isEnhance: false,
      enableFallback: true,
    });
    res.json({ taskId: result.data?.taskId, taskType: 'gpt4o-image' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/veo3-fast', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    const result = await callKieApi('/veo/generate', {
      prompt,
      model: 'veo3_fast',
      aspectRatio,
    });
    res.json({ taskId: result.data.taskId, taskType: 'veo3' });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['veo3-fast']);
    res.status(500).json({ error: error.message });
  }
});

// Sora 2 Text to Video
app.post('/api/generate/sora2-text', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, aspectRatio = 'landscape', duration = '10' } = req.body;
    const result = await callKieApi('/jobs/createTask', {
      model: 'sora-2-text-to-video',
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        n_frames: duration,
        remove_watermark: true,
      },
    });
    res.json({ taskId: result.data?.taskId, taskType: 'sora2' });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['sora2-text']);
    res.status(500).json({ error: error.message });
  }
});

// Sora 2 Image to Video
app.post('/api/generate/sora2-image', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, imageUrl, aspectRatio = 'landscape', duration = '10' } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    // Upload image to Cloudinary first
    const cloudinaryImageUrl = await cloudinaryUtil.uploadImageToCloudinary(imageUrl);
    console.log(`Image uploaded to Cloudinary: ${imageUrl} -> ${cloudinaryImageUrl}`);
    
    const result = await callKieApi('/jobs/createTask', {
      model: 'sora-2-image-to-video',
      input: {
        prompt,
        image_urls: [cloudinaryImageUrl],
        aspect_ratio: aspectRatio,
        n_frames: duration,
        remove_watermark: true,
      },
    });
    res.json({ taskId: result.data?.taskId, taskType: 'sora2' });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['sora2-image']);
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

// Suno AI - Generate Music
app.post('/api/generate/suno', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
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
    await refundCredits(req.userId!, MODEL_CREDITS['suno']);
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

    console.log('[Login] Attempting login for:', email);
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('[Login] User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await verifyPassword(password, user.password_hash);

    if (!validPassword) {
      console.log('[Login] Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    console.log('[Login] Login successful for:', email, 'userId:', user.id);

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
    console.log('[Auth ME] User request:', { userId: req.userId, email: req.user?.email });
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ user: req.user });
  } catch (error: any) {
    console.error('[Auth ME] Error:', error);
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

app.get('/api/products/explore', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const images = await pool.query(
      'SELECT id, user_id, image_url, prompt, model, aspect_ratio, created_at FROM generated_images WHERE is_public = true ORDER BY created_at DESC LIMIT 100'
    );
    
    const videos = await pool.query(
      'SELECT id, user_id, video_url, prompt, model, aspect_ratio, created_at FROM generated_videos WHERE is_public = true ORDER BY created_at DESC LIMIT 100'
    );
    
    const music = await pool.query(
      'SELECT id, user_id, audio_url, title, prompt, style, model, created_at FROM generated_music WHERE is_public = true ORDER BY created_at DESC LIMIT 100'
    );

    res.json({
      images: images.rows,
      videos: videos.rows,
      music: music.rows
    });
  } catch (error: any) {
    console.error('Get explore error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/publish', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { type, id } = req.body;
    
    if (!type || !id) {
      return res.status(400).json({ error: 'Missing type or id' });
    }

    let result;
    if (type === 'image') {
      result = await pool.query(
        'UPDATE generated_images SET is_public = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, req.userId]
      );
    } else if (type === 'video') {
      result = await pool.query(
        'UPDATE generated_videos SET is_public = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, req.userId]
      );
    } else if (type === 'music') {
      result = await pool.query(
        'UPDATE generated_music SET is_public = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, req.userId]
      );
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (error: any) {
    console.error('Publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lesson API Endpoints
app.post('/api/lessons', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, subject, gradeLevel, duration, objectives, teachingStyle } = req.body;
    console.log('[Create Lesson] User ID:', { userId: req.userId, type: typeof req.userId });
    const lesson = await lessonService.createLesson(
      req.userId!,
      title,
      subject,
      gradeLevel,
      duration,
      objectives,
      teachingStyle
    );
    console.log('[Create Lesson] Lesson created:', { id: lesson.id, userId: lesson.user_id });
    res.json({ success: true, id: lesson.id, ...lesson });
  } catch (error: any) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lessons', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Get Lessons] Fetching lessons for user:', { userId: req.userId, type: typeof req.userId });
    const lessons = await lessonService.getLessonsByUser(req.userId!);
    console.log('[Get Lessons] Found lessons:', lessons.length);
    res.json({ lessons });
  } catch (error: any) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lessons/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    console.log(`[Lesson Fetch] Fetching lesson ${lessonId} for user ${req.userId}`);
    const lesson = await lessonService.getLessonById(lessonId);
    console.log(`[Lesson Fetch] Found lesson: ${lesson ? `id=${lesson.id}, user_id=${lesson.user_id}` : 'NOT FOUND'}`);
    console.log(`[Lesson Fetch] User comparison: ${lesson?.user_id} === ${req.userId} ? ${lesson?.user_id === req.userId}`);
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (error: any) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lessons/:id/generate-script', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    console.log(`[Script Gen] Starting script generation for lesson ${lessonId} for user ${req.userId}`);
    const lesson = await lessonService.getLessonById(lessonId);
    console.log(`[Script Gen] Found lesson: ${lesson ? `id=${lesson.id}, user_id=${lesson.user_id}` : 'NOT FOUND'}`);
    console.log(`[Script Gen] User comparison: ${lesson?.user_id} === ${req.userId} ? ${lesson?.user_id === req.userId}`);
    
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const objectives = JSON.parse(lesson.learning_objectives || '[]');
    console.log(`[Script Gen] Objectives: ${JSON.stringify(objectives)}`);
    const script = await lessonService.generateLessonScript(
      lesson.title,
      lesson.grade_level,
      lesson.duration_minutes,
      objectives
    );

    console.log(`[Script Gen] Script generated, length: ${script?.length || 0}`);
    const result = await pool.query(
      'UPDATE lessons SET script_content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [script, lessonId]
    );

    res.json({ success: true, script });
  } catch (error: any) {
    console.error('Generate script error:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

app.post('/api/lessons/:id/generate-slides', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    const lesson = await lessonService.getLessonById(lessonId);
    
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (!lesson.script_content) {
      return res.status(400).json({ error: 'Please generate script first' });
    }

    const slides = await lessonService.generateLessonSlides(lesson.script_content, 5);
    
    const result = await pool.query(
      'INSERT INTO lesson_content (lesson_id, content_type, content_data, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [lessonId, 'slides', JSON.stringify(slides), 0]
    );

    res.json({ success: true, slides });
  } catch (error: any) {
    console.error('Generate slides error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 1. Generate Word document from lesson script
app.post('/api/lessons/:id/generate-word', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    const lesson = await lessonService.getLessonById(lessonId);
    
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (!lesson.script_content) {
      return res.status(400).json({ error: 'Please generate script first' });
    }

    const wordContent = await lessonService.generateLessonWordDoc(
      lesson.title,
      lesson.script_content,
      lesson.subject,
      lesson.grade_level,
      lesson.duration_minutes
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${lesson.title}.docx"`);
    res.send(Buffer.from(wordContent, 'base64'));
  } catch (error: any) {
    console.error('Generate word error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Generate video using Flaton Video V1
app.post('/api/lessons/:id/generate-video', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    const lesson = await lessonService.getLessonById(lessonId);
    
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (!lesson.script_content) {
      return res.status(400).json({ error: 'Please generate script first' });
    }

    const videoUrl = await lessonService.generateLessonVideo(
      lesson.script_content,
      lesson.title
    );

    res.json({ success: true, videoUrl });
  } catch (error: any) {
    console.error('Generate video error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Generate images using Flaton Image V1
app.post('/api/lessons/:id/generate-images', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    const { prompts } = req.body;
    
    if (!prompts || !Array.isArray(prompts)) {
      return res.status(400).json({ error: 'Prompts array is required' });
    }

    const lesson = await lessonService.getLessonById(lessonId);
    
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const imageUrls = await lessonService.generateLessonImages(prompts);

    res.json({ success: true, imageUrls });
  } catch (error: any) {
    console.error('Generate images error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Generate PowerPoint using Gemini
app.post('/api/lessons/:id/generate-powerpoint', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    const lesson = await lessonService.getLessonById(lessonId);
    
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (!lesson.script_content) {
      return res.status(400).json({ error: 'Please generate script first' });
    }

    console.log('[PowerPoint Gen] Generating PowerPoint for lesson:', lesson.title);
    
    const prompt = `Generate Python code using python-pptx library to create a professional PowerPoint presentation.
The presentation should be based on this teaching script:

${lesson.script_content}

Requirements:
1. Title slide with lesson title, subject, and grade level
2. Content slides (5-7 slides) with key points from the script
3. Professional formatting with consistent styling
4. Bullet points for readability
5. Save to file: /tmp/lesson_presentation.pptx

Return ONLY the Python code, no explanations or markdown formatting.
Start with: from pptx import Presentation`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const pythonCode = response.text || '';
    console.log('[PowerPoint Gen] Generated code length:', pythonCode.length);

    // Return the code for frontend to execute
    res.json({ success: true, pythonCode });
  } catch (error: any) {
    console.error('Generate PowerPoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save workflow
app.post('/api/lessons/:id/workflows/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    const { name, steps } = req.body;
    
    if (!name || !steps) {
      return res.status(400).json({ error: 'Name and steps are required' });
    }

    const lesson = await lessonService.getLessonById(lessonId);
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    console.log('[Save Workflow] Saving workflow:', name, 'with', steps.length, 'steps');
    const workflow = await lessonService.createWorkflow(lessonId, name, { steps });
    console.log('[Save Workflow] Workflow saved successfully:', workflow.id);
    res.json({ success: true, workflow });
  } catch (error: any) {
    console.error('Save workflow error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute workflow
app.post('/api/lessons/:id/workflows/execute', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    const { steps } = req.body;
    
    if (!steps || !Array.isArray(steps)) {
      return res.status(400).json({ error: 'Steps array is required' });
    }

    const lesson = await lessonService.getLessonById(lessonId);
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const startTime = Date.now();
    console.log('\n========== 🚀 WORKFLOW EXECUTION STARTED ==========');
    console.log(`[Execute Workflow] Lesson: ${lessonId}`);
    console.log(`[Execute Workflow] Steps: ${steps.length} step(s)`);
    console.log(`[Execute Workflow] Step types: ${steps.map((s: any) => s.type).join(', ')}`);
    const results = await lessonService.executeWorkflow(lessonId, steps, {}, ai);
    const duration = Date.now() - startTime;
    console.log('\n========== ✅ WORKFLOW EXECUTION COMPLETED ==========');
    console.log(`[Execute Workflow] Duration: ${duration}ms`);
    console.log(`[Execute Workflow] Results: ${JSON.stringify(results, null, 2)}`);
    console.log('====================================================\n');
    
    res.json({ success: true, results });
  } catch (error: any) {
    console.error('Execute workflow error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workflows', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId, name, steps } = req.body;
    
    const lesson = await lessonService.getLessonById(lessonId);
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const workflow = await lessonService.createWorkflow(lessonId, name, { steps });
    res.json({ success: true, ...workflow });
  } catch (error: any) {
    console.error('Create workflow error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lessons/:id/workflows', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    const lesson = await lessonService.getLessonById(lessonId);
    
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const workflows = await lessonService.getWorkflowsByLesson(lessonId);
    res.json({ workflows });
  } catch (error: any) {
    console.error('Get workflows error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete workflow
app.delete('/api/workflows/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workflowId = req.params.id;
    const result = await pool.query(
      'DELETE FROM workflows WHERE id = $1 RETURNING *',
      [workflowId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PowerPoint generation endpoint
// Pexels API Integration
async function searchPexelsImage(query: string): Promise<string | null> {
  const PEXELS_API_KEY = '5CMiTYU623YlebMZTUMXniZNDoe3rHP1HNwWhMJC2VLXqOtOIws7WZCx';
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: {
        Authorization: PEXELS_API_KEY
      }
    });
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large2x || data.photos[0].src.original;
    }
    return null;
  } catch (error) {
    console.error('[Pexels] Search failed:', error);
    return null;
  }
}

app.post('/api/generate-pptx-content', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, style, imageSource } = req.body;
    console.log('[PowerPoint] Generating content with Gemini...');

    const geminiPrompt = `
      Create a professional PowerPoint presentation structure for: "${prompt}".
      Style: ${style}
      Number of slides: 5-8.

      IMPORTANT: The content of the slides (title and bullets) MUST be in the SAME LANGUAGE as the user's prompt: "${prompt}".

      Return ONLY a JSON array of slide objects.
      Each object must have:
      - title: string
      - bullets: string[] (3-5 key points)
      - imageSearchQuery: string (short English keyword for searching a relevant photo on Pexels/Unsplash)

      Format as: [{"title": "...", "bullets": ["...", "..."], "imageSearchQuery": "..."}]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: geminiPrompt }] }],
    });

    const text = response.text || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const rawSlides = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Fetch images from Pexels in parallel
    const slidesWithImages = await Promise.all(rawSlides.map(async (s: any) => {
      const imageUrl = await searchPexelsImage(s.imageSearchQuery);
      return { ...s, imageUrl };
    }));

    res.json({ slides: slidesWithImages });
  } catch (error: any) {
    console.error('[PowerPoint] Content generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/export-pptx', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { slides, style } = req.body;
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const lessonId = Date.now();

    console.log('[PowerPoint] Exporting slides to PPTX with layout and images...');

    const pythonCodePrompt = `
      Generate Python code using python-pptx library to create a STUNNING presentation.
      Slides data: ${JSON.stringify(slides)}
      Style choice: ${style}
      
      Canvas is 800x450. PPTX is 10x5.625 inches. 
      Ratio: x_pptx = x_canvas * (10/800) inches, y_pptx = y_canvas * (5.625/450) inches.

      STYLE DEFINITIONS for "${style}":
      - Creative: BG RGBColor(43, 45, 66), Title RGBColor(255, 209, 102), Body RGBColor(237, 242, 244).
      - Professional: BG RGBColor(248, 249, 250), Title RGBColor(30, 60, 88), Body RGBColor(51, 51, 51).
      - Minimalist: BG RGBColor(255, 255, 255), Title RGBColor(0, 0, 0), Body RGBColor(73, 80, 87).
      - FloralPink: BG RGBColor(255, 255, 255), Title RGBColor(255, 105, 180), Body RGBColor(100, 100, 100), Border RGBColor(255, 182, 193).

      LAYOUT RULES:
      - If style is "FloralPink", use a thick pink border (shape) around the slide and add small decorative rectangles in corners to mimic floral patterns.
      - If style is "Creative", use bold layouts with overlapping elements.
      - If style is "Professional", use clean grid layouts.
      - If style is "Minimalist", use centered layouts with lots of white space.

      REQUIREMENTS:
      1. For each slide:
         - Set background color based on style.
         - Add a design accent shape (rectangle) at the top or side based on the style.
         - For elements:
           * If 'text': Create a text box at converted (x, y, w, h). Set font size, and color.
           * If 'image': Download the URL from element['content'] using urllib.request. If successful, add as a picture at (x, y, w, h).
      
      2. TECHNICAL:
         - SAVE TO: /tmp/export_${lessonId}.pptx
         - Use: from pptx.dml.color import RGBColor; from pptx.util import Inches, Pt; from pptx.enum.shapes import MSO_SHAPE.
         - Use: import urllib.request; import os; import time.
      
      Return ONLY the Python code.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: pythonCodePrompt }] }],
    });

    const pythonCode = response.text || '';
    const cleanPythonCode = pythonCode.replace(/```python/g, '').replace(/```/g, '').trim();
    
    const tmpFile = `/tmp/gen_${lessonId}.py`;
    fs.writeFileSync(tmpFile, cleanPythonCode);

    try {
      execSync(`python3 ${tmpFile}`, { stdio: 'pipe' });
    } catch (execErr: any) {
      console.error('[PowerPoint] Python execution error:', execErr.stderr?.toString());
      throw new Error(`Python execution failed: ${execErr.message}`);
    }
    
    const outputFile = `/tmp/export_${lessonId}.pptx`;
    const fileBuffer = fs.readFileSync(outputFile);
    const base64File = fileBuffer.toString('base64');

    res.json({
      file: base64File,
      fileName: `presentation_${lessonId}.pptx`
    });

    // Cleanup
    setTimeout(() => {
      try {
        fs.unlinkSync(tmpFile);
        fs.unlinkSync(outputFile);
      } catch (e) {}
    }, 5000);

  } catch (error: any) {
    console.error('[PowerPoint] Export failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-pptx', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, style, imageSource = 'internet' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('[PPTX Gen] Generating content for:', prompt, 'with style:', style, 'Image source:', imageSource);
    
    // If imageSource is AI, we need to generate images first
    let aiGeneratedImages: string[] = [];
    if (imageSource === 'ai') {
      try {
        console.log('[PPTX Gen] Generating AI images via Flaton Image V1...');
        // Request image prompts from Gemini first to make them relevant
        const imagePromptRequest = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: `Based on the PowerPoint topic "${prompt}", suggest 3 short, highly descriptive image prompts for an AI image generator. Return ONLY a JSON array of strings.` }] }],
        });
        
        const promptsText = imagePromptRequest.text || '[]';
        // Improved parsing for prompt JSON
        let prompts: string[] = [];
        try {
          const cleanedText = promptsText.replace(/```json/g, '').replace(/```/g, '').trim();
          prompts = JSON.parse(cleanedText);
          if (!Array.isArray(prompts)) prompts = [promptsText];
        } catch (e) {
          console.log('[PPTX Gen] Fallback parsing for prompts');
          const matches = promptsText.match(/"([^"]+)"/g);
          if (matches) prompts = matches.map(m => m.replace(/"/g, ''));
          else prompts = [prompt];
        }
        
        // Use Flaton Image V1 (Nano Banana) logic
        for (const imgPrompt of prompts.slice(0, 3)) {
          console.log(`[PPTX Gen] Creating task for prompt: ${imgPrompt}`);
          const result: any = await callKieApi('/playground/createTask', {
            model: 'nano-banana',
            prompt: imgPrompt,
          });
          
          if (result && (result.taskId || (result.data && result.data.taskId))) {
            const taskId = result.taskId || result.data.taskId;
            console.log(`[PPTX Gen] Task created for image: ${taskId}`);
            // Polling for image
            let attempts = 0;
            while (attempts < 15) {
              await new Promise(r => setTimeout(r, 4000));
              const status: any = await checkTaskStatus(taskId, 'playground');
              if (status.status === 'completed' && status.imageUrl) {
                aiGeneratedImages.push(status.imageUrl);
                break;
              } else if (status.status === 'success' && status.imageUrl) {
                aiGeneratedImages.push(status.imageUrl);
                break;
              } else if (status.data?.status === 'success' && (status.data?.result || status.data?.imageUrl)) {
                aiGeneratedImages.push(status.data.result || status.data.imageUrl);
                break;
              }
              attempts++;
            }
          } else {
            console.error('[PPTX Gen] Task creation failed or taskId missing:', result);
          }
        }
        console.log(`[PPTX Gen] Successfully generated ${aiGeneratedImages.length} AI images`);
      } catch (aiErr) {
        console.error('[PPTX Gen] AI Image generation failed, falling back to internet:', aiErr);
      }
    }

    // If imageSource is Internet, we can fetch from Pexels
    let pexelsImages: string[] = [];
    if (imageSource === 'internet') {
      try {
        console.log('[PPTX Gen] Fetching images from Pexels for topic:', prompt);
        const PEXELS_API_KEY = '5CMiTYU623YlebMZTUMXniZNDoe3rHP1HNwWhMJC2VLXqOtOIws7WZCx';
        const pexelsResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(prompt)}&per_page=5`, {
          headers: {
            'Authorization': PEXELS_API_KEY
          }
        });
        const pexelsData = await pexelsResponse.json();
        if (pexelsData.photos && pexelsData.photos.length > 0) {
          pexelsImages = pexelsData.photos.map((p: any) => p.src.large);
          console.log(`[PPTX Gen] Found ${pexelsImages.length} images from Pexels`);
        }
      } catch (err) {
        console.error('[PPTX Gen] Pexels API failed:', err);
      }
    }

    const aiPrompt = `Generate Python code using python-pptx library to create a highly visual and professional PowerPoint presentation.
Topic: ${prompt}
Style: ${style || 'Professional and clean'}
Image Source: ${imageSource}
${aiGeneratedImages.length > 0 ? `AI Images to use: ${JSON.stringify(aiGeneratedImages)}` : ''}
${pexelsImages.length > 0 ? `Pexels Images to use: ${JSON.stringify(pexelsImages)}` : ''}

Requirements for the Python code:
1. Use professional layouts: Only use standard layout indices (0-6) to avoid "index out of range" errors. (0: Title, 1: Title and Content, 2: Section Header, 3: Two Content, 4: Comparison, 5: Title Only, 6: Blank).
2. Visual Richness: 
   ${imageSource === 'ai' && aiGeneratedImages.length > 0 
     ? `Use the provided AI Image URLs sequentially in the slides.` 
     : pexelsImages.length > 0
       ? `Use the provided Pexels Image URLs sequentially in the slides.`
       : `Include at least 3 high-quality images from Unsplash. Use: https://source.unsplash.com/featured/?{keyword} or random professional photo URLs.`}
3. Typography & Styling:
   - Use 'Arial' or 'Calibri' as safe fonts.
   - Set font sizes: Titles (36-44pt), Body (20-24pt).
   - Use MSO_ANCHOR.TOP instead of PP_ALIGN.TOP for vertical anchoring of text frames.
4. Content:
   - At least 6 slides.
5. Image Handling (CRITICAL):
   - Use a try-except block when downloading and adding each image. If an image fails, skip it and continue.
   - For images from Pexels, set a User-Agent header to avoid 403 Forbidden errors.
   - Use a timeout for urllib.request.urlopen to prevent hanging. (timeout=10)
   - Ensure the image exists before adding it (check length of downloaded data).
   - IMPORTANT: Do NOT use any external files or special characters in filenames.
   - Use slide.shapes.add_picture(img_data, Inches(0.5), Inches(1.5), width=Inches(5)) for standard placement.
   - Import: import urllib.request, from io import BytesIO
   - Use:
     try:
       req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
       with urllib.request.urlopen(req, timeout=10) as url:
         img_data = BytesIO(url.read())
         if len(img_data.getvalue()) > 100:
           # Check if it's a title slide (index 0) to avoid overlapping
           slide.shapes.add_picture(img_data, Inches(0.5), Inches(1.5), width=Inches(5))
     except Exception as e:
       print(f"Failed to add image from {img_url}: {e}")

Return ONLY the Python code, no explanations or markdown formatting.
Start with:
import urllib.request
from io import BytesIO
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor

Save final presentation to: /tmp/generated_presentation.pptx`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
    });

    let pythonCode = response.text || '';
    // Clean up code if Gemini adds markdown
    pythonCode = pythonCode.replace(/```python/g, '').replace(/```/g, '').trim();
    
    // Add necessary safety wrappers if missing
    if (!pythonCode.includes('import urllib.request')) {
      pythonCode = 'import urllib.request\nfrom io import BytesIO\n' + pythonCode;
    }
    
    console.log('[PPTX Gen] Executing Python code with visual enhancements...');
    const tempFile = path.join('/tmp', `pptx_${Date.now()}.py`);
    const outputFile = '/tmp/generated_presentation.pptx';
    
    fs.writeFileSync(tempFile, pythonCode);
    
    try {
      await execPromise(`python3 ${tempFile}`);
      
      if (fs.existsSync(outputFile)) {
        const fileContent = fs.readFileSync(outputFile);
        const base64Content = fileContent.toString('base64');
        
        // Cleanup
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        
        res.json({ 
          success: true, 
          message: 'PowerPoint generated successfully',
          file: base64Content,
          fileName: 'presentation.pptx'
        });
      } else {
        throw new Error('Failed to generate PPTX file');
      }
    } catch (execError: any) {
      console.error('[PPTX Gen] Execution error:', execError);
      res.status(500).json({ error: 'Failed to execute Python code', details: execError.message });
    }
  } catch (error: any) {
    console.error('PPTX generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete lesson
app.delete('/api/lessons/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;
    const lesson = await lessonService.getLessonById(lessonId);
    
    if (!lesson || lesson.user_id !== req.userId) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    await pool.query('DELETE FROM lesson_content WHERE lesson_id = $1', [lessonId]);
    await pool.query('DELETE FROM workflows WHERE lesson_id = $1', [lessonId]);
    await pool.query('DELETE FROM lessons WHERE id = $1', [lessonId]);

    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error: any) {
    console.error('Delete lesson error:', error);
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

if ('production' === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
    } else {
      next();
    }
  });
}

// Word Generator Endpoint
app.post('/api/generate-word', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content, isLink } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Nội dung hoặc link là bắt buộc' });
    }

    console.log('[Word Gen] Generating document from:', isLink ? 'Link' : 'Content');

    let textContent = content;
    
    // If link, fetch content from URL
    if (isLink) {
      try {
        const response = await fetch(content, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const html = await response.text();
        // Simple HTML to text extraction
        textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 3000); // Limit content
      } catch (err) {
        console.error('[Word Gen] Failed to fetch URL:', err);
        return res.status(400).json({ error: 'Không thể tải nội dung từ link' });
      }
    }

    // Use Gemini to summarize and structure content
    const geminiPrompt = `
      Bạn là một chuyên gia viết tài liệu. Hãy tổng hợp nội dung dưới đây thành một tài liệu Word chuyên nghiệp.
      Bao gồm: Tiêu đề, giới thiệu, các phần chính, kết luận.
      
      Nội dung gốc:
      "${textContent.substring(0, 2000)}"
      
      Trả về một JSON object với các key:
      - title: string (tiêu đề tài liệu)
      - introduction: string (đoạn giới thiệu)
      - sections: Array<{ heading: string, content: string }> (các phần chính, tối đa 5 phần)
      - conclusion: string (kết luận)
    `;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: geminiPrompt }] }],
    });

    const responseText = geminiResponse.text || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const structuredContent = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      title: 'Tài Liệu',
      introduction: 'Tài liệu được tạo bởi AI',
      sections: [{ heading: 'Nội Dung', content: textContent }],
      conclusion: 'Cảm ơn bạn đã đọc'
    };

    // Create Word document using docx library with Times New Roman font
    const sections = (structuredContent.sections || []).slice(0, 5).map((s: any) => [
      new Paragraph({
        children: [
          new TextRun({
            text: s.heading || 'Mục',
            bold: true,
            font: 'Times New Roman',
            color: '000000',
          }),
        ],
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: (s.content || '').substring(0, 1000),
            font: 'Times New Roman',
            color: '000000',
          }),
        ],
        spacing: { after: 400 },
      }),
    ]).flat();

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: structuredContent.title || 'Tài Liệu',
                bold: true,
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Giới Thiệu',
                bold: true,
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: (structuredContent.introduction || '').substring(0, 500),
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            spacing: { after: 400 },
          }),
          ...sections,
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kết Luận',
                bold: true,
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: (structuredContent.conclusion || '').substring(0, 500),
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            spacing: { after: 400 },
          }),
        ],
      }],
    });

    const outputPath = `/tmp/generated_document_${Date.now()}.docx`;
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    // Send file as download
    const downloadFilename = `document_${Date.now()}.docx`;
    res.download(outputPath, downloadFilename, (err) => {
      if (err) console.error('Download error:', err);
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    });

  } catch (error: any) {
    console.error('[Word Gen] Error:', error);
    res.status(500).json({ error: error.message || 'Lỗi tạo tài liệu Word' });
  }
});

function startKeepAlive() {
  const RENDER_URL = 'https://flaton.onrender.com';
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
      console.log(`Environment: production`);
      console.log('Database initialized successfully');
      
      if ('production' === 'production') {
        startKeepAlive();
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
