import { LayoutDashboard, ShieldAlert, Users, Map, FileText, Bell, Settings, LogOut, Bot } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
        active
          ? "bg-blue-900/40 text-white border-l-4 border-blue-500"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50 border-l-4 border-transparent"
      )}
    >
      <span className={cn(active ? "text-blue-400" : "text-slate-400")}>
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#0b1437] text-white flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Bot size={24} className="text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm leading-tight">AI Powered</span>
          <span className="font-bold text-sm leading-tight">Crime Prediction</span>
        </div>
      </div>

      <div className="px-4 py-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Main Menu
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => onTabChange('dashboard')} />
        <NavItem icon={<ShieldAlert size={20} />} label="Crime Prediction" active={activeTab === 'predict'} onClick={() => onTabChange('predict')} />
        <NavItem icon={<Users size={20} />} label="Suspect Prediction" active={activeTab === 'suspect'} onClick={() => onTabChange('suspect')} />
        <NavItem icon={<Map size={20} />} label="Crime Hotspots" active={activeTab === 'hotspots'} onClick={() => onTabChange('hotspots')} />
        <NavItem icon={<FileText size={20} />} label="Reports" active={activeTab === 'reports'} onClick={() => onTabChange('reports')} />
        <NavItem icon={<Bell size={20} />} label="Alerts" active={activeTab === 'alerts'} onClick={() => onTabChange('alerts')} />
        <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => onTabChange('settings')} />
      </nav>

      <div className="mt-auto pb-4">
        <NavItem icon={<LogOut size={20} />} label="Logout" />
      </div>
    </aside>
  );
}
