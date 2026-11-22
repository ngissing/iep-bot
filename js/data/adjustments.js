/* School adjustments menu, MTSS tiers and prompt hierarchy.
   Edit the records below; keep it valid JSON after the "=". */
const ADJUSTMENTS = {
 "note": "Sources: WSSC Adjustments & Modifications menu (Student Services); WSSC MTSS Tiered Supports; DET Inclusive Classrooms Prompt Hierarchy.",
 "prompt_hierarchy": [
  "Independent — task completed without prompts",
  "Visual prompt — pictures, text, checklists, photos, videos",
  "Indirect verbal prompt — a cue that something is expected, minimal information ('What's next?')",
  "Direct verbal prompt — the full expected response given verbally",
  "Gestural prompt — pointing, eye contact, nodding to indicate",
  "Model prompt — showing the student exactly what to do",
  "Physical prompt — physical assistance to demonstrate the response"
 ],
 "school_menu": {
  "class_tasks": [
   "Simplify the language",
   "Provide structure and routine",
   "Visual supports and demonstrations",
   "Written instructions broken down into single steps and checklists",
   "Check for my understanding",
   "Check that I am on the right track with my work",
   "Prompting, reminders and encouragement",
   "Be explicit about the most essential tasks or part of a task",
   "Additional support to start a task",
   "Assistance with organisation",
   "Prompt me to record HW in my diary and check that I have recorded it",
   "Work in a small group with a teacher, or Inclusion staff",
   "Work one-on-one with a teacher, or Inclusion staff",
   "Provide copy of class notes (particularly if lecture style presentation)",
   "Provide glossaries of subject vocabulary",
   "Audiobook and Immersive Reader (text-to-voice)",
   "Type, answer questions orally, use Dictate/Voice typing (speech-to-text) or have a scribe (if available) - rather than write",
   "Reduce class work quantity",
   "Reduce the amount of visual information (i.e. leave lots of white space)"
  ],
  "assessment_tasks": [
   "Simplify the language",
   "Provide a worked example",
   "Written instructions broken down into single steps and checklists",
   "Check that I am on the right track with my work",
   "Reduction in questions",
   "Assistance with planning (e.g. an essay)",
   "Assistance with organisation",
   "Prompt me to record AT in my diary and check that I have recorded it",
   "Be explicit about the most essential tasks or part of a task",
   "Work in a small group with a teacher, or Inclusion staff",
   "Work one-on-one with a teacher, or Inclusion staff",
   "Adjusted test",
   "Adjusted assignments",
   "Adjusted exam",
   "Additional working time",
   "Allow use of laptop to complete assessment tasks",
   "Scribe or Dictate/Voice typing (speech-to-text)"
  ],
  "communication_social": [
   "Allow extra wait time for me to provide a response",
   "Empower me with choice, provide me with flexibility and allow me to negotiate tasks",
   "Give me the option of reading aloud - do not force me",
   "Do not raise your voice at me",
   "Provide me with literal verbal instructions",
   "Say my name before trying to get my attention",
   "Allow me to work in smaller space outside classroom",
   "Mindful pairing in group tasks",
   "Paired with a class buddy",
   "Pre-warn about change in routine",
   "Pre-warn when about to transition from one activity to the next",
   "Use “First, then” language when moving from a preferred to non-preferred activity",
   "Provide me with a visual schedule",
   "Support with transition between tasks (e.g. by using a countdown clock)"
  ],
  "environment": [
   "Allow movement breaks",
   "Reduce classroom noise",
   "Headphones/earphones allowed during independent tasks",
   "Use of fidget/sensory toys",
   "Allow for oral input (chewy/minty) for a short time to assist with concentration",
   "Seating plan or allocated seat",
   "Provide option to stand in classroom",
   "Allow student to sit on the floor",
   "Allow student to sit away from others"
  ]
 },
 "mtss": {
  "Learning and Applying Knowledge": {
   "t1_universal": [
    "Graphic Organisers",
    "Concrete learning materials (counters, manipulatives)",
    "Use of calculator/ dictionary",
    "Proofreading checklists",
    "What a good one looks like checklists",
    "Learning intentions and success criteria for a lesson",
    "Modelled examples and Assessments"
   ],
   "t2_targeted": [
    "Alternative ways of responding (oral, scribed, written, drawn, typed.)",
    "Alternative ways of assessment (demonstrations, conferences, projects)",
    "Alternative ways of note-taking (photos, annotated presentations, audio recording.)",
    "Alternative to print (audiobooks, videos, digital media)",
    "Individualised task to match skill level. (shorter tasks)",
    "Highlighted key vocabulary",
    "Hearing and Vision Supports",
    "Closed Captioning",
    "Adjustments to font and colour of text"
   ],
   "t3_individual": [
    "Designated reader or scribe for responding and assessments",
    "Alternative print formats (braille, large print, specialised assistive technology.)",
    "Adult annotated notetaking",
    "Individualised task to match student’s skill level and area of interest",
    "Adjusted task and criteria sheet based on interest",
    "1-1 scaffolded learning provided consistently throughout the lesson",
    "Audio described videos",
    "Individual Learning Plan",
    "Behaviour Management Plan"
   ]
  },
  "General Tasks and Demands": {
   "t1_universal": [
    "Classroom visual schedule/ supports",
    "Classroom routine",
    "Goal setting",
    "Additional scaffolding to produce a response (writing frame, sentence starter)",
    "Front loading schedule changes",
    "Use of a timer (visual, auditory) or countdown",
    "Proximity to teacher-seating",
    "Additional time to process oral information and directions",
    "Additional time to produce a response",
    "Brain Breaks",
    "Adjusted workload (layout, length, language)",
    "Reduced complexity of content (simplified vocabulary, more concrete)",
    "Preferential/ flexible seating",
    "Easily accessible learning materials",
    "Check-ins during learning"
   ],
   "t2_targeted": [
    "Visual Schedule for table group",
    "Table-base visual supports",
    "Visual timer for table group",
    "Scheduled brain breaks during learning",
    "Slower and repeated verbal instructions + time to process information, with visuals",
    "Alternative working spaces",
    "Sensory tools (fidget items, standing desks)",
    "Reduced workload (fewer questions, shorter assignments, chunked tasks.)",
    "Table-based learning materials"
   ],
   "t3_individual": [
    "Individualised Visual Schedule (First, then next)",
    "Scheduled sensory and movement breaks",
    "Alternative personalised workspace",
    "Choice zone",
    "Choice order of tasks",
    "Personal visual timer",
    "Adult-directed step-by-step instruction + additional processing time",
    "Individualised scheduled check-ins during learning",
    "Adult-directed redirection to the task",
    "Task aligned to individual interests",
    "Lower-order thinking tasks"
   ]
  },
  "Communication": {
   "t1_universal": [
    "Oral instructions",
    "Simplified language and directions",
    "Visual presentations of verbal materials (word walls, visual organisers)",
    "Visual schedule"
   ],
   "t2_targeted": [
    "Compic scheduling",
    "Small group Oral Language Support"
   ],
   "t3_individual": [
    "Alternative and Augmentative Communication Devices",
    "AUSLAN interpreter",
    "Translator/ CALD Language Support",
    "PECs",
    "Personalised interventions as identified by a Speech Therapist"
   ]
  },
  "Self-Care": {
   "t1_universal": [
    "Modelled practice of self-care (age appropriate)",
    "Community safety teaching for excursions and bus travel"
   ],
   "t2_targeted": [
    "Monitored playground access",
    "Monitoring of medication"
   ],
   "t3_individual": [
    "1-1 supervision of playground access",
    "1-1 assistance for self-care (drinking, eating, dressing, toileting)",
    "Specific 1-1 teaching of hygiene"
   ]
  },
  "Interpersonal Interactions": {
   "t1_universal": [
    "Zones of regulation check-in",
    "Flexible groupings",
    "Peer learning",
    "Modelled practice of problem-solving in social contexts",
    "General Social Stories"
   ],
   "t2_targeted": [
    "Class-based social stories (emotional response, behaviour expectation, change of routine)"
   ],
   "t3_individual": [
    "Personalised social stories (emotional response, change, behaviour, rules.)",
    "Explicit 1-1 teaching of social skills"
   ]
  },
  "Mobility": {
   "t1_universal": [
    "Ramps and handrails positioned around the school",
    "Clear pathways around classrooms"
   ],
   "t2_targeted": [
    "Supervised movement between locations",
    "Deliberate positioning of resources for ease of access",
    "Adjusted handwriting requirements",
    "Use of pencil grip or slope board for fine motor support"
   ],
   "t3_individual": [
    "Incorporation of therapy programs",
    "Occupational Therapist individualised play program"
   ]
  }
 }
};
