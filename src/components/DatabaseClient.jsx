'use client';

import React, { useState, useMemo } from 'react';
import { Database, FileText, Activity, AlertCircle, ShieldCheck, Search, ChevronDown, ChevronUp, User, BadgeIndianRupee } from 'lucide-react';

export default function DatabaseClient({ extractedData, documents, logs, claimsMap }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPatient, setExpandedPatient] = useState(null);

  // Group all data by Patient Name to create a CRM-like view
  const groupedPatients = useMemo(() => {
    const groups = {};
    
    (extractedData || []).forEach(data => {
      // Use "Unknown Patient" if missing, normalize for grouping
      const pName = data.patient_name || 'Unknown Patient';
      
      if (!groups[pName]) {
        groups[pName] = {
           name: pName,
           // Generate a mock Admission Number based on name hashing for demo consistency, 
           // or use one if it was somehow in the DB.
           admission_id: `ADM-${Math.abs(pName.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString().substring(0, 6)}`,
           records: [],
           total_billed: 0,
           total_approved: 0,
           total_paid: 0,
           documents: [],
           claims: [],
           latest_status: 'pending'
        };
      }
      
      const claim = claimsMap[data.document_id];
      const doc = documents?.find(d => d.id === data.document_id);
      
      groups[pName].records.push(data);
      if (doc) groups[pName].documents.push(doc);
      if (claim) {
         groups[pName].claims.push(claim);
         groups[pName].total_billed += Number(claim.billed_amount || 0);
         groups[pName].total_approved += Number(claim.approved_amount || 0);
         groups[pName].total_paid += Number(claim.paid_amount || 0);
         groups[pName].latest_status = claim.status; // Last processed status
      } else {
         groups[pName].total_billed += Number(data.total_cost || 0);
      }
    });

    return Object.values(groups)
      // Sort by most recent documents first
      .sort((a, b) => b.documents.length - a.documents.length);
  }, [extractedData, documents, claimsMap]);

  // Filter based on search term
  const filteredPatients = groupedPatients.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.admission_id.toLowerCase().includes(term);
  });

  return (
    <div className="w-full space-y-8 animate-fade-in pb-24 max-w-6xl mx-auto">
        
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <User size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">Patient Data Records</h1>
            <p className="text-slate-400 mt-1">Unified view of all patient journeys, admissions, and financial claims.</p>
          </div>
        </div>
        
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search by Patient Name or Admission No..."
            className="block w-full pl-10 pr-4 py-3 border border-white/10 rounded-xl leading-5 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:text-sm shadow-inner transition-all backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="space-y-4">
        {filteredPatients.map((patient) => {
          const isExpanded = expandedPatient === patient.admission_id;

          return (
            <div key={patient.admission_id} className="glass-panel overflow-hidden transition-all duration-300 border border-white/5 shadow-lg">
              {/* Collapsed Header / Row */}
              <div 
                className="flex flex-wrap md:flex-nowrap items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors gap-4"
                onClick={() => setExpandedPatient(isExpanded ? null : patient.admission_id)}
              >
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-indigo-300 border border-indigo-500/30">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{patient.name}</h3>
                    <p className="text-xs text-indigo-400 font-mono tracking-widest">{patient.admission_id}</p>
                  </div>
                </div>

                <div className="flex-1 min-w-[150px] hidden md:block">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Doc Trail</p>
                  <div className="flex gap-1">
                    {patient.documents.map((_, i) => (
                       <div key={i} className="w-2 h-6 bg-slate-700 rounded-sm hover:bg-slate-500 transition-colors" title="Processed Document" />
                    ))}
                  </div>
                </div>

                <div className="text-right min-w-[120px]">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Billed</p>
                  <p className="text-lg font-bold text-rose-400">₹{patient.total_billed.toLocaleString('en-IN')}</p>
                </div>

                <div className="text-right min-w-[120px]">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Paid</p>
                  <p className="text-lg font-bold text-emerald-400">₹{patient.total_paid.toLocaleString('en-IN')}</p>
                </div>

                <div className="w-max">
                   <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider ${
                      patient.latest_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      patient.latest_status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      patient.latest_status === 'settled' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      <ShieldCheck size={14} />
                      {patient.latest_status}
                    </span>
                </div>

                <div className="text-slate-500 text-right w-8 flex justify-end">
                  {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>

              {/* Expanded Detail View */}
              {isExpanded && (
                <div className="p-6 border-t border-white/5 bg-black/40 animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Column: Extraction Details */}
                  <div className="space-y-4">
                     <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                       <Activity className="text-blue-400" size={16}/> Accumulated Medical Details
                     </h4>
                     <div className="space-y-3">
                       {patient.records.map((rec, i) => (
                         <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-slate-500 font-mono mb-2 border-b border-white/5 pb-2">Record Block #{i+1}</p>
                            {rec.diagnosis && (
                              <div className="mb-2">
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 block">Diagnosis</span>
                                <span className="text-sm text-slate-200">{rec.diagnosis} <span className="text-blue-400 text-xs">({rec.icd_code})</span></span>
                              </div>
                            )}
                            {rec.procedure && (
                              <div>
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 block">Procedures</span>
                                <span className="text-sm text-slate-200">{rec.procedure} <span className="text-purple-400 text-xs">({rec.cpt_code})</span></span>
                              </div>
                            )}
                         </div>
                       ))}
                     </div>
                  </div>

                  {/* Right Column: Claims & Documents */}
                  <div className="space-y-6">
                     <div>
                       <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                         <BadgeIndianRupee className="text-emerald-400" size={16}/> Financial Claims History
                       </h4>
                       <div className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
                          <table className="w-full text-left text-xs">
                             <thead className="bg-white/5 text-slate-400">
                               <tr>
                                  <th className="p-3">Status</th>
                                  <th className="p-3 text-right">Billed</th>
                                  <th className="p-3 text-right">Approved</th>
                                  <th className="p-3 text-right">Paid</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-white/5">
                               {patient.claims.map((claim, i) => (
                                 <tr key={i} className="text-slate-300">
                                    <td className="p-3 capitalize">{claim.status}</td>
                                    <td className="p-3 text-right">₹{claim.billed_amount || 0}</td>
                                    <td className="p-3 text-right">₹{claim.approved_amount || 0}</td>
                                    <td className="p-3 text-right text-emerald-400 font-bold">₹{claim.paid_amount || 0}</td>
                                 </tr>
                               ))}
                               {patient.claims.length === 0 && (
                                 <tr><td colSpan="4" className="p-4 text-center text-slate-600">No claims filed yet.</td></tr>
                               )}
                             </tbody>
                          </table>
                       </div>
                     </div>

                     <div>
                       <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                         <FileText className="text-sky-400" size={16}/> Processed Source Documents
                       </h4>
                       <div className="flex flex-wrap gap-2">
                          {patient.documents.map((doc, i) => (
                            <div key={i} className="bg-sky-500/10 border border-sky-500/20 text-sky-300 px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2">
                               <FileText size={12}/> DOC-{doc.id.split('-')[0]}
                            </div>
                          ))}
                       </div>
                     </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {filteredPatients.length === 0 && (
          <div className="glass-panel p-16 text-center">
            <User size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Patients Found</h3>
            <p className="text-slate-400">Try adjusting your search query.</p>
          </div>
        )}
      </div>

    </div>
  );
}
