export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-lg font-semibold text-slate-900">W3 WriteLab</h3>
          <p className="text-sm text-slate-500 animate-pulse">Preparing your workspace...</p>
        </div>
      </div>
    </div>
  );
}
