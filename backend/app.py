from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Any
import os

from . import db
from . import generator

app = FastAPI(title="AI Lesson Planner API")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database initialization
@app.on_event("startup")
def startup_event():
    db.init_db()

# Pydantic Schemas for Requests
class LessonGenerateRequest(BaseModel):
    apiKey: Optional[str] = None
    subject: str
    topic: str
    classLevel: str
    duration: str
    objectives: Optional[str] = ""
    resources: Optional[str] = ""

class AssessmentGenerateRequest(BaseModel):
    apiKey: Optional[str] = None
    topic: str
    classLevel: str
    difficulty: str

class ResourcesGenerateRequest(BaseModel):
    apiKey: Optional[str] = None
    topic: str
    classLevel: str

class LessonImproveRequest(BaseModel):
    apiKey: Optional[str] = None
    subject: str
    topic: str
    classLevel: str
    lessonPlan: Any  # Should match the lesson plan JSON structure

class LessonSaveRequest(BaseModel):
    subject: str
    topic: str
    classLevel: str
    duration: str
    objectives: Optional[str] = ""
    resources: Optional[str] = ""
    title: str
    lessonPlan: Any
    assessments: Optional[Any] = None
    teachingAids: Optional[Any] = None
    analytics: Optional[Any] = None

class LessonUpdateRequest(BaseModel):
    subject: str
    topic: str
    classLevel: str
    duration: str
    title: str
    lessonPlan: Any
    assessments: Optional[Any] = None
    teachingAids: Optional[Any] = None
    analytics: Optional[Any] = None

# --- API Endpoints ---

@app.post("/api/generate-lesson")
def api_generate_lesson(req: LessonGenerateRequest):
    try:
        plan = generator.generate_lesson_plan(
            api_key=req.apiKey,
            subject=req.subject,
            topic=req.topic,
            class_level=req.classLevel,
            duration=req.duration,
            objectives=req.objectives,
            resources=req.resources
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-assessment")
def api_generate_assessment(req: AssessmentGenerateRequest):
    try:
        questions = generator.generate_assessments(
            api_key=req.apiKey,
            topic=req.topic,
            class_level=req.classLevel,
            difficulty=req.difficulty
        )
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-resources")
def api_generate_resources(req: ResourcesGenerateRequest):
    try:
        aids = generator.generate_teaching_aids(
            api_key=req.apiKey,
            topic=req.topic,
            class_level=req.classLevel
        )
        return aids
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/improve-lesson")
def api_improve_lesson(req: LessonImproveRequest):
    try:
        result = generator.improve_lesson_plan(
            api_key=req.apiKey,
            subject=req.subject,
            topic=req.topic,
            class_level=req.classLevel,
            lesson_plan=req.lessonPlan
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Database CRUD Endpoints ---

@app.get("/api/lessons")
def api_list_lessons(search: Optional[str] = None):
    try:
        return db.list_lessons(search)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lessons/{lesson_id}")
def api_get_lesson(lesson_id: int):
    lesson = db.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@app.post("/api/lessons")
def api_save_lesson(req: LessonSaveRequest):
    try:
        lesson_id = db.save_lesson(
            subject=req.subject,
            topic=req.topic,
            class_level=req.classLevel,
            duration=req.duration,
            objectives=req.objectives,
            resources=req.resources,
            title=req.title,
            lesson_plan=req.lessonPlan,
            assessments=req.assessments,
            teaching_aids=req.teachingAids,
            analytics=req.analytics
        )
        return {"id": lesson_id, "status": "success", "message": "Lesson saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/lessons/{lesson_id}")
def api_update_lesson(lesson_id: int, req: LessonUpdateRequest):
    lesson = db.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    try:
        db.update_lesson(
            lesson_id=lesson_id,
            subject=req.subject,
            topic=req.topic,
            class_level=req.classLevel,
            duration=req.duration,
            title=req.title,
            lesson_plan=req.lessonPlan,
            assessments=req.assessments,
            teaching_aids=req.teachingAids,
            analytics=req.analytics
        )
        return {"status": "success", "message": "Lesson updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/lessons/{lesson_id}")
def api_delete_lesson(lesson_id: int):
    lesson = db.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    try:
        db.delete_lesson(lesson_id)
        return {"status": "success", "message": "Lesson deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lessons/{lesson_id}/duplicate")
def api_duplicate_lesson(lesson_id: int):
    new_id = db.duplicate_lesson(lesson_id)
    if not new_id:
        raise HTTPException(status_code=404, detail="Lesson to duplicate not found")
    return {"id": new_id, "status": "success", "message": "Lesson duplicated successfully"}

# --- Static File Serving ---
# Locate front end directory relative to backend
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory {FRONTEND_DIR} not found. Only API endpoints are active.")
