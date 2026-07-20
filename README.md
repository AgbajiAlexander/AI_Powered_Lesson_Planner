# AI Powered Lesson Planner

AI Powered Lesson Planner is a full-stack lesson planning app that uses an AI backend to generate curriculum-aligned lesson plans, assessments, teaching aids, and critique suggestions. It includes a browser-based educator interface and a FastAPI backend with local SQLite storage.

## Features

- Generate AI-powered lesson plans based on subject, topic, class level, duration, objectives, and resources
- Generate curriculum-aligned assessments with MCQ, short answer, essay, and practical questions
- Generate teaching aids and classroom resources
- Improve and critique existing lesson plans
- Save, list, update, delete, and duplicate lesson plans in local SQLite storage
- Export lesson plans as printable PDF and Word document
- Demo mode fallback when Gemini API key is not configured

## Tech Stack

- Backend: Python, FastAPI, SQLite
- Frontend: HTML, CSS, JavaScript
- AI Integration: Google Gemini via `google-genai`

## Requirements

- Python 3.11+ (recommended)
- `pip`

## Installation

1. Clone the repository:

   ```bash
   git clone <repo-url> ai-lesson-planner
   cd ai-lesson-planner
   ```

2. Create and activate a virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root if you want to use a real Gemini API key:

   ```env
   GEMINI_API_KEY=your_api_key_here
   DATABASE_FILE=/tmp/lessons.db
   ```

   - `GEMINI_API_KEY` is optional. If not supplied, the app falls back to demo/mock generation mode.
   - `DATABASE_FILE` is optional. By default the app uses `/tmp/lessons.db`.

## Running the App

Start the FastAPI backend with Uvicorn from the project root:

```bash
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

Then open the app in your browser at:

```text
http://127.0.0.1:8000
```

The frontend is served as static files by FastAPI, so you do not need a separate frontend server.

## Usage

1. Open the app in the browser.
2. Configure the API settings from the `API Configuration` panel.
   - Enable demo mode or provide a Gemini API key in the settings modal.
3. Use the `New Lesson` panel to enter:
   - Subject
   - Topic
   - Class level
   - Duration
   - Optional objectives and resources
4. Generate a lesson plan, assessments, and teaching aids.
5. Save generated lessons to the local lesson library.
6. View and manage saved lessons via the `Saved Lessons` section.
7. Export lesson plans to PDF or Word from the active lesson workspace.

## API Endpoints

The backend exposes the following endpoints:

- `POST /api/generate-lesson` - generate lesson plan JSON
- `POST /api/generate-assessment` - generate assessment questions
- `POST /api/generate-resources` - generate teaching aids and resources
- `POST /api/improve-lesson` - critique and improve an existing lesson plan
- `GET /api/lessons` - list saved lessons
- `GET /api/lessons/{lesson_id}` - retrieve a saved lesson
- `POST /api/lessons` - save a new lesson
- `PUT /api/lessons/{lesson_id}` - update a saved lesson
- `DELETE /api/lessons/{lesson_id}` - delete a saved lesson
- `POST /api/lessons/{lesson_id}/duplicate` - duplicate a saved lesson

## Project Structure

- `backend/`
  - `app.py` - FastAPI application and API routes
  - `db.py` - SQLite database helper and CRUD operations
  - `generator.py` - AI generation and demo fallback logic
- `frontend/`
  - `index.html` - main app markup
  - `css/styles.css` - UI styles
  - `js/app.js` - frontend application logic
  - `js/api.js` - API client
  - `js/docExport.js` - PDF/Word export helpers
- `requirements.txt` - Python dependencies
- `.env` - optional environment configuration file

## Notes

- The app supports a `Demo Mode` that uses built-in mock content when no Gemini API key is available.
- AI generation and improvement are designed to be teacher-facing; reviewing content before classroom use is recommended.
- If running in production, consider setting a persistent `DATABASE_FILE` path and securing the Gemini API key.

## License

This project is provided as-is. Adapt and extend it for your lesson planning workflow.
