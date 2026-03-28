import React, { useState } from 'react';
import { Send, CheckCircle2, FileText, Loader2, Hospital } from 'lucide-react';

export default function PreAuthForm({ formData, onFieldChange, onSend, missingFields = [] }) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [emailTo, setEmailTo] = useState('');

  const handleSend = async () => {
    setIsSending(true);
    
    try {
      const res = await fetch('/api/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo || 'tpa@insurance.com',
          subject: `Pre-Authorization Request - ${formData?.patient_name || 'Patient'}`,
          html: `
            <h2>Pre-Authorization Request</h2>
            <p>Please find the extracted clinical data for <b>${formData?.patient_name || 'the patient'}</b>.</p>
            <pre style="background:#f4f4f4; padding:15px; border-radius:8px;">${JSON.stringify(formData, null, 2)}</pre>
          `
        })
      });
      const result = await res.json();
      if (result.success && result.previewUrl) {
         // Automatically open the Ethereal testing preview link in a new tab
         window.open(result.previewUrl, '_blank');
      }
    } catch (e) {
      console.error("Failed to send simulation email", e);
    }

    setIsSending(false);
    setIsSent(true);
    if (onSend) onSend();
  };

  const fields = [
    { key: 'patient_name', label: 'Patient Name', type: 'text' },
    { key: 'dob', label: 'Date of Birth', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'text' },
    { key: 'contact_number', label: 'Contact Number', type: 'tel' },
    { key: 'id_number', label: 'ID Proof Number (Aadhar/PAN)', type: 'text' },
    { key: 'insurance_id', label: 'Policy / TPA ID Number', type: 'text' },
    { key: 'admission_date', label: 'Expected Admission Date', type: 'date' },
    { key: 'chief_complaint', label: 'Diagnosis / Chief Complaint', type: 'textarea' },
    { key: 'estimated_cost', label: 'Estimated Cost (₹)', type: 'number' },
  ];

  return (
    <div className="glass-panel p-6 animate-fade-in border-blue-500/20 shadow-xl">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <h3 className="text-xl font-bold flex items-center gap-3 text-white">
          <Hospital className="text-blue-400" />
          Pre-Authorization Request Form
        </h3>
        <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-mono font-bold tracking-widest border border-blue-500/30">
          AUTO-FILLED BY AI
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {fields.map(({ key, label, type }) => {
          const isMissing = missingFields.includes(key);
          const value = formData?.[key] || '';

          return (
            <div key={key} className={`flex flex-col space-y-1 ${type === 'textarea' ? 'md:col-span-2' : ''}`}>
              <label className="text-xs font-semibold text-slate-400">
                {label} {isMissing && <span className="text-amber-500 text-[10px] ml-1 uppercase">*Required</span>}
              </label>
              {type === 'textarea' ? (
                <textarea
                  className={`bg-slate-900/50 border rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors
                    ${isMissing && !value ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10'}
                  `}
                  rows={3}
                  value={value}
                  onChange={(e) => onFieldChange(key, e.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              ) : (
                <input
                  type={type}
                  className={`bg-slate-900/50 border rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors
                    ${isMissing && !value ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'border-white/10'}
                  `}
                  value={value}
                  onChange={(e) => onFieldChange(key, e.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Area */}
      <div className="flex justify-end items-end pt-4 border-t border-white/10">
        <div className="flex-1 max-w-sm mr-4">
          <label className="text-xs font-semibold text-slate-400 block mb-1">Target TPA Email Address (Will use simulated SMTP)</label>
          <input
            type="email"
            className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g. claims@starhealth.com"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isSending || isSent || missingFields.some((f) => !formData?.[f]) || !emailTo}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
            ${isSent 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
            }
          `}
        >
          {isSending ? (
            <><Loader2 size={18} className="animate-spin" /> Sending Securely...</>
          ) : isSent ? (
            <><CheckCircle2 size={18} /> Pre-Auth Mailed to TPA</>
          ) : (
            <><Send size={18} /> Mail Form to Insurance Co.</>
          )}
        </button>
      </div>
      
      {/* Help text below button */}
      {!isSent && missingFields.some((f) => !formData?.[f]) && (
        <p className="text-right text-xs text-amber-400 mt-2 font-medium">
          Please fill all required missing fields before mailing.
        </p>
      )}
    </div>
  );
}
