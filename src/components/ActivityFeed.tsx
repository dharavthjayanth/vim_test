import type { ActivityItem } from '../types';
import { BEHAVIOR_META } from '../types';

interface Props {
  items: ActivityItem[];
}

export default function ActivityFeed({ items }: Props) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-40 pr-1">
      {items.length === 0 && (
        <p className="text-slate-600 text-xs text-center py-4">Session feed will appear here…</p>
      )}
      {[...items].reverse().map(item => {
        const meta = BEHAVIOR_META[item.behavior];
        return (
          <div
            key={item.id}
            className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
              item.isAlert
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-surface border border-border'
            }`}
          >
            <span className="shrink-0 mt-0.5">{meta.emoji}</span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-white">{item.studentName}</span>
              <span className="text-slate-400"> — {item.description}</span>
            </div>
            <span className="text-slate-600 shrink-0">{item.time}</span>
          </div>
        );
      })}
    </div>
  );
}
