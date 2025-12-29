# Flaton - AI Tools & Automated Lesson Builder

## Overview
A comprehensive web application providing AI tools powered by Flaton AI and an automated lesson builder system. Users can generate images, videos, and music using various AI models, and create automated educational lessons with AI-generated content.

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
- **Sora 2 Text** (80 credits) - Text to HD video, 10-15s duration
- **Sora 2 Image** (85 credits) - Image to HD video, 10-15s duration

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
- `POST /api/generate/sora2-text` - Generate video with Sora 2 Text
- `POST /api/generate/sora2-image` - Generate video from image with Sora 2
- `GET /api/task/:taskType/:taskId` - Check task status
- `GET /api/credits` - Get remaining credits
- `GET /api/health` - Health check

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
- `/api/v1/jobs/createTask` - For Grok Imagenia, Seedream, Sora 2
- `/api/v1/jobs/recordInfo` - Poll Grok, Seedream, Sora 2 task status

## Recent Changes (Dec 29, 2025)

### UI Improvements & Theme Consistency (Complete)
- **Navbar Styling**: Fixed header navbar to support light/dark theme properly:
  - Light mode: White background with backdrop blur and slate border
  - Dark mode: Glass morphism with indigo shadow
- **Menu & Buttons**: Updated all navigation and button elements for theme consistency:
  - Theme toggle button with proper light/dark colors
  - User menu button and dropdown with theme-aware styling
  - Login/Register buttons with proper light mode colors
- **Navigation Modal**: Fixed full-screen menu to display white background in light mode, black in dark mode
- **Footer**: Added theme-aware styling for footer background
- **Overall Consistency**: All navbar and menu elements now have matching light/dark theme colors
- **Menu Cleanup**: Removed "Bài Giảng" (Lessons) from main navigation menu and user dropdown menu
- **Removed**: Deleted LessonBuilderPage component and `/lesson-builder` route from App.tsx
- **Page Theme Fixes**: 
  - Fixed light/dark theme styling in ExplorerPage and PowerPointGeneratorPage
  - Fixed HomePage with comprehensive theme support:
    - Hero section text colors (light/dark)
    - Feature cards with theme-aware backgrounds (white borders in light mode)
    - Tool cards with dynamic styling
    - Buttons with light/dark mode colors
    - All text content with proper contrast for both themes
    - CTA section with theme-aware container styling

## Previous Changes (Dec 24, 2025)

### Workflow Builder System (FIXED)
- **Fixed Database Schema**: lesson_id now uses BIGINT to match lessons.id type
- Workflows can now be saved and executed successfully
- All 4 step types fully operational

### Workflow Builder System (NEW)
- **Custom Workflow Creation**: Teachers can create automated workflows with up to 4 types of steps:
  - **Word Document** - Export teaching script to .docx format
  - **Flaton Image V1** - Generate images using kie.ai API
  - **Flaton Video V1** - Generate videos using kie.ai API  
  - **PowerPoint** - Auto-generate & execute Python code using Gemini + python-pptx
- **Workflow Execution**: Teachers can save workflows and execute them with one click
- **Auto-Execution for PowerPoint**: System automatically:
  1. Prompts Gemini to generate python-pptx code
  2. Writes code to temp file
  3. Executes Python code to generate .pptx file
  4. Returns success/error status
- **UI Integration**: Added "Quy trình" tab in lesson detail page with:
  - WorkflowBuilder component for creating custom workflows
  - List of saved workflows with Execute/Delete buttons
  - Flaton API key input for image/video generation
- **Backend Endpoints**:
  - `POST /api/lessons/:id/workflows/save` - Save new workflow
  - `POST /api/lessons/:id/workflows/execute` - Execute workflow steps
  - `DELETE /api/workflows/:id` - Delete workflow

### Content Generation Endpoints
- `POST /api/lessons/:id/generate-word` - Create Word document from script
- `POST /api/lessons/:id/generate-video` - Generate video via Flaton Video V1
- `POST /api/lessons/:id/generate-images` - Generate images via Flaton Image V1
- `POST /api/lessons/:id/generate-powerpoint` - Generate PowerPoint presentation

### AI Tools Updates
- Added Sora 2 Text-to-Video and Image-to-Video models
- Fixed Seedream endpoint (changed from /seedream/recordInfo to /jobs/recordInfo)
- Increased MAX_CREDITS to 100 to support higher-cost models
- Fixed Midjourney image generation endpoint (changed from /mj/imagine to /mj/txt2img)
- Fixed Midjourney video generation endpoint with proper taskType parameter
- Implemented robust multi-layer fallback parsing for all response types
- Updated frontend to dynamically use taskType from server responses for polling

### Explorer Feature
- Added public Explorer page to showcase user-shared AI-generated content
- Implemented swipeable carousel interface for browsing content
- Added "Publish to Public" buttons in History pages (images, videos, music)
- Database schema includes `is_public` flag for all content types
- API endpoints: `/api/products/explore`, `/api/products/publish`

### Automated Lesson Builder System (NEW)
- **Lesson Creation**: Multi-step form to create lessons with objectives, teaching style
- **AI-Powered Content Generation**: Gemini AI integration for:
  - Auto-generating lesson scripts from topics and objectives
  - Auto-generating slide content from scripts
  - Image prompt suggestions for visual aids
- **Database Schema** for lessons system:
  - `lessons` - Core lesson metadata
  - `workflows` - Automated workflow definitions
  - `workflow_steps` - Individual steps in workflows
  - `schedules` - Scheduling for automated execution
  - `lesson_content` - Various content types (scripts, slides, etc)
  - `lesson_assets` - Media assets (images, videos, PDFs)
  - `lesson_approvals` - Content review & approval status
- **Frontend Pages**:
  - `/lesson-builder` - Create new lessons step-by-step
  - `/lessons` - View all lessons with status
  - `/lessons/:id` - Edit lesson, generate script/slides, manage workflows
- **API Endpoints**:
  - `POST /api/lessons` - Create lesson
  - `GET /api/lessons` - List user's lessons
  - `GET /api/lessons/:id` - Get lesson details
  - `POST /api/lessons/:id/generate-script` - Generate script from Gemini
  - `POST /api/lessons/:id/generate-slides` - Generate slides from script
  - `POST /api/workflows` - Create lesson workflow
  - `GET /api/lessons/:id/workflows` - Get workflows for lesson

### Gemini AI Integration
- Uses Replit AI Integrations (no separate API key needed)
- Models: gemini-2.5-flash for chat/generation
- Batch processing utilities for rate limiting & retries
- Modular chat, image, and batch utilities
