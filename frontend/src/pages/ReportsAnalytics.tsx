import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Download, FileText, PieChart as PieIcon, Shield } from 'lucide-react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export const ReportsAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.getReportsSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportReport = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soc_security_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const protoChartData = Object.entries(data?.protocol_distribution || {}).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const sevChartData = Object.entries(data?.severity_distribution || {}).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const PROTO_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="bg-soc-card border border-soc-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Cybersecurity Analytics & Compliance Reporting
          </h2>
          <p className="text-soc-dim mt-0.5">
            Statistical summaries generated directly from persistent packet, threat, and Zero Trust event tables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-soc-muted hover:text-soc-text transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export SOC Report
          </button>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Protocol Distribution */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-5 space-y-3">
          <h3 className="font-bold text-soc-text text-xs uppercase tracking-wider">Protocol Volume Breakdown</h3>
          <div className="h-52">
            {protoChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={protoChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '6px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {protoChartData.map((_, i) => (
                      <Cell key={i} fill={PROTO_COLORS[i % PROTO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-soc-dim">No packet data yet.</div>
            )}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-5 space-y-3">
          <h3 className="font-bold text-soc-text text-xs uppercase tracking-wider">Security Threat Incidents by Severity</h3>
          <div className="h-52">
            {sevChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sevChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '6px' }} />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-soc-dim">No threats logged yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Threat Actors Table */}
      <div className="bg-soc-card border border-soc-border rounded-lg overflow-hidden">
        <div className="p-3 border-b border-soc-border bg-soc-bg/60">
          <h3 className="font-bold text-soc-text text-xs uppercase tracking-wider">Top Incident Repeat Actors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-soc-bg/90 border-b border-soc-border text-soc-dim text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3">Entity Identifier</th>
                <th className="py-2.5 px-3">Qualifying Incidents</th>
                <th className="py-2.5 px-3">Escalation Posture</th>
                <th className="py-2.5 px-3">Observed Attack Vectors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40 text-soc-text">
              {data?.top_offenders && data.top_offenders.length > 0 ? (
                data.top_offenders.map((o: any, idx: number) => (
                  <tr key={idx} className="hover:bg-soc-cardHover transition-colors">
                    <td className="py-2 px-3 font-bold text-rose-400">{o.ip}</td>
                    <td className="py-2 px-3 font-bold">{o.incident_count}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                        {o.escalation_state}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-soc-dim">{o.categories || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-soc-dim">
                    No threat actors have triggered repeat escalation.
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
