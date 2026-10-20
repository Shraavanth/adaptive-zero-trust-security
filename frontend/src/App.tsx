import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BootSplash } from './components/BootSplash';
import { Ambient } from './components/shell/Ambient';
import { BrandMark } from './components/shell/BrandMark';
import { NavIsland } from './components/shell/NavIsland';
import { CaptureIsland } from './components/shell/CaptureIsland';
import { PageHero } from './components/shell/PageHero';
import { CommandPalette } from './components/shell/CommandPalette';
import { MobileMenu } from './components/shell/MobileMenu';
import { NAV_GROUPS, findPage } from './lib/nav';
import { TelemetryContext } from './lib/telemetry';
import { useLivePacketStream, api } from './services/api';
import { Packet, OperatingMode } from './types';

// Pages
import { Overview } from './pages/Overview';
import { LiveMonitor } from './pages/LiveMonitor';
import { NetworkFlows } from './pages/NetworkFlows';
import { ThreatDetection } from './pages/ThreatDetection';
import { InvestigationCenter } from './pages/InvestigationCenter';
import { DeviceTrust } from './pages/DeviceTrust';
import { ZeroTrustDecisions } from './pages/ZeroTrustDecisions';
import { RepeatOffenders } from './pages/RepeatOffenders';
import { IsolationResponse } from './pages/IsolationResponse';
import { SelfHealing } from './pages/SelfHealing';
import { HoneypotMonitoring } from './pages/HoneypotMonitoring';
import { AuditTrail } from './pages/AuditTrail';
import { ControlledTesting } from './pages/ControlledTesting';
import { ScenarioResults } from './pages/ScenarioResults';
import { NetworkTopology } from './pages/NetworkTopology';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { NetworkInterfaces } from './pages/NetworkInterfaces';
import { CaptureSessions } from './pages/CaptureSessions';
import { Diagnostics } from './pages/Diagnostics';
import { Settings } from './pages/Settings';
import { Documentation } from './pages/Documentation';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('overview');
  const [currentMode, setCurrentMode] = useState<OperatingMode>('SIMULATED_TEST');
  const [selectedInterface, setSelectedInterface] = useState<string>('Software Loopback Interface 1');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [recentPackets, setRecentPackets] = useState<Packet[]>([]);
  const [packetRate, setPacketRate] = useState<number>(0);
  const [rateHistory, setRateHistory] = useState<number[]>(() => Array(24).fill(0));
  const [threatCount, setThreatCount] = useState<number>(0);
  const [lastThreatAt, setLastThreatAt] = useState<number>(0);
  const [threatActive, setThreatActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Poll capture status and counts
  const checkStatus = async () => {
    try {
      const status = await api.getCaptureStatus();
      setIsCapturing(status.is_capturing);
      if (status.current_interface) setSelectedInterface(status.current_interface);
      if (status.stats?.packets_per_sec !== undefined) {
        const rate = status.stats.packets_per_sec;
        setPacketRate(rate);
        setRateHistory((h) => [...h.slice(1), rate]);
      }
      if (status.stats?.malicious_packets !== undefined) setThreatCount(status.stats.malicious_packets);
      setServiceError(null);
    } catch (err) {
      setServiceError(`Backend status unavailable: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Receive live packet via SSE
  const handleNewPacket = useCallback((pkt: Packet) => {
    setRecentPackets((prev) => [pkt, ...prev.slice(0, 100)]);
    if (pkt.detection_status === 'MALICIOUS') {
      setThreatCount((prev) => prev + 1);
      setLastThreatAt(Date.now());
    }
  }, []);

  const { isConnected } = useLivePacketStream(handleNewPacket);

  // The ambient threat bloom stays lit for a few seconds after the last hit
  useEffect(() => {
    if (!lastThreatAt) return;
    setThreatActive(true);
    const t = window.setTimeout(() => setThreatActive(false), 6000);
    return () => window.clearTimeout(t);
  }, [lastThreatAt]);

  // Toggle capture action
  const handleToggleCapture = async () => {
    try {
      if (isCapturing) {
        await api.stopCapture();
        setIsCapturing(false);
      } else {
        await api.startCapture(selectedInterface || '1', currentMode);
        setIsCapturing(true);
      }
      checkStatus();
    } catch (err) {
      setServiceError(`Capture command failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleNavigate = useCallback((page: string) => {
    setActivePage(page);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const current = findPage(activePage);

  // ⌘K / Ctrl+K opens the page switcher
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Panel border spotlight follows a fine pointer. Each panel gets its own
  // coordinates — nothing is driven through a shared parent variable.
  const spotFrame = useRef(0);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let last: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(spotFrame.current);
      spotFrame.current = requestAnimationFrame(() => {
        const panel = (e.target as Element | null)?.closest?.('.panel') as HTMLElement | null;
        if (last && last !== panel) {
          last.style.removeProperty('--mx');
          last.style.removeProperty('--my');
        }
        if (panel) {
          const r = panel.getBoundingClientRect();
          panel.style.setProperty('--mx', `${e.clientX - r.left}px`);
          panel.style.setProperty('--my', `${e.clientY - r.top}px`);
        }
        last = panel;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(spotFrame.current);
    };
  }, []);

  const telemetry = useMemo(
    () => ({ packets: recentPackets, packetRate, rateHistory, isCapturing, isConnected, threatCount, threatActive }),
    [recentPackets, packetRate, rateHistory, isCapturing, isConnected, threatCount, threatActive]
  );

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <Overview onNavigate={handleNavigate} />;
      case 'live-monitor':
        return <LiveMonitor packets={recentPackets} isCapturing={isCapturing} onToggleCapture={handleToggleCapture} />;
      case 'flows':
        return <NetworkFlows />;
      case 'threats':
        return <ThreatDetection />;
      case 'investigations':
        return <InvestigationCenter />;
      case 'device-trust':
        return <DeviceTrust />;
      case 'zt-decisions':
        return <ZeroTrustDecisions />;
      case 'repeat-offenders':
        return <RepeatOffenders />;
      case 'isolation-response':
        return <IsolationResponse />;
      case 'self-healing':
        return <SelfHealing />;
      case 'honeypots':
        return <HoneypotMonitoring />;
      case 'audit-trail':
        return <AuditTrail />;
      case 'controlled-testing':
        return <ControlledTesting onNavigate={handleNavigate} />;
      case 'scenario-results':
        return <ScenarioResults />;
      case 'topology':
        return <NetworkTopology />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'interfaces':
        return (
          <NetworkInterfaces
            selectedInterface={selectedInterface}
            onSelectInterface={(iface) => setSelectedInterface(iface)}
          />
        );
      case 'sessions':
        return <CaptureSessions />;
      case 'diagnostics':
        return <Diagnostics />;
      case 'settings':
        return <Settings />;
      case 'documentation':
        return <Documentation />;
      default:
        return <Overview onNavigate={handleNavigate} />;
    }
  };

  return (
    <TelemetryContext.Provider value={telemetry}>
      <div className="relative min-h-[100dvh] bg-soc-bg text-soc-text">
        <Ambient threat={threatActive} />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-modal focus:rounded-full focus:bg-signal-400 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#0b1006]"
        >
          Skip to content
        </a>

        {/* Content fades out beneath the floating chrome */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-nav h-28 bg-gradient-to-b from-soc-bg via-soc-bg/80 to-transparent" />

        <header className="sticky top-0 z-nav px-3 pt-3 sm:px-5 lg:px-8 lg:pt-5">
          <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-3">
            <BrandMark live={isCapturing} onClick={() => handleNavigate('overview')} />
            <NavIsland
              activeGroup={current.group.id}
              threatCount={threatCount}
              onSelectGroup={(gid) => handleNavigate(NAV_GROUPS.find((g) => g.id === gid)!.pages[0].id)}
              onOpenCommand={() => setCommandOpen(true)}
            />
            <div className="flex items-center gap-2">
              <CaptureIsland
                isCapturing={isCapturing}
                isConnected={isConnected}
                currentMode={currentMode}
                selectedInterface={selectedInterface}
                packetRate={packetRate}
                rateHistory={rateHistory}
                onChangeMode={setCurrentMode}
                onToggleCapture={handleToggleCapture}
              />
              <button
                type="button"
                aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen((o) => !o)}
                className="burger glass relative h-12 w-12 shrink-0 rounded-full text-soc-text lg:hidden"
              >
                <span />
                <span />
              </button>
            </div>
          </div>
        </header>

        <main id="main" className="relative z-[2] mx-auto max-w-[1480px] px-3 pb-28 sm:px-5 lg:px-8">
          <PageHero group={current.group} page={current} onNavigate={handleNavigate} />

          {serviceError && (
            <div role="alert" className="mt-6 flex items-center gap-3 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200 shadow-[inset_0_0_0_1px_rgb(242_122_110/0.3)]">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
              {serviceError}
            </div>
          )}

          <div key={activePage} className="page-enter mt-8 sm:mt-10">
            {renderPage()}
          </div>
        </main>

        <MobileMenu open={menuOpen} activePage={activePage} onNavigate={handleNavigate} onClose={() => setMenuOpen(false)} />
        <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onNavigate={handleNavigate} />
        <BootSplash />
      </div>
    </TelemetryContext.Provider>
  );
};
