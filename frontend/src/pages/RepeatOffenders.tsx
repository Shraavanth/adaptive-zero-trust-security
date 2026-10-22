import React, { useState, useEffect } from 'react';
import { Users2, RefreshCw, AlertOctagon, ShieldAlert, Clock } from 'lucide-react';
import { api } from '../services/api';
import { RepeatOffender } from '../types';

export const RepeatOffenders: React.FC = () => {
  const [offenders, setOffenders] = useState<RepeatOffender[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffenders = async () => {
    try {
      const data = await api.getRepeatOffenders();
      setOffenders(data);
    } catch (err) {
      console.error('Failed to load repeat offenders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffenders();
    const interval = setInterval(fetchOffenders, 5000);
    return () => clearInterval(interval);
  }, []);

  const getEscalationBadge = (state: string) => {
    if (state === 'PERMANENT_BLOCK') {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
          PERMANENT_BLOCK (Level 4)
        </span>
      );
    } else if (state === 'EXTENDED_QUARANTINE') {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-bold bg-orange-950 text-orange-300 border border-orange-800">
          EXTENDED_QUARANTINE (Level 3)
        </span>
      );
    } else if (state === 'ENHANCED_MONITORING') {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
          ENHANCED_MONITORING (Level 2)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">
        ACTIVE (Level 1)
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="page-head">
        <div>
          <h2 className="text-base font-bold text-soc-text font-mono flex items-center gap-2">
            <Users2 className="w-4 h-4 text-rose-400" />
            Repeat Offender Escalation Tracker
          </h2>
          <p className="text-xs text-soc-dim">
            Multi-stage threat recurrence tracking across distinct qualifying security incidents.
          </p>
        </div>
        <button
          onClick={fetchOffenders}
          className="btn-ghost"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Offenders
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-soc-card border border-blue-900/50 rounded-lg">
          <span className="text-soc-dim uppercase text-[10px]">Level 1: 1st Incident</span>
          <p className="text-blue-400 font-bold mt-1">ACTIVE</p>
          <p className="text-[11px] text-soc-dim mt-0.5">Targeted telemetry monitoring</p>
        </div>
        <div className="p-3 bg-soc-card border border-amber-900/50 rounded-lg">
          <span className="text-soc-dim uppercase text-[10px]">Level 2: 2nd Incident</span>
          <p className="text-amber-400 font-bold mt-1">ENHANCED_MONITORING</p>
          <p className="text-[11px] text-soc-dim mt-0.5">DPI buffer inspection & honeypot redirect</p>
        </div>
        <div className="p-3 bg-soc-card border border-orange-900/50 rounded-lg">
          <span className="text-soc-dim uppercase text-[10px]">Level 3: 3rd Incident</span>
          <p className="text-orange-400 font-bold mt-1">EXTENDED_QUARANTINE</p>
          <p className="text-[11px] text-soc-dim mt-0.5">Prolonged isolation & strict cooldown</p>
        </div>
        <div className="p-3 bg-soc-card border border-rose-900/50 rounded-lg">
          <span className="text-soc-dim uppercase text-[10px]">Level 4: 4th+ Incident</span>
          <p className="text-rose-400 font-bold mt-1">PERMANENT_BLOCK</p>
          <p className="text-[11px] text-soc-dim mt-0.5">Autonomous recovery prohibited</p>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="thead-soc">
              <tr>
                <th className="py-2.5 px-3">Offending Entity</th>
                <th className="py-2.5 px-3">Qualifying Incidents</th>
                <th className="py-2.5 px-3">Escalation State</th>
                <th className="py-2.5 px-3">Attack Categories</th>
                <th className="py-2.5 px-3">First Incident</th>
                <th className="py-2.5 px-3">Last Incident</th>
                <th className="py-2.5 px-3">Escalation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {offenders.length > 0 ? (
                offenders.map((o) => (
                  <tr key={o.entity_id} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2.5 px-3 font-bold text-soc-text">
                      {o.ip_address}
                      <span className="block text-[11px] text-soc-dim">{o.mac_address}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-base text-rose-400">
                      {o.qualifying_incident_count}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getEscalationBadge(o.escalation_state)}
                    </td>
                    <td className="py-2.5 px-3 text-soc-muted">
                      {o.attack_categories || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(o.first_incident_time).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-soc-dim whitespace-nowrap">
                      {new Date(o.last_incident_time).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-soc-dim max-w-xs truncate">
                      {o.notes || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-soc-dim">
                    No repeat offenders registered. Multi-stage escalation will activate upon repeated incidents.
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
