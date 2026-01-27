# AI Agent Operational Guide (CV-Wiz)

This repository is a monorepo containing a **FastAPI backend** and a **Next.js frontend**.
Agents must strictly adhere to the following operational guidelines, build commands, and code style conventions.

## 1. Project Structure & Navigation
- **Root**: Contains project-wide config and documentation.
- **`backend/`**: Python/FastAPI application.
- **`frontend/`**: Next.js 15 (App Router) application.

**Crucial**: Always check your current working directory. Use `workdir="backend"` or `workdir="frontend"` for framework-specific commands.

## 2. Backend (FastAPI)
### Environment & Setup
- **Python Version**: 3.9+
- **Dependency Management**: `pip` with `requirements.txt`.
- **Virtual Env**: Expected at `backend/venv`.

### Build & Run Commands
```bash
# Install dependencies
pip install -r requirements.txt

# Start Development Server (from backend/ directory)
uvicorn app.main:app --reload --port 8000

# Run All Tests
pytest

# Run Single Test File
pytest tests/test_file.py

# Run Specific Test Function
pytest tests/test_file.py::test_function_name
```

### Code Style & Conventions
- **Type Hinting**: **MANDATORY**. All function signatures must be typed.
  ```python
  def process_file(file: UploadFile, request_id: str) -> Dict[str, Any]:
      ...
  ```
- **Logging**: Use `app.utils.logger`. NEVER use `print`.
  - Pass structured context (dictionaries) to log methods.
  - specific operations should use `logger.start_operation`, `logger.end_operation`, and `logger.fail_operation`.
- **Async**: Prefer `async def` for all I/O-bound operations (DB, API calls).
- **Naming**: `snake_case` for variables/functions. `PascalCase` for classes/Pydantic models.
- **Error Handling**: Raise `HTTPException` with clear status codes and details. Catch generic exceptions in routers and log them before raising 500s.
- **Architecture**:
  - `routers/`: API endpoints.
  - `services/`: Business logic.
  - `models/`: Pydantic schemas.
  - `utils/`: Shared helpers.

## 3. Frontend (Next.js + TypeScript)
### Environment & Setup
- **Framework**: Next.js 15 (App Router), React 19.
- **Styling**: Tailwind CSS v4.
- **State/Auth**: NextAuth.js (v5 beta), Prisma.

### Build & Run Commands
```bash
# Install dependencies
npm install

# Start Development Server
npm run dev

# Build for Production
npm run build

# Lint Code
npm run lint
```

### Code Style & Conventions
- **Components**: Functional components with strict TypeScript interfaces.
  ```typescript
  interface ButtonProps {
    label: string;
    onClick: () => void;
  }
  export const Button = ({ label, onClick }: ButtonProps) => { ... }
  ```
- **File Structure**:
  - `src/app`: Routes (App Router).
  - `src/components`: Reusable UI components.
  - `src/lib`: Utilities and configuration.
- **Styling**: Use Tailwind utility classes. Use `clsx` or `tailwind-merge` for conditional class merging.
- **Server vs Client**: Explicitly mark Client Components with `"use client";` at the top. Default to Server Components.
- **Data Fetching**: Use Server Actions or API routes for data mutations.

## 4. General Development Rules
- **Zero Hallucination**: When processing resumes, never invent data. If data is missing, omit it.
- **Configuration**: Use environment variables for all secrets and config. Never hardcode API keys.
- **Testing**:
  - Backend: Write unit tests for new services.
  - Frontend: Ensure build passes before committing (`npm run build`).
- **Commits**: Write clear, imperative commit messages (e.g., "Add resume parsing endpoint", "Fix navigation bug").

## 5. Agent Behavior
1. **Verification**: After editing code, ALWAYS attempt to build or run tests to verify syntax and functionality.
2. **Context**: Read `README.md` and related files before starting a task to understand the "Why".
3. **Safety**: Do not delete data or files without explicit user confirmation.
