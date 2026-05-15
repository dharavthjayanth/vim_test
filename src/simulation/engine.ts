import type { Student, BehaviorEvent, BehaviorType, Difficulty, PersonalityType, CoachingNote } from '../types';

const NAMES = [
  'Aarav','Priya','Rohan','Sneha','Arjun','Kavya',
  'Vikram','Ananya','Rahul','Divya','Karan','Meera',
  'Amit','Pooja','Siddharth','Nisha','Varun','Shreya',
  'Akash','Riya','Nikhil','Swati','Harsh','Anjali',
  'Dev','Kritika','Mohit','Simran','Aditya','Neha',
];

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f97316','#84cc16',
  '#14b8a6','#0ea5e9','#f59e0b','#ef4444','#22c55e',
  '#a78bfa','#fb923c','#38bdf8','#4ade80','#fbbf24',
];

const PERSONALITIES: PersonalityType[] = ['curious','distracted','social','quiet','challenging','engaged'];

const DISRUPTION_BEHAVIORS: BehaviorType[] = ['USING_PHONE','SLEEPING','TALKING'];
const POSITIVE_BEHAVIORS: BehaviorType[] = ['HAND_RAISED','ASKING_QUESTION'];

export function createStudents(count: number): Student[] {
  const names = [...NAMES].sort(() => Math.random() - 0.5).slice(0, count);
  return names.map((name, i) => {
    const personality = PERSONALITIES[i % PERSONALITIES.length];
    const isDistracted = personality === 'distracted' || personality === 'social';
    return {
      id: `student-${i}`,
      name,
      personality,
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      currentBehavior: 'ATTENTIVE',
      disruptiveTendency: isDistracted
        ? 0.4 + Math.random() * 0.5
        : Math.random() * 0.35,
      topicInterest: personality === 'curious' || personality === 'engaged'
        ? 0.6 + Math.random() * 0.4
        : 0.2 + Math.random() * 0.5,
      seatIndex: i,
    };
  });
}

export function getNextBehaviorDelay(difficulty: Difficulty): number {
  const base = { beginner: 35000, intermediate: 22000, advanced: 12000 }[difficulty];
  return base + Math.random() * 10000;
}

export function pickDisruptionTarget(
  students: Student[],
  activeEventStudentIds: Set<string>
): Student | null {
  const candidates = students.filter(s => !activeEventStudentIds.has(s.id));
  if (candidates.length === 0) return null;

  // Weight by disruptive tendency
  const total = candidates.reduce((s, c) => s + c.disruptiveTendency, 0);
  let rand = Math.random() * total;
  for (const c of candidates) {
    rand -= c.disruptiveTendency;
    if (rand <= 0) return c;
  }
  return candidates[candidates.length - 1];
}

export function pickBehavior(
  student: Student,
  sessionAgeSec: number,
  audioScore: number
): BehaviorType {
  const ageFactor = sessionAgeSec > 900 ? 1.5 : 1.0; // more disruptions after 15min
  const energyFactor = audioScore > 70 ? 0.7 : 1.2;  // high energy reduces disruptions
  const disruptChance = Math.min(0.9, student.disruptiveTendency * ageFactor * energyFactor);

  if (Math.random() > disruptChance && student.topicInterest > 0.5) {
    return POSITIVE_BEHAVIORS[Math.floor(Math.random() * POSITIVE_BEHAVIORS.length)];
  }
  return DISRUPTION_BEHAVIORS[Math.floor(Math.random() * DISRUPTION_BEHAVIORS.length)];
}

export function createBehaviorEvent(student: Student, behavior: BehaviorType): BehaviorEvent {
  const severity = Math.ceil(student.disruptiveTendency * 6 + Math.random() * 4);
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    studentId: student.id,
    studentName: student.name,
    behavior,
    severity: Math.min(10, severity),
    startTime: new Date(),
    resolved: false,
    eventScore: 0,
    alertFired: false,
  };
}

export function scoreResponse(
  event: BehaviorEvent,
  responseType: 'DIRECT_ADDRESS' | 'ASK_QUESTION' | 'INDIRECT' | 'IGNORE'
): number {
  let score = 0;
  switch (responseType) {
    case 'ASK_QUESTION':    score = 100; break;
    case 'DIRECT_ADDRESS':  score = 60;  break;
    case 'INDIRECT':        score = 20;  break;
    default:                score = 0;
  }
  const responseSec = (Date.now() - event.startTime.getTime()) / 1000;
  if (responseSec < 10) score += 15;
  else if (responseSec > 30) score -= 20;
  return Math.max(0, Math.min(115, score));
}

export function calcManagementScore(events: BehaviorEvent[]): number {
  const disruptions = events.filter(e =>
    ['USING_PHONE','SLEEPING','TALKING'].includes(e.behavior)
  );
  if (disruptions.length === 0) return 100;
  const avg = disruptions.reduce((s, e) => s + e.eventScore, 0) / disruptions.length;
  return Math.round(avg);
}

const STUDENT_QUESTIONS = [
  'Can you give us a real-world example of that?',
  'I didn\'t quite get the last part — could you repeat it?',
  'How does this connect to what we covered earlier?',
  'Is there a simpler way to think about this?',
  'Will this concept appear in the assessment?',
  'What happens if we do it the other way around?',
  'Could you walk through that step one more time?',
  'What\'s the most common mistake beginners make here?',
];

export function getStudentQuestion(): string {
  return STUDENT_QUESTIONS[Math.floor(Math.random() * STUDENT_QUESTIONS.length)];
}

export function generateCoachingNotes(
  audioScore: number,
  videoScore: number,
  managementScore: number,
  missedCount: number
): CoachingNote[] {
  const notes: CoachingNote[] = [];

  if (audioScore < 70) {
    notes.push({ dimension: 'audio', priority: 'high', note: 'Reduce filler words (um, uh, like). Replace them with deliberate 1-2 second pauses — silence signals confidence.' });
  } else {
    notes.push({ dimension: 'audio', priority: 'low', note: 'Good speaking pace and clarity. Continue varying your pitch and tone to maintain energy across the session.' });
  }

  if (audioScore < 80) {
    notes.push({ dimension: 'audio', priority: 'medium', note: 'Ask comprehension-check questions every 10 minutes: "Does anyone have questions so far?" — this boosts engagement and gives you natural pace breaks.' });
  }

  if (videoScore < 70) {
    notes.push({ dimension: 'video', priority: 'high', note: 'Increase camera eye contact. Position notes below the webcam so looking down feels natural. Aim for 80%+ eye contact ratio.' });
  } else {
    notes.push({ dimension: 'video', priority: 'low', note: 'Strong camera presence. Smiling during explanations dramatically increases perceived engagement — keep it up.' });
  }

  if (managementScore < 70 || missedCount > 2) {
    notes.push({ dimension: 'management', priority: 'high', note: `You missed ${missedCount} disruption(s). Scan the virtual classroom every 30 seconds. Address by name within 10 seconds of noticing the behavior.` });
    notes.push({ dimension: 'management', priority: 'high', note: 'Best response technique: pause your delivery → call the student\'s name → ask them a content question. This earns maximum management points and re-engages the student simultaneously.' });
  } else {
    notes.push({ dimension: 'management', priority: 'low', note: 'Excellent classroom management. The "ask a question" re-engagement strategy you used is the gold standard — keep deploying it proactively.' });
  }

  return notes.slice(0, 5);
}
