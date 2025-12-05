# KIE AI Tools - Web App

## Overview
A web application providing AI tools powered by the KIE AI API. Users can generate images and videos using various AI models that cost ≤80 credits.

## Project Structure
```
├── server/           # Express backend
│   └── index.ts      # API routes for KIE AI integration
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

## Available AI Tools (≤80 credits)

### Image Generation
- **Nano Banana** (4 credits) - Google Gemini 2.5 Flash - Fast high-quality images
- **Seedream 4.5** (6.5 credits) - ByteDance - 4K images with cinematic style
- **Midjourney** (8 credits) - Artistic style images with 4 variants

### Video Generation
- **Veo 3 Fast** (60 credits) - Google DeepMind - 8s video with audio
- **Midjourney Video** (40 credits) - Image to 5s video

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
- `/api/v1/jobs/createTask` - For Nano Banana and Seedream
- `/api/v1/jobs/queryTask` - Poll task status for jobs
- `/api/v1/veo/generate` - For Veo 3 video generation
- `/api/v1/veo/record-info` - Poll Veo 3 task status
- `/api/v1/mj/imagine` - For Midjourney images
- `/api/v1/mj/record-info` - Poll Midjourney task status
