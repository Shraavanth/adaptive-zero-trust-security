import React from 'react';
import {
  ShieldAlert,
  Activity,
  Network,
  AlertTriangle,
  Search,
  KeyRound,
  FileCheck2,
  Users2,
  Lock,
  HeartPulse,
  Radar,
  History,
  FlaskConical,
  CheckCircle2,
  GitFork,
  BarChart3,
  Wifi,
  Radio,
  Cpu,
  Settings,
  BookOpen,
  Shield
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (pageId: string) => void;
  threatCount?: number;
  isolatedCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  threatCount = 0,
  isolatedCount = 0,
  isOpen,
  onClose
}) => {
  const sections: NavSection[] = [
    {
      title: 'SOC Operations',
      items: [
        { id: 'overview', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
        { id: 'live-monitor', label: 'Live Packet Monitor', icon: <Activity className="w-4 h-4" /> },
        { id: 'flows', label: 'Network Flows', icon: <Network className="w-4 h-4" /> },
        { id: 'threats', label: 'Threat Detection', icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, badge: threatCount },
        { id: 'investigations', label: 'Investigation Center', icon: <Search className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Zero Trust & Identity',
      items: [
        { id: 'device-trust', label: 'Device Trust', icon: <KeyRound className="w-4 h-4 text-emerald-400" /> },
        { id: 'zt-decisions', label: 'Zero Trust Decisions', icon: <FileCheck2 className="w-4 h-4" /> },
        { id: 'repeat-offenders', label: 'Repeat Offenders', icon: <Users2 className="w-4 h-4 text-rose-400" /> },
      ]
    },
    {
      title: 'Response & Recovery',
      items: [
        { id: 'isolation-response', label: 'Isolation & Response', icon: <Lock className="w-4 h-4 text-rose-400" />, badge: isolatedCount },
        { id: 'self-healing', label: 'Self-Healing Engine', icon: <HeartPulse className="w-4 h-4 text-emerald-400" /> },
        { id: 'honeypots', label: 'Honeypot Monitoring', icon: <Radar className="w-4 h-4 text-cyan-400" /> },
        { id: 'audit-trail', label: 'Response Audit Trail', icon: <History className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Testing & Topology',
      items: [
        { id: 'controlled-testing', label: 'Controlled Testing', icon: <FlaskConical className="w-4 h-4 text-purple-400" /> },
        { id: 'scenario-results', label: 'Scenario Results', icon: <CheckCircle2 className="w-4 h-4" /> },
        { id: 'topology', label: 'Network Topology', icon: <GitFork className="w-4 h-4" /> },
        { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" /> },
      ]
    },
    {
      title: 'System & Capture',
      items: [
        { id: 'interfaces', label: 'Network Interfaces', icon: <Wifi className="w-4 h-4" /> },
        { id: 'sessions', label: 'Capture Sessions', icon: <Radio className="w-4 h-4" /> },
        { id: 'diagnostics', label: 'Diagnostics', icon: <Cpu className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
        { id: 'documentation', label: 'Documentation', icon: <BookOpen className="w-4 h-4" /> },
      ]
    }
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 shrink-0 select-none flex-col border-r border-soc-border bg-soc-bg transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      {/* Brand Header */}
      <div className="p-4 border-b border-soc-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-blue-900/60 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-900/40">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-sm font-semibold tracking-wide text-soc-text truncate">Adaptive Zero Trust</h1>
          <p className="text-[11px] font-mono text-soc-muted truncate">Self-Healing Security</p>
        </div>
      </div>

      {/* Nav List */}
      <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-mono font-semibold tracking-wider text-soc-dim uppercase">
              {sec.title}
            </h2>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-soc-card border border-blue-500/40 text-blue-400 shadow-sm'
                        : 'text-soc-muted hover:text-soc-text hover:bg-soc-cardHover border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-blue-400' : 'text-soc-dim'}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-soc-border bg-soc-bg/80 text-[11px] font-mono text-soc-dim flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-400" />
          SOC Framework v1.0
        </span>
        <span>Local Core</span>
      </div>
      </aside>
    </>
  );
};
