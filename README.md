# 🎓 AI-Powered Lesson Planner — *AI Lesson Architect*

> **Generate professional, curriculum-aligned lesson plans, assessments, and interactive teaching aids in under 5 minutes — powered by Google Gemini 2.5 Flash with live Google Search grounding.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Lesson Generator** | Creates structured, SMART-objectives-driven lesson plans using Gemini 2.5 Flash with chain-of-thought reasoning |
| 🔍 **Live Resource Grounding** | Uses Google Search grounding to access the latest curriculum standards, real-world examples, and current events |
| 📝 **Smart Assessment Builder** | Generates 10 targeted, curriculum-aligned questions (MCQ, Short Answer, Essay, Practical) with answer keys |
| 🎨 **Visual & Interactive Teaching Aids** | Produces mind maps, flowcharts, digital tool suggestions, simulations, and interactive activities |
| 🔁 **Lesson Improvement Engine** | Critiques and enhances existing lesson plans with engagement, clarity, and alignment scores |
| 💾 **Lesson Library** | Save, search, duplicate, update, and delete lessons with SQLite persistence |
| 📄 **Export Support** | Download lesson plans as formatted documents |
| 🌍 **African Education Focus** | Localized examples tailored to Nigerian and pan-African educational contexts |

---

## 🏗️ Architecture

```
AI_Powered_Lesson_Planner/
├── backend/
│   ├── __init__.py          # Package init
│   ├── app.py               # FastAPI application & REST API routes
│   ├── db.py                # SQLite database (CRUD operations, lessons.db)
│   ├── generator.py         # Gemini AI generation engine (google-genai SDK)
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html           # Main SPA shell
│   ├── css/
│   │   └── styles.css       # Premium dark-mode design system
│   └── js/
│       ├── app.js           # Main application controller
│       ├── api.js           # API client (fetch wrapper)
│       └── components/      # Modular UI components
│           ├── form.js
│           ├── lessonDisplay.js
│           ├── assessments.js
│           ├── teachingAids.js
│           └── library.js
├── .env                     # API keys (not committed)
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10+ (tested with 3.13) |
| Google Gemini API Key | Free tier available at [aistudio.google.com](https://aistudio.google.com/) |

> **Note:** No Node.js required! This app uses a plain HTML/CSS/JS frontend served directly by the FastAPI backend.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AI_Powered_Lesson_Planner.git
cd AI_Powered_Lesson_Planner
```

### 2. Create a Virtual Environment

```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Configure Your API Key

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

> 💡 **Tip:** Get a free API key at [Google AI Studio](https://aistudio.google.com/). You can also enter your API key directly in the app's settings panel — it will be used for that session only.

### 5. Start the Server

```bash
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

### 6. Open the App

Navigate to **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser.

---

## 🔑 Getting Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API key"** → **"Create API key"**
4. Copy the key and add it to your `.env` file **OR** paste it directly in the app's API key field

---

## 📡 API Reference

The backend exposes a clean REST API at `http://127.0.0.1:8000`.

### AI Generation Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-lesson` | Generate a complete AI lesson plan |
| `POST` | `/api/generate-assessment` | Generate 10 curriculum-aligned assessment questions |
| `POST` | `/api/generate-resources` | Generate interactive teaching aids & resources |
| `POST` | `/api/improve-lesson` | Critique and improve an existing lesson plan |

### Lesson Library CRUD

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/lessons` | List all saved lessons (supports `?search=query`) |
| `GET` | `/api/lessons/{id}` | Get a specific lesson by ID |
| `POST` | `/api/lessons` | Save a new lesson to the library |
| `PUT` | `/api/lessons/{id}` | Update an existing lesson |
| `DELETE` | `/api/lessons/{id}` | Delete a lesson |
| `POST` | `/api/lessons/{id}/duplicate` | Duplicate a lesson |

### Interactive API Docs

Visit **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)** for the full auto-generated Swagger UI.

---

## 🎨 Design System

The app uses a premium dark-mode glassmorphism design with:

- **Color Palette:** Royal Blue (`#1C6EF2`), Emerald Green (`#10B981`), Amber (`#F59E0B`), Deep Navy (`#0A1628`)
- **Typography:** Inter (body), Poppins (headings) — from Google Fonts
- **Style:** Glassmorphism cards, smooth gradient backgrounds, micro-animations
- **Layout:** Responsive two-column dashboard, mobile-friendly

---

## 🧑‍🏫 User Personas Supported

The AI automatically adapts its tone and depth based on the selected class level:

| Persona | Level | Focus |
|---|---|---|
| 🧒 Primary Coach | Primary School | Gamified, hands-on, bite-sized |
| 🎓 Secondary Specialist | Secondary School | Curriculum-aligned, exam-prep |
| 🎓 University Consultant | University | Scholarly, research-focused |
| 👤 Adaptive Tutor | Private Tutoring | Hyper-personalized, fast-paced |

---

## 🌍 Google Search Grounding

All AI generation calls use **Google Search grounding** to ensure:

- ✅ Content is based on the **latest curriculum standards**
- ✅ Real-world examples are **current and relevant**
- ✅ Topics connect to **today's news and events**
- ✅ Reduced risk of AI hallucination on factual content

---

## 🛡️ Safety & Ethics

- All generated content includes a **"Teacher Review Required"** disclaimer
- The system includes a **content accuracy safety guardrail** that prevents unverified claims
- API keys are stored locally in `.env` and never transmitted beyond the Gemini API
- The `.gitignore` excludes `.env`, `lessons.db`, and `.venv` from version control

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Google Gemini API](https://ai.google.dev/) — AI generation backbone
- [FastAPI](https://fastapi.tiangolo.com/) — High-performance Python web framework  
- [Google AI Studio](https://aistudio.google.com/) — API key management
- Inspired by the need to empower African educators with AI tools

---

<div align="center">

**Built with ❤️ for educators across Africa and beyond**

*"Education is the most powerful weapon which you can use to change the world." — Nelson Mandela*

</div>
