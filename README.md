# CV-Wiz: Career Resume Compiler

A full-stack application for generating tailored resumes and cover letters based on job descriptions using AI.

## Tech Stack

### Frontend (Next.js 15)
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js v5 (Google OAuth + Email/Password)
- **Database ORM:** Prisma

### Backend (Python FastAPI)
- **Framework:** FastAPI
- **PDF Generation:** WeasyPrint
- **LLM Integration:** Groq API
- **Caching:** Redis (Upstash)

### Chrome Extension
- **Manifest Version:** 3
- **Content Scripts:** Job description extraction
- **Popup UI:** Resume/Cover letter generation

### Database
- **Primary:** PostgreSQL (Neon)
- **Cache:** Redis (Upstash)

## Project Structure

```
cv-wiz/
├── frontend/                 # Next.js 15 App
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── (auth)/       # Login, Register
│   │   │   ├── (protected)/  # Profile, Templates
│   │   │   └── api/          # API routes
│   │   └── components/       # React components
│   ├── lib/                  # Utilities (auth, prisma)
│   ├── types/                # TypeScript types
│   └── prisma/               # Database schema
│
├── backend/                  # Python FastAPI
│   └── app/
│       ├── models/           # Pydantic models
│       ├── services/         # Business logic
│       ├── routers/          # API endpoints
│       ├── utils/            # Helpers
│       └── middleware/       # Auth middleware
│
└── extension/                # Chrome Extension (MV3)
    ├── background/           # Service worker
    ├── content/              # Content scripts
    └── popup/                # Popup UI
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or Neon account)
- Redis (or Upstash account)
- Groq API key

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Groq
GROQ_API_KEY=...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Frontend Setup

```bash
cd frontend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Chrome Extension

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` directory

## API Endpoints

### Frontend (Next.js)
- `POST /api/auth/register` - User registration
- `GET/PUT /api/profile` - User profile
- `CRUD /api/profile/experiences` - Work experiences
- `CRUD /api/profile/projects` - Projects
- `CRUD /api/profile/skills` - Skills
- `CRUD /api/profile/educations` - Education
- `GET/PUT /api/profile/settings` - User settings

### Backend (FastAPI)
- `POST /api/compile` - Generate tailored resume PDF
- `POST /api/compile/pdf` - Direct PDF download
- `POST /api/cover-letter` - Generate cover letter
- `GET /api/templates` - Available templates

## Features

- **Profile Management:** Store complete career data (experiences, projects, skills, education)
- **Multiple Templates:** Choose from 4 resume layouts
- **Relevance Scoring:** AI matches your experience to job requirements
- **ATS-Friendly PDFs:** Clean formatting that passes applicant tracking systems
- **No Hallucination:** Cover letters use ONLY your actual profile data
- **Browser Extension:** Extract job descriptions from LinkedIn, Indeed, Glassdoor, etc.
- **Caching:** Repeated requests are cached for performance

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Chrome Extension│───▶│  FastAPI Backend │───▶│   Groq LLM API  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                      │
        │                      ▼
        │              ┌─────────────────┐
        │              │  Redis Cache    │
        │              └─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐
│ Next.js Frontend│───▶│   PostgreSQL    │
└─────────────────┘    └─────────────────┘
```

## License

MIT
