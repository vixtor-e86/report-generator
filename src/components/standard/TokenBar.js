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
      bg: 'bg-green-500',
      text: 'text-green-700',
      lightBg: 'bg-green-50',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-700',
      lightBg: 'bg-yellow-50',
      border: 'border-yellow-200'
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-700',
      lightBg: 'bg-red-50',
      border: 'border-red-200'
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">Token Usage</span>
        <span className="text-xs text-gray-500">
          {percentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${colorClasses[color].bg}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
        <span className={`font-semibold ${colorClasses[color].text}`}>
          {remaining.toLocaleString()} left
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