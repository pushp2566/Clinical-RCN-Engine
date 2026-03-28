/**
 * Advanced Revenue Reconciliation Engine
 * Compares extracted clinical entities against billing rules to detect
 * revenue leakage, missing codes, and financial anomalies.
 */

// LOINC → CPT mapping with estimated revenue amounts
const LOINC_TO_CPT_MAP = {
  '2339-0':  { cpt: '82947', name: 'Glucose',            revenue: 12 },
  '718-7':   { cpt: '85018', name: 'Hemoglobin',         revenue: 15 },
  '6690-2':  { cpt: '85025', name: 'CBC',                revenue: 22 },
  '2093-3':  { cpt: '82465', name: 'Total Cholesterol',  revenue: 25 },
  '2571-8':  { cpt: '84478', name: 'Triglycerides',      revenue: 20 },
  '13457-7': { cpt: '83721', name: 'LDL Cholesterol',    revenue: 28 },
  '2085-9':  { cpt: '83718', name: 'HDL Cholesterol',    revenue: 22 },
  '33959-8': { cpt: '84484', name: 'Troponin-I',         revenue: 45 },
  '42637-9': { cpt: '84484', name: 'Troponin',           revenue: 45 },
  '30934-4': { cpt: '83880', name: 'BNP',                revenue: 55 },
  '4548-4':  { cpt: '83036', name: 'HbA1c',              revenue: 30 },
  '2160-0':  { cpt: '82565', name: 'Creatinine',         revenue: 18 },
  '3094-0':  { cpt: '84520', name: 'BUN',                revenue: 16 },
  '1742-6':  { cpt: '84460', name: 'ALT',                revenue: 18 },
  '1920-8':  { cpt: '84450', name: 'AST',                revenue: 18 },
  '777-3':   { cpt: '85049', name: 'Platelets',          revenue: 20 },
  '26515-7': { cpt: '85049', name: 'Platelets',          revenue: 20 },
  '751-8':   { cpt: '85048', name: 'WBC',                revenue: 18 },
};

// ICD-10 prefix → required CPT billing codes
const ICD_REQUIRED_CPT = {
  'E11': { cpt: '99213', name: 'Diabetes E&M', revenue: 85 },
  'I10': { cpt: '99213', name: 'Hypertension E&M', revenue: 85 },
  'I21': { cpt: '93010', name: 'ECG for MI', revenue: 55 },
  'J18': { cpt: '71046', name: 'Chest X-Ray for Pneumonia', revenue: 75 },
  'N18': { cpt: '99213', name: 'CKD E&M', revenue: 85 },
};

export function runReconciliationRules(extractedEntities) {
  const issues = [];
  if (!extractedEntities) return issues;

  const conditions = extractedEntities.conditions || [];
  const procedures = extractedEntities.procedures || [];
  const claims     = extractedEntities.claims     || [];
  const labs       = extractedEntities.lab_results || [];

  const claimCodes    = claims.map(c => c.code?.toString()?.trim()).filter(Boolean);
  const claimServices = claims.map(c => c.service?.toLowerCase()).filter(Boolean);
  let totalRevOpportunity = 0;

  // ── Rule 1: Lab performed but CPT not billed ──────────────────────────────
  labs.forEach(lab => {
    const loinc = lab.loinc_guess?.trim();
    const mapping = loinc ? LOINC_TO_CPT_MAP[loinc] : null;

    if (mapping) {
      const billed = claimCodes.includes(mapping.cpt) ||
                     claimServices.some(s => s.includes(lab.test_name?.toLowerCase()));
      if (!billed) {
        totalRevOpportunity += mapping.revenue;
        issues.push({
          severity: 'critical',
          category: 'REVENUE LOSS DETECTED',
          message: `Lab '${lab.test_name}' (LOINC ${loinc}) performed but CPT ${mapping.cpt} not billed.`,
          action: `Add CPT ${mapping.cpt} to claim. Estimated lost revenue: ₹${mapping.revenue.toFixed(1)}`,
          amount: mapping.revenue,
        });
      }
    }
  });

  // ── Rule 2: Condition present but no E&M claim ────────────────────────────
  if (conditions.length > 0 && claims.length === 0) {
    const rev = 85;
    totalRevOpportunity += rev;
    issues.push({
      severity: 'critical',
      category: 'REVENUE LOSS DETECTED',
      message: `${conditions.length} documented condition(s) but ZERO claims on record.`,
      action: `Add Evaluation & Management (E&M) claim code. Estimated lost revenue: ₹${rev.toFixed(1)}`,
      amount: rev,
    });
  }

  // ── Rule 3: ICD-10 requires specific CPT that is missing ─────────────────
  conditions.forEach(cond => {
    const code = cond.icd10_guess || '';
    const prefix = code.slice(0, 3);
    const rule = ICD_REQUIRED_CPT[prefix];
    if (rule) {
      const billed = claimCodes.includes(rule.cpt) ||
                     claimServices.some(s => s.includes(rule.name.toLowerCase().split(' ')[0]));
      if (!billed) {
        totalRevOpportunity += rule.revenue;
        issues.push({
          severity: 'high',
          category: 'MISSING REQUIRED CODE',
          message: `Condition '${cond.condition}' (${code}) typically requires CPT ${rule.cpt} — not found in claims.`,
          action: `Add ${rule.name} (CPT ${rule.cpt}). Estimated lost revenue: ₹${rule.revenue.toFixed(1)}`,
          amount: rule.revenue,
        });
      }
    }
  });

  // ── Rule 4: Procedure count mismatch ─────────────────────────────────────
  if (procedures.length > claims.length) {
    issues.push({
      severity: 'high',
      category: 'BILLING MISMATCH',
      message: `${procedures.length} procedure(s) documented but only ${claims.length} claim(s) filed.`,
      action: `Review unbilled procedures and add corresponding CPT codes to prevent revenue leakage.`,
      amount: 0,
    });
  }

  // ── Rule 5: Surgical procedure without matching claim ────────────────────
  procedures.forEach(proc => {
    const isSurgical = proc.procedure?.toLowerCase().match(/surger|appendect|mastect|bypass|repair|resection|excision/);
    if (isSurgical) {
      const hasClaim = claimCodes.includes(proc.cpt_guess) ||
                       claimServices.some(s => s.includes('surg'));
      if (!hasClaim) {
        const rev = 350;
        totalRevOpportunity += rev;
        issues.push({
          severity: 'critical',
          category: 'REVENUE LOSS DETECTED',
          message: `Surgical procedure '${proc.procedure}' detected with no matching claim code.`,
          action: `Add CPT ${proc.cpt_guess || 'code'} to claim. Estimated lost revenue: ₹${rev.toFixed(1)}`,
          amount: rev,
        });
      }
    }
  });

  // ── Rule 6: Zero-amount claims (financial anomaly) ────────────────────────
  claims.forEach(claim => {
    if (claim.amount === 0 || claim.amount === null || claim.amount === undefined) {
      issues.push({
        severity: 'medium',
        category: 'FINANCIAL ANOMALY',
        message: `Claim for '${claim.service}' has a ₹0 or missing billed amount.`,
        action: `Verify pricing for this service and update claim before submission.`,
        amount: 0,
      });
    }
  });

  // ── Rule 7: Payment vs Approved Discrepancy (Insurance Validation) ────────
  const fin = extractedEntities.financial_summary || {};
  const ins = extractedEntities.insurance_workflow || {};
  
  const parseAmt = (val) => {
    if (val === null || val === undefined) return null;
    const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? null : num;
  };
  
  const billedAmt = parseAmt(fin.total_billed_amount);
  const approvedAmt = parseAmt(ins.approved_amount);
  const paidAmt = parseAmt(ins.paid_amount);

  if (paidAmt !== null && approvedAmt !== null && paidAmt !== approvedAmt) {
     issues.push({
       severity: 'critical',
       category: 'PAYMENT DISCREPANCY',
       message: `Insurance paid ₹${paidAmt} but approved amount was ₹${approvedAmt}.`,
       action: `Investigate short pay. Recover ₹${Math.abs(approvedAmt - paidAmt).toFixed(2)}`,
       amount: Math.abs(approvedAmt - paidAmt)
     });
  }

  // ── Rule 8: Allowed vs Billed (Overbilling / Denial) ──────────────────────
  if (approvedAmt !== null && billedAmt !== null && approvedAmt < billedAmt) {
     issues.push({
       severity: 'high',
       category: 'INSURANCE DENIAL ROUNDING',
       message: `Insurance approved ₹${approvedAmt} against billed ₹${billedAmt}.`,
       action: `Review Explanation of Benefits (EOB) for denied line items (₹${(billedAmt - approvedAmt).toFixed(2)} loss)`,
       amount: billedAmt - approvedAmt
     });
  }

  // ── Summary issue (always inserted first) ────────────────────────────────
  if (totalRevOpportunity > 0) {
    issues.unshift({
      severity: 'info',
      category: 'RCM INSIGHT SUMMARY',
      message: `Total estimated revenue capture opportunity: ₹${totalRevOpportunity.toFixed(1)}`,
      action: `Approve all detected billing additions`,
      amount: totalRevOpportunity,
    });
  }

  // ── Compute Cross-Validation Engine Flags ───────────────────────────────
  const isDiagnosisValid = conditions.length > 0; 
  // Billing is justified if there are no Billing/Financial issues and we actually have procedures billed
  const isBillingJustified = issues.filter(i => i.category === 'BILLING MISMATCH' || i.category === 'FINANCIAL ANOMALY').length === 0;
  // Payment is correct if paid matches approved
  const isPaymentCorrect = paidAmt !== null && approvedAmt !== null && paidAmt === approvedAmt;

  return {
    issues,
    validationSummary: {
      isDiagnosisValid,
      isBillingJustified,
      isPaymentCorrect
    }
  };
}
