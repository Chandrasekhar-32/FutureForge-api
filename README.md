# FutureForge AI

**Complete career guidance for every student — whatever they want to become.**

FutureForge AI is a full career operating system for students: discover paths (tech, sports, healthcare, business, creative, and more), build personalized month-by-month roadmaps for **any career they type**, analyze resumes, practice interviews, chat with an AI coach, and track progress on one dashboard.

![Stack](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green) ![Gemini](https://img.shields.io/badge/Google-Gemini-blue)

## Features

| Feature | Description |
|---------|-------------|
| **Career Assessment** | 25-question quiz with radar chart and top career matches |
| **AI Career Coach** | Chat interface powered by Google Gemini |
| **Career Explorer** | 10+ detailed careers with compare mode |
| **Resume Analyzer** | PDF upload, ATS score, strengths/gaps |
| **Interview Coach** | Role-based questions with AI scoring |
| **Roadmap Generator** | Month-by-month plans with progress tracking |
| **Dashboard** | Stats, Chart.js visualizations |
| **Job Search** | Adzuna API integration + demo fallback |
| **Auth** | Email/password + demo Google login |

## Quick Start

```bash
cd futureforge-ai
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5000**

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Recommended | [Google AI Studio](https://aistudio.google.com/apikey) for coach, resume, interview |
| `MONGODB_URI` | Optional | Persistent data; without it, auth uses in-memory storage |
| `JWT_SECRET` | Production | Sign auth tokens |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Optional | Live job search |

## Project Structure

```
futureforge-ai/
├── frontend/          # HTML, CSS, JS (served by Express)
├── backend/           # Express API, Mongoose models, Gemini services
├── database/          # Seed JSON (careers, roadmaps, interviews)
└── package.json
```

## API Overview

- `POST /api/auth/register` · `POST /api/auth/login`
- `GET /api/careers` · `GET /api/careers/compare?a=&b=`
- `POST /api/assessment/submit`
- `GET /api/roadmap/:careerId` · `POST /api/roadmap/progress`
- `POST /api/resume/analyze` (multipart PDF)
- `POST /api/interview/generate` · `POST /api/interview/answer`
- `POST /api/chat/message`
- `GET /api/jobs/search`
- `GET /api/dashboard/stats`

## Deployment

| Layer | Suggested platform |
|-------|-------------------|
| Full stack (static + API) | **Render** (Web Service) |
| Frontend only | **Vercel** (point API to Render URL) |
| Database | **MongoDB Atlas** |

1. Deploy backend to Render with `npm start` and env vars.
2. Set `CLIENT_URL` to your frontend URL for CORS if split.
3. Connect MongoDB Atlas and add `MONGODB_URI`.

## Resume / Portfolio Talking Points

- Full-stack architecture with REST API and JWT auth
- AI integration (Gemini) with graceful fallbacks
- Product design: dashboard, assessment, coach UX
- Data modeling: User, Assessment, Resume, Interview, Chat
- Real-world APIs (Adzuna jobs) with demo mode
- Chart.js analytics and PDF resume parsing

## License

MIT
