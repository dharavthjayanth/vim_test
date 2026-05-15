import { scoreColor } from '../types';

interface Props {
  label: string;
  score: number;
  icon: string;
  history?: number[];
}

export default function ScoreGauge({ label, score, icon, history = [] }: Props) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;
  const color = scoreColor(clampedScore);

  // Mini sparkline from history
  const sparkH = 20;
  const sparkW = 80;
  const pts = history.slice(-12);
  const sparkPath = pts.length > 1
    ? pts.map((v, i) => {
        const x = (i / (pts.length - 1)) * sparkW;
        const y = sparkH - (v / 100) * sparkH;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ')
    : '';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* SVG gauge */}
      <div className="relative">
        <svg width="90" height="90" viewBox="0 0 90 90">
          {/* Track */}
          <circle cx="45" cy="45" r={radius} fill="none" stroke="#1e2235" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="45" cy="45" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 45 45)"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-white" style={{ color }}>{clampedScore}</span>
          <span className="text-[9px] text-slate-500">/ 100</span>
        </div>
      </div>

      {/* Sparkline */}
      {sparkPath && (
        <svg width={sparkW} height={sparkH} className="overflow-visible">
          <path d={sparkPath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      )}

      {/* Label */}
      <div className="flex items-center gap-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold text-slate-300">{label}</span>
      </div>
    </div>
  );
}
