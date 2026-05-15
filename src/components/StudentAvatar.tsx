import type { Student, BehaviorEvent } from '../types';
import { BEHAVIOR_META } from '../types';

interface Props {
  student: Student;
  activeEvent?: BehaviorEvent;
  onRespond: (studentId: string, studentName: string) => void;
}

const BEHAVIOR_ANIM: Record<string, string> = {
  USING_PHONE: 'phone-anim',
  SLEEPING:    '',
  TALKING:     'talk-anim',
  HAND_RAISED: 'hand-anim',
};

export default function StudentAvatar({ student, activeEvent, onRespond }: Props) {
  const behavior = student.currentBehavior;
  const meta = BEHAVIOR_META[behavior];
  const isDisruptive = ['USING_PHONE', 'SLEEPING', 'TALKING'].includes(behavior);
  const isPositive   = ['HAND_RAISED', 'ASKING_QUESTION'].includes(behavior);
  const isActive     = behavior !== 'ATTENTIVE';

  const ringColor = isDisruptive
    ? 'ring-red-500'
    : isPositive
    ? 'ring-indigo-400'
    : 'ring-green-500/40';

  const ringWidth = isActive ? 'ring-2' : 'ring-1';
  const animClass = BEHAVIOR_ANIM[behavior] ?? '';
  const opacity   = behavior === 'SLEEPING' ? 'opacity-60' : 'opacity-100';

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      {/* Avatar circle */}
      <div
        className={`relative w-14 h-14 rounded-2xl ${ringWidth} ${ringColor} ${opacity} transition-all duration-500 ${animClass} cursor-pointer`}
        style={{ backgroundColor: student.avatarColor + '22', border: `1.5px solid ${student.avatarColor}44` }}
        onClick={() => isDisruptive && onRespond(student.id, student.name)}
        title={isDisruptive ? `Click to address ${student.name}` : student.name}
      >
        {/* Initials */}
        <div
          className="w-full h-full rounded-2xl flex items-center justify-center text-lg font-bold"
          style={{ color: student.avatarColor }}
        >
          {student.name.slice(0, 2).toUpperCase()}
        </div>

        {/* Behavior icon badge */}
        {isActive && (
          <div className="absolute -top-2 -right-2 text-base leading-none z-10">
            {meta.emoji}
          </div>
        )}

        {/* Sleeping Z overlay */}
        {behavior === 'SLEEPING' && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-slate-400 text-xs font-bold zzz-anim pointer-events-none">
            ZZZ
          </div>
        )}

        {/* Disruption pulsing ring */}
        {isDisruptive && (
          <div
            className="absolute inset-0 rounded-2xl animate-ping opacity-20"
            style={{ backgroundColor: meta.color }}
          />
        )}

        {/* Click to respond indicator */}
        {isDisruptive && (
          <div className="absolute inset-0 rounded-2xl flex items-end justify-center pb-0.5 opacity-0 hover:opacity-100 transition-opacity bg-black/40">
            <span className="text-white text-[9px] font-bold">RESPOND</span>
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-xs text-slate-400 font-medium truncate max-w-[60px] text-center">
        {student.name}
      </span>

      {/* Status dot */}
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
    </div>
  );
}
