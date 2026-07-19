import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

MODEL_ID = "gemini-2.0-flash"

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
        "data. Be encouraging, clear, and structured. Maintain an empathetic, professional tone that "
        "values the teacher's time."
    )
}

SAFETY_GUARDRAIL = (
    "\n\nCRITICAL SAFETY RULE: Eliminate hallucinated content and factual errors. "
    "If a fact, scientific process, historical date, or formula cannot be verified with certainty, "
    "do not include it, or rephrase to ensure academic accuracy."
)

def get_client(api_key=None):
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    return genai.Client(api_key=key)


def generate_lesson_plan(api_key, subject, topic, class_level, duration, objectives, resources):
    """
    Workflow Step 2: Chain-of-Thought Lesson Planner with Google Search grounding
    for up-to-date curriculum resources.
    """
    client = get_client(api_key)
    if not client:
        return get_mock_lesson(subject, topic, class_level, duration, objectives, resources)

    persona = PERSONAS.get(class_level, PERSONAS["Default"]) + SAFETY_GUARDRAIL

    prompt = f"""
    {persona}

    Using the latest available educational resources and curriculum standards, create a detailed lesson plan:
    - Subject: {subject}
    - Topic: {topic}
    - Class Level: {class_level}
    - Duration: {duration}
    - Stated Objectives (if any): {objectives or "Generate appropriate SMART objectives"}
    - Available Resources (if any): {resources or "Assume low-cost, widely available classroom resources"}

    Think step-by-step using Chain-of-Thought reasoning. Use your knowledge of current educational best 
    practices and real-world applications.

    Output your response as valid JSON with exactly these keys:
    - title: A catchy, professional lesson title
    - objectives: A list of 3-5 SMART learning objectives
    - introduction: A hook/set-induction activity to capture student interest
    - teacher_activities: Step-by-step instructional flow for the teacher
    - student_activities: Step-by-step active participation activities for students
    - teaching_methods: Recommended pedagogical approaches
    - assessment_plan: Formative checking-for-understanding strategies during the lesson
    - assignment: Homework or follow-up extension task
    - summary: Closing activity or summary remarks
    - current_relevance: How this topic connects to current events or real-world applications today
    - disclaimer: "Teacher Review Required: AI-generated content should be reviewed before classroom use"
    """

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json",
                system_instruction=persona,
            ),
        )
        text = response.text.strip()
        # Strip markdown json fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            return json.loads(response.text)
        except Exception:
            return get_mock_lesson(subject, topic, class_level, duration, objectives, resources)
    except Exception as e:
        print(f"Gemini API Error (Lesson Gen): {e}")
        return get_mock_lesson(subject, topic, class_level, duration, objectives, resources)


def generate_assessments(api_key, topic, class_level, difficulty):
    """
    Workflow Step 3: Few-Shot Assessment Builder with Google Search grounding
    for up-to-date, curriculum-relevant questions.
    """
    client = get_client(api_key)
    if not client:
        return get_mock_assessments(topic, difficulty)

    system_instruction = (
        "You are an Educational Psychometrician and Assessment Expert. Generate exactly 10 "
        "targeted, curriculum-aligned assessment questions. Include a balanced mix of MCQ, "
        "Short Answer, Essay, and Practical Activity types. Each question must include a clear "
        "answer key or rubric. Use current, real-world examples where applicable."
    )

    prompt = f"""
    Generate exactly 10 assessment questions for:
    - Topic: {topic}
    - Class Level: {class_level}
    - Difficulty Level: {difficulty} (Beginner / Intermediate / Advanced)

    Use Google Search to ground questions in current curriculum standards and real-world examples.

    Return a JSON array of exactly 10 objects. Each object must have:
    - id: (integer, 1-10)
    - type: one of "MCQ", "Short Answer", "Essay", or "Practical"
    - question: the question text
    - options: list of 4 options (ONLY for MCQ type, otherwise null)
    - answer: the correct answer or model answer
    - explanation: why this is the answer / marking guidance
    - difficulty: "{difficulty}"
    - real_world_connection: a brief note on how this question connects to real-life scenarios

    Example MCQ format:
    {{
      "id": 1,
      "type": "MCQ",
      "question": "What process do plants use to make food?",
      "options": ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
      "answer": "Photosynthesis",
      "explanation": "Plants use light energy, CO2 and water to produce glucose through photosynthesis.",
      "difficulty": "{difficulty}",
      "real_world_connection": "Solar panels mimic photosynthesis to convert light into energy."
    }}
    """

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json",
                system_instruction=system_instruction,
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)
        # Handle case where JSON is wrapped in an object
        if isinstance(data, dict):
            for v in data.values():
                if isinstance(v, list):
                    return v
        return data
    except Exception as e:
        print(f"Gemini API Error (Assessment Gen): {e}")
        return get_mock_assessments(topic, difficulty)


def generate_teaching_aids(api_key, topic, class_level):
    """
    Workflow Step 4: Teaching Aid & Resource Creator with Google Search grounding.
    Now includes interactive and visual teaching aids with embedded links.
    """
    client = get_client(api_key)
    if not client:
        return get_mock_teaching_aids(topic)

    system_instruction = (
        "You are an Innovative Teaching Aid and Resource Designer specializing in interactive, "
        "visual, and digital learning resources. Generate creative, practical, and engaging "
        "teaching aids using the latest educational technology and pedagogical approaches."
    )

    prompt = f"""
    Create comprehensive teaching aids and interactive resources for:
    - Topic: {topic}
    - Class Level: {class_level}

    Use Google Search to find current, real-world examples and up-to-date educational resources.

    Return a JSON object with exactly these keys:

    - demonstrations: list of 2-3 hands-on, low-cost classroom demonstrations with step-by-step instructions
    - games: list of 2 interactive educational games/activities with rules and learning objectives
    - visual_aids: list of 2-3 visual aid descriptions including:
        * type (e.g. "Mind Map", "Infographic", "Diagram", "Flowchart")
        * description of what to include
        * layout_suggestion (how to arrange it on the board/screen)
    - interactive_activities: list of 2-3 interactive digital or physical activities such as:
        * Kahoot-style quizzes
        * Think-Pair-Share prompts
        * Group simulation activities
        * Role-play scenarios
        Each should include: activity_name, instructions, materials_needed, learning_outcome
    - simulations: list of 1-2 real-world simulations or experiments students can perform
    - video_recommendations: list of 2-3 specific YouTube search queries or named educational videos
        Each should include: search_query, expected_duration, what_to_focus_on
    - local_examples: list of 2-3 highly relatable, localized, real-life examples connecting 
        the topic to students' everyday African/community experiences
    - digital_tools: list of 1-2 free digital tools or apps teachers can use to teach this topic
        (e.g. Google Earth, GeoGebra, PhET simulations, Canva, etc.)
        Each should include: tool_name, url, how_to_use
    """

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json",
                system_instruction=system_instruction,
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        print(f"Gemini API Error (Aids Gen): {e}")
        return get_mock_teaching_aids(topic)


def improve_lesson_plan(api_key, subject, topic, class_level, lesson_plan):
    """
    Workflow Step 5: Lesson Improvement & Critique Engine.
    """
    client = get_client(api_key)
    if not client:
        return get_mock_improvement(lesson_plan)

    system_instruction = (
        "You are a critical, constructive Lesson Quality Auditor and Pedagogical Coach. "
        "Analyze lesson plans using current educational research and best practices. "
        "Provide actionable, specific improvement suggestions."
    )

    prompt = f"""
    Analyze and improve this lesson plan for '{topic}' ({subject}, {class_level}):

    Current Plan:
    {json.dumps(lesson_plan, indent=2)}

    Using Google Search, verify the accuracy of curriculum content and identify any gaps
    based on current educational standards and recent research.

    Return a JSON object with exactly these keys:

    - critique: {{
        "engagement_score": integer 1-100 for student engagement quality,
        "clarity_score": integer 1-100 for logical flow and clarity,
        "alignment_score": integer 1-100 for objectives-assessment alignment,
        "content_accuracy_score": integer 1-100 for factual accuracy based on current sources,
        "feedback": list of specific, actionable improvement points,
        "strengths": list of what the lesson does well
      }}
    - optimized_lesson_plan: A complete, improved version of the lesson plan with all original 
      keys plus any improvements. Must include: title, objectives, introduction, teacher_activities,
      student_activities, teaching_methods, assessment_plan, assignment, summary, current_relevance,
      disclaimer.
    """

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json",
                system_instruction=system_instruction,
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        print(f"Gemini API Error (Improve Engine): {e}")
        return get_mock_improvement(lesson_plan)


# --- MOCK FALLBACKS / DEMO MODE DATA GENERATORS ---

def get_mock_lesson(subject, topic, class_level, duration, objectives, resources):
    return {
        "title": f"Unlocking the Power of {topic}",
        "objectives": [
            f"Define the core principles of {topic} with accuracy.",
            f"Explain how {topic} applies to everyday situations.",
            f"Demonstrate the basic application of {topic} in small groups."
        ],
        "introduction": f"Begin with a Hook: Display an intriguing real-world example relating to {topic}. Ask students: 'Have you ever wondered how this works in everyday life?'",
        "teacher_activities": f"1. Introduce key definitions of {topic} using a concept map on the whiteboard.\n2. Work through a live practical demonstration.\n3. Facilitate group discussions, correcting misconceptions in real-time.",
        "student_activities": f"1. Take notes on key terminology.\n2. Work in pairs to solve a challenge question.\n3. Present findings to the class.",
        "teaching_methods": "Cooperative Learning, Inquiry-Based Learning, and Direct Instruction.",
        "assessment_plan": "Observe pair-share discussions, conduct exit tickets, and use thumbs-up/down checks for understanding.",
        "assignment": f"Research two real-world examples of {topic} found in your community. Be ready to share tomorrow.",
        "summary": f"Closing: Call on 3 random students to state one key thing they learned about {topic} today.",
        "current_relevance": f"{topic} is increasingly relevant in today's world due to rapid technological advances and its direct applications in modern industry and daily life.",
        "disclaimer": "Teacher Review Required: AI-generated lesson content should be reviewed before classroom use"
    }

def get_mock_assessments(topic, difficulty):
    types_cycle = ["MCQ", "MCQ", "MCQ", "MCQ", "Short Answer", "Short Answer", "Short Answer", "Essay", "Essay", "Practical"]
    return [
        {
            "id": i + 1,
            "type": types_cycle[i],
            "question": f"Sample {difficulty} question {i + 1} about {topic}?",
            "options": ["Option A", "Option B (Correct)", "Option C", "Option D"] if types_cycle[i] == "MCQ" else None,
            "answer": "Option B (Correct)" if types_cycle[i] == "MCQ" else "This is the model answer for this question.",
            "explanation": f"This question tests understanding of core concepts in {topic}.",
            "difficulty": difficulty,
            "real_world_connection": f"This concept is directly applied in real-world scenarios related to {topic}."
        }
        for i in range(10)
    ]

def get_mock_teaching_aids(topic):
    return {
        "demonstrations": [
            f"The Balloon Model: Use an inflated balloon to demonstrate key properties related to {topic}.",
            f"Paper Chain: Build a chain of paper clips to model the interconnected elements in {topic}."
        ],
        "games": [
            {
                "name": f"{topic} Jeopardy",
                "description": "A quiz game where groups compete to answer increasingly difficult questions.",
                "rules": "Divide into 3 teams. Each team picks a category and point value. Correct answers earn points.",
                "learning_objective": f"Reinforce knowledge of key {topic} concepts through competitive recall."
            }
        ],
        "visual_aids": [
            {
                "type": "Mind Map",
                "description": f"Central circle labeled '{topic}' with 4 branches for key concepts.",
                "layout_suggestion": "Draw on whiteboard with colored markers. Add icons for visual memory."
            },
            {
                "type": "Flowchart",
                "description": f"A step-by-step process chart showing how {topic} works in sequence.",
                "layout_suggestion": "Use arrows to show cause-and-effect relationships."
            }
        ],
        "interactive_activities": [
            {
                "activity_name": "Think-Pair-Share",
                "instructions": f"Pose a question about {topic}. Students think individually (1 min), discuss with a partner (2 min), then share with the class.",
                "materials_needed": "None — just student pairs",
                "learning_outcome": "Develop critical thinking and communication skills."
            },
            {
                "activity_name": "Gallery Walk",
                "instructions": f"Post 4 stations around the room with {topic} problems/prompts. Groups rotate every 5 minutes.",
                "materials_needed": "Sticky notes, markers, printed prompts",
                "learning_outcome": "Collaborative exploration of multiple perspectives."
            }
        ],
        "simulations": [
            f"Real-world scenario simulation: Students roleplay as professionals using {topic} to solve a community problem."
        ],
        "video_recommendations": [
            {
                "search_query": f"{topic} explained for {topic} beginners animated",
                "expected_duration": "5-8 minutes",
                "what_to_focus_on": "Pay attention to the key definitions and visual diagrams."
            },
            {
                "search_query": f"Crash Course {topic} overview",
                "expected_duration": "10-12 minutes",
                "what_to_focus_on": "Note the real-world examples and historical context provided."
            }
        ],
        "local_examples": [
            f"Market Dynamics: Use a local market to demonstrate exchange or system flow in {topic}.",
            f"Community Roles: Compare elements of {topic} to roles played by community leaders."
        ],
        "digital_tools": [
            {
                "tool_name": "Canva for Education",
                "url": "https://www.canva.com/education/",
                "how_to_use": f"Create visual infographics, mind maps, and presentations about {topic}. Free for teachers."
            },
            {
                "tool_name": "Mentimeter",
                "url": "https://www.mentimeter.com/",
                "how_to_use": f"Run live interactive polls, word clouds, and quizzes about {topic} during class."
            }
        ]
    }

def get_mock_improvement(lesson_plan):
    return {
        "critique": {
            "engagement_score": 85,
            "clarity_score": 90,
            "alignment_score": 95,
            "content_accuracy_score": 88,
            "feedback": [
                "Added more student-led group tasks to boost active participation.",
                "Structured teacher instructions to make transitions clearer.",
                "Aligned exit ticket questions directly with objectives.",
                "Added current real-world connections to increase relevance."
            ],
            "strengths": [
                "Clear learning objectives that are measurable.",
                "Good mix of teacher and student activities.",
                "Assessment plan aligns well with stated objectives."
            ]
        },
        "optimized_lesson_plan": {
            "title": f"Enhanced: {lesson_plan.get('title', 'Lesson Plan')}",
            "objectives": lesson_plan.get("objectives", ["Understand the concepts"]),
            "introduction": lesson_plan.get("introduction", "") + " [Enhanced: Start with a current news story related to this topic]",
            "teacher_activities": "[Improved] Begin with concept mapping, then " + lesson_plan.get("teacher_activities", ""),
            "student_activities": "[Improved] Collaborative case study in groups of 3, then " + lesson_plan.get("student_activities", ""),
            "teaching_methods": lesson_plan.get("teaching_methods", "") + ", Problem-Based Learning",
            "assessment_plan": lesson_plan.get("assessment_plan", "") + " [Enhanced: Peer-evaluation checklist added]",
            "assignment": lesson_plan.get("assignment", ""),
            "summary": lesson_plan.get("summary", ""),
            "current_relevance": lesson_plan.get("current_relevance", "Connect this topic to current events and technology."),
            "disclaimer": "Teacher Review Required: AI-generated lesson content should be reviewed before classroom use"
        }
    }
