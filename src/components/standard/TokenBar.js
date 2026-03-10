"use client";

export default function TokenBar({ used, limit }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);

  // Determine color based on usage
  const getColor = () => {
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'yellow';
    return 'green';
  };

  const color = getColor();

  const colorClasses = {
    green: {
      bg: 'bg-slate-900',
      text: 'text-slate-900',
      lightBg: 'bg-slate-50',
      border: 'border-slate-100'
    },
    yellow: {
      bg: 'bg-amber-500',
      text: 'text-amber-700',
      lightBg: 'bg-amber-50',
      border: 'border-amber-100'
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-700',
      lightBg: 'bg-red-50',
      border: 'border-red-200'
    }
  };

  return (
    <div className="py-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Tokens Used</span>
        <span className="text-[10px] font-black text-slate-900">
          {percentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color].bg}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-slate-400">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
        <span className={`${colorClasses[color].text}`}>
          {remaining.toLocaleString()} Left
        </span>
      </div>

      {/* Warning Messages */}
      {percentage >= 90 && (
        <div className={`mt-2 p-2 rounded-lg border ${colorClasses[color].lightBg} ${colorClasses[color].border}`}>
          <p className={`text-xs font-medium ${colorClasses[color].text}`}>
            {percentage >= 100 ? (
              '⚠️ Token limit reached! Manual editing still available.'
            ) : (
              `⚠️ ${remaining.toLocaleString()} tokens left (~${Math.floor(remaining / 10000)} regenerations)`
            )}
          </p>
        </div>
      )}

      {percentage >= 70 && percentage < 90 && (
        <div className={`mt-2 p-2 rounded-lg border ${colorClasses[color].lightBg} ${colorClasses[color].border}`}>
          <p className={`text-xs ${colorClasses[color].text}`}>
            💡 Tip: Use "Edit" to make manual changes without using tokens
          </p>
        </div>
      )}
    </div>
  );
}