import React, { useState } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { SecurityEvent } from '../types';
import { api } from '../services/api';

interface ThreatModalProps {
  event: SecurityEvent | null;
  onClose: () => void;
  onInvestigationCreated?: () => void;
}

export const ThreatModal: React.FC<ThreatModalProps> = ({ event, onClose, onInvestigationCreated }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createInvestigation(
        title || `Investigation: ${event.category} on ${event.src_ip}`,
        event.id,
        priority,
        notes
      );
      setSuccess(true);
      setTimeout(() => {
        if (onInvestigationCreated) onInvestigationCreated();
        onClose();
      }, 1000);
    } catch (err) {
      alert(`Failed to create case: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-soc-card border border-soc-border rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-soc-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-semibold text-soc-text">Open Formal SOC Investigation</h3>
          </div>
          <button onClick={onClose} className="text-soc-muted hover:text-soc-text">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Incident Summary */}
        <div className="bg-soc-bg rounded p-3 border border-soc-border text-xs space-y-1 font-mono">
          <p><span className="text-soc-muted">Event ID:</span> <span className="text-blue-400 font-bold">{event.id}</span></p>
          <p><span className="text-soc-muted">Category:</span> <span className="text-rose-400 font-bold">{event.category}</span></p>
          <p><span className="text-soc-muted">Offender IP:</span> <span className="text-soc-text">{event.src_ip}</span></p>
          <p><span className="text-soc-muted">Rule Triggered:</span> <span className="text-amber-400">{event.rule_id}</span></p>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-center text-xs font-mono flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Case escalated to Investigation Center successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-soc-muted mb-1 font-medium">Case Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Investigation: ${event.category} on ${event.src_ip}`}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-soc-muted mb-1 font-medium">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-soc-muted mb-1 font-medium">Analyst Observations / Evidence Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Document observed indicators, impact scope, and recommended containment steps..."
                className="w-full bg-soc-bg border border-soc-border rounded px-3 py-1.5 text-soc-text focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-soc-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-soc-bg hover:bg-soc-border text-soc-muted hover:text-soc-text font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Escalating...' : 'Create Investigation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
