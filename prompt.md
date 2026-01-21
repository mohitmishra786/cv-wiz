# Career Resume Compiler - Development Plan

## Technology Stack

- **Frontend (Next.js with React/TypeScript):** We recommend **Next.js** for the user-facing web app (profile editor, schema selector, etc.). Next.js is built for complex, dynamic applications and provides built-in routing, server-side rendering, and API routes[\[1\]](https://www.contentful.com/blog/astro-next-js-compared/#:~:text=If%20your%20project%20requires%20state,js%20is%20the%20clear%20choice). In contrast, Astro is optimized for mostly static content[\[2\]](https://www.contentful.com/blog/astro-next-js-compared/#:~:text=Just%20because%20something%20is%20newer,suitable%20for%20your%20specific%20project). Because our app requires stateful UI (profile forms, live schema preview) and server actions (sending data to backend), Next.js aligns better. Next.js on Vercel offers serverless API routes and automatic scaling[\[3\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=In%20a%20serverless%20architecture%2C%20you,on%20writing%20your%20application%20logic)[\[4\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=,API%20Routes%20and%20Server%20Actions), which fits our need for isolated, on-demand functions (e.g. resume compilation endpoints) without managing servers. We would use **NextAuth.js** (or Auth0) for Google OAuth and email/password sign-up within Next.js. For styling and UI, a modern component library (e.g. Tailwind CSS or Material UI) can ensure a minimalistic, responsive interface.
- **Backend (Python with FastAPI or Go with Fiber):** The core resume-compilation and LLM-invoking logic can be written in either Python or Go. Both are supported as Vercel serverless functions[\[5\]](https://vercel.com/docs/functions/runtimes/python#:~:text=The%20Python%20runtime%20is%20available,Beta%20%20on%20%20495)[\[6\]](https://vercel.com/docs/functions/runtimes/go#:~:text=Copy%20page). Python has a richer ecosystem for AI/LLM integration (easy use of requests, asyncio, ML libraries) and rapid development, making it attractive for a small team. Go offers high performance and strong concurrency, but its ML ecosystem is smaller. Given the heavy use of LLMs (Groq API) and text processing, **Python (e.g. FastAPI)** is a strong choice for maintainability and libraries. Go could be considered for performance-critical subcomponents (e.g. parsing) if needed. Either way, we design the backend in a **modular service style** - e.g. separate functions or modules for "Auth", "Profile Store", "Job Parsing", "Resume Compilation", and "Cover Letter Generation". These can be individual API routes on Vercel. Using serverless functions lets each endpoint scale and deploy independently[\[3\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=In%20a%20serverless%20architecture%2C%20you,on%20writing%20your%20application%20logic)[\[4\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=,API%20Routes%20and%20Server%20Actions).
- **Databases & Storage:**
- **Neon Postgres** - a serverless PostgreSQL instance - to store the user's canonical profile graph (tables for users, roles, projects, skills, education, publications, etc.). This relational store ensures no loss of data structure and supports complex queries (e.g. finding relevant experience by keywords).
- **Upstash Redis** - for a fast KV cache or ephemeral storage (e.g. caching recent resume compilations, storing job descriptions temporarily, or session tokens). Upstash provides a serverless Redis with simple pricing.
- **Blob/File Storage** - e.g. AWS S3 or Vercel's Edge Storage - for generated resume and cover letter files. When generating a PDF resume, we can upload it to blob storage and return a download link to the user (or serve directly through the extension). This keeps database storage minimal.
- **Browser Extension (Chrome Manifest v3):** The extension will be built as a WebExtension (initially Chrome, with a view to Firefox/Safari later). Key components:
- A **content script** injected into job pages to detect job postings and extract the job description text.
- A **background service worker** (per MV3 manifest) to coordinate actions, call backend APIs, and manage state.
- A **popup/UI** or in-page overlay for previewing the compiled resume and cover letter before applying.
- We will communicate between content scripts, background, and popup via Chrome's message-passing APIs[\[7\]](https://medium.com/@lucas.abgodoy/chrome-extension-development-with-clean-architecture-a-poc-22e861aa4ede#:~:text=At%20a%20glance%2C%20a%20chrome,of%20the%20following%20script%20components)[\[8\]](https://medium.com/@lucas.abgodoy/chrome-extension-development-with-clean-architecture-a-poc-22e861aa4ede#:~:text=The%20communication%20from%20one%20component,by%20a%20Message%20passing%20system). This aligns with best practices: content scripts handle DOM parsing, background scripts handle API calls/logic, and popups handle user interaction.
- We may use a framework (e.g. React with Vite or a lightweight framework) to build the extension UI, but it will follow MV3 rules (no long-running background page; use service workers, etc.).
- **LLM Layer (Groq API):** Use the Groq Cloud LLM API (OpenAI-compatible endpoint) for generating personalized cover letters and guiding resume content. Groq offers modern LLaMA-4-based models with a large context window[\[9\]](https://console.groq.com/docs/models#:~:text=Hosted%20models%20are%20directly%20accessible,list%20of%20all%20active%20models). We will design prompts carefully to minimize hallucination (e.g. explicitly quoting user's profile data and job description, constraining style). For example, the backend "Cover Letter" service will fetch the user's matched data and pass it to Groq's chat completion API[\[9\]](https://console.groq.com/docs/models#:~:text=Hosted%20models%20are%20directly%20accessible,list%20of%20all%20active%20models) with system instructions about tone/format. We might also fine-tune or prompt-control output to stay factual. _Note:_ Because LLMs can hallucinate, we rely on our structured data for facts and use the LLM only for natural language synthesis, validating important facts against the profile data where possible.
- **Authentication:** Implement using **NextAuth.js** (with Vercel/Next.js) for Google OAuth and email/password. NextAuth integrates smoothly with Next.js API routes and can use the database for storing user accounts. We ensure secure session cookies and role-based access (each user can only access their own profile and generated resumes).

## High-Level Architecture (Textual Diagram)

**Components and Data Flow:**

- **User Interface (Web App):** The Next.js frontend (hosted on Vercel) provides pages for signup/login, profile entry (roles/projects/skills/etc.), and schema selection. When the user updates their profile, the app calls backend APIs (e.g. /api/profile) which write to Postgres. The user can also select a resume template schema; this preference is stored (e.g. in Postgres).
- **Authentication Service:** Handled via NextAuth (JWT/cookies). The frontend uses OAuth or email flow to authenticate; NextAuth callbacks sign the user in and can store a user record in Postgres. All subsequent API calls include the user's session token or JWT to identify the user.
- **Data Storage (Postgres & Redis):** Postgres holds the canonical profile (normalized tables). Redis is used for caching hot data, e.g. storing the JSON of the last compiled resume for quick preview, caching frequent job keywords, or rate-limiting API calls.
- **Resume Compiler API (/api/compile):** A serverless backend endpoint. On request, it: (1) retrieves the logged-in user's profile from Postgres; (2) fetches the job description (provided by the extension content script); (3) applies a selection algorithm to pick relevant experience and skills constrained by the chosen template (e.g. use most relevant 3-5 items to fit one page, ensure ATS keyword match); (4) formats this into a resume document (e.g. Markdown or JSON intermediate); (5) calls a PDF generation library or service to create a 1-page PDF. This endpoint returns the generated PDF (or a blob URL). Key point: all resume content is drawn from the user's data - no new facts are hallucinated.
- **Cover Letter API (/api/cover-letter):** Another backend function. It takes the user's profile data and the job description, then invokes the Groq LLM (via its OpenAI-like API[\[9\]](https://console.groq.com/docs/models#:~:text=Hosted%20models%20are%20directly%20accessible,list%20of%20all%20active%20models)) with a prompt like: "Write a concise, one-page cover letter in a professional tone. Use this candidate's experience: \[structured data\]. The job is described as: \[job description\]. Be ATS-friendly and customize to the role." The response (text) is returned to the extension.
- **Browser Extension:**
- **Content Script** runs on job pages (detected by URL pattern or user action). It parses the DOM to extract the **Job Description** text (e.g. from a &lt;div class="job-description"&gt; or similar).
- The content script sends this JD text to the **background script** via chrome.runtime.sendMessage.
- The **Background Script** receives the message, then calls our backend APIs (/api/compile and /api/cover-letter) with the user's auth token (stored in extension or obtained via OAuth flow). These calls pass the JD.
- The backend returns the tailored resume PDF and cover letter text. The background then displays an interactive **Preview UI** (either as a popup window or injected overlay) showing the resume (e.g. embedded PDF viewer) and cover letter (text).
- The user reviews and clicks "Apply." The background script then attempts to **autofill** the job application form: for text inputs, it sets fields like "Cover Letter" or "Additional Info" with the generated letter. For file uploads (resume/CV), full automation isn't possible due to browser security[\[10\]](https://stackoverflow.com/questions/60707185/chrome-extension-is-it-possible-to-control-file-input-programatically#:~:text=0); instead, we can either prompt the user to attach the generated PDF (offering a one-click download), or use form POST with FormData (if the site's endpoint is known and open to CORS requests)[\[11\]](https://stackoverflow.com/questions/60707185/chrome-extension-is-it-possible-to-control-file-input-programatically#:~:text=What%20I%20have%20found%20though%2C,Works%20just%20fine). (We note that Chrome extensions cannot programmatically trigger the OS file picker[\[10\]](https://stackoverflow.com/questions/60707185/chrome-extension-is-it-possible-to-control-file-input-programatically#:~:text=0), so the final upload step may need a manual click or an alternative mechanism like remote submission if allowed.)
- Once completed, the extension can notify the user or navigate to the confirmation page.

This architecture isolates concerns into clear modules (auth, data, resume engine, cover-letter engine, extension UI) so each can be developed and tested independently. Using Vercel and serverless functions means we have no long-lived servers to manage. As one recent guide notes, Next.js's API Routes and serverless model allow deploying small, single-purpose endpoints that **"scale independently on demand"** and incur costs only when invoked[\[4\]\[12\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=,API%20Routes%20and%20Server%20Actions).

&lt;div&gt;**Key References:** In our extension, we follow Chrome's component model: a service worker background, content scripts, and popup UI communicate via message passing[\[7\]](https://medium.com/@lucas.abgodoy/chrome-extension-development-with-clean-architecture-a-poc-22e861aa4ede#:~:text=At%20a%20glance%2C%20a%20chrome,of%20the%20following%20script%20components)[\[8\]](https://medium.com/@lucas.abgodoy/chrome-extension-development-with-clean-architecture-a-poc-22e861aa4ede#:~:text=The%20communication%20from%20one%20component,by%20a%20Message%20passing%20system). For the frontend/backend, we leverage Next.js's serverless architecture: API routes on Vercel for isolated logic[\[3\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=In%20a%20serverless%20architecture%2C%20you,on%20writing%20your%20application%20logic)[\[4\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=,API%20Routes%20and%20Server%20Actions).&lt;/div&gt;

## Opus 4.5 Implementation Prompt

Below is a sample AI prompt to guide an advanced code-generation assistant (Opus 4.5). It outlines the module responsibilities, best practices, and constraints to minimize errors and hallucinations:

You are implementing the \*\*Career Resume Compiler\*\* system. Structure your code in well-isolated modules and follow clean architecture principles. The system has these parts:  
<br/>1\. \*\*Authentication Module:\*\*  
\- Use NextAuth.js in Next.js for Google OAuth and email signup.  
\- Store user sessions securely (JWT or encrypted cookies).  
\- Create API routes \`/api/auth/login\` and \`/api/auth/logout\`.  
\- Use middleware to protect profile and compile endpoints.  
<br/>2\. \*\*User Profile Storage:\*\*  
\- In the backend (Python FastAPI or Go), create schemas/models for User, Experience, Project, Education, Skill, Publication, etc.  
\- Provide CRUD API endpoints (\`/api/profile\`) so the Next.js frontend can save the canonical career data.  
\- Ensure one-to-many relations (a user has many roles, skills, etc.) in Postgres. Use an ORM (Prisma or SQLAlchemy) with migrations.  
\- Validate all input; do not truncate or lose fields (lossless storage).  
<br/>3\. \*\*Resume Template Schema Selection UI:\*\*  
\- In the React frontend, offer a few resume layouts (e.g. "Experience+Skills+Projects", "Education+Research+Skills") selectable via radio buttons or a preview.  
\- Save the selected template preference in user profile or settings.  
<br/>4\. \*\*Job Description Extraction (Extension Content Script):\*\*  
\- Write a content script (manifest v3) that runs on job listing pages.  
\- Use DOM queries to extract the main job description text.  
\- Send this text to the extension background script via \`chrome.runtime.sendMessage\`.  
<br/>5\. \*\*Resume Compilation Endpoint (\`/api/compile\`):\*\*  
\- Accept user auth and job description (POST JSON).  
\- Fetch the user's full profile from the database.  
\- Implement a relevance-scoring function: match job keywords to user's experiences/skills.  
\- Select the top N items (e.g. roles, skills) that fit a 1-page resume.  
\- Format them into a resume structure (JSON).  
\- Convert to PDF (using a library like WeasyPrint or headless Puppeteer).  
\- Return the PDF file (base64 or direct response).  
<br/>6\. \*\*Cover Letter Endpoint (\`/api/cover-letter\`):\*\*  
\- Accept user auth and job description.  
\- Retrieve user profile.  
\- Construct a precise prompt: e.g. "Write a job cover letter using this candidate's background \[fields from DB\] and this job description \[text\]."  
\- Call the Groq API with system messages to enforce ATS-friendly style.  
\- Return the generated text.  
<br/>7\. \*\*Extension Background & UI Logic:\*\*  
\- In the background script, listen for messages from content scripts.  
\- On receiving a JD, call the \`/api/compile\` and \`/api/cover-letter\` endpoints.  
\- Handle responses: open a popup or modal showing the resume (use PDF.js or an \`&lt;iframe&gt;\`) and cover letter text for review.  
\- On user approval, attempt to autofill the form: set text fields and, if possible, use Fetch+FormData to attach files (noting browser file-security limits).  
<br/>8\. \*\*Error Handling & Performance:\*\*  
\- Each API should validate inputs and handle errors gracefully (return JSON error codes).  
\- Cache repeated requests (same JD within short time) in Redis to speed up.  
\- Avoid long blocking: use async programming (async/await in Python).  
\- Enforce size limits (PDF <= 1 page) strictly.  
<br/>Follow best patterns: repository or service layers for DB access, clear separation of concerns, and use TypeScript types on the frontend. Comment any assumptions, and do not hard-code sensitive data. Use environment variables for API keys. Avoid Hallucination: do not let LLM add information not in the user's profile. Rely on structured data for facts.

This prompt ensures each piece of the system is described in scope, asking the AI to build clean, testable modules and to cite (or at least adhere to) known best practices.

## Codebase Structure

A suggested directory layout:

career-resume-compiler/  
├── frontend/ # Next.js app  
│ ├── pages/ # Next.js pages (login, profile, settings, etc.)  
│ ├── components/ # React components (forms, previews, etc.)  
│ ├── public/ # static assets  
│ ├── styles/ # CSS/Tailwind files  
│ ├── lib/ # helper libraries (e.g. API client)  
│ ├── pages/api/ # Next.js API routes for auth/profile  
│ ├── next.config.js  
│ └── tsconfig.json  
├── backend/ # Serverless function code (if separate)  
│ ├── auth.py (or auth.go) # Auth-related APIs (if using separate service)  
│ ├── profile.py # Profile CRUD APIs  
│ ├── compile.py # Resume compilation logic  
│ ├── cover_letter.py # Cover letter logic (calls LLM)  
│ ├── utils/ # Database connections, models, helpers  
│ └── requirements.txt # Python deps (if Python)  
│ └── go.mod # (if Go)  
├── extension/ # Chrome extension code  
│ ├── manifest.json  
│ ├── background.js # Background service worker  
│ ├── content_script.js # Content script for job pages  
│ ├── popup/ # React/Vite app for popup UI  
│ │ ├── index.html  
│ │ ├── popup.js  
│ │ └── popup.css  
│ └── assets/ # icons, etc.  
├── docs/ # Technical documentation  
│ └── architecture.md  
├── .env # environment config (not in version control)  
└── README.md

- The **frontend** folder is a standard Next.js project with React and TypeScript. API calls to /api/... correspond to Next.js API routes or edge functions.
- The **backend** folder contains the code for serverless functions. Alternatively, these can live in frontend/pages/api/ (as Next.js routes) or be separate if using Python/Go (Vercel can detect /api/\*.py or .go).
- The **extension** folder follows Chrome extension conventions (manifest v3). We might use a bundler (Webpack/Rollup) for the popup UI.
- Clear separation (frontend vs backend vs extension) aids maintainability.

## Project Name Ideas

We suggest short, memorable names that evoke resume/job tailoring and are likely available as domains (preferably .com or similarly common TLDs):

- **TailorCV** - suggests tailoring CVs to jobs. _(Check availability; e.g. cvtailor.com may be taken, but a variation like tailorCV.com or tailorcv.ai.)_
- **ApplyGenius** - implies smart job applications. (applygenius.com)
- **ResumeCraft** - building and crafting resumes. (resumecraft.com)
- **JobTailorAI** - conveys AI-powered tailoring. (jobtailorai.com)
- **CVWiz** - short for CV wizard. (cvwiz.com or cvwiz.ai)

Each name is brandable and focused on the product concept. We recommend checking domain registrars (e.g. Namecheap) for current availability and prices. Consider securing common TLDs (.com, .app, .ai) early.

**Conclusion:** This plan lays out the recommended stack (Next.js, Python, Groq LLM, Postgres, Redis), the modular architecture (frontend, API services, extension), and development guidance (Opus prompt, directory layout). It should enable a dev team to start building the "Career Resume Compiler" with minimal ambiguity, following modern best practices[\[1\]](https://www.contentful.com/blog/astro-next-js-compared/#:~:text=If%20your%20project%20requires%20state,js%20is%20the%20clear%20choice)[\[7\]](https://medium.com/@lucas.abgodoy/chrome-extension-development-with-clean-architecture-a-poc-22e861aa4ede#:~:text=At%20a%20glance%2C%20a%20chrome,of%20the%20following%20script%20components)[\[9\]](https://console.groq.com/docs/models#:~:text=Hosted%20models%20are%20directly%20accessible,list%20of%20all%20active%20models)[\[3\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=In%20a%20serverless%20architecture%2C%20you,on%20writing%20your%20application%20logic). All core components are separately maintainable, and the use of Next.js on Vercel ensures performance and scalability[\[4\]\[12\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=,API%20Routes%20and%20Server%20Actions).

[\[1\]](https://www.contentful.com/blog/astro-next-js-compared/#:~:text=If%20your%20project%20requires%20state,js%20is%20the%20clear%20choice) [\[2\]](https://www.contentful.com/blog/astro-next-js-compared/#:~:text=Just%20because%20something%20is%20newer,suitable%20for%20your%20specific%20project) Astro vs. Next.js: Features, performance, and use cases compared | Contentful

<https://www.contentful.com/blog/astro-next-js-compared/>

[\[3\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=In%20a%20serverless%20architecture%2C%20you,on%20writing%20your%20application%20logic) [\[4\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=,API%20Routes%20and%20Server%20Actions) [\[12\]](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c#:~:text=,API%20Routes%20and%20Server%20Actions) The Ultimate Guide to Software Architecture in Next.js: From Monolith to Microservices - DEV Community

<https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c>

[\[5\]](https://vercel.com/docs/functions/runtimes/python#:~:text=The%20Python%20runtime%20is%20available,Beta%20%20on%20%20495) Using the Python Runtime with Vercel Functions

<https://vercel.com/docs/functions/runtimes/python>

[\[6\]](https://vercel.com/docs/functions/runtimes/go#:~:text=Copy%20page) Using the Go Runtime with Vercel functions

<https://vercel.com/docs/functions/runtimes/go>

[\[7\]](https://medium.com/@lucas.abgodoy/chrome-extension-development-with-clean-architecture-a-poc-22e861aa4ede#:~:text=At%20a%20glance%2C%20a%20chrome,of%20the%20following%20script%20components) [\[8\]](https://medium.com/@lucas.abgodoy/chrome-extension-development-with-clean-architecture-a-poc-22e861aa4ede#:~:text=The%20communication%20from%20one%20component,by%20a%20Message%20passing%20system) Chrome extension development with Clean Architecture (a PoC) | by Lucas Godoy | Medium

<https://medium.com/@lucas.abgodoy/chrome-extension-development-with-clean-architecture-a-poc-22e861aa4ede>

[\[9\]](https://console.groq.com/docs/models#:~:text=Hosted%20models%20are%20directly%20accessible,list%20of%20all%20active%20models) Supported Models - GroqDocs

<https://console.groq.com/docs/models>

[\[10\]](https://stackoverflow.com/questions/60707185/chrome-extension-is-it-possible-to-control-file-input-programatically#:~:text=0) [\[11\]](https://stackoverflow.com/questions/60707185/chrome-extension-is-it-possible-to-control-file-input-programatically#:~:text=What%20I%20have%20found%20though%2C,Works%20just%20fine) Chrome Extension - Is it possible to control file input programatically? - Stack Overflow

<https://stackoverflow.com/questions/60707185/chrome-extension-is-it-possible-to-control-file-input-programatically>
