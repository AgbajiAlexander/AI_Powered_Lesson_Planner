# Product Requirements Document (PRD): AI Lesson Planner MVP

## 1. App Overview
*   **Title:** AI Lesson Architect (Working Title)
*   **Summary:** A clean, intuitive web-based utility that generates comprehensive, curriculum-aligned lesson plans, activities, and assessments in minutes.
*   **Problem Statement:** Teachers spend excessive time on administrative lesson planning.
*   **Purpose:** To automate the "blank page" phase of planning, allowing educators to focus on teaching and student engagement.

## 2. User and Audience
*   **Target Users:** Primary/Secondary Teachers, University Lecturers, and Tutors.
*   **Needs:** Speed, high-quality pedagogical structure, and professional formatting.
*   **User Journey:** Teacher logs in → Enters lesson details (Topic, Grade, Duration) → Clicks "Generate" → Reviews/Edits output → Exports as PDF/Word.

## 3. Goals and Success
*   **Core Metrics:** Time taken to create a full lesson plan (Goal: < 5 minutes).
*   **Success:** High teacher satisfaction with content quality and usability.

## 4. Scope (The MVP Focus)
*   **In V1 (Must-Haves):** Input form, AI generation engine, Rich Text Editor for manual refinement, export to PDF/Word, and local saving/dashboard.
*   **Out of Scope (V2+):** LMS integrations (Google Classroom/Canvas), student login/tracking, image/slide generation, and analytics.

## 5. Features and Functionality
*   **AI Generator Engine:** Must take parameters (Subject, Topic, Grade, Duration) and output a structured lesson plan (Objectives, Activities, Assessments).
*   **Editor:** The ability to regenerate *specific* sections (e.g., "Regenerate only the assessment questions") rather than the whole document.
*   **Export:** Clean, templated PDF and Word document downloads.

## 6. UI/UX Requirements
*   **Style:** Minimalist, clean, and professional. 
*   **Layout:** Two-column split. Left = Input Form (sticky); Right = Editor/Preview (scrollable).
*   **Aesthetics:** Royal Blue/Emerald Green/Amber accents on white/light gray background. Use Inter/Poppins typography.

## 7. Platform and Compatibility
*   **Deployment:** Responsive Web App (Desktop and Mobile browser friendly).

## 8. Technical Preferences (Developer Recommendations)
*   **Frontend:** React or Next.js (Excellent for dashboards).
*   **Backend:** Node.js or Python (Fastest for AI API calls).
*   **AI Integration:** OpenAI API (GPT-4o or GPT-4o-mini) for high-quality, reliable text generation.
*   **Database:** Supabase or Firebase (Easy to set up for user accounts and saving lessons).
*   **Document Generation:** `react-pdf` or similar libraries for PDF creation; `docx` library for Word document generation.

## 9. Data and Content
*   **Storage:** Securely store lesson titles, metadata, and body text in a user-linked database.
*   **Privacy:** Standard data encryption; user data is used only for personal lesson generation.

## 10. Risks and Constraints
*   **AI Hallucinations:** AI may occasionally generate inaccurate facts; include a "Teacher Review Required" disclaimer on every generated plan.
*   **Connectivity:** App requires an active internet connection to communicate with the AI engine.

## 11. Open Questions
*   *Do you want to implement "Lesson Templates" (saved structures) in V1, or just let the AI build from scratch every time?*
*   *Will you require a user authentication system (Log in/Sign up) for the MVP, or a simple anonymous-access model?*

## 12. Final Build Summary
**Your next best step:** Present this document to a developer or use it as the primary prompt for an AI coding assistant (like Cursor or Windsurf) to scaffold the project. Start by building the **Input Form** and connecting it to the **OpenAI API** to render the first lesson plan—this is the "heart" of your product.
