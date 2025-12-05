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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function checkTaskStatus(taskId: string, taskType: string) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error('KIE_API_KEY not configured');
  }

  let endpoint = '';
  switch (taskType) {
    case 'veo3':
      endpoint = `/veo3/record-detail?taskId=${taskId}`;
      break;
    case 'midjourney':
      endpoint = `/mj/record-detail?taskId=${taskId}`;
      break;
    case 'seedream':
      endpoint = `/seedream/record-detail?taskId=${taskId}`;
      break;
    case 'nano-banana':
      endpoint = `/nano-banana/record-detail?taskId=${taskId}`;
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

app.post('/api/generate/nano-banana', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    const result = await callKieApi('/nano-banana/generate', {
      prompt,
      aspectRatio,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/seedream', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    const result = await callKieApi('/seedream/generate', {
      prompt,
      aspectRatio,
    });
    res.json(result);
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
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/veo3-fast', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '16:9', duration = 8 } = req.body;
    const result = await callKieApi('/veo3/generate', {
      prompt,
      aspectRatio,
      duration,
      mode: 'fast',
    });
    res.json(result);
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
    res.json(result);
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

    const response = await fetch(`${KIE_API_BASE}/account/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

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
