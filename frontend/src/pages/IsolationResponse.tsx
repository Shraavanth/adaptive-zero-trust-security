import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle, Radio } from 'lucide-react';
import { api } from '../services/api';
import { ResponseAction, ResponsePreview } from '../types';

export const IsolationResponse: React.FC = () => {
  const [actions, setActions] = useState<ResponseAction[]>([]);
  const [targetIp, setTargetIp] = useState('192.168.1.188');
  const [actionType, setActionType] = useState<ResponseAction['action_type']>('ISOLATE');
  const [reason, setReason] = useState('Manual SOC operator containment command');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<ResponsePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const fetchActions = async () => {
    try {
      const data = await api.getResponseActions();
      setActions(data);
    } catch (err) {
      console.error('Failed to load response actions', err);
    }
  };

  useEffect(() => {
    fetchActions();
    const interval = setInterval(fetchActions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePreview = async () => {
    setIsPreviewing(true);
    setPreviewError(null);
    try {
      const data = await api.previewResponse(targetIp, actionType, reason);
      setPreview(data);
    } catch (err) {
      setPreview(null);
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.executeResponse(targetIp, actionType, reason, 'SIMULATED');
      await fetchActions();
      alert(`Response action ${actionType} was recorded in SIMULATED mode for ${targetIp}; no network controls were changed.`);
    } catch (err) {
      alert(`Execution error: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            Intelligent Traffic Isolation & Incident Containment
          </h2>
          <p className="text-xs text-soc-dim">
            SIMULATED mode only. Actions update local audit state and do not change network traffic or firewall policy.
          </p>
        </div>
        <button
          onClick={fetchActions}
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Actions
        </button>
      </div>

      {/* Operator Execution Panel */}
      <div className="panel p-4 font-mono text-xs">
        <h3 className="font-bold text-soc-text mb-3 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-400" /> Operator Containment Console
        </h3>
        <form onSubmit={handleExecute} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-soc-dim mb-1 font-medium">Target Entity / Host IP</label>
            <input
              type="text"
              value={targetIp}
              onChange={(e) => { setTargetIp(e.target.value); setPreview(null); }}
              className="w-full inset-well px-3 py-1.5 text-soc-text focus:outline-none focus:border-blue-500"
              placeholder="e.g. 192.168.1.188"
              required
            />
          </div>
          <div>
            <label className="block text-soc-dim mb-1 font-medium">Enforcement Operation</label>
            <select
              value={actionType}
              onChange={(e) => { setActionType(e.target.value as ResponseAction['action_type']); setPreview(null); }}
              className="w-full inset-well px-3 py-1.5 text-soc-text focus:outline-none focus:border-blue-500"
            >
              <option value="ISOLATE">ISOLATE (Full Quarantine)</option>
              <option value="RESTRICT">RESTRICT (Bandwidth / Port Limit)</option>
              <option value="MONITOR">MONITOR (Heightened DPI Inspection)</option>
              <option value="RELEASE">RELEASE (Revoke Isolation)</option>
            </select>
          </div>
          <div>
            <label className="block text-soc-dim mb-1 font-medium">Authorization Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setPreview(null); }}
              className="w-full inset-well px-3 py-1.5 text-soc-text focus:outline-none focus:border-blue-500"
              placeholder="Operational justification"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing || !targetIp.trim() || !reason.trim()}
              className="flex-1 rounded border border-blue-700 bg-blue-950/60 px-3 py-1.5 font-bold text-blue-200 transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPreviewing ? 'Previewing…' : 'Preview'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 rounded px-3 py-1.5 font-bold transition-colors ${
                actionType === 'RELEASE'
                  ? 'btn-signal'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {isSubmitting ? 'Recording…' : 'Record'}
            </button>
          </div>
        </form>
      </div>

      {(preview || previewError) && (
        <section aria-label="Response action preview" className="rounded-lg border border-blue-800/70 bg-blue-950/20 p-4 font-mono text-xs">
          {previewError ? (
            <p role="alert" className="text-rose-300">Unable to generate preview: {previewError}</p>
          ) : preview && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-blue-200">Preview: {preview.action_type} for {preview.target_entity}</h3>
                <span className="rounded border border-amber-800 bg-amber-950/60 px-2 py-1 text-[10px] font-bold text-amber-300">
                  NO STATE CHANGED · SIMULATED ONLY
                </span>
              </div>
              <p className="mt-2 text-soc-text">{preview.requested_operation}</p>
              <p className="mt-1 text-soc-muted">Would update local records: {preview.affected_local_records.join(', ')}.</p>
              <p className="mt-1 text-soc-muted">Suggested inverse: {preview.rollback_action ?? 'none'}.</p>
              <p className="mt-2 text-[10px] text-amber-300">{preview.rollback_limitations}</p>
            </>
          )}
        </section>
      )}

      {/* Response Audit Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="thead-soc">
              <tr>
                <th className="py-2.5 px-3">Action ID</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Enforcement Scope</th>
                <th className="py-2.5 px-3">Executed At</th>
                <th className="py-2.5 px-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {actions.length > 0 ? (
                actions.map((a) => (
                  <tr key={a.id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2.5 px-3 font-bold text-blue-400">{a.id}</td>
                    <td className="py-2.5 px-3 font-bold">{a.target_entity}</td>
                    <td className="py-2.5 px-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        a.action_type === 'ISOLATE'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : a.action_type === 'RELEASE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {a.action_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-soc-dim">{a.execution_mode}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        a.execution_status === 'SIMULATED' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {a.execution_status === 'SIMULATED'
                          ? <AlertTriangle className="w-3 h-3 text-amber-400" />
                          : <CheckCircle className="w-3 h-3" />}
                        {a.execution_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-soc-dim max-w-xs truncate" title={a.requested_operation}>
                      {a.requested_operation}
                    </td>
                    <td className="py-2.5 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(a.start_time).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {a.action_type === 'ISOLATE' && (
                        <button
                          onClick={async () => {
                            await api.executeResponse(a.target_entity, 'RELEASE', 'Operator manual release');
                            fetchActions();
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] inline-flex items-center gap-1"
                        >
                          <Unlock className="w-3 h-3" /> Release
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-soc-dim">
                    No active containment actions dispatched yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
