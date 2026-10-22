import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Shield, FileText } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs(150);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Security Response & System Audit Trail
          </h2>
          <p className="text-soc-dim mt-0.5">
            Immutable chronicle of all containment orders, Zero Trust policy shifts, capture sessions, and self-healing cycles.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="thead-soc">
              <tr>
                <th className="py-2.5 px-3">Audit ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Actor / Subsystem</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {logs.length > 0 ? (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2 px-3 font-bold text-blue-400">{l.id}</td>
                    <td className="py-2 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-semibold text-soc-text">{l.action}</td>
                    <td className="py-2 px-3 text-soc-dim">{l.actor}</td>
                    <td className="py-2 px-3">{l.category}</td>
                    <td className="py-2 px-3 font-bold">{l.target}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-soc-dim max-w-md truncate" title={l.details}>
                      {l.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-soc-dim">
                    No persistent audit records available yet.
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
