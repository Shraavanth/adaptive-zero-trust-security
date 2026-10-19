import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle, Clock, FileText, User } from 'lucide-react';
import { api } from '../services/api';
import { IncidentEvidence, Investigation } from '../types';

export const InvestigationCenter: React.FC = () => {
  const [cases, setCases] = useState<Investigation[]>([]);
  const [selectedCase, setSelectedCase] = useState<Investigation | null>(null);
  const [noteText, setNoteText] = useState('');
  const [incidentEvidence, setIncidentEvidence] = useState<IncidentEvidence | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      const data = await api.getInvestigations();
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
        setNoteText(data[0].notes);
      }
    } catch (err) {
      console.error('Failed to load investigation cases', err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (!selectedCase) {
      setIncidentEvidence(null);
      return;
    }
    let isCurrent = true;
    setEvidenceLoading(true);
    setEvidenceError(null);
    setIncidentEvidence(null);
    api.getThreatEvidence(selectedCase.event_id)
      .then((data) => {
        if (isCurrent) setIncidentEvidence(data);
      })
      .catch((err) => {
        if (isCurrent) {
          setEvidenceError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (isCurrent) setEvidenceLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [selectedCase?.event_id]);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedCase) return;
    try {
      await api.updateInvestigation(selectedCase.id, status, noteText);
      await fetchCases();
    } catch (err) {
      alert(`Error updating case: ${err}`);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCase) return;
    try {
      await api.updateInvestigation(selectedCase.id, undefined, noteText);
      alert('Analyst notes saved successfully.');
      await fetchCases();
    } catch (err) {
      alert(`Error saving notes: ${err}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-soc-card border border-soc-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-soc-text font-mono flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            Security Incident Investigation Center
          </h2>
          <p className="text-xs text-soc-dim">
            Formal forensic case management for analyst reviews, evidence triage, and incident containment.
          </p>
        </div>
        <button
          onClick={fetchCases}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-xs font-mono text-soc-muted hover:text-soc-text transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Cases
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cases List */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-3 space-y-2 font-mono text-xs">
          <h3 className="font-semibold text-soc-dim text-[11px] uppercase tracking-wider px-2">Active Cases ({cases.length})</h3>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {cases.length > 0 ? (
              cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCase(c);
                    setNoteText(c.notes);
                  }}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedCase?.id === c.id
                      ? 'bg-blue-950/40 border-blue-600/70'
                      : 'bg-soc-bg border-soc-border hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400">{c.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'CLOSED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="font-semibold text-soc-text mt-1 truncate">{c.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-soc-dim mt-2">
                    <span>Priority: {c.priority}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-soc-dim">
                No active investigations. Open a case directly from Threat Detection!
              </div>
            )}
          </div>
        </div>

        {/* Case Work Area */}
        <div className="lg:col-span-2 bg-soc-card border border-soc-border rounded-lg p-5 font-mono text-xs space-y-4">
          {selectedCase ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-soc-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-soc-text">{selectedCase.title}</h3>
                  <p className="text-soc-dim text-[11px]">Case Ref: {selectedCase.id} | Linked Event: {selectedCase.event_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('INVESTIGATING')}
                    className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs"
                  >
                    Set Investigating
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('CLOSED')}
                    className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs"
                  >
                    Close Case
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="bg-soc-bg rounded p-2.5 border border-soc-border flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-soc-dim">Assigned Analyst:</span>
                    <p className="text-soc-text font-bold">{selectedCase.analyst}</p>
                  </div>
                </div>
                <div className="bg-soc-bg rounded p-2.5 border border-soc-border flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-soc-dim">Evidence Cross-Reference:</span>
                    <p className="text-soc-text font-bold truncate">{selectedCase.evidence_links}</p>
                  </div>
                </div>
              </div>

              <section aria-label="Correlated incident evidence" className="rounded border border-soc-border bg-soc-bg p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-soc-text">Correlated incident timeline</h4>
                    <p className="mt-1 text-[10px] text-soc-dim">
                      Persisted packet, detection, trust, policy, and response records for this event.
                    </p>
                  </div>
                  {incidentEvidence && (
                    <span className="rounded border border-blue-800 bg-blue-950/60 px-2 py-1 text-[10px] text-blue-300">
                      {incidentEvidence.timeline.length} evidence records
                    </span>
                  )}
                </div>
                {evidenceLoading && <p role="status" className="py-4 text-center text-soc-dim">Loading correlated evidence…</p>}
                {evidenceError && (
                  <p role="alert" className="rounded border border-rose-800 bg-rose-950/40 p-2 text-rose-300">
                    Unable to load incident evidence: {evidenceError}
                  </p>
                )}
                {!evidenceLoading && incidentEvidence && (
                  <div className="space-y-3">
                    {incidentEvidence.packet ? (
                      <div className="grid grid-cols-2 gap-2 rounded border border-soc-border p-2 text-[10px] sm:grid-cols-4">
                        <div><span className="text-soc-dim">PACKET</span><p className="text-soc-text">#{incidentEvidence.packet.id}</p></div>
                        <div><span className="text-soc-dim">SOURCE</span><p className="break-all text-soc-text">{incidentEvidence.packet.src_ip}:{incidentEvidence.packet.src_port ?? '—'}</p></div>
                        <div><span className="text-soc-dim">DESTINATION</span><p className="break-all text-soc-text">{incidentEvidence.packet.dst_ip}:{incidentEvidence.packet.dst_port ?? '—'}</p></div>
                        <div><span className="text-soc-dim">PROTOCOL / MODE</span><p className="text-soc-text">{incidentEvidence.packet.protocol} / {incidentEvidence.packet.mode}</p></div>
                      </div>
                    ) : (
                      <p className="rounded border border-amber-900/70 bg-amber-950/30 p-2 text-[10px] text-amber-300">
                        No packet record is linked to this event.
                      </p>
                    )}
                    <ol className="max-h-72 space-y-2 overflow-y-auto">
                      {incidentEvidence.timeline.map((entry, index) => (
                        <li key={`${entry.record_type}-${entry.timestamp}-${index}`} className="flex gap-3 border-l border-blue-900 pl-3">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                              <span className="font-semibold text-soc-text">{entry.title}</span>
                              <time className="text-[10px] text-soc-dim">{new Date(entry.timestamp).toLocaleString()}</time>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-relaxed text-soc-muted">{entry.detail}</p>
                            {entry.status && <span className="mt-1 inline-block text-[9px] uppercase text-blue-300">{entry.record_type}: {entry.status}</span>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </section>

              <div>
                <label className="block text-soc-muted mb-1 font-medium uppercase text-[11px]">
                  Analyst Working Notes & Root-Cause Documentation
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={8}
                  className="w-full bg-soc-bg border border-soc-border rounded p-3 text-soc-text font-mono focus:outline-none focus:border-blue-500"
                  placeholder="Record forensic analysis notes, timeline artifacts, and mitigations..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs font-mono"
                >
                  Save Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-soc-dim">
              Select an investigation case to review and update analyst forensics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
