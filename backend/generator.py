import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Predefined personas and system instructions based on the System Instructions file
PERSONAS = {
    "Primary": (
        "You are an empathetic, highly creative Primary School Instructional Coach specializing in early "
        "childhood and elementary education. Your goal is to help teachers like Grace design engaging, "
        "interactive, and child-friendly lesson components. Keep language simple, focus heavily on "
        "gamified learning, hands-on activities, and clear, bite-sized explanations. Avoid overly "
        "dense text or academic jargon, ensuring everything generated maximizes student engagement and "
        "manages short attention spans."
    ),
    "Secondary": (
        "You are a rigorous Secondary School Curriculum Specialist. Your objective is to help high school "
        "teachers design lesson structures that map perfectly to national and regional educational "
        "curricula. Prioritize practical demonstrations, real-world applications of abstract concepts, "
        "and examination-style preparation. Ensure the academic depth is appropriate for adolescent "
        "learners preparing for transition into tertiary education."
    ),
    "University": (
        "You are a University Professor and Senior Academic Consultant. Your role is to assist university "
        "lecturers and instructional designers like David in creating advanced, structured lecture notes, "
        "clear higher-level learning outcomes, and deeply analytical discussion questions. Your tone "
        "should be highly professional, scholarly, and sophisticated, focusing on fostering critical "
        "thinking, research skills, and comprehensive domain mastery."
    ),
    "Tutor": (
        "You are an Adaptive Private Tutor Consultant. Your focus is on hyper-personalized, fast lesson "
        "preparation for one-on-one or small group tutoring environments. When generating materials, "
        "prioritize high-impact, flexible activities that can adapt instantly to a student's immediate "
        "feedback, focusing on clearing up common misconceptions rapidly and providing accelerated "
        "pacing options."
    ),
    "Default": (
        "You are an expert AI curriculum planner and instructional designer tailored for the African "
        "educational landscape. Your primary role is to interact with educators to gather essential lesson "
        "data. Be encouraging, clear, and structured. Maintain an empathetic, professional tone that values "
        "the teacher's time."
    )
}

# Strict Anti-Hallucination Guardrail
SAFETY_GUARDRAIL = (
    "\n\nCRITICAL SAFETY RULE: You must act under the strict Anti-Hallucination Guardrail. "
    "Eliminate hallucinated content and factual errors across STEM, humanities, and vocational studies. "
    "If a fact, scientific process, historical date, or formula cannot be verified with absolute certainty, "
    "do not include it, or rephrase it to ensure 100% academic accuracy and curriculum compliance. "
    "Include a 'Teacher Review Required: AI-generated lesson content should be reviewed before classroom use' "
    "disclaimer tag in your output."
)

def get_gemini_client(api_key=None):
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    genai.configure(api_key=key)
    return genai

def generate_lesson_plan(api_key, subject, topic, class_level, duration, objectives, resources):
    """
    Workflow Step 2: Chain-of-Thought Lesson Planner
    Uses Role-Based prompting based on the target class level.
    """
    client = get_gemini_client(api_key)
    if not client:
        return get_mock_lesson(subject, topic, class_level, duration, objectives, resources)

    system_instruction = PERSONAS.get(class_level, PERSONAS["Default"]) + SAFETY_GUARDRAIL
    
    prompt = f"""
    Create a detailed lesson plan based on the following inputs:
    - Subject: {subject}
    - Topic: {topic}
    - Class Level: {class_level}
    - Duration: {duration}
    - Stated Objectives (if any): {objectives or "None provided, please generate appropriate ones"}
    - Available Resources (if any): {resources or "None provided, assume low-cost resources"}

    Think step-by-step using a Chain-of-Thought approach to create a comprehensive lesson plan.
    You must output your response in JSON format. The JSON schema must contain the following keys:
    - title: A catchy, professional lesson title.
    - objectives: A list of 3 to 5 SMART (Specific, Measurable, Achievable, Relevant, Time-bound) learning objectives.
    - introduction: A set induction/hook activity to capture student interest.
    - teacher_activities: Step-by-step instructional flow of what the teacher does.
    - student_activities: Step-by-step active participation activities for students.
    - teaching_methods: Recommended pedagogical approaches (e.g., inquiry-based learning, cooperative learning).
    - assessment_plan: Formative checking-for-understanding strategies during the lesson.
    - assignment: Homework or a follow-up extension task.
    - summary: Closing remarks or a summary activity.
    - disclaimer: The safety disclaimer 'Teacher Review Required: AI-generated lesson content should be reviewed before classroom use'.
    """

    try:
        model = client.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error (Lesson Gen): {e}")
        # Fallback to text generation if json format fails
        try:
            response = model.generate_content(prompt)
            # Simple text parsing fallback
            return {
                "title": f"Lesson: {topic}",
                "objectives": [objectives] if objectives else ["Understand " + topic],
                "introduction": "Hook the students with a question about " + topic,
                "teacher_activities": response.text,
                "student_activities": "Engage with the content and ask questions.",
                "teaching_methods": "Direct instruction and discussion",
                "assessment_plan": "Ask review questions at the end of class.",
                "assignment": "Read more about " + topic,
                "summary": "Review the main points.",
                "disclaimer": "Teacher Review Required: AI-generated lesson content should be reviewed before classroom use"
            }
        except Exception:
            return get_mock_lesson(subject, topic, class_level, duration, objectives, resources)

def generate_assessments(api_key, topic, class_level, difficulty):
    """
    Workflow Step 3: Few-Shot Assessment Builder
    Generates exactly 10 questions based on difficulty.
    """
    client = get_gemini_client(api_key)
    if not client:
        return get_mock_assessments(topic, difficulty)

    system_instruction = (
        "You are an Educational Psychometrician and Assessment Expert. Your task is to generate exactly 10 "
        "targeted assessment questions based on the provided topic, class level, and difficulty. "
        "You must output a balanced mix of Multiple Choice Questions (MCQs), Short Answer Questions, "
        "Essay Questions, and Practical Activities. Each question must include an answer key or rubric."
    )

    few_shot_examples = """
    Example Output Format:
    [
      {
        "id": 1,
        "type": "MCQ",
        "question": "What is 1/2 + 1/4?",
        "options": ["1/6", "3/4", "2/6", "1/8"],
        "answer": "3/4",
        "explanation": "To add fractions, find a common denominator. 1/2 becomes 2/4. 2/4 + 1/4 = 3/4."
      },
      {
        "id": 2,
        "type": "Short Answer",
        "question": "Define a fraction in your own words.",
        "answer": "A fraction represents a part of a whole.",
        "explanation": "Any answer indicating parts of a whole or ratio is correct."
      },
      {
        "id": 3,
        "type": "Practical",
        "question": "Shade exactly one-third of the circle provided.",
        "answer": "Circle divided into 3 equal parts, with 1 part shaded.",
        "explanation": "Checks spatial understanding of thirds."
      }
    ]
    """

    prompt = f"""
    Generate exactly 10 assessment questions for:
    - Topic: {topic}
    - Class Level: {class_level}
    - Difficulty: {difficulty} (Beginner, Intermediate, Advanced)

    Use the following few-shot examples to model your JSON structure:
    {few_shot_examples}

    Output the result as a raw JSON array containing exactly 10 questions matching this schema. Make sure options are provided only for MCQ types.
    """

    try:
        model = client.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error (Assessment Gen): {e}")
        return get_mock_assessments(topic, difficulty)

def generate_teaching_aids(api_key, topic, class_level):
    """
    Workflow Step 4: Teaching Aid & Resource Creator
    Generates demonstrations, games, visuals, search terms, and real-life examples.
    """
    client = get_gemini_client(api_key)
    if not client:
        return get_mock_teaching_aids(topic)

    system_instruction = (
        "You are an Innovative Teaching Aid and Resource Designer. Your goal is to maximize classroom "
        "engagement and clarity by providing teachers with an array of supporting resources. "
        "Focus on cost-effective, localized, and digital teaching aids suitable for the classroom context."
    )

    prompt = f"""
    Create classroom resources and teaching aids for:
    - Topic: {topic}
    - Class Level: {class_level}

    Generate a JSON object with the following keys:
    - demonstrations: A list of 2-3 low-cost, easy-to-source hands-on demonstrations.
    - games: A list of 1-2 interactive educational classroom games or active learning group events.
    - visual_aids: Concept descriptions or sketches for visual aids (charts, diagrams, whiteboard layouts).
    - video_recommendations: 2-3 specific video topics or search prompts for YouTube/web to find great educational video clips.
    - local_examples: 2-3 highly relatable, localized, real-life examples that connect this topic to students' everyday lives.
    """

    try:
        model = client.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error (Aids Gen): {e}")
        return get_mock_teaching_aids(topic)

def improve_lesson_plan(api_key, subject, topic, class_level, lesson_plan):
    """
    Workflow Step 5: Lesson Improvement & Critique Engine
    Analyzes lesson for weaknesses, returns critique scores (1-100) and optimized version.
    """
    client = get_gemini_client(api_key)
    if not client:
        return get_mock_improvement(lesson_plan)

    system_instruction = (
        "You are a critical, constructive Lesson Quality Auditor. Your job is to analyze generated "
        "lesson plans for weaknesses. Evaluate student engagement, clarity, flow, learning objectives, "
        "and assessment quality. Suggest improvements and rewrite the lesson plan details to be much better."
    )

    prompt = f"""
    Analyze and improve the following lesson plan for the topic '{topic}' ({subject}, {class_level}):
    
    Current Lesson Plan Content:
    {json.dumps(lesson_plan)}

    Output your audit and rewritten version in a JSON object with the following structure:
    - critique: {{
        "engagement_score": A score from 1 to 100 for student engagement.
        "clarity_score": A score from 1 to 100 for logical flow and clarity.
        "alignment_score": A score from 1 to 100 for objectives-assessment alignment.
        "feedback": A detailed, bulleted review listing specific weaknesses found and what was improved.
      }}
    - optimized_lesson_plan: A revised version of the lesson plan containing:
        - title: A revised lesson title.
        - objectives: Revised SMART objectives list.
        - introduction: Revised introduction.
        - teacher_activities: Revised step-by-step teacher actions.
        - student_activities: Revised student activities.
        - teaching_methods: Revised teaching methods.
        - assessment_plan: Revised formative assessment strategy.
        - assignment: Revised assignment.
        - summary: Revised summary.
        - disclaimer: 'Teacher Review Required: AI-generated lesson content should be reviewed before classroom use'.
    """

    try:
        model = client.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error (Improve Engine): {e}")
        return get_mock_improvement(lesson_plan)

# --- MOCK FALLBACKS / DEMO MODE DATA GENERATORS ---

def get_mock_lesson(subject, topic, class_level, duration, objectives, resources):
    return {
        "title": f"Unlocking the Power of {topic}",
        "objectives": [
            f"Define the core principles of {topic} with 100% accuracy.",
            f"Explain how {topic} applies to everyday situations.",
            f"Demonstrate the basic application of {topic} in small groups."
        ],
        "introduction": f"Begin with an interactive Hook: Display an intriguing object or run a 3-minute quiz relating to {topic}. Ask students: 'Have you ever wondered how this works in real life?'",
        "teacher_activities": f"1. Explain the fundamental definitions of {topic} using a whiteboard outline.\n2. Work through a live, practical demonstration on the board.\n3. Walk around the classroom to facilitate group discussions, correcting misconceptions in real-time.",
        "student_activities": f"1. Take notes on key terminology in notebooks.\n2. Work in pairs to solve a simple challenge question set by the teacher.\n3. Present pair findings to the rest of the class.",
        "teaching_methods": "Cooperative Learning (pair-share), Inquiry-Based Learning, and Direct Instruction.",
        "assessment_plan": "Observe student pair-share discussions, conduct a thumbs-up/thumbs-down check for understanding, and collect exit tickets at the door.",
        "assignment": f"Research and write down two examples of {topic} found in your home or community. Be ready to share tomorrow.",
        "summary": f"Wrap up the lesson by calling on 3 random students to state one key thing they learned today about {topic}.",
        "disclaimer": "Teacher Review Required: AI-generated lesson content should be reviewed before classroom use"
    }

def get_mock_assessments(topic, difficulty):
    return [
        {
            "id": i,
            "type": "MCQ" if i <= 4 else ("Short Answer" if i <= 7 else ("Essay" if i <= 9 else "Practical")),
            "question": f"Sample {difficulty} question {i} about {topic}?",
            "options": ["Option A", "Option B (Correct)", "Option C", "Option D"] if i <= 4 else None,
            "answer": "Option B (Correct)" if i <= 4 else "This is the sample model answer.",
            "explanation": f"Explanation for question {i} explaining the core concepts of {topic}."
        } for i in range(1, 11)
    ]

def get_mock_teaching_aids(topic):
    return {
        "demonstrations": [
            f"The Balloon Model: Use a simple inflated balloon to demonstrate the expansions of {topic}.",
            f"Paper Clip Chain: Build a chain of paper clips to model the interconnected nodes in {topic}."
        ],
        "games": [
            f"{topic} Jeopardy: A classic quiz game where groups compete to answer increasingly difficult questions.",
            f"Roleplay Tag: Students play active roles representing elements of {topic} interacting with each other."
        ],
        "visual_aids": [
            f"Mind Map Layout: Draw a central circle labeled '{topic}' on the whiteboard with 4 branches for key concepts.",
            f"Process Chart: Create a flow chart showing the step-by-step inputs and outputs of this system."
        ],
        "video_recommendations": [
            f"Search YouTube: '{topic} for Beginners' or 'How {topic} works animation'",
            f"Search Crash Course: '{topic} overview video'"
        ],
        "local_examples": [
            f"Market Dynamics: Use a local market stall as an example of exchange or system flow in {topic}.",
            f"Community Roles: Compare the elements of {topic} to the roles played by community leaders and workers."
        ]
    }

def get_mock_improvement(lesson_plan):
    return {
        "critique": {
            "engagement_score": 85,
            "clarity_score": 90,
            "alignment_score": 95,
            "feedback": (
                "- Added more student-led group tasks to boost active participation (Grace Persona style).\n"
                "- Structured teacher instructions to make transitions clearer.\n"
                "- Aligned exit ticket questions directly with objectives."
            )
        },
        "optimized_lesson_plan": {
            "title": f"Optimized: {lesson_plan.get('title', 'Lesson Plan')}",
            "objectives": lesson_plan.get("objectives", ["Understand the concepts"]),
            "introduction": lesson_plan.get("introduction", "") + " (Enhanced with an introductory reflection question)",
            "teacher_activities": "1. [Improved] Introduce topic with dynamic concept mapping.\n" + lesson_plan.get("teacher_activities", ""),
            "student_activities": "1. [Improved] Collaborate in groups of three on a mini-case study.\n" + lesson_plan.get("student_activities", ""),
            "teaching_methods": lesson_plan.get("teaching_methods", "") + ", Collaborative Case Study",
            "assessment_plan": lesson_plan.get("assessment_plan", "") + " (Enhanced with a peer-evaluation checklist)",
            "assignment": lesson_plan.get("assignment", ""),
            "summary": lesson_plan.get("summary", ""),
            "disclaimer": "Teacher Review Required: AI-generated lesson content should be reviewed before classroom use"
        }
    }
