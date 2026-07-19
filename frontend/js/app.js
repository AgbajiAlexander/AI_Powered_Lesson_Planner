import { Api } from "./api.js";
import { DocExport } from "./docExport.js";

// --- Application State ---
const State = {
    lessons: [],
    activeLesson: null,
    currentView: "dashboard",
    filters: {
        search: "",
        level: "all"
    }
};

// --- DOM Cache ---
const DOM = {
    navItems: document.querySelectorAll(".nav-item"),
    views: document.querySelectorAll(".view-panel"),
    
    // Dashboard elements
    totalLessonsText: document.getElementById("stat-total-lessons"),
    timeSavedText: document.getElementById("stat-time-saved"),
    apiStatusText: document.getElementById("stat-api-status"),
    lessonsList: document.getElementById("lessons-list"),
    dashboardNewLessonBtn: document.getElementById("dashboard-new-lesson-btn"),
    filterTabs: document.querySelectorAll(".filter-tab"),
    globalSearch: document.getElementById("global-search"),
    
    // Settings Modal
    settingsModal: document.getElementById("settings-modal"),
    openSettingsBtn: document.getElementById("open-settings"),
    closeSettingsBtn: document.getElementById("close-settings-btn"),
    cancelSettingsBtn: document.getElementById("btn-cancel-settings"),
    saveSettingsBtn: document.getElementById("btn-save-settings"),
    quickSettingsBtn: document.getElementById("quick-settings-btn"),
    geminiKeyInput: document.getElementById("settings-gemini-key"),
    demoToggleInput: document.getElementById("settings-toggle-demo"),
    toggleKeyVisibility: document.getElementById("toggle-key-visibility"),
    
    // Generator elements
    wizardForm: document.getElementById("lesson-wizard-form"),
    workspaceEmpty: document.getElementById("workspace-empty"),
    workspaceLoading: document.getElementById("workspace-loading"),
    workspaceActive: document.getElementById("workspace-active"),
    btnGenerateAll: document.getElementById("btn-generate-all"),
    
    // Editor Workspace active elements
    activeLessonTitle: document.getElementById("active-lesson-title"),
    saveStatusText: document.getElementById("save-status-text"),
    btnSaveCurrent: document.getElementById("btn-save-current"),
    btnExportDropdown: document.getElementById("btn-export-dropdown"),
    exportMenu: document.getElementById("export-menu"),
    exportPDF: document.getElementById("export-pdf"),
    exportWord: document.getElementById("export-word"),
    btnDeleteActive: document.getElementById("btn-delete-active"),
    
    // Workspace tabs
    workspaceTabs: document.querySelectorAll(".w-tab"),
    tabPanes: document.querySelectorAll(".tab-pane"),
    
    // Editable outline fields
    summarySubject: document.getElementById("summary-subject"),
    summaryLevel: document.getElementById("summary-level"),
    summaryDuration: document.getElementById("summary-duration"),
    
    editObjectives: document.getElementById("edit-objectives"),
    editIntroduction: document.getElementById("edit-introduction"),
    editTeacherActivities: document.getElementById("edit-teacher_activities"),
    editStudentActivities: document.getElementById("edit-student_activities"),
    editMethods: document.getElementById("edit-methods"),
    editAssessmentPlan: document.getElementById("edit-assessment-plan"),
    editAssignment: document.getElementById("edit-assignment"),
    editSummary: document.getElementById("edit-summary"),
    
    // Assessment and Aids tab content containers
    assessmentsListContainer: document.getElementById("assessments-list-container"),
    aidsContentContainer: document.getElementById("aids-content-container"),
    btnRegenAssessments: document.getElementById("btn-regenerate-assessments"),
    btnRegenAids: document.getElementById("btn-regenerate-aids"),
    
    // Audit / Critique pane
    critiqueTabBtn: document.getElementById("critique-tab-btn"),
    btnApplyOptimizations: document.getElementById("btn-apply-optimizations"),
    scoreEngagement: document.getElementById("score-ring-engagement"),
    scoreClarity: document.getElementById("score-ring-clarity"),
    scoreAlignment: document.getElementById("score-ring-alignment"),
    scoreTextEngagement: document.getElementById("score-text-engagement"),
    scoreTextClarity: document.getElementById("score-text-clarity"),
    scoreTextAlignment: document.getElementById("score-text-alignment"),
    critiqueFeedbackList: document.getElementById("critique-feedback-list"),
    
    // Saved library elements
    libraryLessonsList: document.getElementById("library-lessons-list"),
    librarySearch: document.getElementById("library-search")
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initSettings();
    initNavigation();
    initEventListeners();
    loadLessons();
    lucide.createIcons();
});

// --- Settings Controller ---
function initSettings() {
    const key = localStorage.getItem("gemini_api_key") || "";
    const demo = localStorage.getItem("demo_mode") !== "false"; // Default true if not set
    
    DOM.geminiKeyInput.value = key;
    DOM.demoToggleInput.checked = demo;
    
    localStorage.setItem("demo_mode", demo); // Ensure set
    updateApiStatusUI(key, demo);
}

function updateApiStatusUI(key, demo) {
    if (demo) {
        DOM.apiStatusText.textContent = "Demo Mode";
        DOM.apiStatusText.style.color = "var(--warning-dark)";
    } else if (key) {
        DOM.apiStatusText.textContent = "Active Key";
        DOM.apiStatusText.style.color = "var(--success-dark)";
    } else {
        DOM.apiStatusText.textContent = "Key Missing";
        DOM.apiStatusText.style.color = "var(--danger)";
    }
}

// --- Navigation Controller ---
function initNavigation() {
    DOM.navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetView = item.getAttribute("data-view");
            if (targetView) {
                switchView(targetView);
            }
        });
    });

    DOM.dashboardNewLessonBtn.addEventListener("click", () => {
        switchView("generator");
        resetGeneratorForm();
    });
}

function switchView(viewName) {
    State.currentView = viewName;
    
    // Update Sidebar
    DOM.navItems.forEach(item => {
        const view = item.getAttribute("data-view");
        if (view === viewName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Update Panels
    DOM.views.forEach(panel => {
        const panelId = panel.getAttribute("id");
        if (panelId === `view-${viewName}`) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });

    if (viewName === "history" || viewName === "dashboard") {
        loadLessons();
    }
}

// --- Events Setup ---
function initEventListeners() {
    // Settings modal triggers
    const toggleModal = (show) => {
        DOM.settingsModal.classList.toggle("hidden", !show);
    };
    DOM.openSettingsBtn.addEventListener("click", () => toggleModal(true));
    DOM.quickSettingsBtn.addEventListener("click", () => toggleModal(true));
    DOM.closeSettingsBtn.addEventListener("click", () => toggleModal(false));
    DOM.cancelSettingsBtn.addEventListener("click", () => toggleModal(false));
    
    // Password visibility toggle
    DOM.toggleKeyVisibility.addEventListener("click", () => {
        const isPassword = DOM.geminiKeyInput.type === "password";
        DOM.geminiKeyInput.type = isPassword ? "text" : "password";
        DOM.toggleKeyVisibility.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}"></i>`;
        lucide.createIcons({ attrs: { "data-lucide": true } });
    });

    // Save configurations
    DOM.saveSettingsBtn.addEventListener("click", () => {
        const key = DOM.geminiKeyInput.value.trim();
        const demo = DOM.demoToggleInput.checked;
        
        localStorage.setItem("gemini_api_key", key);
        localStorage.setItem("demo_mode", demo);
        
        updateApiStatusUI(key, demo);
        toggleModal(false);
        
        showNotification("Configuration updated!", "success");
    });

    // Search filter tab clicks
    DOM.filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            DOM.filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            State.filters.level = tab.getAttribute("data-filter");
            renderLessonsList();
        });
    });

    // Search input changes
    DOM.globalSearch.addEventListener("input", (e) => {
        State.filters.search = e.target.value.trim();
        renderLessonsList();
    });

    DOM.librarySearch.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        loadLessons(query);
    });

    // Wizard Form Generation
    DOM.wizardForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Grab values
        const subject = document.getElementById("lesson-subject").value.trim();
        const topic = document.getElementById("lesson-topic").value.trim();
        const classLevel = document.getElementById("lesson-level").value;
        const duration = document.getElementById("lesson-duration").value.trim();
        const objectives = document.getElementById("lesson-objectives").value.trim();
        const resources = document.getElementById("lesson-resources").value.trim();
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;

        // Double check API configuration
        const isDemo = localStorage.getItem("demo_mode") === "true";
        const key = localStorage.getItem("gemini_api_key") || "";
        if (!isDemo && !key) {
            showNotification("Please configure your Gemini API Key first or enable Demo Mode in settings.", "error");
            toggleModal(true);
            return;
        }

        await runInstructionChain(subject, topic, classLevel, duration, objectives, resources, difficulty);
    });

    // Tab switcher in active workspace
    DOM.workspaceTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetPane = tab.getAttribute("data-tab");
            
            DOM.workspaceTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            DOM.tabPanes.forEach(pane => {
                const paneId = pane.getAttribute("id");
                if (paneId === `pane-${targetPane}`) {
                    pane.classList.add("active");
                } else {
                    pane.classList.remove("active");
                }
            });
        });
    });

    // Auto-close export dropdown on click outside
    document.addEventListener("click", (e) => {
        if (!DOM.btnExportDropdown.contains(e.target) && !DOM.exportMenu.contains(e.target)) {
            DOM.exportMenu.classList.add("hidden");
        }
    });

    DOM.btnExportDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
        DOM.exportMenu.classList.toggle("hidden");
    });

    // Export PDF
    DOM.exportPDF.addEventListener("click", () => {
        if (!State.activeLesson) return;
        DOM.exportMenu.classList.add("hidden");
        DocExport.exportToPDF(State.activeLesson);
    });

    // Export Word
    DOM.exportWord.addEventListener("click", () => {
        if (!State.activeLesson) return;
        DOM.exportMenu.classList.add("hidden");
        DocExport.exportToWord(State.activeLesson);
    });

    // Update active title
    DOM.activeLessonTitle.addEventListener("blur", () => {
        if (State.activeLesson) {
            State.activeLesson.title = DOM.activeLessonTitle.value.trim();
            saveActiveChanges();
        }
    });

    // Save Active Changes
    DOM.btnSaveCurrent.addEventListener("click", () => {
        saveActiveChanges(true);
    });

    // Delete Active Lesson
    DOM.btnDeleteActive.addEventListener("click", async () => {
        if (!State.activeLesson) return;
        if (confirm("Are you sure you want to delete this lesson plan permanently?")) {
            try {
                if (State.activeLesson.id) {
                    await Api.deleteLesson(State.activeLesson.id);
                }
                showNotification("Lesson plan deleted.", "success");
                State.activeLesson = null;
                switchView("dashboard");
            } catch (err) {
                showNotification(err.message, "error");
            }
        }
    });

    // Regenerate Specific Sections
    document.querySelectorAll(".section-regen-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const secName = btn.getAttribute("data-sec-name");
            await regenerateSection(secName);
        });
    });

    // Regenerate Assessments
    DOM.btnRegenAssessments.addEventListener("click", async () => {
        await regenerateAssessments();
    });

    // Regenerate Aids
    DOM.btnRegenAids.addEventListener("click", async () => {
        await regenerateAids();
    });

    // Apply Critique Optimizations
    DOM.btnApplyOptimizations.addEventListener("click", () => {
        applyOptimizedAudit();
    });
}

// --- CRUD Database Operations ---
async function loadLessons(search = "") {
    try {
        State.lessons = await Api.listLessons(search);
        renderLessonsList();
        renderLibraryList();
        
        // Update stats
        DOM.totalLessonsText.textContent = State.lessons.length;
        DOM.timeSavedText.textContent = `${State.lessons.length * 2.5} hrs`; // Assume 2.5 hrs saved per lesson
    } catch (err) {
        console.error("Error loading lessons:", err);
    }
}

function renderLessonsList() {
    DOM.lessonsList.innerHTML = "";
    
    // Filter
    let filtered = State.lessons;
    if (State.filters.level !== "all") {
        filtered = filtered.filter(l => l.class_level === State.filters.level);
    }
    if (State.filters.search) {
        const q = State.filters.search.toLowerCase();
        filtered = filtered.filter(l => l.topic.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
        DOM.lessonsList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="book-dashed" class="empty-icon"></i>
                <h3>No lessons found</h3>
                <p>No lesson cards match your filter criteria.</p>
            </div>
        `;
        lucide.createIcons({ attrs: { "data-lucide": true } });
        return;
    }

    filtered.slice(0, 6).forEach(lesson => {
        const card = createLessonCard(lesson);
        DOM.lessonsList.appendChild(card);
    });
    
    lucide.createIcons({ attrs: { "data-lucide": true } });
}

function renderLibraryList() {
    DOM.libraryLessonsList.innerHTML = "";
    if (State.lessons.length === 0) {
        DOM.libraryLessonsList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="book-dashed" class="empty-icon"></i>
                <h3>No lessons found</h3>
                <p>You haven't saved any lesson plans yet.</p>
            </div>
        `;
        lucide.createIcons({ attrs: { "data-lucide": true } });
        return;
    }

    State.lessons.forEach(lesson => {
        const card = createLessonCard(lesson);
        DOM.libraryLessonsList.appendChild(card);
    });
    
    lucide.createIcons({ attrs: { "data-lucide": true } });
}

function createLessonCard(lesson) {
    const card = document.createElement("div");
    card.className = "lesson-card glass";
    
    const formattedDate = new Date(lesson.created_at || Date.now()).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    const levelClass = lesson.class_level ? lesson.class_level.toLowerCase() : "secondary";

    card.innerHTML = `
        <div class="card-actions-row">
            <button class="card-action-btn duplicate-btn" title="Duplicate"><i data-lucide="copy"></i></button>
            <button class="card-action-btn delete delete-btn" title="Delete"><i data-lucide="trash-2"></i></button>
        </div>
        <div class="badge-row">
            <span class="level-badge ${levelClass}">${lesson.class_level}</span>
            <span class="date-text">${formattedDate}</span>
        </div>
        <h4>${escapeHtml(lesson.title || lesson.topic)}</h4>
        <div class="lesson-card-meta">
            <span>Subject: ${escapeHtml(lesson.subject)}</span>
            <span>⏱️ ${escapeHtml(lesson.duration)}</span>
        </div>
    `;

    // Click card to open in editor workspace
    card.addEventListener("click", async (e) => {
        if (e.target.closest(".card-action-btn")) return; // Prevent card load on button click
        await loadLessonIntoWorkspace(lesson.id);
    });

    // Duplicate button
    card.querySelector(".duplicate-btn").addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
            await Api.duplicateLesson(lesson.id);
            showNotification("Lesson plan duplicated!", "success");
            loadLessons();
        } catch (err) {
            showNotification(err.message, "error");
        }
    });

    // Delete button
    card.querySelector(".delete-btn").addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Delete the lesson plan "${lesson.title || lesson.topic}" permanently?`)) {
            try {
                await Api.deleteLesson(lesson.id);
                showNotification("Lesson plan deleted.", "success");
                loadLessons();
            } catch (err) {
                showNotification(err.message, "error");
            }
        }
    });

    return card;
}

async function loadLessonIntoWorkspace(lessonId) {
    try {
        const lesson = await Api.getLesson(lessonId);
        State.activeLesson = {
            id: lesson.id,
            subject: lesson.subject,
            topic: lesson.topic,
            classLevel: lesson.class_level,
            duration: lesson.duration,
            objectives: lesson.objectives,
            resources: lesson.resources,
            title: lesson.title,
            lessonPlan: lesson.lesson_plan,
            assessments: lesson.assessments,
            teachingAids: lesson.teaching_aids,
            analytics: lesson.analytics
        };
        
        switchView("generator");
        populateWorkspaceUI();
    } catch (err) {
        showNotification(err.message, "error");
    }
}

// --- Generator Chain Logic ---
async function runInstructionChain(subject, topic, classLevel, duration, objectives, resources, difficulty) {
    // Show Loading state
    DOM.workspaceEmpty.classList.add("hidden");
    DOM.workspaceActive.classList.add("hidden");
    DOM.workspaceLoading.classList.remove("hidden");
    
    // Reset steps checklist
    resetLoadingSteps();

    try {
        // Step 1: Outline
        setStepStatus("load-step-1", "current");
        const outline = await Api.generateLesson(subject, topic, classLevel, duration, objectives, resources);
        setStepStatus("load-step-1", "done");

        // Step 2: Assessment Quiz
        setStepStatus("load-step-2", "current");
        const assessments = await Api.generateAssessment(topic, classLevel, difficulty);
        setStepStatus("load-step-2", "done");

        // Step 3: Teaching Aids
        setStepStatus("load-step-3", "current");
        const aids = await Api.generateResources(topic, classLevel);
        setStepStatus("load-step-3", "done");

        // Step 4: Audit & critique
        setStepStatus("load-step-4", "current");
        const audit = await Api.improveLesson(subject, topic, classLevel, outline);
        setStepStatus("load-step-4", "done");

        // Setup active state
        State.activeLesson = {
            id: null, // New unsaved lesson
            subject,
            topic,
            classLevel,
            duration,
            objectives,
            resources,
            title: outline.title || `Lesson: ${topic}`,
            lessonPlan: outline,
            assessments: assessments,
            teachingAids: aids,
            analytics: audit
        };

        // Auto Save to backend database SQLite
        await autoSaveActiveLesson();

        // Populate and show workspace
        populateWorkspaceUI();
        showNotification("Lesson Plan generated and saved successfully!", "success");

    } catch (err) {
        console.error("Chain Error:", err);
        showNotification(`Generation Chain Failed: ${err.message}`, "error");
        
        DOM.workspaceLoading.classList.add("hidden");
        DOM.workspaceEmpty.classList.remove("hidden");
    }
}

// --- Workspace UI Populator ---
function populateWorkspaceUI() {
    const lesson = State.activeLesson;
    if (!lesson) return;

    DOM.workspaceLoading.classList.add("hidden");
    DOM.workspaceEmpty.classList.add("hidden");
    DOM.workspaceActive.classList.remove("hidden");

    // Title & Save indicators
    DOM.activeLessonTitle.value = lesson.title;
    DOM.saveStatusText.textContent = lesson.id ? "Saved locally" : "Unsaved changes";

    // Meta box
    DOM.summarySubject.textContent = lesson.subject;
    DOM.summaryLevel.textContent = lesson.classLevel;
    DOM.summaryDuration.textContent = lesson.duration;

    // Fill Editable fields (Plan pane)
    DOM.editObjectives.innerHTML = formatArrayOrTextToListHTML(lesson.lessonPlan.objectives);
    DOM.editIntroduction.innerHTML = formatTextToParagraphsHTML(lesson.lessonPlan.introduction);
    DOM.editTeacherActivities.innerHTML = formatTextToParagraphsHTML(lesson.lessonPlan.teacher_activities);
    DOM.editStudentActivities.innerHTML = formatTextToParagraphsHTML(lesson.lessonPlan.student_activities);
    DOM.editMethods.innerHTML = formatTextToParagraphsHTML(lesson.lessonPlan.teaching_methods);
    DOM.editAssessmentPlan.innerHTML = formatTextToParagraphsHTML(lesson.lessonPlan.assessment_plan);
    DOM.editAssignment.innerHTML = formatTextToParagraphsHTML(lesson.lessonPlan.assignment);
    DOM.editSummary.innerHTML = formatTextToParagraphsHTML(lesson.lessonPlan.summary);

    // Populate Assessments Pane
    renderAssessmentsUI();

    // Populate Aids Pane
    renderAidsUI();

    // Populate Critique Pane
    renderCritiqueUI();

    // Switch workspace tab to plan
    DOM.workspaceTabs[0].click();
}

function renderAssessmentsUI() {
    DOM.assessmentsListContainer.innerHTML = "";
    const list = State.activeLesson.assessments;
    if (!list || list.length === 0) {
        DOM.assessmentsListContainer.innerHTML = `<p class="text-muted">No assessment questions generated.</p>`;
        return;
    }

    list.forEach((q, index) => {
        const qCard = document.createElement("div");
        qCard.className = "quiz-card doc-section";
        
        let optionsHtml = "";
        if (q.options && q.options.length > 0) {
            optionsHtml += `<ul class="quiz-options-list">`;
            q.options.forEach(opt => {
                const isCorrect = opt === q.answer;
                optionsHtml += `<li class="quiz-option ${isCorrect ? 'correct' : ''}">[ ] ${escapeHtml(opt)}</li>`;
            });
            optionsHtml += `</ul>`;
        }

        qCard.innerHTML = `
            <div>
                <span class="quiz-q-num">Question ${index + 1}</span>
                <span class="quiz-type-badge">${q.type}</span>
            </div>
            <div class="quiz-question-text" contenteditable="true" data-quiz-idx="${index}" data-quiz-field="question">${escapeHtml(q.question)}</div>
            ${optionsHtml}
            <div class="quiz-explanation-box">
                <p><strong>Correct Answer:</strong> <span contenteditable="true" data-quiz-idx="${index}" data-quiz-field="answer">${escapeHtml(q.answer)}</span></p>
                <p style="margin-top: 4px;"><strong>Explanation:</strong> <span contenteditable="true" data-quiz-idx="${index}" data-quiz-field="explanation">${escapeHtml(q.explanation)}</span></p>
            </div>
        `;

        // Listen for user edits in quiz fields
        qCard.querySelectorAll("[contenteditable]").forEach(editable => {
            editable.addEventListener("blur", (e) => {
                const idx = parseInt(e.target.getAttribute("data-quiz-idx"));
                const field = e.target.getAttribute("data-quiz-field");
                State.activeLesson.assessments[idx][field] = e.target.innerText;
                saveActiveChanges();
            });
        });

        DOM.assessmentsListContainer.appendChild(qCard);
    });
}

function renderAidsUI() {
    DOM.aidsContentContainer.innerHTML = "";
    const aids = State.activeLesson.teachingAids;
    if (!aids) {
        DOM.aidsContentContainer.innerHTML = `<p class="text-muted">No teaching resources generated.</p>`;
        return;
    }

    const sections = [
        { title: "Low-Cost Classroom Demonstrations", field: "demonstrations" },
        { title: "Interactive Educational Games", field: "games" },
        { title: "Visual Aids Outline", field: "visual_aids" },
        { title: "Recommended Video Searches", field: "video_recommendations" },
        { title: "Localized Community Examples", field: "local_examples" }
    ];

    sections.forEach(sec => {
        const secDiv = document.createElement("div");
        secDiv.className = "doc-section";
        secDiv.innerHTML = `
            <div class="section-title-row">
                <h3>${sec.title}</h3>
            </div>
            <div class="section-content-editable" contenteditable="true" data-aids-field="${sec.field}">
                ${formatArrayOrTextToListHTML(aids[sec.field])}
            </div>
        `;

        secDiv.querySelector(".section-content-editable").addEventListener("blur", (e) => {
            const field = e.target.getAttribute("data-aids-field");
            // If it's a list, parsed back as array of items
            const listItems = Array.from(e.target.querySelectorAll("li")).map(li => li.innerText);
            State.activeLesson.teachingAids[field] = listItems.length > 0 ? listItems : e.target.innerText;
            saveActiveChanges();
        });

        DOM.aidsContentContainer.appendChild(secDiv);
    });
}

function renderCritiqueUI() {
    const audit = State.activeLesson.analytics;
    if (!audit || !audit.critique) {
        DOM.critiqueFeedbackList.innerHTML = `<li>No critique audit available for this lesson.</li>`;
        return;
    }

    const crit = audit.critique;

    // Set Scores
    setCircularScore("engagement", crit.engagement_score || 80);
    setCircularScore("clarity", crit.clarity_score || 80);
    setCircularScore("alignment", crit.alignment_score || 80);

    // Bullet feedback
    DOM.critiqueFeedbackList.innerHTML = "";
    let bullets = crit.feedback;
    if (typeof bullets === "string") {
        bullets = bullets.split("\n").filter(line => line.trim().length > 0);
    }
    
    if (Array.isArray(bullets)) {
        bullets.forEach(bullet => {
            const li = document.createElement("li");
            li.textContent = bullet.replace(/^[-*•\s\d.]+\s*/, ""); // Strip leading bullet chars
            DOM.critiqueFeedbackList.appendChild(li);
        });
    }
}

function setCircularScore(type, score) {
    const ring = document.getElementById(`score-ring-${type}`);
    const txt = document.getElementById(`score-text-${type}`);
    
    // stroke-dasharray circumfarance is 100 in our SVG path layout
    ring.setAttribute("stroke-dasharray", `${score}, 100`);
    txt.textContent = `${score}%`;
}

// --- Active Lesson Save Changes ---
async function autoSaveActiveLesson() {
    const lesson = State.activeLesson;
    if (!lesson) return;

    const payload = {
        subject: lesson.subject,
        topic: lesson.topic,
        classLevel: lesson.classLevel,
        duration: lesson.duration,
        objectives: typeof lesson.objectives === "string" ? lesson.objectives : JSON.stringify(lesson.objectives),
        resources: typeof lesson.resources === "string" ? lesson.resources : JSON.stringify(lesson.resources),
        title: lesson.title,
        lessonPlan: lesson.lessonPlan,
        assessments: lesson.assessments,
        teachingAids: lesson.teachingAids,
        analytics: lesson.analytics
    };

    try {
        const res = await Api.saveLesson(payload);
        State.activeLesson.id = res.id;
        DOM.saveStatusText.textContent = "Saved locally";
    } catch (err) {
        console.error("Auto-save failed:", err);
    }
}

async function saveActiveChanges(manual = false) {
    const lesson = State.activeLesson;
    if (!lesson) return;

    // Pull modifications from UI DOM
    lesson.lessonPlan.objectives = parseHtmlToListArray(DOM.editObjectives.innerHTML);
    lesson.lessonPlan.introduction = parseHtmlToText(DOM.editIntroduction.innerHTML);
    lesson.lessonPlan.teacher_activities = parseHtmlToText(DOM.editTeacherActivities.innerHTML);
    lesson.lessonPlan.student_activities = parseHtmlToText(DOM.editStudentActivities.innerHTML);
    lesson.lessonPlan.teaching_methods = parseHtmlToText(DOM.editMethods.innerHTML);
    lesson.lessonPlan.assessment_plan = parseHtmlToText(DOM.editAssessmentPlan.innerHTML);
    lesson.lessonPlan.assignment = parseHtmlToText(DOM.editAssignment.innerHTML);
    lesson.lessonPlan.summary = parseHtmlToText(DOM.editSummary.innerHTML);

    DOM.saveStatusText.textContent = "Saving...";

    const payload = {
        subject: lesson.subject,
        topic: lesson.topic,
        classLevel: lesson.classLevel,
        duration: lesson.duration,
        title: lesson.title,
        lessonPlan: lesson.lessonPlan,
        assessments: lesson.assessments,
        teachingAids: lesson.teachingAids,
        analytics: lesson.analytics
    };

    try {
        if (lesson.id) {
            await Api.updateLesson(lesson.id, payload);
            DOM.saveStatusText.textContent = "Saved locally";
            if (manual) showNotification("Changes saved successfully!", "success");
        } else {
            // If somehow not saved yet
            await autoSaveActiveLesson();
        }
    } catch (err) {
        DOM.saveStatusText.textContent = "Save failed";
        if (manual) showNotification(`Save failed: ${err.message}`, "error");
    }
}

function applyOptimizedAudit() {
    const lesson = State.activeLesson;
    if (!lesson || !lesson.analytics || !lesson.analytics.optimized_lesson_plan) {
        showNotification("No optimized critique version available.", "error");
        return;
    }

    if (confirm("Are you sure you want to apply the optimized version? This will overwrite the current outline edits.")) {
        lesson.lessonPlan = lesson.analytics.optimized_lesson_plan;
        
        // Re-inject Plan fields
        populateWorkspaceUI();
        saveActiveChanges();
        
        showNotification("Applied auditor optimizations!", "success");
    }
}

// --- Specific Section Regeneration ---
async function regenerateSection(sectionName) {
    const lesson = State.activeLesson;
    if (!lesson) return;

    const btn = document.querySelector(`.section-regen-btn[data-sec-name="${sectionName}"]`);
    if (btn) btn.classList.add("loading");

    showNotification(`Regenerating ${sectionName.replace('_', ' ')}...`, "info");

    const payload = {
        apiKey: localStorage.getItem("gemini_api_key") || "",
        subject: lesson.subject,
        topic: lesson.topic,
        classLevel: lesson.classLevel,
        duration: lesson.duration,
        objectives: typeof lesson.objectives === "string" ? lesson.objectives : JSON.stringify(lesson.objectives),
        resources: typeof lesson.resources === "string" ? lesson.resources : JSON.stringify(lesson.resources)
    };

    try {
        // Fetch fresh full lesson plan and pull just the single section requested
        const freshPlan = await Api.generateLesson(
            payload.subject,
            payload.topic,
            payload.classLevel,
            payload.duration,
            payload.objectives,
            payload.resources
        );

        const freshSectionData = freshPlan[sectionName];
        if (freshSectionData) {
            lesson.lessonPlan[sectionName] = freshSectionData;
            
            // Re-populate just that UI field
            if (sectionName === "objectives") {
                DOM.editObjectives.innerHTML = formatArrayOrTextToListHTML(freshSectionData);
            } else {
                const targetDOMEl = document.getElementById(`edit-${sectionName}`) || document.getElementById(`edit-${sectionName.replace('assessment_plan', 'assessment-plan').replace('teaching_methods', 'methods')}`);
                if (targetDOMEl) {
                    targetDOMEl.innerHTML = formatTextToParagraphsHTML(freshSectionData);
                }
            }

            saveActiveChanges();
            showNotification(`Regenerated section successfully!`, "success");
        }
    } catch (err) {
        showNotification(`Regeneration failed: ${err.message}`, "error");
    } finally {
        if (btn) btn.classList.remove("loading");
    }
}

async function regenerateAssessments() {
    const lesson = State.activeLesson;
    if (!lesson) return;

    DOM.btnRegenAssessments.disabled = true;
    showNotification("Regenerating assessments...", "info");

    try {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        const freshAssessments = await Api.generateAssessment(lesson.topic, lesson.classLevel, difficulty);
        
        lesson.assessments = freshAssessments;
        renderAssessmentsUI();
        saveActiveChanges();
        
        showNotification("Assessments regenerated successfully!", "success");
    } catch (err) {
        showNotification(`Failed: ${err.message}`, "error");
    } finally {
        DOM.btnRegenAssessments.disabled = false;
    }
}

async function regenerateAids() {
    const lesson = State.activeLesson;
    if (!lesson) return;

    DOM.btnRegenAids.disabled = true;
    showNotification("Regenerating teaching aids...", "info");

    try {
        const freshAids = await Api.generateResources(lesson.topic, lesson.classLevel);
        
        lesson.teachingAids = freshAids;
        renderAidsUI();
        saveActiveChanges();
        
        showNotification("Teaching aids regenerated successfully!", "success");
    } catch (err) {
        showNotification(`Failed: ${err.message}`, "error");
    } finally {
        DOM.btnRegenAids.disabled = false;
    }
}

// --- Text Formatting Helpers ---
function escapeHtml(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatArrayOrTextToListHTML(input) {
    if (!input) return "";
    if (Array.isArray(input)) {
        return `<ul>` + input.map(item => `<li>${escapeHtml(item)}</li>`).join("") + `</ul>`;
    }
    return formatTextToParagraphsHTML(input);
}

function formatTextToParagraphsHTML(text) {
    if (!text) return "";
    return text.split("\n")
        .filter(line => line.trim().length > 0)
        .map(p => {
            const trimmed = p.trim();
            if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                return `<li>${escapeHtml(trimmed.substring(1).trim())}</li>`;
            }
            if (/^\d+\.\s+/.test(trimmed)) {
                return `<li>${escapeHtml(trimmed.replace(/^\d+\.\s+/, ""))}</li>`;
            }
            return `<p style="margin-bottom: 8px;">${escapeHtml(p)}</p>`;
        })
        .join("");
}

function parseHtmlToListArray(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const items = Array.from(temp.querySelectorAll("li")).map(li => li.innerText.trim());
    if (items.length > 0) return items;
    return html.replace(/<[^>]*>/g, "\n").split("\n").map(l => l.trim()).filter(l => l.length > 0);
}

function parseHtmlToText(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    
    // Replace paragraphs with newlines
    temp.querySelectorAll("p").forEach(p => {
        p.innerHTML = p.innerHTML + "\n";
    });
    temp.querySelectorAll("li").forEach(li => {
        li.innerHTML = "- " + li.innerHTML + "\n";
    });
    
    return temp.innerText.trim();
}

// --- Loading Panel Helpers ---
function resetLoadingSteps() {
    const steps = ["load-step-1", "load-step-2", "load-step-3", "load-step-4"];
    steps.forEach(id => {
        setStepStatus(id, "idle");
    });
}

function setStepStatus(id, status) {
    const el = document.getElementById(id);
    let iconName = "circle";
    let extraClass = "";
    
    if (status === "current") {
        el.className = "step-check current";
        iconName = "loader-2";
        extraClass = "spin-animate";
    } else if (status === "done") {
        el.className = "step-check done";
        iconName = "check-circle";
    } else {
        el.className = "step-check";
    }
    
    const labelSpan = el.querySelector("span");
    const labelText = labelSpan ? labelSpan.innerText : "";
    
    el.innerHTML = `<i data-lucide="${iconName}" class="${extraClass}"></i> <span>${escapeHtml(labelText)}</span>`;
    lucide.createIcons({ attrs: { "data-lucide": true } });
}

function resetGeneratorForm() {
    DOM.wizardForm.reset();
    DOM.workspaceEmpty.classList.remove("hidden");
    DOM.workspaceActive.classList.add("hidden");
    DOM.workspaceLoading.classList.add("hidden");
}

// --- Toast Notifications ---
function showNotification(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type} glass`;
    
    let iconName = "info";
    if (type === "success") iconName = "check-circle";
    if (type === "error") iconName = "alert-circle";
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    lucide.createIcons({ attrs: { "data-lucide": true } });
    
    // Add toast css class properties on-the-fly dynamically
    Object.assign(toast.style, {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        padding: "12px 24px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: type === "error" ? "var(--danger)" : (type === "success" ? "var(--success-dark)" : "var(--primary-dark)"),
        borderLeft: `5px solid ${type === "error" ? "var(--danger)" : (type === "success" ? "var(--success)" : "var(--primary)")}`,
        backgroundColor: "#ffffff",
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        zIndex: "9999",
        animation: "slide-in 0.3s forwards",
        fontFamily: "var(--font-inter)",
        fontSize: "0.88rem",
        fontWeight: "500"
    });

    setTimeout(() => {
        toast.style.animation = "slide-out 0.3s forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add slide keyframes directly to stylesheet or in a style tag
const style = document.createElement("style");
style.innerHTML = `
    @keyframes slide-in {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
    }
    .spin-animate {
        animation: spin 1.2s linear infinite;
    }
    .toast-notification i {
        width: 18px;
        height: 18px;
    }
`;
document.head.appendChild(style);
