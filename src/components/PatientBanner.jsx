import React, { useState } from 'react';
import { User, HeartPulse, Activity, Thermometer, Wind, FileJson, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function PatientBanner({ patient, vitals, fhirBundle, rawText }) {
  const [showTechData, setShowTechData] = useState(false);
  const [techTab, setTechTab] = useState('fhir'); // 'fhir' or 'raw'

  // Default fallbacks for clean rendering
  const name = patient?.patient_name || 'Pending Extraction';
  const ageDob = patient?.dob || '-';
  const idNum = patient?.id_number || '-';
  const admNum = patient?.admission_number || '-';

  const hr = vitals?.heart_rate || '--';
  const bp = vitals?.blood_pressure || '--/--';
  const temp = vitals?.temperature || '--';
  const spo2 = vitals?.oxygen_saturation || '--';
  const resp = vitals?.respiratory_rate || '--';

  return (
    <div className="mb-6 rounded-2xl overflow-hidden glass-panel border border-blue-500/20 shadow-2xl animate-fade-in-up">
      {/* Top Banner Content: Demographics & Vitals */}
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
        
        {/* Patient Demographics */}
        <div className="p-5 md:w-1/3 flex items-center gap-4 bg-slate-900/40">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/20 shadow-inner">
            <User size={32} className="text-white" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-xl font-bold text-white truncate">{name}</h2>
            <div className="flex text-xs text-slate-400 gap-3 mt-1 font-mono">
              <span>DOB: {ageDob}</span>
              <span>ID: {idNum}</span>
            </div>
            {admNum !== '-' && (
               <div className="mt-1.5 inline-block text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-widest">
                 {admNum}
               </div>
            )}
          </div>
        </div>

        {/* Vitals Ribbon */}
        <div className="p-5 md:w-2/3 flex items-center justify-between text-center overflow-x-auto gap-4 custom-scrollbar">
           
           <div className="flex-1 min-w-[80px]">
             <HeartPulse className="text-rose-400 mx-auto mb-1" size={20} />
             <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Heart Rate</p>
             <p className="text-lg font-mono text-white mt-1">
               {hr} <span className="text-[10px] text-slate-500">bpm</span>
             </p>
           </div>
           
           <div className="w-px h-10 bg-white/5 mx-2 shrink-0 hidden sm:block" />

           <div className="flex-1 min-w-[80px]">
             <Activity className="text-purple-400 mx-auto mb-1" size={20} />
             <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">BP</p>
             <p className="text-lg font-mono text-white mt-1">
               {bp} <span className="text-[10px] text-slate-500">mmHg</span>
             </p>
           </div>
           
           <div className="w-px h-10 bg-white/5 mx-2 shrink-0 hidden sm:block" />

           <div className="flex-1 min-w-[80px]">
             <Thermometer className="text-amber-400 mx-auto mb-1" size={20} />
             <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Temp</p>
             <p className="text-lg font-mono text-white mt-1">
               {temp} <span className="text-[10px] text-slate-500">°</span>
             </p>
           </div>
           
           <div className="w-px h-10 bg-white/5 mx-2 shrink-0 hidden sm:block" />

           <div className="flex-1 min-w-[80px]">
             <Wind className="text-cyan-400 mx-auto mb-1" size={20} />
             <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">SpO2</p>
             <p className="text-lg font-mono text-white mt-1">
               {spo2} <span className="text-[10px] text-slate-500">%</span>
             </p>
           </div>

        </div>
      </div>

      {/* Tech Data Toggle Strip */}
      <div 
        className="bg-slate-900 border-t border-white/5 p-2 px-5 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setShowTechData(!showTechData)}
      >
        <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
          {fhirBundle || rawText ? (
            <span className="flex items-center gap-1.5 text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/> Parsed Data Available</span>
          ) : (
            "Awaiting Document Processing..."
          )}
        </span>
        <button className="text-xs text-blue-400 hover:text-white flex items-center gap-1 transition-colors font-bold uppercase tracking-wider">
           {showTechData ? <><ChevronUp size={14}/> Hide Technical Data</> : <><ChevronDown size={14}/> View AI Extraction JSON</>}
        </button>
      </div>

      {/* Slide-down Technical Data Viewer */}
      {showTechData && (
        <div className="border-t border-white/10 bg-black/60 p-0 animate-fade-in divide-x divide-white/10 flex flex-col md:flex-row h-72">
          
          {/* Tech Menu */}
          <div className="md:w-48 bg-slate-900/50 flex md:flex-col border-b md:border-b-0 border-white/10">
            <button 
              onClick={(e) => { e.stopPropagation(); setTechTab('fhir'); }}
              className={`flex-1 text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2
                ${techTab === 'fhir' ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-white/5 border-l-2 border-transparent'}
              `}
            >
              <FileJson size={16}/> FHIR R4 JSON
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setTechTab('raw'); }}
              className={`flex-1 text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2
                ${techTab === 'raw' ? 'bg-amber-600/20 text-amber-300 border-l-2 border-amber-500' : 'text-slate-400 hover:bg-white/5 border-l-2 border-transparent'}
              `}
            >
              <FileText size={16}/> Raw OCR Text
            </button>
          </div>

          {/* Tech Viewer Pane */}
          <div className="flex-1 overflow-auto bg-black p-4 custom-scrollbar text-[11px] font-mono leading-relaxed text-slate-300">
             {techTab === 'fhir' && (
                fhirBundle ? (
                  <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600">No FHIR Bundle generated yet.</div>
                )
             )}
             {techTab === 'raw' && (
                rawText ? (
                  <p className="whitespace-pre-wrap">{rawText}</p>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600">No raw text extracted.</div>
                )
             )}
          </div>
        </div>
      )}
    </div>
  );
}
