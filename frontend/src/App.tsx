import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
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
  const [threatCount, setThreatCount] = useState<number>(0);
  const [isolatedCount, setIsolatedCount] = useState<number>(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Poll capture status and counts
  const checkStatus = async () => {
    try {
      const status = await api.getCaptureStatus();
      setIsCapturing(status.is_capturing);
      if (status.current_interface) setSelectedInterface(status.current_interface);
      if (status.stats?.packets_per_sec !== undefined) setPacketRate(status.stats.packets_per_sec);
      if (status.stats?.malicious_packets !== undefined) setThreatCount(status.stats.malicious_packets);

      const isolations = await api.getIsolations();
      const activeIso = isolations.filter((i: any) =>
        i.status === 'ISOLATED' && i.execution_mode !== 'SIMULATED'
      ).length;
      setIsolatedCount(activeIso);
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
    }
  }, []);

  const { isConnected } = useLivePacketStream(handleNewPacket);

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
      alert(`Capture command error: ${err}`);
    }
  };

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setMobileNavOpen(false);
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'overview': return 'Executive Overview';
      case 'live-monitor': return 'Live Packet Monitor';
      case 'flows': return 'Network Flow Telemetry';
      case 'threats': return 'Cyber Threat Detection';
      case 'investigations': return 'Investigation Center';
      case 'device-trust': return 'Device Trust Scores';
      case 'zt-decisions': return 'Zero Trust Access Decisions';
      case 'repeat-offenders': return 'Repeat Offender Timeline';
      case 'isolation-response': return 'Traffic Isolation & Response';
      case 'self-healing': return 'Self-Healing Engine';
      case 'honeypots': return 'Autonomous Honeypot Monitoring';
      case 'audit-trail': return 'Security Response Audit Trail';
      case 'controlled-testing': return 'Controlled Testing Suite';
      case 'scenario-results': return 'Scenario Verification Results';
      case 'topology': return 'Network Topology Map';
      case 'reports': return 'Compliance Reports & Analytics';
      case 'interfaces': return 'Network Adapters & Drivers';
      case 'sessions': return 'Capture Sessions & Replay';
      case 'diagnostics': return 'System Diagnostics & Health';
      case 'settings': return 'System Parameters & Policies';
      case 'documentation': return 'Architecture & API Documentation';
      default: return 'SOC Dashboard';
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <Overview onNavigate={setActivePage} />;
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
        return <ControlledTesting onNavigate={setActivePage} />;
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
        return <Overview onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="flex h-screen bg-soc-bg text-soc-text overflow-hidden select-none">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        threatCount={threatCount}
        isolatedCount={isolatedCount}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Compact Topbar */}
        <Topbar
          pageTitle={getPageTitle()}
          isCapturing={isCapturing}
          currentMode={currentMode}
          selectedInterface={selectedInterface}
          onToggleCapture={handleToggleCapture}
          onChangeMode={setCurrentMode}
          packetRate={packetRate}
          isConnected={isConnected}
          onOpenMenu={() => setMobileNavOpen(true)}
        />

        {/* Scrollable Main Content */}
        <main className="soc-main min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            {serviceError && (
              <div role="alert" className="mb-4 rounded-lg border border-rose-800 bg-rose-950/70 px-4 py-3 text-sm text-rose-200">
                {serviceError}
              </div>
            )}
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};
