/**
 * API client library for the AI Lesson Architect backend.
 */

const API_BASE = ""; // Relative path since FastAPI serves the frontend

function getApiKey() {
    return localStorage.getItem("gemini_api_key") || "";
}

function getDemoMode() {
    return localStorage.getItem("demo_mode") === "true";
}

export const Api = {
    // --- Generation Engines ---
    
    async generateLesson(subject, topic, classLevel, duration, objectives, resources) {
        const payload = {
            apiKey: getApiKey(),
            subject,
            topic,
            classLevel,
            duration,
            objectives,
            resources
        };
        
        const response = await fetch(`${API_BASE}/api/generate-lesson`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to generate lesson outline");
        }
        return await response.json();
    },

    async generateAssessment(topic, classLevel, difficulty) {
        const payload = {
            apiKey: getApiKey(),
            topic,
            classLevel,
            difficulty
        };

        const response = await fetch(`${API_BASE}/api/generate-assessment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to generate assessment");
        }
        return await response.json();
    },

    async generateResources(topic, classLevel) {
        const payload = {
            apiKey: getApiKey(),
            topic,
            classLevel
        };

        const response = await fetch(`${API_BASE}/api/generate-resources`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to generate teaching resources");
        }
        return await response.json();
    },

    async improveLesson(subject, topic, classLevel, lessonPlan) {
        const payload = {
            apiKey: getApiKey(),
            subject,
            topic,
            classLevel,
            lessonPlan
        };

        const response = await fetch(`${API_BASE}/api/improve-lesson`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to run critique audit");
        }
        return await response.json();
    },

    // --- Saved Library CRUD Operations ---

    async listLessons(search = "") {
        const url = search ? `${API_BASE}/api/lessons?search=${encodeURIComponent(search)}` : `${API_BASE}/api/lessons`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load lesson list");
        return await response.json();
    },

    async getLesson(lessonId) {
        const response = await fetch(`${API_BASE}/api/lessons/${lessonId}`);
        if (!response.ok) throw new Error("Failed to retrieve lesson");
        return await response.json();
    },

    async saveLesson(lessonData) {
        const response = await fetch(`${API_BASE}/api/lessons`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lessonData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to save lesson");
        }
        return await response.json();
    },

    async updateLesson(lessonId, lessonData) {
        const response = await fetch(`${API_BASE}/api/lessons/${lessonId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lessonData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to update lesson");
        }
        return await response.json();
    },

    async deleteLesson(lessonId) {
        const response = await fetch(`${API_BASE}/api/lessons/${lessonId}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Failed to delete lesson");
        return await response.json();
    },

    async duplicateLesson(lessonId) {
        const response = await fetch(`${API_BASE}/api/lessons/${lessonId}/duplicate`, {
            method: "POST"
        });
        if (!response.ok) throw new Error("Failed to duplicate lesson");
        return await response.json();
    }
};
