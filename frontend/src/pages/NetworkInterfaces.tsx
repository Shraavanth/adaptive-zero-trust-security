import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw, CheckCircle2, AlertTriangle, Shield, Check, Info } from 'lucide-react';
import { api } from '../services/api';
import { NetworkInterfaceInfo } from '../types';

interface NetworkInterfacesProps {
  selectedInterface: string;
  onSelectInterface: (ifaceName: string) => void;
}

export const NetworkInterfaces: React.FC<NetworkInterfacesProps> = ({ selectedInterface, onSelectInterface }) => {
  const [interfaces, setInterfaces] = useState<NetworkInterfaceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterfaces = async () => {
    setLoading(true);
    try {
      const data = await api.getInterfaces();
      setInterfaces(data);
    } catch (err) {
      console.error('Failed to load interfaces', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterfaces();
  }, []);

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="bg-soc-card border border-soc-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-400" />
            Host Network Adapter & Capture Interface Manager
          </h2>
          <p className="text-soc-dim mt-0.5">
            Discovers hardware NICs, virtual adapters, Npcap kernel drivers, and IPv4/IPv6 addresses.
          </p>
        </div>
        <button
          onClick={fetchInterfaces}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-soc-muted hover:text-soc-text transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-scan Adapters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interfaces.map((iface) => {
          const isSelected = selectedInterface === iface.name || selectedInterface === iface.id;
          return (
            <div
              key={iface.id}
              className={`bg-soc-card border rounded-lg p-4 space-y-3 transition-all ${
                isSelected
                  ? 'border-blue-500 shadow-lg shadow-blue-950/40 bg-blue-950/20'
                  : 'border-soc-border hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-soc-dim font-bold">Index / ID: {iface.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  iface.is_eligible
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {iface.permission_status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-soc-text text-sm truncate">{iface.name}</h3>
                <p className="text-[11px] text-soc-dim truncate mt-0.5">{iface.description || 'Hardware Adapter'}</p>
              </div>

              <div className="bg-soc-bg rounded p-2.5 border border-soc-border space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-soc-dim">MAC Address:</span>
                  <span className="text-soc-text font-bold">{iface.mac_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soc-dim">Type / Medium:</span>
                  <span className="text-blue-400">{iface.interface_type}</span>
                </div>
                <div>
                  <span className="text-soc-dim">IPv4 Addresses:</span>
                  <p className="text-soc-text font-bold truncate">
                    {iface.ipv4_addresses.length > 0 ? iface.ipv4_addresses.join(', ') : 'No IPv4 assigned'}
                  </p>
                </div>
                {iface.ipv6_addresses.length > 0 && (
                  <div>
                    <span className="text-soc-dim">IPv6 Addresses:</span>
                    <p className="text-soc-muted truncate text-[10px]">
                      {iface.ipv6_addresses.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => onSelectInterface(iface.name)}
                className={`w-full py-1.5 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'bg-emerald-900/80 border border-emerald-700 text-emerald-300'
                    : 'bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-soc-text'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Selected Interface
                  </>
                ) : (
                  'Select for Live Capture'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
