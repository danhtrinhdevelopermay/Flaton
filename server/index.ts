import express, { Request, Response } from 'express';
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from 'cors';

async function getGeminiModel() {
  // prioritize database
  try {
    const result = await pool.query("SELECT setting_value FROM admin_settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
    if (result.rows.length > 0 && result.rows[0].setting_value) {
      const apiKey = result.rows[0].setting_value.trim().replace(/^['"]|['"]$/g, '');
      if (apiKey && apiKey !== '') {
        console.log('[Gemini] Using API Key from database');
        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash"
        }, { apiVersion: 'v1' });
      }
    }
  } catch (error) {
    console.error('Error fetching Gemini API key from database:', error);
  }

  // fallback to env
  const envKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (envKey) {
    const cleanedKey = envKey.trim().replace(/^['"]|['"]$/g, '');
    console.log('[Gemini] Using API Key from environment variables');
    const genAI = new GoogleGenerativeAI(cleanedKey);
    return genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    }, { apiVersion: 'v1' });
  }

  console.error('[Gemini] CRITICAL: No API Key found in env or database!');
  return null;
}
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
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun, ImageRun } from 'docx';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-2024';

dotenv.config();

const app = express();
const PORT = 3001;

// Trust proxy for Render/HTTPS
app.set('trust proxy', 1);

// HTTPS Redirect Middleware
app.use((req, res, next) => {
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }
  // Redirect to HTTPS version of flaton.io.vn or current host
  const host = req.headers.host === 'flaton.io.vn' ? 'flaton.io.vn' : req.headers.host;
  res.redirect(301, `https://${host}${req.url}`);
});

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Manus AI Integration
const MANUS_API_BASE = 'https://api.manus.ai/v1';

async function getManusApiKey(): Promise<string> {
  const result = await pool.query("SELECT setting_value FROM admin_settings WHERE setting_key = 'manus_api_key' LIMIT 1");
  if (result.rows.length > 0 && result.rows[0].setting_value) {
    return result.rows[0].setting_value.trim();
  }
  return process.env.MANUS_API_KEY || '';
}

app.post('/api/manus/tasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, taskMode = 'agent', agentProfile = 'manus-1.6' } = req.body;
    console.log('[Manus] Creating task:', { prompt, taskMode, agentProfile });
    
    const apiKey = await getManusApiKey();
    if (!apiKey) {
      console.error('[Manus] Error: API key not configured');
      return res.status(400).json({ error: 'Manus API key chưa được cấu hình.' });
    }

    const response = await fetch(`${MANUS_API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'API_KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, taskMode, agentProfile })
    });

    const data = await response.json();
    console.log('[Manus] Create task response:', data);
    
    if (!response.ok) {
      console.error('[Manus] API Error:', data);
      return res.status(response.status).json(data);
    }

    // Save task to database
    const taskId = data.task_id || data.id;
    if (taskId) {
      await pool.query(
        'INSERT INTO manus_tasks (user_id, task_id, status, prompt) VALUES ($1, $2, $3, $4)',
        [req.userId, taskId, 'pending', prompt]
      );
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('[Manus] Request Exception:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/manus/tasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT task_id as id, status, prompt, result, error, created_at as "createdAt" FROM manus_tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('[Manus] Get tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/manus/tasks/:taskId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    console.log('[Manus] Polling task:', taskId);
    
    const apiKey = await getManusApiKey();
    const response = await fetch(`${MANUS_API_BASE}/tasks/${taskId}`, {
      headers: { 'API_KEY': apiKey }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Manus] Poll API Error:', data);
      return res.status(response.status).json(data);
    }

    // Try to get full list of files for this task
    try {
      const filesResponse = await fetch(`${MANUS_API_BASE}/files?task_id=${taskId}`, {
        headers: { 'API_KEY': apiKey }
      });
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        // The API returns { "files": [...] } according to the docs
        if (filesData && filesData.files && Array.isArray(filesData.files)) {
          data.all_files = filesData.files;
          console.log(`[Manus] Found ${filesData.files.length} files for task ${taskId}`);
        } else if (Array.isArray(filesData)) {
          data.all_files = filesData;
          console.log(`[Manus] Found ${filesData.length} files for task ${taskId}`);
        }
      }
    } catch (fileErr) {
      console.error('[Manus] Error fetching files list:', fileErr);
    }

    // Update status in database if changed
    if (data.status) {
      // If we have all_files, merge it into result for storage
      const resultToSave = data.result || data.output || {};
      if (data.all_files) {
        if (typeof resultToSave === 'object') {
          resultToSave.all_files = data.all_files;
        }
      }

      await pool.query(
        'UPDATE manus_tasks SET status = $1, result = $2, error = $3, updated_at = CURRENT_TIMESTAMP WHERE task_id = $4 AND user_id = $5',
        [data.status, resultToSave, data.error || null, taskId, req.userId]
      );
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('[Manus] Poll Exception:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Check if table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await pool.query("SELECT setting_key, setting_value FROM admin_settings");
    const settings: Record<string, string> = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    
    // Check if table exists, if not create it (safety)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(
      "INSERT INTO admin_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP",
      [key, value]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error saving admin setting:', error);
    res.status(500).json({ error: error.message });
  }
});


// PPTX generation endpoint
app.post('/api/generate-pptx-content', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, style } = req.body;
    
    const systemPrompt = `Bạn là một chuyên gia soạn thảo bài giảng. Hãy tạo nội dung slide cho bài giảng dưới dạng JSON. Trả về mảng các slide, mỗi slide có tiêu đề và nội dung.`;
    const model = await getGeminiModel();
    if (!model) {
      throw new Error('Gemini model not initialized');
    }
    const result = await (model as any).generateContent(systemPrompt + "\n\n" + prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean JSON response
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const content = JSON.parse(text);

    res.json(content);
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Không thể tạo nội dung slide miễn phí lúc này.' });
  }
});

app.post('/api/generate/pptx-from-html', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { slides } = req.body;
    res.status(200).json({ message: "Chức năng xuất PPTX đang được hoàn thiện." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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

// Admin: Get all KIE API keys
app.get('/api/admin/kie-keys', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT id, name, credits FROM api_keys WHERE is_active = true ORDER BY id ASC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function getApiKeyById(id: number): Promise<string> {
  const result = await pool.query('SELECT key_value FROM api_keys WHERE id = $1 AND is_active = true', [id]);
  if (result.rows.length === 0) {
    throw new Error('API Key not found or inactive');
  }
  return result.rows[0].key_value;
}

// Update callKieApi to accept an optional apiKeyId
async function callKieApi(endpoint: string, data: any, apiKeyId?: number) {
  let apiKey = '';
  if (apiKeyId) {
    apiKey = await getApiKeyById(apiKeyId);
  } else {
    apiKey = await getActiveApiKey();
  }

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

async function checkTaskStatus(taskId: string, taskType: string, apiKeyId?: number) {
  let apiKey = '';
  try {
    if (apiKeyId) {
      apiKey = await getApiKeyById(apiKeyId);
    } else {
      apiKey = await getActiveApiKey();
    }
  } catch (e) {
    apiKey = await getActiveApiKey();
  }

  const checkStatus = async (useRecordId: boolean) => {
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
        endpoint = useRecordId 
          ? `/playground/recordInfo?taskId=${taskId}&recordId=${taskId}`
          : `/playground/recordInfo?recordId=${taskId}`;
        break;
      case 'seedream':
      case 'grok':
      case 'sora2':
      case 'kling':
      case 'topaz-video':
        endpoint = useRecordId
          ? `/jobs/recordInfo?taskId=${taskId}&recordId=${taskId}`
          : `/jobs/recordInfo?recordId=${taskId}`;
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

    return await response.json();
  };

  let result = await checkStatus(true);
  console.log(`Task status check (with recordId) for ${taskType}/${taskId}:`, JSON.stringify(result, null, 2));

  // Fallback if recordInfo is null
  if (result.code === 422 && result.msg === 'recordInfo is null') {
    console.log(`[DEBUG] recordInfo is null for ${taskType}/${taskId}. Retrying without recordId...`);
    result = await checkStatus(false);
    console.log(`Task status check (without recordId) for ${taskType}/${taskId}:`, JSON.stringify(result, null, 2));
  }

  return parseKieStatus(result, taskType);
}

async function parseKieStatus(result: any, taskType: string) {
  if (result.code !== 200) {
    const errorMsg = result.msg || result.message || 'Failed to check task status';
    throw new Error(errorMsg);
  }
  
  const data = result.data;
  if (!data) return { status: 'processing', progress: 'waiting' };

  if (taskType === 'playground' || taskType === 'seedream' || taskType === 'topaz-video' || taskType === 'grok' || taskType === 'sora2' || taskType === 'kling') {
    if (data.state === 'success') {
      let mediaUrl = null;
      if (data.resultJson) {
        try {
          const resultData = JSON.parse(data.resultJson);
          const originalUrl = resultData.resultUrls?.[0] || resultData.videoUrl || null;
          if (originalUrl) {
            if (taskType === 'playground' || taskType === 'seedream') {
              mediaUrl = await cloudinaryUtil.uploadImageToCloudinary(originalUrl);
            } else {
              mediaUrl = await cloudinaryUtil.uploadVideoToCloudinary(originalUrl);
            }
          }
        } catch (e) {
          console.error('Failed to parse resultJson:', e);
        }
      }
      return {
        status: 'completed',
        imageUrl: (taskType === 'playground' || taskType === 'seedream') ? mediaUrl : undefined,
        videoUrl: (taskType !== 'playground' && taskType !== 'seedream') ? mediaUrl : undefined,
      };
    } else if (data.state === 'failed' || data.state === 'fail') {
      return { status: 'failed', error: data.failMsg || 'Generation failed' };
    } else {
      return { status: 'processing', progress: data.state || 'waiting' };
    }
  }

  // Handle GPT-4o Image generation
  if (taskType === 'gpt4o-image') {
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
        return { status: 'processing', progress: data.progress || '0.00' };
      }
      return { status: 'failed', error: data.errorMessage || 'Image generation failed' };
    } else {
      return { status: 'processing', progress: data.progress || '0.00' };
    }
  }

  // Handle Sora 2 video generation
  if (taskType === 'sora2') {
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
      return { status: 'completed', videoUrl: videoUrl };
    } else if (data.state === 'fail' || data.state === 'failed') {
      return { status: 'failed', error: data.failMsg || 'Video generation failed' };
    } else {
      return { status: 'processing', progress: data.state || 'waiting' };
    }
  }

  // Handle Kling Motion Control
  if (taskType === 'kling') {
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
          console.error('Failed to parse Kling resultJson:', e);
        }
      }
      return { status: 'completed', videoUrl: videoUrl };
    } else if (data.state === 'fail' || data.state === 'failed') {
      return { status: 'failed', error: data.failMsg || 'Kling generation failed' };
    } else {
      return { status: 'processing', progress: data.state || 'waiting' };
    }
  }

  // Handle Midjourney status-based responses
  if ((taskType === 'midjourney' || taskType === 'midjourney-video') && data.status) {
    if (data.status === 'completed' || data.status === 'success') {
      if (taskType === 'midjourney-video') {
        let videos: string[] = [];
        if (data.videos && Array.isArray(data.videos)) {
          videos = data.videos.map((v: any) => v.url || v);
        }
        if (videos.length === 0 && data.resultInfoJson) {
          const resultInfo = typeof data.resultInfoJson === 'string' ? JSON.parse(data.resultInfoJson) : data.resultInfoJson;
          if (resultInfo.resultUrls && Array.isArray(resultInfo.resultUrls)) {
            videos = resultInfo.resultUrls.map((item: any) => item.resultUrl || item);
          }
        }
        if (videos.length === 0 && data.response?.result_urls) videos = data.response.result_urls;
        return { status: 'completed', videoUrl: videos[0], videos: videos };
      } else {
        let images: string[] = [];
        if (data.resultInfoJson) {
          const resultInfo = typeof data.resultInfoJson === 'string' ? JSON.parse(data.resultInfoJson) : data.resultInfoJson;
          if (resultInfo.resultUrls && Array.isArray(resultInfo.resultUrls)) {
            images = resultInfo.resultUrls.map((item: any) => item.resultUrl || item);
          }
        }
        if (images.length === 0 && data.response?.result_urls) images = data.response.result_urls;
        return { status: 'completed', imageUrl: images[0], images: images };
      }
    } else if (data.status === 'failed' || data.status === 'error') {
      return { status: 'failed', error: data.errorMessage || data.error || 'Generation failed' };
    } else {
      return { status: 'processing', progress: data.progress };
    }
  }

  if (data.successFlag === 1) {
    if (taskType === 'veo3') {
      let videoUrl = data.response?.resultUrls?.[0] || null;
      if (!videoUrl && data.resultUrls) {
        try {
          const urls = typeof data.resultUrls === 'string' ? JSON.parse(data.resultUrls) : data.resultUrls;
          videoUrl = Array.isArray(urls) ? urls[0] : urls;
        } catch (e) {}
      }
      return { status: 'completed', videoUrl: videoUrl };
    }
    const responseData = data.response || {};
    return { status: 'completed', imageUrl: responseData.result_urls?.[0], images: responseData.result_urls };
  } else if (data.successFlag === 2 || data.successFlag === 3) {
    return { status: 'failed', error: data.errorMessage || 'Generation failed' };
  } else {
    return { status: 'processing', progress: data.progress };
  }
}

const MODEL_CREDITS: Record<string, number> = {
  'nano-banana': 0,
  'seedream': 0,
  'veo3-fast': 0,
  'suno': 0,
  'sora2-text': 0,
  'sora2-image': 0,
  'kling-motion': 48,
  'topaz-video': 72,
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
    const { prompt, aspectRatio = '1:1', apiKeyId } = req.body;
    const result = await callKieApi('/playground/createTask', {
      model: 'google/nano-banana',
      input: {
        prompt,
        image_size: aspectRatio,
        output_format: 'png',
      },
    }, apiKeyId);
    
    const finalTaskId = result.task_id || result.data?.taskId || result.data?.recordId;
    res.json({ taskId: finalTaskId, taskType: 'playground', apiKeyId });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['nano-banana']);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload-video', authMiddleware, upload.single('video'), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }
    const result = await cloudinaryUtil.uploadVideoToCloudinary(req.file.path);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json({ videoUrl: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/topaz-video', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { videoUrl, upscaleFactor = '4x', apiKeyId } = req.body;
    const factor = upscaleFactor.replace('x', '');
    const result = await callKieApi('/jobs/createTask', {
      model: 'topaz/video-upscale',
      input: { video_url: videoUrl, upscale_factor: factor }
    }, apiKeyId);
    res.json({ taskId: result.task_id || result.data?.taskId, taskType: 'topaz-video', apiKeyId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/seedream', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1', resolution = '1K', apiKeyId } = req.body;
    const imageSizeMap: Record<string, string> = {
      '1:1': 'square_hd', '16:9': 'landscape_16_9', '9:16': 'portrait_16_9', '4:3': 'landscape_4_3',
      '3:4': 'portrait_4_3', '3:2': 'landscape_3_2', '2:3': 'portrait_3_2',
    };
    const result = await callKieApi('/jobs/createTask', {
      model: 'bytedance/seedream-v4-text-to-image',
      input: { prompt, image_size: imageSizeMap[aspectRatio] || 'square_hd', image_resolution: resolution, max_images: 1 },
    }, apiKeyId);
    res.json({ taskId: result.task_id || result.data?.taskId, taskType: 'seedream', apiKeyId });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['seedream']);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/gpt4o-image', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    const sizeMap: Record<string, string> = {
      '1:1': '1:1', '3:2': '3:2', '2:3': '2:3', '16:9': '3:2', '9:16': '2:3', '4:3': '3:2', '3:4': '2:3',
    };
    const result = await callKieApi('/gpt4o-image/generate', {
      prompt, size: sizeMap[aspectRatio] || '1:1', nVariants: 1, isEnhance: false, enableFallback: true,
    });
    res.json({ taskId: result.data?.taskId, taskType: 'gpt4o-image' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/veo3-fast', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userCheck = await pool.query('SELECT is_pro FROM users WHERE id = $1', [req.userId]);
    if (!userCheck.rows[0]?.is_pro) return res.status(403).json({ error: 'Tính năng này chỉ dành cho tài khoản Pro.' });
    const { prompt, aspectRatio = '16:9', apiKeyId } = req.body;
    const result = await callKieApi('/veo/generate', { prompt, model: 'veo3_fast', aspectRatio }, apiKeyId);
    res.json({ taskId: result.data.taskId, taskType: 'veo3', apiKeyId });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['veo3-fast']);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/kling-motion', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, input_urls, video_urls, mode, apiKeyId } = req.body;
    if (!input_urls || !video_urls) return res.status(400).json({ error: 'Image and Video URLs are required' });
    const result = await callKieApi('/jobs/createTask', {
      model: 'kling-2.6/motion-control',
      input: { prompt: prompt || 'The cartoon character is dancing.', input_urls: Array.isArray(input_urls) ? input_urls : [input_urls], video_urls: Array.isArray(video_urls) ? video_urls : [video_urls], mode: mode || '720p' }
    }, apiKeyId);
    res.json({ taskId: result.data.taskId, taskType: 'kling', apiKeyId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/sora2-text', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userCheck = await pool.query('SELECT is_pro FROM users WHERE id = $1', [req.userId]);
    if (!userCheck.rows[0]?.is_pro) return res.status(403).json({ error: 'Tính năng này chỉ dành cho tài khoản Pro.' });
    const { prompt, aspectRatio = 'landscape', duration = '10', apiKeyId } = req.body;
    const result = await callKieApi('/jobs/createTask', { model: 'sora-2-text-to-video', input: { prompt, aspect_ratio: aspectRatio, n_frames: duration, remove_watermark: true } }, apiKeyId);
    res.json({ taskId: result.data?.taskId, taskType: 'sora2', apiKeyId });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['sora2-text']);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/sora2-image', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userCheck = await pool.query('SELECT is_pro FROM users WHERE id = $1', [req.userId]);
    if (!userCheck.rows[0]?.is_pro) return res.status(403).json({ error: 'Tính năng này chỉ dành cho tài khoản Pro.' });
    const { prompt, imageUrl, aspectRatio = 'landscape', duration = '10', apiKeyId } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });
    const cloudinaryImageUrl = await cloudinaryUtil.uploadImageToCloudinary(imageUrl);
    const result = await callKieApi('/jobs/createTask', { model: 'sora-2-image-to-video', input: { prompt, image_urls: [cloudinaryImageUrl], aspect_ratio: aspectRatio, n_frames: duration, remove_watermark: true } }, apiKeyId);
    res.json({ taskId: result.data?.taskId, taskType: 'sora2', apiKeyId });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['sora2-image']);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/veo3/1080p/:taskId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const index = parseInt(req.query.index as string) || 0;
    const apiKey = await getActiveApiKey();
    const response = await fetch(`${KIE_API_BASE}/veo/get-1080p-video?taskId=${taskId}&index=${index}`, { method: 'GET', headers: { 'Authorization': `Bearer ${apiKey}` } });
    const result = await response.json();
    if (result.code === 200) res.json({ success: true, videoUrl: result.data, message: 'Video 1080P ready' });
    else res.json({ success: false, message: result.msg || 'Video 1080P not ready' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/suno', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userCheck = await pool.query('SELECT is_pro FROM users WHERE id = $1', [req.userId]);
    if (!userCheck.rows[0]?.is_pro) return res.status(403).json({ error: 'Tính năng này chỉ dành cho tài khoản Pro.' });
    const { prompt, songDescription, customMode = false, instrumental = false, model = 'V4', style, title, negativeTags, vocalGender, apiKeyId } = req.body;
    const payload: any = { model, customMode, instrumental, prompt: customMode ? (prompt || '') : (songDescription || ''), callBackUrl: 'https://example.com/callback' };
    if (customMode) { payload.title = title || ''; payload.style = style || ''; if (vocalGender) payload.vocalGender = vocalGender; }
    if (negativeTags) payload.negativeTags = negativeTags;
    const result = await callKieApi('/generate', payload, apiKeyId);
    res.json({ taskId: result.data?.taskId, taskType: 'suno', apiKeyId });
  } catch (error: any) {
    await refundCredits(req.userId!, MODEL_CREDITS['suno']);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/task/:taskType/:taskId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { taskType, taskId } = req.params;
    const apiKeyId = req.query.apiKeyId ? parseInt(req.query.apiKeyId as string) : undefined;
    const result = await checkTaskStatus(taskId, taskType, apiKeyId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin auth middleware
function adminAuthMiddleware(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.admin_token;
  if (!token) return res.status(401).json({ error: 'Admin access required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid admin token' });
  }
}

function generateAdminToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
}

app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const result = await pool.query("SELECT setting_value FROM admin_settings WHERE setting_key = 'admin_password'");
    const adminPass = result.rows[0]?.setting_value || 'admin123';
    if (password === adminPass) {
      const token = generateAdminToken();
      res.cookie('admin_token', token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
      res.json({ success: true, token });
    } else res.status(401).json({ error: 'Invalid password' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/api-keys', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM api_keys ORDER BY id ASC');
    const maskedKeys = result.rows.map(key => ({ ...key, key_value: key.key_value.substring(0, 8) + '...' + key.key_value.substring(key.key_value.length - 4) }));
    res.json(maskedKeys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/api-keys', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, key_value } = req.body;
    await pool.query('INSERT INTO api_keys (name, key_value) VALUES ($1, $2)', [name, key_value]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/api-keys/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM api_keys WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/api-keys/:id/refresh', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const credits = await apiKeyManager.refreshApiKey(parseInt(req.params.id));
    res.json({ success: true, credits });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/api-keys/:id/set-current', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    await apiKeyManager.setCurrentApiKey(parseInt(req.params.id));
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
    await apiKeyManager.markAlertAsRead(parseInt(req.params.id));
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
    const maskedKeys = keys.map(key => ({ ...key, api_key: key.key_value.length > 12 ? key.key_value.substring(0, 8) + '...' + key.key_value.substring(key.key_value.length - 4) : '****' }));
    res.json({ success: true, keys: maskedKeys });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await hashPassword(password);
    const result = await pool.query('INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name', [email, passwordHash, name || null]);
    const user = result.rows[0];
    const token = generateToken(user.id);
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const user = result.rows[0];
    if (!(await verifyPassword(password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
    const token = generateToken(user.id);
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT id, email, name, credits, is_pro FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (e) {
    console.error('Failed to start server:', e);
    process.exit(1);
  }
}

start();
