# Flaton - AI Tools Web App

## Overview
A web application providing AI tools powered by Flaton AI. Users can generate images, videos, and music using various AI models.

## Project Structure
```
├── server/           # Express backend
│   └── index.ts      # API routes for Flaton AI integration
├── client/           # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── App.tsx       # Main app with routing
│   │   └── main.tsx      # Entry point
│   └── index.html
├── package.json
└── tsconfig.json
```

## Available AI Tools

### Image Generation
- **FLUX Schnell** (3 credits) - Ultra-fast 1-4 step generation (WaveSpeed)
- **Flaton Image V1** (4 credits) - Fast high-quality images
- **FLUX Dev** (5 credits) - High quality 12B parameter model (WaveSpeed)
- **Flaton Image V2** (6.5 credits) - 4K images with cinematic style
- **Flaton Image Pro** (8 credits) - Artistic style images with 4 variants

### Video Generation
- **Flaton Video X (Text)** (20 credits) - Text to Video
- **Flaton Video X (Image)** (20 credits) - Image to Video
- **WAN 2.2 T2V 720p** (30 credits) - Text to Video HD (WaveSpeed)
- **WAN 2.2 I2V 720p** (35 credits) - Image to Video HD (WaveSpeed)
- **Flaton Video Pro** (40 credits) - Image to 5s video
- **Flaton Video V1** (60 credits) - Fast 720P video with audio
- **Flaton Video V2** (100 credits) - High quality video

### Music Generation
- **Flaton Music V1** - Fast, stable
- **Flaton Music V1.5** - Higher quality
- **Flaton Music V2** - Latest

### VBA Document Generator
- Chat với AI để tạo mã VBA macro
- Hỗ trợ xuất file Word (.docx), Excel (.xlsx), PowerPoint (.pptx)
- Sử dụng Google Gemini API (miễn phí)

## Environment Variables
- `KIE_API_KEY` - Required: API key from kie.ai
- `WAVESPEED_API_KEY` - Required for WaveSpeed models (FLUX, WAN): API key from https://wavespeed.ai/accesskey
- `GEMINI_API_KEY` - Required for VBA Generator: API key from Google AI Studio (https://aistudio.google.com)

## API Endpoints

### Backend Routes
- `POST /api/generate/nano-banana` - Generate image with Nano Banana
- `POST /api/generate/seedream` - Generate image with Seedream 4.5
- `POST /api/generate/midjourney` - Generate image with Midjourney
- `POST /api/generate/flux-schnell` - Generate image with FLUX Schnell (WaveSpeed)
- `POST /api/generate/flux-dev` - Generate image with FLUX Dev (WaveSpeed)
- `POST /api/generate/veo3-fast` - Generate video with Veo 3 Fast
- `POST /api/generate/midjourney-video` - Generate video from image
- `POST /api/generate/wan-t2v-720p` - Generate video from text (WaveSpeed WAN 2.2)
- `POST /api/generate/wan-i2v-720p` - Generate video from image (WaveSpeed WAN 2.2)
- `GET /api/task/:taskType/:taskId` - Check task status
- `GET /api/credits` - Get remaining credits
- `GET /api/health` - Health check
- `POST /api/vba/generate` - Generate VBA code with Gemini AI
- `POST /api/vba/chat` - Chat with AI about VBA
- `POST /api/vba/download` - Download VBA code as Office document

## Development
- Frontend runs on port 5000 (Vite)
- Backend runs on port 3001 (Express)
- API calls are proxied from frontend to backend

## Deployment to Render

### Quick Start
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `POSTGRES_URL` = Your PostgreSQL connection string
   - `JWT_SECRET` = Your secret key
   - `KIE_API_KEY` = Your KIE API key
   - `RENDER_EXTERNAL_URL` = URL của app (vd: https://your-app.onrender.com)
   - **Lưu ý:** KHÔNG set PORT - Render tự động cung cấp

### Anti-Spindown Feature
Server tự động ping chính nó mỗi 14 phút để ngăn Render tắt instance do không hoạt động.
Chỉ cần set `RENDER_EXTERNAL_URL` để kích hoạt tính năng này.

### Using render.yaml (Blueprint)
Alternatively, use the included `render.yaml` file for automatic configuration.

## Tech Stack
- Frontend: React 19, React Router, Tailwind CSS v4, Lucide Icons
- Backend: Express 5, TypeScript
- Build: Vite 7, TSX

## KIE AI API Integration
Uses the official KIE AI API endpoints:
- `/api/v1/playground/createTask` - For Nano Banana (Google Gemini)
- `/api/v1/playground/recordInfo` - Poll Nano Banana task status
- `/api/v1/seedream/createTask` - For Seedream 4.5 (ByteDance)
- `/api/v1/seedream/recordInfo` - Poll Seedream task status
- `/api/v1/mj/txt2img` - For Midjourney text-to-image
- `/api/v1/mj/img2video` - For Midjourney image-to-video
- `/api/v1/mj/record-info` - Poll Midjourney task status
- `/api/v1/veo/generate` - For Veo 3 video generation
- `/api/v1/veo/record-info` - Poll Veo 3 task status
- `/api/v1/jobs/createTask` - For Grok Imagenia
- `/api/v1/jobs/recordInfo` - Poll Grok task status

## Recent Changes (Dec 2024)
- Integrated WaveSpeed.ai API for additional AI models:
  - FLUX Schnell (3 credits) - Ultra-fast image generation
  - FLUX Dev (5 credits) - High quality 12B parameter image model
  - WAN 2.2 T2V 720p (30 credits) - Text to Video HD
  - WAN 2.2 I2V 720p (35 credits) - Image to Video HD
- Added VBA Document Generator feature with Google Gemini AI integration
  - Chat interface to generate VBA macro code
  - Download as Word, Excel, or PowerPoint files
  - Supports quick code generation and conversational mode
- Fixed Midjourney image generation endpoint (changed from /mj/imagine to /mj/txt2img)
- Fixed Midjourney video generation endpoint with proper taskType parameter
- Implemented robust multi-layer fallback parsing for all response types:
  - Images: resultInfoJson → response.result_urls → resultUrls
  - Videos: videos array → resultInfoJson → response.result_urls → resultUrls
- Added comprehensive handling for both successFlag-based and status-based API responses
- Updated frontend to dynamically use taskType from server responses for polling
- Ensured URL extraction works across all provider response format variations

## WaveSpeed API Integration
Uses WaveSpeed.ai REST API endpoints:
- Base URL: `https://api.wavespeed.ai/api/v3`
- Authentication: Bearer token (WAVESPEED_API_KEY)
- `/wavespeed-ai/flux-schnell` - FLUX Schnell image generation
- `/wavespeed-ai/flux-dev` - FLUX Dev image generation
- `/wavespeed-ai/wan-2.2/t2v-720p` - WAN 2.2 Text to Video
- `/wavespeed-ai/wan-2.2/i2v-720p` - WAN 2.2 Image to Video
- `/predictions/{taskId}/result` - Poll task status
