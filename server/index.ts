import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const KIE_API_BASE = 'https://api.kie.ai/api/v1';

async function callKieApi(endpoint: string, data: any) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error('KIE_API_KEY not configured');
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
    throw new Error(errorMsg);
  }

  return result;
}

async function checkTaskStatus(taskId: string, taskType: string) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error('KIE_API_KEY not configured');
  }

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
      endpoint = `/music/record-info?taskId=${taskId}`;
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
    if (data.state === 'complete' || data.state === 'success') {
      let audioUrls: string[] = [];
      if (data.resultJson) {
        try {
          const resultData = JSON.parse(data.resultJson);
          audioUrls = resultData.resultUrls || resultData.audioUrls || [];
        } catch (e) {
          console.error('Failed to parse Suno resultJson:', e);
        }
      }
      return {
        status: 'completed',
        audioUrl: audioUrls[0],
        audioUrls: audioUrls,
        title: data.title,
      };
    } else if (data.state === 'failed') {
      return {
        status: 'failed',
        error: data.failMsg || 'Music generation failed',
      };
    } else {
      return {
        status: 'processing',
        progress: data.state, // text, first, complete stages
      };
    }
  }

  if (data.successFlag === 1) {
    if (taskType === 'veo3') {
      let videoUrl = null;
      if (data.resultUrls) {
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

app.post('/api/generate/nano-banana', async (req: Request, res: Response) => {
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
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/seedream', async (req: Request, res: Response) => {
  try {
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

app.post('/api/generate/midjourney', async (req: Request, res: Response) => {
  try {
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

app.post('/api/generate/veo3-fast', async (req: Request, res: Response) => {
  try {
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
app.post('/api/generate/veo3', async (req: Request, res: Response) => {
  try {
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
app.get('/api/veo3/1080p/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const index = parseInt(req.query.index as string) || 0;
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      throw new Error('KIE_API_KEY not configured');
    }

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

app.post('/api/generate/midjourney-video', async (req: Request, res: Response) => {
  try {
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

// Grok Imagenia - Image to Video
app.post('/api/generate/grok-i2v', async (req: Request, res: Response) => {
  try {
    const { imageUrl, prompt, mode = 'normal' } = req.body;
    const result = await callKieApi('/jobs/createTask', {
      model: 'grok-imagine/image-to-video',
      input: {
        image_urls: [imageUrl],
        prompt,
        mode,
      },
    });
    res.json({ taskId: result.data?.taskId, taskType: 'grok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Grok Imagenia - Text to Video
app.post('/api/generate/grok-t2v', async (req: Request, res: Response) => {
  try {
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
app.post('/api/generate/suno', async (req: Request, res: Response) => {
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
    
    const payload: any = {
      model,
      customMode,
      instrumental,
      prompt: prompt || '',
      songDescription: songDescription || '',
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

app.get('/api/task/:taskType/:taskId', async (req: Request, res: Response) => {
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
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      throw new Error('KIE_API_KEY not configured');
    }

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

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', apiKeyConfigured: !!process.env.KIE_API_KEY });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
