import { useLocation, useNavigate } from 'react-router-dom';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
} from 'recharts';
import {
  formatTime, scoreColor, CERT_META,
  type SessionReport, type BehaviorEvent,
} from '../types';

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <p className="text-4xl font-bold" style={{ color }}>{score}</p>
      <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function EventRow({ event }: { event: BehaviorEvent }) {
  const responseColors: Record<string, string> = {
    ASK_QUESTION:   'text-green-400',
    DIRECT_ADDRESS: 'text-amber-400',
    INDIRECT:       'text-slate-400',
    IGNORE:         'text-red-400',
  };
  const responseLabels: Record<string, string> = {
    ASK_QUESTION:   '⭐ Asked Question',
    DIRECT_ADDRESS: '✓ Direct Address',
    INDIRECT:       '~ General Reminder',
    IGNORE:         '✗ Not Responded',
  };
  const behaviorEmojis: Record<string, string> = {
    USING_PHONE: '📱', SLEEPING: '😴', TALKING: '💬',
    HAND_RAISED: '✋', ASKING_QUESTION: '❓',
  };

  const isDisruptive = ['USING_PHONE','SLEEPING','TALKING'].includes(event.behavior);
  if (!isDisruptive) return null;

  const rt = event.responseType ?? 'IGNORE';
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-4 text-slate-300 text-sm">
        {behaviorEmojis[event.behavior] ?? '•'} {event.studentName}
      </td>
      <td className="py-2.5 pr-4 text-slate-400 text-xs">{event.behavior.replace('_', ' ')}</td>
      <td className={`py-2.5 pr-4 text-xs font-medium ${responseColors[rt]}`}>{responseLabels[rt]}</td>
      <td className="py-2.5 pr-4 text-slate-400 text-xs">
        {event.responseTimeSec != null ? `${Math.round(event.responseTimeSec)}s` : '—'}
      </td>
      <td className="py-2.5 text-right">
        <span className="font-bold text-sm" style={{ color: scoreColor(event.eventScore) }}>
          {Math.round(event.eventScore)}
        </span>
      </td>
    </tr>
  );
}

export default function ReportPage() {
  const { state } = useLocation() as { state: { report: SessionReport } | null };
  const navigate = useNavigate();
  const report = state?.report;

  if (!report) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No session data found.</p>
          <button onClick={() => navigate('/setup')} className="text-accent hover:text-indigo-400">← Back to Setup</button>
        </div>
      </div>
    );
  }

  const { config, durationSeconds, scores, certLevel, coachingNotes, events,
    totalDisruptions, respondedCount, responseRate, avgResponseTime,
    fillerWordCount, wordsPerMinute } = report;

  const cert = CERT_META[certLevel];

  const radarData = [
    { dimension: 'Audio',      score: scores.audio },
    { dimension: 'Video',      score: scores.video },
    { dimension: 'Management', score: scores.management },
    { dimension: 'Pace',       score: Math.max(40, Math.min(100, wordsPerMinute - 70)) },
    { dimension: 'Engagement', score: responseRate },
    { dimension: 'Confidence', score: scores.audio - 5 + Math.floor(Math.random() * 10) },
  ];

  const disruptionEvents = events.filter(e => ['USING_PHONE','SLEEPING','TALKING'].includes(e.behavior));
  const missed = disruptionEvents.filter(e => !e.responseType || e.responseType === 'IGNORE').length;

  const managementBarData = [
    { label: 'Ask Question', value: events.filter(e => e.responseType === 'ASK_QUESTION').length, fill: '#22c55e' },
    { label: 'Direct Address', value: events.filter(e => e.responseType === 'DIRECT_ADDRESS').length, fill: '#f59e0b' },
    { label: 'Indirect', value: events.filter(e => e.responseType === 'INDIRECT').length, fill: '#94a3b8' },
    { label: 'Missed', value: missed, fill: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-surface pb-16">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎓</span>
          <div>
            <p className="text-white font-bold">Session Report</p>
            <p className="text-slate-500 text-xs">{config.topic} · {config.subjectArea} · {formatTime(durationSeconds)} session</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/setup')}
            className="px-4 py-2 border border-border rounded-xl text-slate-300 hover:border-slate-400 text-sm transition-colors"
          >
            Practice Again
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-accent hover:bg-indigo-500 rounded-xl text-white text-sm font-semibold transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-8 space-y-6">

        {/* Hero: Certification + scores */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Overall Readiness Score</p>
              <p className="text-6xl font-bold" style={{ color: scoreColor(scores.overall) }}>{scores.overall}</p>
              <p className="text-slate-500 text-sm">/100</p>
            </div>
            <div className={`rounded-2xl border px-6 py-4 text-center ${cert.bg}`} style={{ borderColor: cert.color + '40' }}>
              <p className="text-2xl mb-2">
                {certLevel === 'DEPLOYMENT_READY' ? '🏆' : certLevel === 'CONDITIONALLY_READY' ? '🟡' : certLevel === 'DEVELOPING' ? '📈' : '🔴'}
              </p>
              <p className="font-bold text-base" style={{ color: cert.color }}>{cert.label}</p>
              <p className="text-slate-500 text-xs mt-1 max-w-[180px]">{cert.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <ScoreBadge label="🎙️ Audio Quality"       score={scores.audio}      />
            <ScoreBadge label="🎥 Video Presence"       score={scores.video}      />
            <ScoreBadge label="📋 Classroom Management" score={scores.management} />
          </div>
        </div>

        {/* 2-col: Radar + Management bar */}
        <div className="grid grid-cols-2 gap-6">
          <SectionCard title="Skill Radar" icon="🕸️">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke="#2d3148" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Response Breakdown" icon="📊">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={managementBarData} margin={{ left: -20 }}>
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {managementBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        {/* Session stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Duration',     value: formatTime(durationSeconds), icon: '⏱️' },
            { label: 'Disruptions',  value: totalDisruptions,            icon: '⚡' },
            { label: 'Response Rate',value: `${responseRate}%`,          icon: '✓'  },
            { label: 'Avg Response', value: avgResponseTime > 0 ? `${avgResponseTime}s` : 'N/A', icon: '⚡' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Audio analysis */}
        <SectionCard title="Audio Analysis" icon="🎙️">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{wordsPerMinute}</p>
              <p className="text-xs text-slate-500 mt-1">Words per Minute</p>
              <p className="text-xs mt-1" style={{ color: wordsPerMinute >= 120 && wordsPerMinute <= 150 ? '#22c55e' : '#f59e0b' }}>
                {wordsPerMinute >= 120 && wordsPerMinute <= 150 ? 'Optimal pace ✓' : 'Adjust pace'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{fillerWordCount}</p>
              <p className="text-xs text-slate-500 mt-1">Filler Words</p>
              <p className="text-xs mt-1" style={{ color: fillerWordCount < 5 ? '#22c55e' : '#f59e0b' }}>
                {fillerWordCount < 5 ? 'Excellent ✓' : 'Reduce um/uh'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: scoreColor(scores.audio) }}>{scores.audio}</p>
              <p className="text-xs text-slate-500 mt-1">Audio Score</p>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${scores.audio}%`, backgroundColor: scoreColor(scores.audio) }} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Classroom management event log */}
        <SectionCard title="Classroom Management — Event Log" icon="📋">
          {disruptionEvents.length === 0
            ? <p className="text-slate-500 text-sm text-center py-4">No disruption events during this session.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs text-slate-500 pb-2 pr-4">Student</th>
                      <th className="text-left text-xs text-slate-500 pb-2 pr-4">Behavior</th>
                      <th className="text-left text-xs text-slate-500 pb-2 pr-4">Response</th>
                      <th className="text-left text-xs text-slate-500 pb-2 pr-4">Time</th>
                      <th className="text-right text-xs text-slate-500 pb-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disruptionEvents.map(ev => <EventRow key={ev.id} event={ev} />)}
                  </tbody>
                </table>
              </div>
            )}
        </SectionCard>

        {/* AI Coaching notes */}
        <SectionCard title="AI Coaching Recommendations" icon="🤖">
          <div className="space-y-3">
            {coachingNotes.map((note, i) => {
              const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }[note.priority];
              const dimIcon = { audio: '🎙️', video: '🎥', management: '📋' }[note.dimension];
              return (
                <div key={i} className="flex gap-3 bg-surface border border-border rounded-xl p-4">
                  <div className="shrink-0 mt-0.5">
                    <span className="text-base">{dimIcon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        {note.dimension}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ color: priorityColor, backgroundColor: priorityColor + '20' }}
                      >
                        {note.priority}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{note.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Next steps */}
        <div className={`rounded-2xl border p-6 ${cert.bg}`} style={{ borderColor: cert.color + '30' }}>
          <h3 className="font-bold text-white mb-3">
            {certLevel === 'DEPLOYMENT_READY' ? '🏆 Congratulations — You\'re Ready!' : '📌 Recommended Next Steps'}
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {certLevel === 'DEPLOYMENT_READY' && <li>✓ Share this report with your manager for deployment approval.</li>}
            {certLevel !== 'DEPLOYMENT_READY' && <li>• Review the AI coaching notes above and practice the identified areas.</li>}
            {scores.management < 75 && <li>• Run a focused classroom management drill (high-distraction scenario).</li>}
            {scores.audio < 75 && <li>• Practice your audio delivery: record yourself and count filler words.</li>}
            {scores.video < 75 && <li>• Improve camera presence: maintain 80%+ eye contact during delivery.</li>}
            <li>• Schedule your next practice session to track improvement.</li>
          </ul>
          <button
            onClick={() => navigate('/setup')}
            className="mt-4 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors"
            style={{ backgroundColor: cert.color + '30', border: `1px solid ${cert.color}40` }}
          >
            Practice Again →
          </button>
        </div>
      </div>
    </div>
  );
}
