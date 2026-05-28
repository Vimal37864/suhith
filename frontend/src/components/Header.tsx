

export function Header() {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8 sticky top-0 z-10 w-full shadow-sm">
      <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span>System Active</span>
        </div>
        <div className="w-px h-4 bg-slate-300"></div>
        <span>{currentDate} - {currentTime}</span>
      </div>
    </header>
  );
}
