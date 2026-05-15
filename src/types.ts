export type BehaviorType =
  | 'ATTENTIVE'
  | 'USING_PHONE'
  | 'SLEEPING'
  | 'TALKING'
  | 'HAND_RAISED'
  | 'ASKING_QUESTION'
  | 'CONFUSED';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type PersonalityType = 'curious' | 'distracted' | 'social' | 'quiet' | 'challenging' | 'engaged';
export type ResponseType = 'DIRECT_ADDRESS' | 'ASK_QUESTION' | 'INDIRECT' | 'IGNORE';
export type CertLevel = 'DEPLOYMENT_READY' | 'CONDITIONALLY_READY' | 'DEVELOPING' | 'NEEDS_INTENSIVE_SUPPORT';

export interface Student {
  id: string;
  name: string;
  personality: PersonalityType;
  avatarColor: string;
  currentBehavior: BehaviorType;
  disruptiveTendency: number; // 0-1
  topicInterest: number;      // 0-1
  seatIndex: number;
}

export interface BehaviorEvent {
  id: string;
  studentId: string;
  studentName: string;
  behavior: BehaviorType;
  severity: number;           // 1-10
  startTime: Date;
  endTime?: Date;
  resolved: boolean;
  responseType?: ResponseType;
  responseTimeSec?: number;
  eventScore: number;
  alertFired: boolean;
}

export interface ActivityItem {
  id: string;
  time: string;
  studentName: string;
  behavior: BehaviorType;
  description: string;
  isAlert: boolean;
}

export interface Alert {
  id: string;
  studentName: string;
  behavior: BehaviorType;
  message: string;
  suggestion: string;
}

export interface LiveScores {
  audio: number;
  video: number;
  management: number;
  overall: number;
}

export interface SessionConfig {
  topic: string;
  subjectArea: string;
  difficulty: Difficulty;
  numStudents: number;
  instructorName: string;
}

export interface SessionReport {
  config: SessionConfig;
  durationSeconds: number;
  scores: LiveScores;
  certLevel: CertLevel;
  events: BehaviorEvent[];
  totalDisruptions: number;
  respondedCount: number;
  responseRate: number;
  avgResponseTime: number;
  fillerWordCount: number;
  wordsPerMinute: number;
  transcript: string;
  coachingNotes: CoachingNote[];
}

export interface CoachingNote {
  dimension: 'audio' | 'video' | 'management';
  note: string;
  priority: 'high' | 'medium' | 'low';
}

export const BEHAVIOR_META: Record<BehaviorType, { label: string; emoji: string; color: string; ringClass: string }> = {
  ATTENTIVE:      { label: 'Attentive',       emoji: '✅', color: '#22c55e', ringClass: 'ring-green-500'  },
  USING_PHONE:    { label: 'Using Phone',      emoji: '📱', color: '#f59e0b', ringClass: 'ring-amber-400'  },
  SLEEPING:       { label: 'Sleeping',         emoji: '😴', color: '#64748b', ringClass: 'ring-slate-500'  },
  TALKING:        { label: 'Side Talking',     emoji: '💬', color: '#f97316', ringClass: 'ring-orange-400' },
  HAND_RAISED:    { label: 'Hand Raised',      emoji: '✋', color: '#6366f1', ringClass: 'ring-indigo-400' },
  ASKING_QUESTION:{ label: 'Asking Question',  emoji: '❓', color: '#0ea5e9', ringClass: 'ring-sky-400'    },
  CONFUSED:       { label: 'Confused',         emoji: '😕', color: '#a78bfa', ringClass: 'ring-violet-400' },
};

export const CERT_META: Record<CertLevel, { label: string; color: string; bg: string; description: string }> = {
  DEPLOYMENT_READY:       { label: 'Deployment Ready',        color: '#22c55e', bg: 'bg-green-500/10',   description: 'Cleared for live classroom deployment.' },
  CONDITIONALLY_READY:    { label: 'Conditionally Ready',     color: '#f59e0b', bg: 'bg-amber-500/10',   description: 'One more session + targeted coaching recommended.' },
  DEVELOPING:             { label: 'Developing',              color: '#f97316', bg: 'bg-orange-500/10',  description: 'Structured improvement plan required.' },
  NEEDS_INTENSIVE_SUPPORT:{ label: 'Needs Intensive Support', color: '#ef4444', bg: 'bg-red-500/10',     description: 'Mandatory coaching and repeat simulation required.' },
};

export function certFromScore(score: number): CertLevel {
  if (score >= 90) return 'DEPLOYMENT_READY';
  if (score >= 75) return 'CONDITIONALLY_READY';
  if (score >= 60) return 'DEVELOPING';
  return 'NEEDS_INTENSIVE_SUPPORT';
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
