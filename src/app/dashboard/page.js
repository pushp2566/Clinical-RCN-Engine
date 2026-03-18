"use client";

import { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import {
  AlertCircle, FileJson, Table2, Download, FileText,
  CheckCircle2, ChevronDown, ChevronUp, User, DollarSign,
  Activity, FlaskConical, ClipboardList, TrendingUp
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function buildReconciliationReport(data) {
  const ts      = new Date().toLocaleString();
  const patient = data?.extractedEntities?.patient;
  const issues  = data?.reconciliationIssues || [];
  let report = `======================================================\n`;
  report    += `  CLINICAL DATA NORMALIZATION ENGINE\n`;
  report    += `  Revenue Reconciliation Report\n`;
  report    += `  Generated: ${ts}\n`;
  report    += `======================================================\n\n`;
  if (patient) {
    report += `PATIENT INFORMATION\n-------------------\n`;
    report += `  Name   : ${patient.name   || 'N/A'}\n`;
    report += `  DOB    : ${patient.dob    || 'N/A'}\n`;
    report += `  Gender : ${patient.gender || 'N/A'}\n\n`;
  }
  report += `RECONCILIATION ISSUES (${issues.length} found)\n-------------------\n`;
  if (issues.length === 0) {
    report += `  ✅ No discrepancies detected.\n`;
  } else {
    issues.forEach((issue, i) => {
      report += `\n  [${i + 1}] [${(issue.category || issue.severity)?.toUpperCase()}] ${issue.message}\n`;
      report += `       Action: ${issue.action}\n`;
    });
  }
  report += `\n\nEXTRACTED CODES SUMMARY\n-------------------\n`;
  const conditions = data?.extractedEntities?.conditions  || [];
  const procedures = data?.extractedEntities?.procedures  || [];
  const labs       = data?.extractedEntities?.lab_results || [];
  const claims     = data?.extractedEntities?.claims      || [];
  report += `  Diagnoses (ICD-10) : ${conditions.length}\n`;
  conditions.forEach(c => { report += `    • ${c.condition} → ${c.icd10_guess || 'N/A'}\n`; });
  report += `\n  Procedures (CPT) : ${procedures.length}\n`;
  procedures.forEach(p => { report += `    • ${p.procedure} → ${p.cpt_guess || 'N/A'}\n`; });
  report += `\n  Lab Tests (LOINC) : ${labs.length}\n`;
  labs.forEach(l => { report += `    • ${l.test_name} = ${l.value} → ${l.loinc_guess || 'N/A'}\n`; });
  report += `\n  Claims Filed : ${claims.length}\n`;
  claims.forEach(c => { report += `    • ${c.service} — $${c.amount ?? 'N/A'} (${c.code || 'No code'})\n`; });
  report += `\n======================================================\n  END OF REPORT\n======================================================\n`;
  return report;
}

// ── Patient Header ────────────────────────────────────────────────────────────
function PatientHeader({ patient, claims }) {
  const totalBill = claims?.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0) ?? 0;
  return (
    <div className="glass-panel p-5 border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <User size={22} className="text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{patient?.name || 'Unknown Patient'}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {patient?.gender && <span className="capitalize">{patient.gender}</span>}
              {patient?.dob && <span> · DOB: {patient.dob}</span>}
            </p>
          </div>
        </div>
        {totalBill > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Billed</p>
            <p className="text-2xl font-extrabold text-emerald-400">${totalBill.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Clinical Timeline ─────────────────────────────────────────────────────────
function ClinicalTimeline({ conditions }) {
  if (!conditions?.length) return null;
  return (
    <div className="glass-panel p-5">
      <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity size={14} /> Clinical Timeline
      </h4>
      <div className="relative pl-4 border-l border-blue-500/20 space-y-4">
        {conditions.map((cond, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500/60 border-2 border-blue-400" />
            <p className="text-sm font-semibold text-amber-300 leading-tight">{cond.condition}</p>
            <div className="flex items-center gap-2 mt-1">
              {cond.icd10_guess && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  ICD-10: {cond.icd10_guess}
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                active
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Lab Results Grid ──────────────────────────────────────────────────────────
function parseLabValue(valueStr) {
  if (!valueStr) return { num: null, unit: '' };
  const match = String(valueStr).match(/^([\d.]+)\s*(.*)$/);
  return match ? { num: match[1], unit: match[2].trim() } : { num: null, unit: valueStr };
}

function LabResultsGrid({ labs }) {
  if (!labs?.length) return null;
  return (
    <div className="glass-panel p-5">
      <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <FlaskConical size={14} /> Lab Results &amp; Vitals
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {labs.map((lab, i) => {
          const { num, unit } = parseLabValue(lab.value);
          return (
            <div key={i} className="bg-slate-900/60 border border-white/8 rounded-xl p-3 hover:border-purple-500/30 transition-colors">
              <p className="text-[11px] text-slate-400 mb-1 truncate">{lab.test_name}</p>
              <p className="text-xl font-bold text-white leading-tight">
                {num || lab.value}
                {unit && <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>}
              </p>
              {lab.loinc_guess && (
                <p className="text-[10px] text-purple-400/60 font-mono mt-1">LOINC {lab.loinc_guess}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Reconciliation Panel ──────────────────────────────────────────────────────
const CATEGORY_STYLES = {
  'RCM INSIGHT SUMMARY':   { border: 'border-blue-500/30',   bg: 'bg-blue-500/8',   label: 'text-blue-400',   dot: 'bg-blue-400' },
  'REVENUE LOSS DETECTED': { border: 'border-orange-500/30', bg: 'bg-orange-500/8', label: 'text-orange-400', dot: 'bg-orange-400' },
  'MISSING REQUIRED CODE': { border: 'border-amber-500/30',  bg: 'bg-amber-500/8',  label: 'text-amber-400',  dot: 'bg-amber-400' },
  'BILLING MISMATCH':      { border: 'border-yellow-500/30', bg: 'bg-yellow-500/8', label: 'text-yellow-400', dot: 'bg-yellow-400' },
  'FINANCIAL ANOMALY':     { border: 'border-red-500/30',    bg: 'bg-red-500/8',    label: 'text-red-400',    dot: 'bg-red-400'   },
};

const SEVERITY_LABEL = {
  info:     { border: 'border-blue-500/30',   bg: 'bg-blue-500/8',   label: 'text-blue-400'   },
  critical: { border: 'border-orange-500/30', bg: 'bg-orange-500/8', label: 'text-orange-400' },
  high:     { border: 'border-amber-500/30',  bg: 'bg-amber-500/8',  label: 'text-amber-400'  },
  medium:   { border: 'border-yellow-500/30', bg: 'bg-yellow-500/8', label: 'text-yellow-400' },
  low:      { border: 'border-slate-500/30',  bg: 'bg-slate-500/8',  label: 'text-slate-400'  },
};

function ReconciliationPanel({ issues }) {
  if (!issues?.length) return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
      <CheckCircle2 size={18} />
      <div>
        <p className="font-bold text-sm">No Revenue Discrepancies Found</p>
        <p className="text-xs text-emerald-400 mt-0.5">All procedures and conditions have matching claim codes.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-slate-300 flex items-center gap-2">
        <TrendingUp size={14} className="text-amber-400" />
        Revenue Reconciliation Engine
        <span className="ml-auto text-[10px] font-normal text-slate-500">{issues.length} issue{issues.length !== 1 ? 's' : ''} detected</span>
      </h4>
      {issues.map((issue, idx) => {
        const cat   = issue.category || '';
        const style = CATEGORY_STYLES[cat] || SEVERITY_LABEL[issue.severity] || SEVERITY_LABEL.low;
        return (
          <div key={idx} className={`border ${style.border} ${style.bg} rounded-xl p-4 text-center space-y-1`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${style.label}`}>
              {cat || issue.severity?.toUpperCase()} • SEVERITY: {issue.severity?.toUpperCase()}
            </p>
            <p className="text-sm font-semibold text-white">
              <span className="text-slate-300">Issue: </span>{issue.message}
            </p>
            {issue.action && (
              <p className="text-sm text-slate-300">
                <span className="font-semibold">Action: </span>{issue.action}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Procedures List ───────────────────────────────────────────────────────────
function ProceduresList({ procedures }) {
  if (!procedures?.length) return null;
  return (
    <div className="glass-panel p-5">
      <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <ClipboardList size={14} /> Procedures &amp; CPT Codes
      </h4>
      <ul className="space-y-2">
        {procedures.map((p, i) => (
          <li key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <span className="text-sm text-slate-200">{p.procedure}</span>
            {p.cpt_guess && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 shrink-0 ml-2">
                CPT {p.cpt_guess}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [extractedData, setExtractedData] = useState(null);
  const [apiError, setApiError]           = useState(null);
  const [fhirExpanded, setFhirExpanded]   = useState(false);
  const [showRawJson, setShowRawJson]     = useState(false);

  const handleExtractionSuccess = (data) => {
    if (!data) { setExtractedData(null); setApiError(null); return; }
    if (!data.success) { setApiError(data.error || 'An unknown error occurred.'); setExtractedData(null); }
    else               { setApiError(null); setExtractedData(data); setFhirExpanded(false); }
  };

  const entities       = extractedData?.extractedEntities;
  const issues         = extractedData?.reconciliationIssues || [];
  const issueCount     = issues.length;
  const claimsCount    = entities?.claims?.length || 0;

  const stats = extractedData ? [
    { label: 'Diagnoses',    value: entities?.conditions?.length  || 0, color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    { label: 'Procedures',   value: entities?.procedures?.length  || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Lab Tests',    value: entities?.lab_results?.length || 0, color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
    { label: 'Claims Filed', value: claimsCount,                        color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
    { label: 'RCM Issues',   value: issueCount,
      color:  issueCount > 0 ? 'text-amber-400'    : 'text-emerald-400',
      bg:     issueCount > 0 ? 'bg-amber-500/10'   : 'bg-emerald-500/10',
      border: issueCount > 0 ? 'border-amber-500/20': 'border-emerald-500/20' },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in pb-24">

      {/* Page Header + Export buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold">Normalization Dashboard</h2>
          <p className="text-slate-400 mt-1">Upload clinical documents to extract entities and map to FHIR resources.</p>
        </div>
        {extractedData && (
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => downloadJSON(extractedData.fhirStructure, 'fhir_bundle.json')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-semibold hover:bg-blue-500/20 transition-colors">
              <Download size={14} /> FHIR JSON
            </button>
            <button onClick={() => downloadText(buildReconciliationReport(extractedData), 'reconciliation_report.txt')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 transition-colors">
              <FileText size={14} /> Reconciliation Report
            </button>
          </div>
        )}
      </div>

      {/* API Error */}
      {apiError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 animate-fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Processing Failed</p>
            <p className="text-sm mt-0.5 text-red-400">{apiError}</p>
            {apiError.toLowerCase().includes('key') && (
              <p className="text-xs mt-2 text-red-500">Make sure <code className="bg-red-900/40 px-1 rounded">GEMINI_API_KEY</code> is set in <code className="bg-red-900/40 px-1 rounded">.env.local</code>.</p>
            )}
          </div>
        </div>
      )}

      {/* Summary stats */}
      {extractedData && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-fade-in">
          {stats.map(s => (
            <div key={s.label} className={`glass-panel p-4 border ${s.border} ${s.bg} text-center`}>
              <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Upload + Patient context ── */}
        <div className="lg:col-span-4 space-y-5">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
              Data Ingestion
            </h3>
            <FileUploadZone onExtractionComplete={handleExtractionSuccess} />
          </div>

          {/* Patient header */}
          {entities?.patient && (
            <PatientHeader patient={entities.patient} claims={entities.claims} />
          )}

          {/* Clinical Timeline */}
          {entities?.conditions?.length > 0 && (
            <ClinicalTimeline conditions={entities.conditions} />
          )}

          {/* Procedures */}
          {entities?.procedures?.length > 0 && (
            <ProceduresList procedures={entities.procedures} />
          )}

          {/* Raw text preview */}
          {extractedData?.extractedTextPreview && (
            <div className="glass-panel p-5 animate-fade-in">
              <h3 className="text-sm font-semibold mb-3 text-slate-300 border-b border-white/10 pb-2 flex items-center gap-2">
                <FileJson size={14} /> OCR Preview
              </h3>
              <div className="bg-slate-900/80 border border-white/5 p-3 rounded-xl max-h-[260px] overflow-y-auto text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                {extractedData.extractedTextPreview}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="lg:col-span-8 space-y-5">
          <div className={`glass-panel p-6 min-h-[500px] transition-all duration-500 ${!extractedData && !apiError ? 'flex items-center justify-center opacity-40' : ''}`}>
            {!extractedData && !apiError ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5">
                  <span className="text-4xl">🪄</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-300">Awaiting Documents</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm">
                  Upload discharge summaries, lab reports, or bills on the left. Our engine will extract, map to FHIR, and reconcile revenue codes automatically.
                </p>
              </div>
            ) : extractedData ? (
              <div className="space-y-8 animate-fade-in">

                {/* Section header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                    AI Extraction &amp; Reconciliation
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                    Gemini 2.5 Flash
                  </span>
                </div>

                {/* Reconciliation */}
                <ReconciliationPanel issues={issues} />

                {/* Lab Results Grid */}
                {entities?.lab_results?.length > 0 && (
                  <LabResultsGrid labs={entities.lab_results} />
                )}

                {/* FHIR Bundle Viewer */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-semibold text-blue-400 text-sm">
                      <FileJson size={15} />
                      FHIR Resource Explorer
                      <span className="text-xs text-slate-500 font-normal">
                        ({extractedData.fhirStructure?.entry?.length || 0} resources)
                      </span>
                    </h4>
                    <div className="flex items-center gap-3">
                      <button onClick={() => downloadJSON(extractedData.fhirStructure, 'fhir_bundle.json')}
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        <Download size={12} /> Download
                      </button>
                      <button onClick={() => setFhirExpanded(v => !v)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors border border-white/10 rounded-lg px-2 py-1">
                        {fhirExpanded ? <><ChevronUp size={12} /> Collapse</> : <><ChevronDown size={12} /> Expand</>}
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-950 overflow-hidden rounded-xl border border-white/5 shadow-inner">
                    <div className="bg-slate-900/60 px-4 py-2 border-b border-white/5 flex gap-2 items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                      <span className="ml-2 text-[10px] text-slate-600 font-mono">fhir_bundle.json</span>
                      {!fhirExpanded && (
                        <span className="ml-auto text-[10px] text-slate-600 italic">Click Expand to view full bundle</span>
                      )}
                    </div>
                    {fhirExpanded ? (
                      <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[460px]">
                        {JSON.stringify(extractedData.fhirStructure, null, 2)}
                      </pre>
                    ) : (
                      <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto">
                        {JSON.stringify({ resourceType: extractedData.fhirStructure?.resourceType, type: extractedData.fhirStructure?.type, entry: `[ ... ${extractedData.fhirStructure?.entry?.length || 0} resources — click Expand to view ]` }, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                {/* AI Extraction Output (collapsible) */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <button onClick={() => setShowRawJson(v => !v)}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    <Table2 size={13} />
                    AI Extraction Output
                    {showRawJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {showRawJson && (
                    <div className="bg-slate-950 overflow-hidden rounded-xl border border-white/5 animate-fade-in">
                      <pre className="p-4 text-xs font-mono text-slate-400 overflow-x-auto max-h-[260px]">
                        {JSON.stringify(extractedData.extractedEntities, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
