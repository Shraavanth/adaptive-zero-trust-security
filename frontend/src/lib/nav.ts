import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Cpu,
  FileCheck2,
  FlaskConical,
  Fingerprint,
  GitFork,
  HeartPulse,
  History,

  Lock,
  Network,
  Radar,
  Radio,
  ScanSearch,
  Settings,
  Users2,
  Waypoints,
  Wifi,
  type LucideIcon,
} from 'lucide-react';

export interface NavPage {
  id: string;
  label: string;
  /** Hero headline: plain lead, then an editorial italic tail */
  title: [string, string];
  icon: LucideIcon;
}

export interface NavGroup {
  id: string;
  label: string;
  pages: NavPage[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'operations',
    label: 'Operations',
    pages: [
      { id: 'overview', label: 'Overview', title: ['Security operations', 'overview'], icon: Radar },
      { id: 'live-monitor', label: 'Live monitor', title: ['Live packet', 'monitor'], icon: Activity },
      { id: 'flows', label: 'Flows', title: ['Network', 'flows'], icon: Network },
      { id: 'threats', label: 'Threats', title: ['Threat', 'detection'], icon: AlertTriangle },
      { id: 'investigations', label: 'Investigations', title: ['Investigation', 'center'], icon: ScanSearch },
    ],
  },
  {
    id: 'trust',
    label: 'Zero trust',
    pages: [
      { id: 'device-trust', label: 'Device trust', title: ['Device', 'trust'], icon: Fingerprint },
      { id: 'zt-decisions', label: 'Decisions', title: ['Zero trust', 'decisions'], icon: FileCheck2 },
      { id: 'repeat-offenders', label: 'Repeat offenders', title: ['Repeat', 'offenders'], icon: Users2 },
    ],
  },
  {
    id: 'response',
    label: 'Response',
    pages: [
      { id: 'isolation-response', label: 'Isolation', title: ['Isolation &', 'response'], icon: Lock },
      { id: 'self-healing', label: 'Self-healing', title: ['Self-healing', 'engine'], icon: HeartPulse },
      { id: 'honeypots', label: 'Honeypots', title: ['Honeypot', 'monitoring'], icon: Waypoints },
      { id: 'audit-trail', label: 'Audit trail', title: ['Response', 'audit trail'], icon: History },
    ],
  },
  {
    id: 'lab',
    label: 'Lab',
    pages: [
      { id: 'controlled-testing', label: 'Controlled testing', title: ['Controlled', 'testing'], icon: FlaskConical },
      { id: 'scenario-results', label: 'Scenario results', title: ['Scenario', 'results'], icon: CheckCircle2 },
      { id: 'topology', label: 'Topology', title: ['Network', 'topology'], icon: GitFork },
      { id: 'reports', label: 'Reports', title: ['Reports &', 'analytics'], icon: BarChart3 },
    ],
  },
  {
    id: 'system',
    label: 'System',
    pages: [
      { id: 'interfaces', label: 'Interfaces', title: ['Network', 'interfaces'], icon: Wifi },
      { id: 'sessions', label: 'Capture sessions', title: ['Capture', 'sessions'], icon: Radio },
      { id: 'diagnostics', label: 'Diagnostics', title: ['System', 'diagnostics'], icon: Cpu },
      { id: 'settings', label: 'Settings', title: ['Policy', 'settings'], icon: Settings },
      { id: 'documentation', label: 'Documentation', title: ['Architecture', 'notes'], icon: BookOpen },
    ],
  },
];

export const ALL_PAGES = NAV_GROUPS.flatMap((g) => g.pages.map((p) => ({ ...p, group: g })));

export const findPage = (id: string) => ALL_PAGES.find((p) => p.id === id) ?? ALL_PAGES[0];

