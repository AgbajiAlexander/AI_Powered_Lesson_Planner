/**
 * Helper utilities for exporting lesson packages to PDF (Print) and Word (.docx).
 */

export const DocExport = {
    /**
     * Prepares and triggers browser print layout to export the lesson plan as a PDF.
     */
    exportToPDF(lesson) {
        const printContainer = document.getElementById("print-layout-container");
        if (!printContainer) return;

        // Build structured print layout
        let html = `
            <div class="print-lesson-title">${escapeHtml(lesson.title || "Lesson Plan")}</div>
            <div class="print-meta-grid">
                <div class="print-meta-item"><strong>Subject:</strong> ${escapeHtml(lesson.subject)}</div>
                <div class="print-meta-item"><strong>Level:</strong> ${escapeHtml(lesson.classLevel)}</div>
                <div class="print-meta-item"><strong>Duration:</strong> ${escapeHtml(lesson.duration)}</div>
            </div>
            
            <div class="print-section">
                <h2>Learning Objectives</h2>
                <div>${formatAsPrintList(lesson.lessonPlan.objectives)}</div>
            </div>

            <div class="print-section">
                <h2>Hook & Introduction</h2>
                <div>${formatAsPrintParagraphs(lesson.lessonPlan.introduction)}</div>
            </div>

            <div class="print-two-col">
                <div class="print-section">
                    <h2>Teacher Activities</h2>
                    <div>${formatAsPrintParagraphs(lesson.lessonPlan.teacher_activities)}</div>
                </div>
                <div class="print-section">
                    <h2>Student Activities</h2>
                    <div>${formatAsPrintParagraphs(lesson.lessonPlan.student_activities)}</div>
                </div>
            </div>

            <div class="print-section">
                <h2>Teaching Methods</h2>
                <div>${formatAsPrintParagraphs(lesson.lessonPlan.teaching_methods)}</div>
            </div>

            <div class="print-section">
                <h2>Formative Assessment Plan</h2>
                <div>${formatAsPrintParagraphs(lesson.lessonPlan.assessment_plan)}</div>
            </div>

            <div class="print-section">
                <h2>Assignment / Homework</h2>
                <div>${formatAsPrintParagraphs(lesson.lessonPlan.assignment)}</div>
            </div>

            <div class="print-section">
                <h2>Summary & Closing</h2>
                <div>${formatAsPrintParagraphs(lesson.lessonPlan.summary)}</div>
            </div>
        `;

        // Append Chained Assessments if they exist
        if (lesson.assessments && lesson.assessments.length > 0) {
            html += `
                <div style="page-break-before: always;"></div>
                <div class="print-lesson-title">Assessment Questions</div>
                <div class="print-meta-grid" style="margin-bottom: 20px;">
                    <div class="print-meta-item"><strong>Topic:</strong> ${escapeHtml(lesson.topic)}</div>
                    <div class="print-meta-item"><strong>Questions:</strong> 10 Items</div>
                    <div class="print-meta-item"><strong>Level:</strong> ${escapeHtml(lesson.classLevel)}</div>
                </div>
            `;

            lesson.assessments.forEach((q, idx) => {
                html += `
                    <div class="print-section" style="page-break-inside: avoid; margin-bottom: 12pt;">
                        <p><strong>Question ${idx + 1} (${q.type})</strong></p>
                        <p style="margin: 4pt 0 8pt 0;">${escapeHtml(q.question)}</p>
                `;
                
                if (q.options && q.options.length > 0) {
                    html += `<ul style="list-style-type: none; margin-left: 20px; margin-bottom: 8pt;">`;
                    q.options.forEach(opt => {
                        html += `<li style="margin-bottom: 3pt;">[ ] ${escapeHtml(opt)}</li>`;
                    });
                    html += `</ul>`;
                }

                html += `
                        <p style="font-size: 9pt; color: #555;"><strong>Correct Answer:</strong> ${escapeHtml(q.answer)}</p>
                        <p style="font-size: 9pt; color: #555;"><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</p>
                    </div>
                `;
            });
        }

        // Append Teaching Aids if they exist
        if (lesson.teachingAids) {
            html += `
                <div style="page-break-before: always;"></div>
                <div class="print-lesson-title">Teaching Aids & Resource Guide</div>
                
                <div class="print-section">
                    <h2>Low-Cost Classroom Demonstrations</h2>
                    <div>${formatAsPrintList(lesson.teachingAids.demonstrations)}</div>
                </div>

                <div class="print-section">
                    <h2>Interactive Educational Games</h2>
                    <div>${formatAsPrintList(lesson.teachingAids.games)}</div>
                </div>

                <div class="print-section">
                    <h2>Visual Aids Outline</h2>
                    <div>${formatAsPrintList(lesson.teachingAids.visual_aids)}</div>
                </div>

                <div class="print-section">
                    <h2>Localized Examples</h2>
                    <div>${formatAsPrintList(lesson.teachingAids.local_examples)}</div>
                </div>

                <div class="print-section">
                    <h2>Recommended Video Searches</h2>
                    <div>${formatAsPrintList(lesson.teachingAids.video_recommendations)}</div>
                </div>
            `;
        }

        printContainer.innerHTML = html;
        window.print();
    },

    /**
     * Exports the lesson plan package as a rich Word (.doc/.docx) file.
     * Uses standard Microsoft Office HTML layout to download native files.
     */
    exportToWord(lesson) {
        const title = lesson.title || "Lesson Plan";
        const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.doc`;
        
        let wordContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <title>${escapeHtml(title)}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; line-height: 1.5; color: #333333; }
                    h1 { font-family: 'Georgia', serif; font-size: 24pt; color: #1f2937; text-align: center; margin-bottom: 20px; }
                    h2 { font-size: 16pt; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 30px; }
                    h3 { font-size: 13pt; color: #1e293b; margin-top: 20px; }
                    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .meta-table td { padding: 8px; border: 1px solid #e5e7eb; }
                    .two-col-table { width: 100%; border-collapse: collapse; }
                    .two-col-table td { width: 50%; padding: 12px; border: 1px solid #e5e7eb; valign: top; }
                    ul, ol { margin-left: 20px; }
                    li { margin-bottom: 6px; }
                    .alert { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 20px; }
                    .footer { text-align: center; font-size: 9pt; color: #94a3b8; margin-top: 40px; }
                </style>
            </head>
            <body>
                <h1>${escapeHtml(title)}</h1>
                
                <table class="meta-table">
                    <tr>
                        <td><strong>Subject:</strong> ${escapeHtml(lesson.subject)}</td>
                        <td><strong>Class Level:</strong> ${escapeHtml(lesson.classLevel)}</td>
                        <td><strong>Duration:</strong> ${escapeHtml(lesson.duration)}</td>
                    </tr>
                </table>

                <div class="alert">
                    <strong>Disclaimer:</strong> Teacher Review Required. AI-generated lesson content should be reviewed before classroom use.
                </div>

                <h2>1. Learning Objectives</h2>
                ${formatAsHtmlContent(lesson.lessonPlan.objectives)}

                <h2>2. Hook & Introduction</h2>
                ${formatAsHtmlContent(lesson.lessonPlan.introduction)}

                <h2>3. Instructional Flow (Activities)</h2>
                <table class="two-col-table">
                    <tr>
                        <td bgcolor="#f8fafc"><strong>Teacher Activities</strong></td>
                        <td bgcolor="#f8fafc"><strong>Student Activities</strong></td>
                    </tr>
                    <tr>
                        <td>${formatAsHtmlContent(lesson.lessonPlan.teacher_activities)}</td>
                        <td>${formatAsHtmlContent(lesson.lessonPlan.student_activities)}</td>
                    </tr>
                </table>

                <h2>4. Pedagogical Specifications</h2>
                <h3>Teaching Methods</h3>
                ${formatAsHtmlContent(lesson.lessonPlan.teaching_methods)}

                <h3>Formative Assessment Plan</h3>
                ${formatAsHtmlContent(lesson.lessonPlan.assessment_plan)}

                <h2>5. Wrap Up & Closing</h2>
                <h3>Summary</h3>
                ${formatAsHtmlContent(lesson.lessonPlan.summary)}

                <h3>Homework / Assignment</h3>
                ${formatAsHtmlContent(lesson.lessonPlan.assignment)}
        `;

        if (lesson.assessments && lesson.assessments.length > 0) {
            wordContent += `
                <br style="page-break-before: always;" />
                <h1>Chained Quiz & Assessment</h2>
                <p><strong>Topic:</strong> ${escapeHtml(lesson.topic)} | <strong>Level:</strong> ${escapeHtml(lesson.classLevel)}</p>
                <hr />
            `;

            lesson.assessments.forEach((q, idx) => {
                wordContent += `
                    <h3>Question ${idx + 1} (${q.type})</h3>
                    <p>${escapeHtml(q.question)}</p>
                `;

                if (q.options && q.options.length > 0) {
                    wordContent += `<ul>`;
                    q.options.forEach(opt => {
                        wordContent += `<li>[ ] ${escapeHtml(opt)}</li>`;
                    });
                    wordContent += `</ul>`;
                }

                wordContent += `
                    <p style="margin-top: 5px; font-size: 10pt; color: #555555;">
                        <strong>Correct Answer:</strong> ${escapeHtml(q.answer)}<br/>
                        <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
                    </p>
                `;
            });
        }

        if (lesson.teachingAids) {
            wordContent += `
                <br style="page-break-before: always;" />
                <h1>Teaching Aids & Activity Guide</h2>
                
                <h2>Classroom Demonstrations</h2>
                ${formatAsHtmlContent(lesson.teachingAids.demonstrations)}

                <h2>Educational Games</h2>
                ${formatAsHtmlContent(lesson.teachingAids.games)}

                <h2>Visual Aids Guidelines</h2>
                ${formatAsHtmlContent(lesson.teachingAids.visual_aids)}

                <h2>Localized Community Examples</h2>
                ${formatAsHtmlContent(lesson.teachingAids.local_examples)}

                <h2>Search Keywords / Video Resources</h2>
                ${formatAsHtmlContent(lesson.teachingAids.video_recommendations)}
            `;
        }

        wordContent += `
                <div class="footer">Generated by AI Lesson Architect - Professional Educator Workspace</div>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + wordContent], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Helper Functions
function escapeHtml(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatAsPrintList(items) {
    if (!items) return "";
    if (Array.isArray(items)) {
        return `<ul style="list-style-type: square; margin-left: 20px;">` + 
            items.map(item => `<li style="margin-bottom: 4pt;">${escapeHtml(item)}</li>`).join("") + 
            `</ul>`;
    }
    return formatAsPrintParagraphs(items);
}

function formatAsPrintParagraphs(text) {
    if (!text) return "";
    return text.split("\n")
        .filter(p => p.trim().length > 0)
        .map(p => {
            if (p.trim().startsWith("-") || p.trim().startsWith("*")) {
                return `<li style="margin-left: 20px; margin-bottom: 4pt;">${escapeHtml(p.replace(/^[-*]\s*/, ""))}</li>`;
            }
            return `<p style="margin-bottom: 6pt;">${escapeHtml(p)}</p>`;
        }).join("");
}

function formatAsHtmlContent(input) {
    if (!input) return "";
    if (Array.isArray(input)) {
        return `<ul>` + input.map(item => `<li>${escapeHtml(item)}</li>`).join("") + `</ul>`;
    }
    return input.split("\n")
        .filter(p => p.trim().length > 0)
        .map(p => {
            const trimmed = p.trim();
            if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                return `<li>${escapeHtml(trimmed.substring(1).trim())}</li>`;
            }
            if (/^\d+\.\s+/.test(trimmed)) {
                return `<li>${escapeHtml(trimmed.replace(/^\d+\.\s+/, ""))}</li>`;
            }
            return `<p>${escapeHtml(p)}</p>`;
        })
        .join("");
}
