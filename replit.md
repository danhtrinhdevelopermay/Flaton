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
- **Nano Banana** (4 credits) - Google DeepMind - 2K/4K images
- **Seedream 4.5** (3.5 credits) - ByteDance - 4K images
- **Midjourney** (8 credits) - Artistic style images

### Video Generation
- **Veo 3 Fast** (60 credits) - Google DeepMind - 8s video with audio
- **Midjourney Video** (40 credits) - Image to 5s video

## Environment Variables
- `KIE_API_KEY` - Required: API key from kie.ai

## Development
- Frontend runs on port 5000 (Vite)
- Backend runs on port 3001 (Express)
- API calls are proxied from frontend to backend

## Tech Stack
- Frontend: React 19, React Router, Tailwind CSS, Lucide Icons
- Backend: Express, TypeScript
- Build: Vite, TSX
