import type { Alert } from '../types';
import { BEHAVIOR_META } from '../types';

interface Props {
  alert: Alert;
  onDismiss: (id: string) => void;
  onRespond: (studentName: string) => void;
}

export default function AlertBanner({ alert, onDismiss, onRespond }: Props) {
  const meta = BEHAVIOR_META[alert.behavior];

  return (
    <div className="alert-anim bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-xs">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{meta.emoji}</span>
          <span className="font-bold text-red-300">{alert.message}</span>
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className="text-slate-500 hover:text-slate-300 text-sm shrink-0 leading-none"
        >✕</button>
      </div>
      <p className="text-slate-400 mb-2 leading-relaxed">{alert.suggestion}</p>
      <button
        onClick={() => { onRespond(alert.studentName); onDismiss(alert.id); }}
        className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg py-1.5 font-semibold transition-colors"
      >
        Respond to {alert.studentName}
      </button>
    </div>
  );
}
