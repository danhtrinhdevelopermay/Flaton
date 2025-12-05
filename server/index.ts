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

  const response = await fetch(`${KIE_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (result.code !== 200) {
    throw new Error(result.msg || 'API request failed');
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
      endpoint = `/mj/record-info?taskId=${taskId}`;
      break;
    case 'jobs':
      endpoint = `/jobs/queryTask?taskId=${taskId}`;
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
  
  if (result.code !== 200) {
    throw new Error(result.msg || 'Failed to check task status');
  }

  const data = result.data;
  
  if (taskType === 'jobs') {
    if (data.state === 'success' || data.state === 'completed') {
      return {
        status: 'completed',
        imageUrl: data.output?.image_url || data.output?.url,
        images: data.output?.images || (data.output?.image_url ? [data.output.image_url] : null),
      };
    } else if (data.state === 'failed') {
      return {
        status: 'failed',
        error: data.error || 'Generation failed',
      };
    } else {
      return {
        status: 'processing',
        progress: data.progress,
      };
    }
  }
  
  if (data.successFlag === 1) {
    if (taskType === 'veo3') {
      return {
        status: 'completed',
        videoUrl: data.resultUrls ? JSON.parse(data.resultUrls)[0] : null,
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
    const result = await callKieApi('/jobs/createTask', {
      model: 'google/nano-banana',
      input: {
        prompt,
        image_size: aspectRatio,
        output_format: 'png',
      },
    });
    res.json({ taskId: result.data.taskId, taskType: 'jobs' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/seedream', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    const result = await callKieApi('/jobs/createTask', {
      model: 'seedream/4.5-text-to-image',
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        quality: 'basic',
      },
    });
    res.json({ taskId: result.data.taskId, taskType: 'jobs' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/midjourney', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    const result = await callKieApi('/mj/imagine', {
      prompt,
      aspect: aspectRatio,
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

app.post('/api/generate/midjourney-video', async (req: Request, res: Response) => {
  try {
    const { imageUrl, prompt } = req.body;
    const result = await callKieApi('/mj/img2video', {
      imageUrl,
      prompt,
    });
    res.json({ taskId: result.data.taskId, taskType: 'midjourney' });
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
