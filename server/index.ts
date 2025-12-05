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
      endpoint = `/mj/record-info?taskId=${taskId}`;
      break;
    case 'playground':
      endpoint = `/playground/recordInfo?taskId=${taskId}`;
      break;
    case 'seedream':
      endpoint = `/seedream/recordInfo?taskId=${taskId}`;
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
    if (result.status === 'successful') {
      return {
        status: 'completed',
        imageUrl: result.result?.image_urls?.[0],
        images: result.result?.image_urls,
      };
    } else if (result.status === 'failed') {
      return {
        status: 'failed',
        error: result.error || 'Generation failed',
      };
    } else {
      return {
        status: 'processing',
        progress: result.progress,
      };
    }
  }
  
  if (result.code !== 200) {
    const errorMsg = result.msg || result.message || result.error || 'Failed to check task status';
    console.error(`API Error: ${errorMsg}`, result);
    throw new Error(errorMsg);
  }

  const data = result.data;
  
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
