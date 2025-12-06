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
- **Flaton Image V1** (4 credits) - Fast high-quality images
- **Flaton Image V2** (6.5 credits) - 4K images with cinematic style
- **Flaton Image Pro** (8 credits) - Artistic style images with 4 variants

### Video Generation
- **Flaton Video V1** (60 credits) - Fast 720P video with audio
- **Flaton Video V2** (100 credits) - High quality video
- **Flaton Video X** (20 credits) - Text/Image to video
- **Flaton Video Pro** (40 credits) - Image to 5s video

### Music Generation
- **Flaton Music V1** - Fast, stable
- **Flaton Music V1.5** - Higher quality
- **Flaton Music V2** - Latest

## Environment Variables
- `KIE_API_KEY` - Required: API key from kie.ai

## API Endpoints

### Backend Routes
- `POST /api/generate/nano-banana` - Generate image with Nano Banana
- `POST /api/generate/seedream` - Generate image with Seedream 4.5
- `POST /api/generate/midjourney` - Generate image with Midjourney
- `POST /api/generate/veo3-fast` - Generate video with Veo 3 Fast
- `POST /api/generate/midjourney-video` - Generate video from image
- `GET /api/task/:taskType/:taskId` - Check task status
- `GET /api/credits` - Get remaining credits
- `GET /api/health` - Health check

## Development
- Frontend runs on port 5000 (Vite)
- Backend runs on port 3001 (Express)
- API calls are proxied from frontend to backend

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
- Fixed Midjourney image generation endpoint (changed from /mj/imagine to /mj/txt2img)
- Fixed Midjourney video generation endpoint with proper taskType parameter
- Implemented robust multi-layer fallback parsing for all response types:
  - Images: resultInfoJson → response.result_urls → resultUrls
  - Videos: videos array → resultInfoJson → response.result_urls → resultUrls
- Added comprehensive handling for both successFlag-based and status-based API responses
- Updated frontend to dynamically use taskType from server responses for polling
- Ensured URL extraction works across all provider response format variations
