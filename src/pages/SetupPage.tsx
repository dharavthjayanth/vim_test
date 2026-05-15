import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SessionConfig, Difficulty } from '../types';

const SUBJECTS = [
  { area: 'Technology', topics: ['Introduction to Python', 'Data Structures', 'Web Development Basics', 'Machine Learning Fundamentals', 'Cloud Computing'] },
  { area: 'Business',   topics: ['Project Management', 'Financial Analysis', 'Marketing Strategy', 'Business Communication', 'Leadership Skills'] },
  { area: 'Design',     topics: ['UI/UX Principles', 'Adobe Photoshop', 'Typography & Layout', 'Motion Design', 'Brand Identity'] },
  { area: 'Science',    topics: ['Data Analysis', 'Research Methodology', 'Statistics Basics', 'Lab Safety', 'Scientific Writing'] },
];

const DIFFICULTIES: { value: Difficulty; label: string; desc: string; color: string }[] = [
  { value: 'beginner',     label: 'Beginner',     desc: 'Fewer disruptions, longer response windows', color: 'border-green-500/50 bg-green-500/5'  },
  { value: 'intermediate', label: 'Intermediate', desc: 'Moderate disruptions, realistic pacing',     color: 'border-amber-500/50 bg-amber-500/5'  },
  { value: 'advanced',     label: 'Advanced',     desc: 'Frequent disruptions, simultaneous events',  color: 'border-red-500/50 bg-red-500/5'      },
];

const STUDENT_COUNTS = [8, 12, 15, 20, 30];

export default function SetupPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [subjectArea, setSubjectArea] = useState('Technology');
  const [topic, setTopic] = useState('Introduction to Python');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [numStudents, setNumStudents] = useState(12);
  const [cameraOk, setCameraOk] = useState(false);
  const [cameraChecking, setCameraChecking] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('vcvsp_user');
    if (!stored) { navigate('/'); return; }
    setUser(JSON.parse(stored));
  }, [navigate]);

  const currentTopics = SUBJECTS.find(s => s.area === subjectArea)?.topics ?? [];

  function handleSubjectChange(area: string) {
    setSubjectArea(area);
    const topics = SUBJECTS.find(s => s.area === area)?.topics ?? [];
    setTopic(topics[0] ?? '');
  }

  async function checkCamera() {
    setCameraChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      setCameraOk(true);
    } catch {
      setCameraOk(false);
      alert('Camera/microphone access denied. Please allow access and try again.');
    } finally {
      setCameraChecking(false);
    }
  }

  function startSession() {
    const config: SessionConfig = { topic, subjectArea, difficulty, numStudents, instructorName: user?.name ?? 'Instructor' };
    navigate('/classroom', { state: { config } });
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface p-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h1 className="text-white font-bold">VCVSP</h1>
              <p className="text-slate-500 text-xs">Simulation Setup</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white text-sm font-medium">{user.name}</p>
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-xs text-slate-500 hover:text-slate-300">Sign out</button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Configure Your Simulation</h2>
          <p className="text-slate-400 text-sm mt-1">Set up the virtual classroom before launching your session.</p>
        </div>

        <div className="space-y-6">
          {/* Subject & Topic */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">📚</span> Session Topic
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 block mb-2">Subject Area</label>
                <select
                  value={subjectArea}
                  onChange={e => handleSubjectChange(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
                >
                  {SUBJECTS.map(s => <option key={s.area} value={s.area}>{s.area}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Topic</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
                >
                  {currentTopics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-3">
              <p className="text-indigo-300 text-sm">
                <span className="font-semibold">Session:</span> {subjectArea} — {topic}
              </p>
            </div>
          </div>

          {/* Difficulty */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">⚡</span> Difficulty Level
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`border rounded-xl p-4 text-left transition-all ${
                    difficulty === d.value ? d.color + ' border-opacity-100' : 'border-border hover:border-slate-500'
                  }`}
                >
                  <p className="text-white font-semibold text-sm">{d.label}</p>
                  <p className="text-slate-400 text-xs mt-1">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Student Count */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">👥</span> Number of Students
            </h3>
            <div className="flex gap-3 flex-wrap">
              {STUDENT_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setNumStudents(n)}
                  className={`px-5 py-2.5 rounded-lg border font-semibold text-sm transition-all ${
                    numStudents === n
                      ? 'bg-accent border-accent text-white'
                      : 'border-border text-slate-400 hover:border-slate-400 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-3">{numStudents} AI student agents will be initialized with unique personalities.</p>
          </div>

          {/* Camera Check */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">🎥</span> Camera & Microphone Check
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={checkCamera}
                disabled={cameraChecking}
                className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-white hover:border-slate-400 transition-all disabled:opacity-50"
              >
                {cameraChecking ? 'Checking...' : 'Test Camera & Mic'}
              </button>
              {cameraOk && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                  Camera & Microphone ready
                </div>
              )}
              {!cameraOk && !cameraChecking && (
                <p className="text-slate-500 text-xs">Camera check is optional for this MVP demo.</p>
              )}
            </div>
          </div>

          {/* Launch */}
          <button
            onClick={startSession}
            className="w-full bg-accent hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-colors text-base flex items-center justify-center gap-2"
          >
            <span>🚀</span> Launch Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
