<div align="center">

# CV-Wiz

*"The future depends on what you do today."* — Mahatma Gandhi

The modern career compiler. Turn job descriptions into opportunities with AI-driven tailoring.

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Groq](https://img.shields.io/badge/Powered%20by-Groq-orange?style=flat-square)](https://groq.com/)

---

Most job seekers spend hours manually tweaking their resumes for every application. They guess which keywords matter, struggle with formatting, and eventually settle for a generic version that fails to stand out.

**CV-Wiz** changes the game. It is not just a resume builder; it is a compilation engine. By matching your professional profile against specific job descriptions in real-time, it generates high-impact, tailored artifacts that speak directly to what hiring managers are looking for.

</div>

---

## Components

| Component | Stack | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15, Prisma, NextAuth | The command center for your professional profile and template management. |
| **Backend** | FastAPI, WeasyPrint, Groq | The intelligence layer that scores relevance and generates ATS-optimized PDFs. |
| **Extension** | Manifest V3, Content Scripts | The bridge that extracts job descriptions directly from LinkedIn, Indeed, and more. |

---

## What It Actually Does

The workflow is designed for maximum speed and minimum friction.

First, the **Chrome Extension** identifies a job description on your screen. With one click, it extracts the requirements, responsibilities, and key technologies, sending them to the processing engine.

Second, the **Backend Engine** performs a deep analysis. It compares your stored experiences, projects, and skills against the job's needs. It doesn't just look for keywords; it calculates relevance scores to determine which parts of your history will have the most impact.

Third, it generates a **Tailored PDF**. Using standard professional templates and WeasyPrint, it produces a clean, readable resume that handles the heavy lifting of formatting while ensuring your most relevant achievements are front and center.

## The Engine

The intelligence behind CV-Wiz is built on three core pillars:

**Relevance Scoring** ensures you never lead with the wrong story. The AI evaluates every experience and project, suggesting the optimal order based on the specific job description.

**Zero Hallucination** is our promise. Unlike generic LLM tools that might invent history to fit a role, CV-Wiz is strictly constrained to your actual validated data. It rephrases and highlights, but it never invents.

**ATS Optimization** keeps your resume in the "Yes" pile. By avoiding complex tables, images, and non-standard fonts, the generated PDFs are fully readable by Applicant Tracking Systems while remaining visually polished for human eyes.

## Philosophy

*"Simplicity is the ultimate sophistication."* — Leonardo da Vinci

We believe that professional storytelling shouldn't be a chore. CV-Wiz is built on the idea that your past achievements are the raw code, and a job description is the target architecture. Our job is to compile one into the other.

No unwanted emojis. No generic templates. No setup complexity for the end user. Just a direct path from "Job Found" to "Application Sent."

## Technical Approach

The system is architected for low latency and high reliability:

- **Next.js 15** provides a reactive, modern interface for managing complex profile data.
- **FastAPI** handles the intensive scoring and PDF generation tasks with asynchronous performance.
- **Groq LPU Inference** allows for near-instant resume tailoring and cover letter generation.
- **Redis (Upstash)** caches scoring results to ensure that repeated adjustments don't cost time or tokens.

## Looking Ahead

We are building the future of career management. Upcoming updates include deeper integrations with company research tools, automated portfolio generation, and an even wider range of industry-standard professional templates.

*"Excellence is not a destination; it is a continuous journey that never ends."* — Brian Tracy

---

MIT License
