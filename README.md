# AI-Powered Lesson Planner

A small web application that generates lesson plans using AI. It includes a Python backend and a lightweight frontend for creating, previewing, and exporting lesson plans.

**Features**

- Generate lesson plans from prompts or templates
- Simple frontend UI for editing and exporting plans
- Backend API for generating and persisting lesson data

**Repository Structure**

- [backend](backend): Flask app, generator logic, and dependencies
- [frontend](frontend): static UI files (HTML, CSS, JS)

**Quick Start (Windows)**

1. Create and activate a virtual environment

```powershell
python -m venv .venv
.venv\Scripts\activate
```

2. Install backend dependencies and run the app

```powershell
pip install -r backend/requirements.txt
python backend/app.py
```

3. Open the frontend in your browser: [frontend/index.html](frontend/index.html)

**Development Notes**

- Backend entry: [backend/app.py](backend/app.py)
- Generator logic: [backend/generator.py](backend/generator.py)
- Frontend entry: [frontend/index.html](frontend/index.html)
- Frontend API helper: [frontend/js/api.js](frontend/js/api.js)


