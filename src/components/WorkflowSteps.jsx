import React from 'react';
import { Check, ClipboardList, Stethoscope, HandHeart, FileCheck, Landmark } from 'lucide-react';

const STEPS = [
  { id: 1, key: 'preauth', label: '1. Pre-Auth Request', icon: ClipboardList, desc: 'ID & Initial Docs' },
  { id: 2, key: 'admit', label: '2. Admission', icon: Stethoscope, desc: 'Approval & Claim No' },
  { id: 3, key: 'enhance', label: '3. Enhancement', icon: HandHeart, desc: 'Provisional Bills' },
  { id: 4, key: 'discharge', label: '4. Discharge', icon: FileCheck, desc: 'Final Bill & FHIR' },
  { id: 5, key: 'settle', label: '5. Settlement', icon: Landmark, desc: 'UTR & Closure' },
];

export default function WorkflowSteps({ currentPhase }) {
  // Map phase string to integer ID for progress line
  const phaseOrder = ['preauth', 'admit', 'enhance', 'discharge', 'settle'];
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const activeId = currentIdx >= 0 ? currentIdx + 1 : 1;

  return (
    <div className="w-full glass-panel p-6 mb-6">
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
        Hospital & Insurance Workflow
      </h3>
      <div className="relative flex justify-between">
        {/* Progress track background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-slate-800 -z-10 rounded-full" />
        
        {/* Active progress fill */}
        <div 
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 -z-10 rounded-full transition-all duration-700 ease-in-out" 
          style={{ width: `${((activeId - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step) => {
          const isCompleted = step.id < activeId;
          const isActive = step.id === activeId;
          const isPending = step.id > activeId;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 w-24">
              <div 
                className={`w-11 h-11 rounded-full flex items-center justify-center border-4 transition-all duration-300
                  ${isCompleted ? 'bg-indigo-500 border-slate-900 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''}
                  ${isActive ? 'bg-blue-600 border-indigo-900 text-white scale-110 shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-pulse-slow' : ''}
                  ${isPending ? 'bg-slate-800 border-slate-700 text-slate-500' : ''}
                `}
              >
                {isCompleted ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
              </div>
              <p className={`mt-3 text-xs font-bold text-center tracking-tight transition-colors duration-300
                ${(isCompleted || isActive) ? 'text-white' : 'text-slate-500'}
              `}>
                {step.label}
              </p>
              <p className="text-[10px] text-slate-400 text-center mt-1 uppercase tracking-widest hidden md:block">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
