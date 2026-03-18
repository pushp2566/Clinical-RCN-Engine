import Link from 'next/link';
import { FileUp, Activity, Database, ShieldCheck, ArrowRight, Zap, Users, Building2, UserCheck } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    num: '01',
    icon: '📄',
    title: 'Data Ingestion',
    description: 'Upload PDF discharge summaries, lab reports, bills, scans, or handwritten notes.',
    color: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20',
    accent: 'text-blue-400',
  },
  {
    num: '02',
    icon: '🤖',
    title: 'AI Extraction',
    description: 'Gemini 2.5 Flash performs OCR & NLP to extract patient info, diagnoses, procedures, and billing codes.',
    color: 'from-indigo-500/20 to-indigo-600/5',
    border: 'border-indigo-500/20',
    accent: 'text-indigo-400',
  },
  {
    num: '03',
    icon: '🗂️',
    title: 'FHIR Mapping',
    description: 'Extracted entities are normalized into a structured FHIR R4 Bundle with Patient, Condition, Procedure, Observation, and Claim resources.',
    color: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/20',
    accent: 'text-purple-400',
  },
  {
    num: '04',
    icon: '⚖️',
    title: 'Revenue Reconciliation',
    description: 'Automated rules flag missing billing codes, unbilled surgical procedures, and claim/procedure count mismatches.',
    color: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/20',
    accent: 'text-emerald-400',
  },
];

const STAKEHOLDERS = [
  { icon: Building2, label: 'Hospital Billing Teams', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Users, label: 'RCM Managers', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: UserCheck, label: 'TPA Coordination Staff', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: ShieldCheck, label: 'Claims Processing Executives', color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center animate-fade-in space-y-24 pb-24">

      {/* Hero */}
      <div className="text-center space-y-8 max-w-4xl pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-4">
          <Zap size={14} />
          PS-2 · Hackathon Submission · Powered by Gemini 2.5 Flash
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
          AI-Powered Clinical &<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Administrative Data
          </span>
          <br />Normalization Engine
        </h1>

        <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Eliminate RCM inefficiencies by transforming unstructured clinical documents into
          structured <strong className="text-white">FHIR R4</strong> resources and automatically
          flagging <strong className="text-white">revenue leakage</strong> with AI-powered reconciliation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="glass-button px-8 py-4 rounded-full font-bold text-lg inline-flex items-center gap-3"
          >
            <FileUp size={22} />
            Launch Dashboard
            <ArrowRight size={18} />
          </Link>
          <a
            href="https://hl7.org/fhir/R4/"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 rounded-full font-semibold text-slate-300 border border-white/10 hover:border-white/30 hover:text-white transition-all inline-flex items-center gap-2"
          >
            <Database size={18} />
            FHIR R4 Standard
          </a>
        </div>

        {/* Live stats bar */}
        <div className="flex items-center justify-center gap-8 pt-6 border-t border-white/5">
          {[
            { label: 'Document Types', value: '6+' },
            { label: 'AI Model', value: 'Gemini 2.5 Flash' },
            { label: 'Code Systems', value: 'ICD-10 · CPT · LOINC' },
            { label: 'FHIR Version', value: 'R4' },
          ].map((stat) => (
            <div key={stat.label} className="text-center hidden sm:block">
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="w-full max-w-6xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-slate-400">A fully automated 4-step pipeline from raw documents to structured data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {/* Connector line for desktop */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-emerald-500/30" />

          {PIPELINE_STEPS.map((step, idx) => (
            <div
              key={step.num}
              className={`glass-panel p-6 border ${step.border} bg-gradient-to-br ${step.color} flex flex-col gap-4 relative hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{step.icon}</span>
                <span className={`text-xs font-mono font-bold ${step.accent} opacity-60`}>{step.num}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{step.title}</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{step.description}</p>
              </div>
              {idx < PIPELINE_STEPS.length - 1 && (
                <div className="lg:hidden flex justify-center pt-2">
                  <ArrowRight size={16} className="text-slate-600 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="w-full max-w-6xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">What Gets Extracted</h2>
          <p className="text-slate-400">Every clinical entity automatically identified and coded</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 flex flex-col gap-4 hover:border-blue-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl">🩺</div>
            <div>
              <h3 className="font-bold text-lg">Diagnoses · ICD-10</h3>
              <p className="text-sm text-slate-400 mt-1">Every clinical condition mapped to its ICD-10 code in real-time.</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              {['E11.9', 'I10', 'J18.9', 'K21.0'].map(c => (
                <span key={c} className="text-xs font-mono px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">{c}</span>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 flex flex-col gap-4 hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">🔬</div>
            <div>
              <h3 className="font-bold text-lg">Procedures · CPT</h3>
              <p className="text-sm text-slate-400 mt-1">Surgical and clinical procedures coded with CPT billing codes.</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              {['99213', '71046', '85025', '36415'].map(c => (
                <span key={c} className="text-xs font-mono px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">{c}</span>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 flex flex-col gap-4 hover:border-purple-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 text-2xl">🧪</div>
            <div>
              <h3 className="font-bold text-lg">Lab Tests · LOINC</h3>
              <p className="text-sm text-slate-400 mt-1">Lab results structured as FHIR Observations with LOINC codes.</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              {['2339-0', '718-7', '6690-2', '2093-3'].map(c => (
                <span key={c} className="text-xs font-mono px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stakeholders */}
      <div className="w-full max-w-6xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Built For</h2>
          <p className="text-slate-400">Solving real pain points for key healthcare stakeholders</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAKEHOLDERS.map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className="glass-panel p-5 flex flex-col items-center text-center gap-3 hover:border-white/20 transition-colors">
              <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                <Icon size={22} className={color} />
              </div>
              <p className="text-sm font-medium text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="w-full max-w-6xl">
        <div className="glass-panel p-10 text-center bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border-blue-500/20 space-y-6">
          <h2 className="text-4xl font-extrabold">Ready to normalize your data?</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Upload a discharge summary, lab report, or bill and watch our engine extract, structure, and reconcile in seconds.
          </p>
          <Link href="/dashboard" className="glass-button px-10 py-4 rounded-full font-bold text-lg inline-flex items-center gap-3">
            <FileUp size={22} />
            Open the Dashboard
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
