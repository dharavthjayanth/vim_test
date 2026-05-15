import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentAvatar from '../components/StudentAvatar';
import ScoreGauge from '../components/ScoreGauge';
import ActivityFeed from '../components/ActivityFeed';
import AlertBanner from '../components/AlertBanner';
import {
  createStudents, getNextBehaviorDelay, pickDisruptionTarget,
  pickBehavior, createBehaviorEvent, scoreResponse,
  calcManagementScore, getStudentQuestion, generateCoachingNotes,
} from '../simulation/engine';
import {
  formatTime, certFromScore,
  type Student, type BehaviorEvent, type ActivityItem,
  type Alert, type LiveScores, type SessionConfig, type SessionReport,
  BEHAVIOR_META,
} from '../types';

// Response modal
function RespondModal({ studentName, behavior, onClose, onSubmit }: {
  studentName: string;
  behavior: string;
  onClose: () => void;
  onSubmit: (type: 'DIRECT_ADDRESS' | 'ASK_QUESTION' | 'INDIRECT') => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-white font-bold mb-1">Respond to {studentName}</h3>
        <p className="text-slate-400 text-sm mb-5">
          <span className="font-semibold">{studentName}</span> is currently {BEHAVIOR_META[behavior as keyof typeof BEHAVIOR_META]?.label ?? behavior}.
          Choose your response:
        </p>
        <div className="space-y-2">
          <button
            onClick={() => onSubmit('ASK_QUESTION')}
            className="w-full text-left bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 rounded-xl p-3 transition-all"
          >
            <p className="text-green-400 font-semibold text-sm">Ask a Content Question ⭐ +100pts</p>
            <p className="text-slate-500 text-xs mt-0.5">"{studentName}, can you answer this for the class?"</p>
          </button>
          <button
            onClick={() => onSubmit('DIRECT_ADDRESS')}
            className="w-full text-left bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl p-3 transition-all"
          >
            <p className="text-amber-400 font-semibold text-sm">Direct Address +60pts</p>
            <p className="text-slate-500 text-xs mt-0.5">"{studentName}, please focus on the session."</p>
          </button>
          <button
            onClick={() => onSubmit('INDIRECT')}
            className="w-full text-left bg-slate-700/30 border border-border hover:bg-slate-700/50 rounded-xl p-3 transition-all"
          >
            <p className="text-slate-300 font-semibold text-sm">General Reminder +20pts</p>
            <p className="text-slate-500 text-xs mt-0.5">"Everyone, let's stay focused please."</p>
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full text-slate-500 hover:text-slate-300 text-sm transition-colors">
          Cancel (Ignore — 0pts)
        </button>
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { config: SessionConfig } | null };
  const config = state?.config;

  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<BehaviorEvent[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scores, setScores] = useState<LiveScores>({ audio: 75, video: 75, management: 100, overall: 83 });
  const [scoreHistory, setScoreHistory] = useState<{ audio: number[]; video: number[]; management: number[] }>({ audio: [75], video: [75], management: [100] });
  const [elapsed, setElapsed] = useState(0);
  const [sessionRunning, setSessionRunning] = useState(true);
  const [respondModal, setRespondModal] = useState<{ studentId: string; studentName: string; behavior: string } | null>(null);

  const studentsRef = useRef<Student[]>([]);
  const eventsRef   = useRef<BehaviorEvent[]>([]);
  const scoresRef   = useRef<LiveScores>(scores);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const behaviorTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!config) { navigate('/setup'); return; }
    const initialStudents = createStudents(config.numStudents);
    studentsRef.current = initialStudents;
    setStudents(initialStudents);

    // Start webcam
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => {}); // OK if denied

    // Simulate audio/video drifting scores
    const scoreInterval = setInterval(() => {
      setScores(prev => {
        const audio = Math.max(40, Math.min(100, prev.audio + (Math.random() - 0.45) * 4));
        const video = Math.max(40, Math.min(100, prev.video + (Math.random() - 0.45) * 3));
        const management = calcManagementScore(eventsRef.current);
        const overall = Math.round(audio * 0.30 + video * 0.30 + management * 0.40);
        const next = { audio: Math.round(audio), video: Math.round(video), management, overall };
        scoresRef.current = next;
        setScoreHistory(h => ({
          audio: [...h.audio.slice(-20), next.audio],
          video: [...h.video.slice(-20), next.video],
          management: [...h.management.slice(-20), next.management],
        }));
        return next;
      });
    }, 5000);

    scheduleBehavior();

    return () => {
      clearInterval(scoreInterval);
      if (behaviorTimer.current) clearTimeout(behaviorTimer.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!sessionRunning) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [sessionRunning]);

  function scheduleBehavior() {
    if (!config) return;
    const delay = getNextBehaviorDelay(config.difficulty);
    behaviorTimer.current = setTimeout(() => {
      triggerBehavior();
      scheduleBehavior();
    }, delay);
  }

  function triggerBehavior() {
    const activeIds = new Set(eventsRef.current.filter(e => !e.resolved).map(e => e.studentId));
    if (activeIds.size >= 3) return; // max 3 concurrent

    const target = pickDisruptionTarget(studentsRef.current, activeIds);
    if (!target) return;

    const behavior = pickBehavior(target, elapsed, scoresRef.current.audio);
    const event = createBehaviorEvent(target, behavior);

    // Update student state
    studentsRef.current = studentsRef.current.map(s =>
      s.id === target.id ? { ...s, currentBehavior: behavior } : s
    );
    setStudents([...studentsRef.current]);

    eventsRef.current = [...eventsRef.current, event];
    setEvents([...eventsRef.current]);

    const description = {
      USING_PHONE:    'started using phone',
      SLEEPING:       'fell asleep',
      TALKING:        'started side conversation',
      HAND_RAISED:    'raised hand',
      ASKING_QUESTION: 'is asking a question',
      CONFUSED:       'looks confused',
      ATTENTIVE:      'is attentive',
    }[behavior] ?? behavior;

    // Activity feed entry
    const feedItem: ActivityItem = {
      id: event.id,
      time: formatTime(elapsed),
      studentName: target.name,
      behavior,
      description,
      isAlert: false,
    };
    setActivityFeed(f => [...f.slice(-49), feedItem]);

    // If it's a question, auto-show the question text in the feed
    if (behavior === 'ASKING_QUESTION' || behavior === 'HAND_RAISED') {
      setTimeout(() => {
        const q = getStudentQuestion();
        setActivityFeed(f => [...f.slice(-49), {
          id: event.id + '-q',
          time: formatTime(elapsed + 5),
          studentName: target.name,
          behavior: 'ASKING_QUESTION',
          description: `asks: "${q}"`,
          isAlert: false,
        }]);
        // Auto-resolve positive event after 10s
        setTimeout(() => resolveEvent(event.id, true), 8000);
      }, 4000);
      return;
    }

    // Fire alert after 20s if not resolved
    const alertTimer = setTimeout(() => {
      const still = eventsRef.current.find(e => e.id === event.id && !e.resolved);
      if (!still) return;

      const suggestion = {
        USING_PHONE: `Try: "${target.name}, please put your phone away and focus with us."`,
        SLEEPING:    `Try: "${target.name}, I'd love your thoughts — what do you think about this?"`,
        TALKING:     `Try: "${target.name}, could you share your discussion with the whole class?"`,
      }[behavior] ?? `Address ${target.name}'s behavior directly.`;

      const newAlert: Alert = {
        id: `alert-${event.id}`,
        studentName: target.name,
        behavior,
        message: `${target.name} has been ${description} for 20 seconds`,
        suggestion,
      };
      setAlerts(a => [...a.slice(-4), newAlert]);

      // Mark alert fired
      eventsRef.current = eventsRef.current.map(e =>
        e.id === event.id ? { ...e, alertFired: true } : e
      );
    }, 20000);

    // Auto-resolve (IGNORE) after 60s
    setTimeout(() => {
      const ev = eventsRef.current.find(e => e.id === event.id && !e.resolved);
      if (!ev) { clearTimeout(alertTimer); return; }
      eventsRef.current = eventsRef.current.map(e =>
        e.id === event.id ? { ...e, resolved: true, eventScore: 0, responseType: 'IGNORE' } : e
      );
      setEvents([...eventsRef.current]);
      studentsRef.current = studentsRef.current.map(s =>
        s.id === target.id ? { ...s, currentBehavior: 'ATTENTIVE' } : s
      );
      setStudents([...studentsRef.current]);
    }, 60000);
  }

  function resolveEvent(eventId: string, isPositive = false) {
    eventsRef.current = eventsRef.current.map(e =>
      e.id === eventId ? { ...e, resolved: true, eventScore: isPositive ? 80 : e.eventScore } : e
    );
    setEvents([...eventsRef.current]);
    const ev = eventsRef.current.find(e => e.id === eventId);
    if (ev) {
      studentsRef.current = studentsRef.current.map(s =>
        s.id === ev.studentId ? { ...s, currentBehavior: 'ATTENTIVE' } : s
      );
      setStudents([...studentsRef.current]);
    }
  }

  const openRespondModal = useCallback((studentId: string, studentName: string) => {
    const activeEvent = eventsRef.current.find(e => e.studentId === studentId && !e.resolved);
    if (!activeEvent) return;
    setRespondModal({ studentId, studentName, behavior: activeEvent.behavior });
  }, []);

  function handleResponse(responseType: 'DIRECT_ADDRESS' | 'ASK_QUESTION' | 'INDIRECT') {
    if (!respondModal) return;
    const activeEvent = eventsRef.current.find(e => e.studentId === respondModal.studentId && !e.resolved);
    if (!activeEvent) { setRespondModal(null); return; }

    const score = scoreResponse(activeEvent, responseType);
    eventsRef.current = eventsRef.current.map(e =>
      e.id === activeEvent.id
        ? { ...e, resolved: true, responseType, responseTimeSec: (Date.now() - e.startTime.getTime()) / 1000, eventScore: score }
        : e
    );
    setEvents([...eventsRef.current]);

    studentsRef.current = studentsRef.current.map(s =>
      s.id === respondModal.studentId ? { ...s, currentBehavior: 'ATTENTIVE' } : s
    );
    setStudents([...studentsRef.current]);

    // Remove matching alert
    setAlerts(a => a.filter(al => al.studentName !== respondModal.studentName));

    const responseLabel = { ASK_QUESTION: 'asked a question to', DIRECT_ADDRESS: 'directly addressed', INDIRECT: 'gave a general reminder about' }[responseType];
    setActivityFeed(f => [...f.slice(-49), {
      id: `resp-${Date.now()}`,
      time: formatTime(elapsed),
      studentName: respondModal.studentName,
      behavior: 'ATTENTIVE',
      description: `✓ Instructor ${responseLabel} ${respondModal.studentName} (+${score}pts)`,
      isAlert: true,
    }]);

    setRespondModal(null);
  }

  function endSession() {
    setSessionRunning(false);
    if (behaviorTimer.current) clearTimeout(behaviorTimer.current);

    const disruptions = eventsRef.current.filter(e => ['USING_PHONE','SLEEPING','TALKING'].includes(e.behavior));
    const responded = disruptions.filter(e => e.responseType && e.responseType !== 'IGNORE');
    const missed = disruptions.filter(e => !e.responseType || e.responseType === 'IGNORE');
    const responseRate = disruptions.length > 0 ? Math.round(responded.length / disruptions.length * 100) : 100;
    const avgResponseTime = responded.length > 0
      ? Math.round(responded.reduce((s, e) => s + (e.responseTimeSec ?? 30), 0) / responded.length)
      : 0;

    const finalScores = scoresRef.current;
    const certLevel = certFromScore(finalScores.overall);
    const coachingNotes = generateCoachingNotes(finalScores.audio, finalScores.video, finalScores.management, missed.length);

    const report: SessionReport = {
      config: config!,
      durationSeconds: elapsed,
      scores: finalScores,
      certLevel,
      events: eventsRef.current,
      totalDisruptions: disruptions.length,
      respondedCount: responded.length,
      responseRate,
      avgResponseTime,
      fillerWordCount: Math.floor(Math.random() * 8),
      wordsPerMinute: 120 + Math.floor(Math.random() * 40),
      transcript: '',
      coachingNotes,
    };

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }

    navigate('/report', { state: { report } });
  }

  if (!config) return null;

  // Build grid columns based on student count
  const cols = config.numStudents <= 8 ? 4 : config.numStudents <= 12 ? 4 : config.numStudents <= 15 ? 5 : 6;

  const activeDisruptions = events.filter(e => !e.resolved && ['USING_PHONE','SLEEPING','TALKING'].includes(e.behavior));

  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xl">🎓</span>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{config.topic}</p>
            <p className="text-slate-500 text-xs">{config.subjectArea} · {config.numStudents} students · {config.difficulty}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-semibold uppercase tracking-wide">Live</span>
          </div>

          {/* Timer */}
          <div className="text-center">
            <p className="text-white font-mono font-bold text-xl">{formatTime(elapsed)}</p>
            <p className="text-slate-500 text-[10px]">Elapsed</p>
          </div>

          {/* End button */}
          <button
            onClick={endSession}
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Instructor video + info */}
        <div className="w-56 shrink-0 border-r border-border flex flex-col gap-4 p-4 bg-card/50">
          {/* Webcam */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-slate-700 text-center">
                <div className="text-3xl mb-1">🎥</div>
                <p className="text-xs">Your Camera</p>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-[10px] font-semibold">{config.instructorName}</span>
            </div>
          </div>

          {/* Overall score */}
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Overall Score</p>
            <p className="text-3xl font-bold" style={{ color: scores.overall >= 80 ? '#22c55e' : scores.overall >= 60 ? '#f59e0b' : '#ef4444' }}>
              {scores.overall}
            </p>
            <p className="text-xs text-slate-500">/ 100</p>
          </div>

          {/* Active disruptions */}
          <div className="bg-surface border border-border rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-2">Active Issues</p>
            {activeDisruptions.length === 0
              ? <p className="text-green-400 text-xs">✓ All students attentive</p>
              : activeDisruptions.map(ev => (
                  <div key={ev.id} className="flex items-center gap-2 text-xs mb-1">
                    <span>{BEHAVIOR_META[ev.behavior as keyof typeof BEHAVIOR_META]?.emoji}</span>
                    <span className="text-amber-300 font-medium">{ev.studentName}</span>
                  </div>
                ))
            }
          </div>

          {/* Quick guide */}
          <div className="bg-surface border border-border rounded-xl p-3 mt-auto">
            <p className="text-xs text-slate-500 mb-2 font-semibold">Quick Guide</p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p>📱 Click avatar to respond</p>
              <p>⭐ Ask a question = max pts</p>
              <p>⚡ Respond in &lt;10s for bonus</p>
            </div>
          </div>
        </div>

        {/* CENTER: Classroom grid + feed */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Classroom label */}
          <div className="px-5 pt-4 pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-slate-300 text-sm font-semibold">Virtual Classroom</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" /> Attentive</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full inline-block" /> Distracted</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full inline-block" /> Disruptive</span>
              </div>
            </div>
          </div>

          {/* Avatar grid */}
          <div className="flex-1 overflow-y-auto px-5">
            <div
              className="grid gap-5 py-4"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {students.map(student => {
                const activeEvent = events.find(e => e.studentId === student.id && !e.resolved);
                return (
                  <StudentAvatar
                    key={student.id}
                    student={student}
                    activeEvent={activeEvent}
                    onRespond={openRespondModal}
                  />
                );
              })}
            </div>
          </div>

          {/* Activity feed */}
          <div className="border-t border-border px-5 py-3 shrink-0 bg-card/40">
            <p className="text-xs text-slate-500 font-semibold mb-2">📋 Activity Feed</p>
            <ActivityFeed items={activityFeed} />
          </div>
        </div>

        {/* RIGHT: Score gauges + alerts */}
        <div className="w-52 shrink-0 border-l border-border flex flex-col gap-4 p-4 bg-card/50 overflow-y-auto">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Live Scores</p>

          <div className="flex flex-col items-center gap-5">
            <ScoreGauge label="Audio"      score={scores.audio}      icon="🎙️" history={scoreHistory.audio} />
            <ScoreGauge label="Video"      score={scores.video}      icon="🎥" history={scoreHistory.video} />
            <ScoreGauge label="Management" score={scores.management} icon="📋" history={scoreHistory.management} />
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs text-slate-500 font-semibold mb-1">Session Stats</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Disruptions</span>
                <span className="text-white font-semibold">{events.filter(e => ['USING_PHONE','SLEEPING','TALKING'].includes(e.behavior)).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Responded</span>
                <span className="text-green-400 font-semibold">{events.filter(e => e.responseType && e.responseType !== 'IGNORE').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Missed</span>
                <span className="text-red-400 font-semibold">{events.filter(e => e.resolved && (!e.responseType || e.responseType === 'IGNORE') && ['USING_PHONE','SLEEPING','TALKING'].includes(e.behavior)).length}</span>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs text-red-400 font-semibold">⚠️ Alerts</p>
              {alerts.map(alert => (
                <AlertBanner
                  key={alert.id}
                  alert={alert}
                  onDismiss={id => setAlerts(a => a.filter(al => al.id !== id))}
                  onRespond={name => {
                    const s = students.find(st => st.name === name);
                    if (s) openRespondModal(s.id, s.name);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Response modal */}
      {respondModal && (
        <RespondModal
          studentName={respondModal.studentName}
          behavior={respondModal.behavior}
          onClose={() => setRespondModal(null)}
          onSubmit={handleResponse}
        />
      )}
    </div>
  );
}
