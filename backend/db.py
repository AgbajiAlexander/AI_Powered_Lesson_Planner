import sqlite3
import json
import os
from datetime import datetime

DATABASE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lessons.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            topic TEXT NOT NULL,
            class_level TEXT NOT NULL,
            duration TEXT NOT NULL,
            objectives TEXT,
            resources TEXT,
            title TEXT,
            lesson_plan TEXT,        -- JSON string of complete lesson plan details
            assessments TEXT,        -- JSON string of assessment questions
            teaching_aids TEXT,      -- JSON string of classroom aids/games
            analytics TEXT,          -- JSON string of critique results
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_lesson(subject, topic, class_level, duration, objectives, resources, title, lesson_plan, assessments, teaching_aids, analytics):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if we should serialize dictionaries/lists
    objectives_str = json.dumps(objectives) if isinstance(objectives, (list, dict)) else objectives
    resources_str = json.dumps(resources) if isinstance(resources, (list, dict)) else resources
    lesson_plan_str = json.dumps(lesson_plan) if isinstance(lesson_plan, (list, dict)) else lesson_plan
    assessments_str = json.dumps(assessments) if isinstance(assessments, (list, dict)) else assessments
    teaching_aids_str = json.dumps(teaching_aids) if isinstance(teaching_aids, (list, dict)) else teaching_aids
    analytics_str = json.dumps(analytics) if isinstance(analytics, (list, dict)) else analytics

    cursor.execute("""
        INSERT INTO lessons (subject, topic, class_level, duration, objectives, resources, title, lesson_plan, assessments, teaching_aids, analytics, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    """, (subject, topic, class_level, duration, objectives_str, resources_str, title, lesson_plan_str, assessments_str, teaching_aids_str, analytics_str))
    
    lesson_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return lesson_id

def get_lesson(lesson_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        result = dict(row)
        # Parse JSON fields back to objects
        for field in ['objectives', 'resources', 'lesson_plan', 'assessments', 'teaching_aids', 'analytics']:
            if result.get(field):
                try:
                    result[field] = json.loads(result[field])
                except json.JSONDecodeError:
                    pass  # Keep as raw text if not valid JSON
        return result
    return None

def list_lessons(search_query=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if search_query:
        # Search by subject, topic, title
        query = "%" + search_query + "%"
        cursor.execute("""
            SELECT id, subject, topic, class_level, duration, title, created_at 
            FROM lessons 
            WHERE subject LIKE ? OR topic LIKE ? OR title LIKE ? 
            ORDER BY created_at DESC
        """, (query, query, query))
    else:
        cursor.execute("""
            SELECT id, subject, topic, class_level, duration, title, created_at 
            FROM lessons 
            ORDER BY created_at DESC
        """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_lesson(lesson_id, subject, topic, class_level, duration, title, lesson_plan, assessments=None, teaching_aids=None, analytics=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    lesson_plan_str = json.dumps(lesson_plan) if isinstance(lesson_plan, (list, dict)) else lesson_plan
    assessments_str = json.dumps(assessments) if isinstance(assessments, (list, dict)) else assessments
    teaching_aids_str = json.dumps(teaching_aids) if isinstance(teaching_aids, (list, dict)) else teaching_aids
    analytics_str = json.dumps(analytics) if isinstance(analytics, (list, dict)) else analytics

    cursor.execute("""
        UPDATE lessons 
        SET subject = ?, topic = ?, class_level = ?, duration = ?, title = ?, lesson_plan = ?, assessments = ?, teaching_aids = ?, analytics = ?, updated_at = datetime('now')
        WHERE id = ?
    """, (subject, topic, class_level, duration, title, lesson_plan_str, assessments_str, teaching_aids_str, analytics_str, lesson_id))
    
    conn.commit()
    conn.close()

def delete_lesson(lesson_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM lessons WHERE id = ?", (lesson_id,))
    conn.commit()
    conn.close()

def duplicate_lesson(lesson_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,))
    row = cursor.fetchone()
    if row:
        data = dict(row)
        cursor.execute("""
            INSERT INTO lessons (subject, topic, class_level, duration, objectives, resources, title, lesson_plan, assessments, teaching_aids, analytics, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (
            data['subject'], 
            data['topic'] + " (Copy)", 
            data['class_level'], 
            data['duration'], 
            data['objectives'], 
            data['resources'], 
            data['title'] + " (Copy)" if data['title'] else None,
            data['lesson_plan'], 
            data['assessments'], 
            data['teaching_aids'], 
            data['analytics']
        ))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return new_id
    conn.close()
    return None
