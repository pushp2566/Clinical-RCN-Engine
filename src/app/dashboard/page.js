"use client";

import { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import WorkflowSteps from '@/components/WorkflowSteps';
import PreAuthForm from '@/components/PreAuthForm';
import LaymanFeedbackCard from '@/components/LaymanFeedbackCard';
import PatientBanner from '@/components/PatientBanner';
import { Download, FileJson, ArrowRight, ArrowLeft, CheckCircle2, FlaskConical, Stethoscope, BadgeIndianRupee, Activity, UploadCloud } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [currentPhase, setCurrentPhase] = useState('preauth'); // preauth, admit, enhance, discharge, settle
  const [viewMode, setViewMode] = useState('upload'); // 'upload' or 'dashboard'
  
  // Accumulated context
  const [patientHistory, setPatientHistory] = useState({
    patient_name: '',
    contact_number: '',
    id_number: '',
    admission_number: '', // assigned in phase 2
    claim_number: '',     // assigned in phase 2
    total_billed: 0,
    approved_amount: 0,
    paid_amount: 0,
    history_log: [], // to pass to AI memory
    vitals: {} // to track heart rate, BP, etc.
  });

  const [currentExtraction, setCurrentExtraction] = useState(null);
  const [missingFields, setMissingFields] = useState([]);

  // Generate random IDs when moving to admit
  const generateAdmitCodes = () => {
    return {
      adm_no: `ADM-${Math.floor(100000 + Math.random() * 900000)}`,
      claim_no: `CLM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };
  };

  const handleExtraction = (data) => {
    if (!data || !data.success) return;
    
    const entities = data.extractedEntities;
    const aiFeedback = entities.layman_feedback || '';
    const missing = entities.missing_fields || [];
    
    setMissingFields(missing);
    setCurrentExtraction({
      data: data,
      feedback: aiFeedback
    });

    // Merge patient info into history
    setPatientHistory(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(entities.patient || {}).filter(([_, v]) => v !== null)
      ),
      total_billed: Math.max(prev.total_billed, parseFloat(entities.financial_summary?.total_billed_amount || 0) || prev.total_billed),
      approved_amount: Math.max(prev.approved_amount, parseFloat(entities.financial_summary?.approved_amount || 0) || prev.approved_amount),
      paid_amount: Math.max(prev.paid_amount, parseFloat(entities.financial_summary?.paid_amount || 0) || prev.paid_amount),
      history_log: [
        ...prev.history_log, 
        { phase: currentPhase, summary: aiFeedback }
      ],
      vitals: {
        heart_rate: entities.vitals?.heart_rate || prev.vitals?.heart_rate,
        blood_pressure: entities.vitals?.blood_pressure || prev.vitals?.blood_pressure,
        temperature: entities.vitals?.temperature || prev.vitals?.temperature,
        oxygen_saturation: entities.vitals?.oxygen_saturation || prev.vitals?.oxygen_saturation,
        respiratory_rate: entities.vitals?.respiratory_rate || prev.vitals?.respiratory_rate,
      }
    }));

    setViewMode('dashboard'); // Switch to the dashboard results automatically
  };

  const handleFormFieldChange = (key, value) => {
    setPatientHistory(prev => ({ ...prev, [key]: value }));
    setMissingFields(prev => prev.filter(f => f !== key));
  };

  // Move phase
  const advancePhase = (nextPhase) => {
    if (nextPhase === 'admit') {
      const codes = generateAdmitCodes();
      setPatientHistory(prev => ({
        ...prev,
        admission_number: codes.adm_no,
        claim_number: codes.claim_no
      }));
    }
    setCurrentExtraction(null);
    setCurrentPhase(nextPhase);
    setViewMode('upload'); // Revert back to upload view for the next stage
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBackPhase = (prevPhase) => {
    setCurrentExtraction(null);
    setCurrentPhase(prevPhase);
    setViewMode('upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fhirBundle = currentExtraction?.data?.fhirStructure;

  return (
    <div className="space-y-6 animate-fade-in pb-24 max-w-6xl mx-auto">
      <div className="md:flex justify-between items-end border-b border-white/10 pb-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Intelligent Insurance Wizard
          </h2>
          <p className="text-slate-400 mt-1">End-to-end normalization and TPA workflow simulation.</p>
        </div>
      </div>

      <PatientBanner 
        patient={patientHistory} 
        vitals={patientHistory.vitals} 
        fhirBundle={fhirBundle} 
        rawText={currentExtraction?.data?.extractedTextPreview} 
      />

      {/* Progress Wizard */}
      <WorkflowSteps currentPhase={currentPhase} />

      {/* AI Memory Timeline Ledger */}
      {patientHistory.history_log.length > 0 && (
        <div className="mb-8">
           <h4 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4 pl-2">AI Knowledge Ledger</h4>
           <div className="relative border-l-2 border-slate-700 ml-2 shadow-sm space-y-3 pb-2">
             {patientHistory.history_log.map((log, i) => (
                <div key={i} className="pl-6 relative">
                   <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] top-2 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                   <p className="text-[10px] text-blue-400 uppercase font-mono mb-1">Phase: {log.phase}</p>
                   <p className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded border border-white/5">{log.summary}</p>
                </div>
             ))}
           </div>
        </div>
      )}

      {/* Phase Navigation Controls */}
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
         <div className="flex gap-4">
           {currentPhase !== 'preauth' && (
              <button 
                onClick={() => {
                  const phases = ['preauth', 'admit', 'enhance', 'discharge', 'settle'];
                  const prev = phases[phases.indexOf(currentPhase) - 1];
                  goBackPhase(prev);
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-white/5 py-1 px-3 rounded-full transition-colors font-medium border border-white/10"
              >
                <ArrowLeft size={12} /> Go to Previous Workflow Step
              </button>
           )}
           <Link href="/" className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors font-medium font-mono uppercase">
             Exit to Home
           </Link>
         </div>

         {/* Toggle Between Upload & Dashboard Results */}
         <div className="flex bg-slate-900 rounded-lg p-1 border border-white/10 shadow-inner">
           <button 
             onClick={() => setViewMode('upload')}
             className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2
               ${viewMode === 'upload' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}
             `}
           >
             <UploadCloud size={14} /> Upload Interface
           </button>
           <button 
             onClick={() => setViewMode('dashboard')}
             disabled={!currentExtraction}
             className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2
               ${viewMode === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}
               ${!currentExtraction ? 'opacity-30 cursor-not-allowed' : ''}
             `}
             title={!currentExtraction ? "Upload and process first to see dashboard" : "View Dashboard Results"}
           >
             <Activity size={14} /> Dashboard Results
           </button>
         </div>
      </div>

      {/* View Content Rendering */}
      <div className="animate-fade-in transition-all">
        
        {/* ----------- UPLOAD INTERFACE ----------- */}
        {viewMode === 'upload' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="glass-panel p-8 shadow-2xl border border-blue-500/20 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2 text-white shadow-black drop-shadow-lg">
                <UploadCloud className="text-blue-400"/>
                {currentPhase === 'preauth' && 'Upload Pre-Auth & Initial Diagnosis'}
                {currentPhase === 'admit' && 'Upload Approval Letter'}
                {currentPhase === 'enhance' && 'Upload Further Diagnosis & Provisional Bill'}
                {currentPhase === 'discharge' && 'Upload Discharge Summary & Final Bill'}
                {currentPhase === 'settle' && 'Upload Settlement/UTR Document'}
              </h3>
              <p className="text-sm text-slate-300 font-medium mb-8">
                Drop the relevant documents here. The AI will read, extract, and remember context from previous steps. Once processed, you will automatically be taken to the dashboard viewing mode.
              </p>
              
              <FileUploadZone 
                phase={currentPhase} 
                contextHistory={patientHistory.history_log} 
                onExtractionComplete={handleExtraction} 
              />
            </div>
            {currentExtraction && (
               <button 
                 onClick={() => setViewMode('dashboard')}
                 className="w-full text-center py-4 bg-slate-900/60 border border-white/10 rounded-xl text-slate-400 hover:text-white font-medium hover:border-white/20 transition-all font-mono tracking-wider flex items-center justify-center gap-2"
               >
                 View Previously Processed Dashboard Results <ArrowRight size={16} />
               </button>
            )}
          </div>
        )}

        {/* ----------- DASHBOARD RESULTS INTERFACE ----------- */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6 lg:max-w-4xl mx-auto">
            
            <div className="flex justify-start mb-2">
               <button 
                 onClick={() => setViewMode('upload')}
                 className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 transition-all hover:scale-105"
               >
                 <ArrowLeft size={14}/> Back to Document Uploading Interface
               </button>
            </div>

            {/* Render Layman feedback always if we have a successful extraction */}
            <LaymanFeedbackCard 
              feedback={currentExtraction?.feedback} 
              missingFields={missingFields} 
            />

            {/* Default blank state - shouldn't happen because button is disabled, but fallback */}
            {!currentExtraction && currentPhase === 'preauth' && (
              <div className="glass-panel p-10 flex flex-col items-center justify-center text-center text-slate-500 border-dashed border-2 border-white/5 opacity-60">
                <Activity size={48} className="mb-4 text-blue-500/30" />
                <p>Upload Initial Consultation and ID proof to generate the auto-filled Pre-Auth form.</p>
              </div>
            )}

            {/* Phase 1 specific UI */}
            {currentPhase === 'preauth' && currentExtraction && (
              <div className="animate-fade-in-up">
                <PreAuthForm 
                  formData={patientHistory} 
                  onFieldChange={handleFormFieldChange} 
                  missingFields={missingFields}
                  onSend={() => setTimeout(() => advancePhase('admit'), 2000)}
                />
              </div>
            )}

            {/* Phase 2 specific UI */}
            {currentPhase === 'admit' && currentExtraction && (
              <div className="glass-panel p-8 animate-fade-in mt-6 border-indigo-500/20 text-center">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Patient Admitted Successfully</h2>
                <p className="text-slate-400 mb-6">The approval letter was processed and admission numbers are logged.</p>
                <div className="flex justify-center gap-4 mb-8">
                  <div className="px-4 py-2 bg-slate-900 rounded-lg border border-white/10 font-mono text-lg text-indigo-300">
                    {patientHistory.admission_number}
                  </div>
                  <div className="px-4 py-2 bg-slate-900 rounded-lg border border-white/10 font-mono text-lg text-indigo-300">
                    {patientHistory.claim_number}
                  </div>
                </div>
                <button 
                  onClick={() => advancePhase('enhance')}
                  className="mx-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full font-bold transition-all"
                >
                  Proceed to Treatment / Enhancement <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* Phase 3 specific UI */}
            {currentPhase === 'enhance' && currentExtraction && (
              <div className="glass-panel p-8 animate-fade-in border-purple-500/20">
                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400">
                  <Stethoscope /> Enhancement Request Sent
                 </h3>
                 <p className="text-slate-300 text-sm mb-6 max-w-lg mx-auto">
                   The updated diagnostic reports and provisional bills justify the medical necessity. AI has automatically compiled the justification based on the initial chief complaint.
                 </p>
                 <button 
                  onClick={() => advancePhase('discharge')}
                  className="mx-auto flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full font-bold transition-all"
                >
                  Proceed to Discharge Phase <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* Phase 4 specific UI */}
            {currentPhase === 'discharge' && currentExtraction && (
               <div className="glass-panel p-8 animate-fade-in border-blue-500/30 shadow-xl shadow-blue-500/5">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                    <BadgeIndianRupee className="text-emerald-400" size={28} />
                    Discharge Summary & Final Claim
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-900 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Final Bill Amount</p>
                      <p className="text-2xl font-bold text-red-400">₹{patientHistory.total_billed}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">TPA Approval Base</p>
                      <p className="text-2xl font-bold text-emerald-400">₹{patientHistory.approved_amount}</p>
                    </div>
                  </div>

                  {/* End FHIR block */}

                 <div className="flex gap-4 items-end mt-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-400 block mb-1">TPA Settlement Email Address</label>
                      <input
                        type="email"
                        id="dischargeEmail"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="e.g. settlements@tpa.com"
                      />
                    </div>
                    <button 
                      onClick={async () => {
                        const email = document.getElementById('dischargeEmail').value;
                        if (!email) return alert("Please enter an email");
                        const res = await fetch('/api/mail', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            to: email,
                            subject: `Discharge Claim for ${patientHistory.patient_name}`,
                            html: `<h2>Final Claim Submission</h2><p>Billed: ₹${patientHistory.total_billed}</p>`
                          })
                        });
                        const data = await res.json();
                        if (data.previewUrl) window.open(data.previewUrl, '_blank');
                        advancePhase('settle');
                      }}
                      className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                    >
                      Send Final Bill to TPA <ArrowRight size={20} />
                    </button>
                 </div>
               </div>
            )}

            {/* Phase 5 specific UI */}
            {currentPhase === 'settle' && currentExtraction && (
              <div className="glass-panel p-10 animate-fade-in border-emerald-500/40 text-center bg-emerald-900/10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                 <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/50">
                    <CheckCircle2 size={40} className="text-emerald-400" />
                 </div>
                 <h2 className="text-3xl font-extrabold text-white mb-2">File Closed & Settled</h2>
                 <p className="text-emerald-300 font-medium mb-8">The UTR data has been parsed and matched with Finance records.</p>
                 
                 <div className="max-w-xs mx-auto text-left bg-black/40 p-5 rounded-xl border border-white/5 space-y-3">
                   <div className="flex justify-between border-b border-white/10 pb-2">
                     <span className="text-slate-400 text-sm">Total Billed:</span>
                     <span className="text-white font-mono">₹{patientHistory.total_billed}</span>
                   </div>
                   <div className="flex justify-between border-b border-white/10 pb-2">
                     <span className="text-slate-400 text-sm">Amount Paid:</span>
                     <span className="text-emerald-400 font-mono font-bold">₹{patientHistory.paid_amount || patientHistory.approved_amount}</span>
                   </div>
                   <div className="flex justify-between pt-1">
                     <span className="text-slate-400 text-sm">Deductions/Copay:</span>
                     <span className="text-red-400 font-mono">₹{Math.max(0, patientHistory.total_billed - (patientHistory.paid_amount || patientHistory.approved_amount))}</span>
                   </div>
                 </div>

                 <button 
                  onClick={() => window.location.reload()}
                  className="mt-8 text-sm text-slate-400 hover:text-white underline transition-colors"
                 >
                   Start New Patient Workflow
                 </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
