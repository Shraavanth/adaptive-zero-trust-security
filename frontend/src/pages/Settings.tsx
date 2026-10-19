import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Check } from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchConfigs = async () => {
    try {
      const data = await api.getSettings();
      setConfigs(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleChange = (key: string, val: string) => {
    setConfigs((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings(configs);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert(`Save error: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="bg-soc-card border border-soc-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-soc-text flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-blue-400" />
            Adaptive Zero Trust Engine Configuration
          </h2>
          <p className="text-soc-dim mt-0.5">
            Fine-tune trust score penalty weights, isolation overrides, self-healing cooldowns, and privacy masking.
          </p>
        </div>
        <button
          onClick={fetchConfigs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-cardHover border border-soc-border text-soc-muted hover:text-soc-text transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload Config
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trust Scoring Penalties */}
          <div className="bg-soc-card border border-soc-border rounded-lg p-4 space-y-3">
            <h3 className="font-bold text-soc-text text-sm uppercase tracking-wider border-b border-soc-border pb-2">
              Dynamic Trust Scoring Penalties
            </h3>
            <div>
              <label className="block text-soc-dim mb-1">Initial Trust Score (New Endpoints)</label>
              <input
                type="number"
                value={configs.trust_initial_score || '100'}
                onChange={(e) => handleChange('trust_initial_score', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              />
            </div>
            <div>
              <label className="block text-soc-dim mb-1">Informational Event Penalty (pts)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={configs.penalty_informational || '2'}
                onChange={(e) => handleChange('penalty_informational', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              />
            </div>
            <div>
              <label className="block text-soc-dim mb-1">Phishing Attack Penalty (pts)</label>
              <input
                type="number"
                value={configs.penalty_phishing || '15'}
                onChange={(e) => handleChange('penalty_phishing', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              />
            </div>
            <div>
              <label className="block text-soc-dim mb-1">DNS Spoofing / Poisoning Penalty (pts)</label>
              <input
                type="number"
                value={configs.penalty_dns_spoofing || '25'}
                onChange={(e) => handleChange('penalty_dns_spoofing', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              />
            </div>
            <div>
              <label className="block text-soc-dim mb-1">ARP Spoofing / MITM Penalty (pts)</label>
              <input
                type="number"
                value={configs.penalty_arp_spoofing || '30'}
                onChange={(e) => handleChange('penalty_arp_spoofing', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              />
            </div>
          </div>

          {/* Behavior Risk & Self Healing */}
          <div className="bg-soc-card border border-soc-border rounded-lg p-4 space-y-3">
            <h3 className="font-bold text-soc-text text-sm uppercase tracking-wider border-b border-soc-border pb-2">
              Risk Bounds & Self-Healing Prerequisites
            </h3>
            <div>
              <label className="block text-soc-dim mb-1">Behavior-Risk Quarantine Override (&ge;)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={configs.behavior_risk_isolate_threshold || '70'}
                onChange={(e) => handleChange('behavior_risk_isolate_threshold', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              />
            </div>
            <div>
              <label className="block text-soc-dim mb-1">Maximum Recovery Risk Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={configs.recovery_max_risk_score || '69'}
                onChange={(e) => handleChange('recovery_max_risk_score', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              />
            </div>
            <div>
              <label className="block text-soc-dim mb-1">Clean Telemetry Window (seconds)</label>
              <input
                type="number"
                value={configs.recovery_clean_window_seconds || '300'}
                onChange={(e) => handleChange('recovery_clean_window_seconds', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              />
            </div>
            <div>
              <label className="block text-soc-dim mb-1">Min Recovery Trust Score (&ge;)</label>
              <input
                type="number"
                value={configs.recovery_min_trust_score || '80'}
                onChange={(e) => handleChange('recovery_min_trust_score', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              />
            </div>
            <div>
              <label className="block text-soc-dim mb-1">Authorized Enforcement Mode</label>
              <select
                value={configs.authorized_response_mode || 'SIMULATED'}
                onChange={(e) => handleChange('authorized_response_mode', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              >
                <option value="SIMULATED">SIMULATED (Production Safe)</option>
                <option value="AUTHORIZED_LAB" disabled>AUTHORIZED_LAB (Not implemented)</option>
              </select>
            </div>
            <div>
              <label className="block text-soc-dim mb-1">Automatic Simulated Recovery</label>
              <select
                value={configs.auto_healing_enabled || 'true'}
                onChange={(e) => handleChange('auto_healing_enabled', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-soc-dim mb-1">Default Packet Privacy Masking</label>
              <select
                value={configs.privacy_masking_enabled || 'true'}
                onChange={(e) => handleChange('privacy_masking_enabled', e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> System parameters updated in persistent store!
            </span>
          ) : (
            <span className="text-soc-dim">Parameters are stored permanently in SQLite system_settings.</span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
