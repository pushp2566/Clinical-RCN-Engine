/**
 * Maps the unstructured Gemini JSON output to structured FHIR R4 JSON formats.
 */
export function mapToFHIR(extractedData) {
  const fhirStructure = {
    resourceType: "Bundle",
    type: "collection",
    entry: []
  };

  if (!extractedData) return fhirStructure;

  // Map Encounter (the linking resource for all clinical events in RCM)
  const encounter = {
    fullUrl: "urn:uuid:encounter-1",
    resource: {
      resourceType: "Encounter",
      id: "encounter-1",
      status: "finished",
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "IMP",
        display: "inpatient encounter"
      },
      subject: { reference: "urn:uuid:patient-1" },
      period: {
        start: extractedData.patient?.admission_date || null,
        end:   extractedData.patient?.discharge_date || null
      },
      reasonCode: [
        {
          text: extractedData.conditions?.[0]?.condition || "Clinical Encounter"
        }
      ]
    }
  };
  fhirStructure.entry.push(encounter);

  // Map Patient
  if (extractedData.patient) {
    const patientResource = {
      fullUrl: "urn:uuid:patient-1",
      resource: {
        resourceType: "Patient",
        id: "patient-1",
        name: [
          {
            use: "official",
            text: extractedData.patient.name
          }
        ],
        gender: extractedData.patient.gender,
        birthDate: extractedData.patient.dob
      }
    };
    fhirStructure.entry.push(patientResource);
  }

  // Map Conditions
  if (extractedData.conditions && Array.isArray(extractedData.conditions)) {
    extractedData.conditions.forEach((cond, index) => {
      fhirStructure.entry.push({
        fullUrl: `urn:uuid:condition-${index}`,
        resource: {
          resourceType: "Condition",
          id: `condition-${index}`,
          clinicalStatus: {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }]
          },
          verificationStatus: {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }]
          },
          subject: { reference: "urn:uuid:patient-1" },
          encounter: { reference: "urn:uuid:encounter-1" },
          code: {
            coding: [
              {
                system: "http://hl7.org/fhir/sid/icd-10",
                code: cond.icd10_guess,
                display: cond.condition
              }
            ],
            text: cond.condition
          }
        }
      });
    });
  }

  // Map Procedures
  if (extractedData.procedures && Array.isArray(extractedData.procedures)) {
    extractedData.procedures.forEach((proc, index) => {
      fhirStructure.entry.push({
        fullUrl: `urn:uuid:procedure-${index}`,
        resource: {
          resourceType: "Procedure",
          id: `procedure-${index}`,
          status: "completed",
          subject: { reference: "urn:uuid:patient-1" },
          encounter: { reference: "urn:uuid:encounter-1" },
          code: {
            coding: [
              {
                system: "http://www.ama-assn.org/go/cpt",
                code: proc.cpt_guess,
                display: proc.procedure
              }
            ],
            text: proc.procedure
          }
        }
      });
    });
  }

  // Map Lab Results (Observations)
  if (extractedData.lab_results && Array.isArray(extractedData.lab_results)) {
    extractedData.lab_results.forEach((lab, index) => {
      fhirStructure.entry.push({
        fullUrl: `urn:uuid:observation-${index}`,
        resource: {
          resourceType: "Observation",
          id: `observation-${index}`,
          status: "final",
          subject: { reference: "urn:uuid:patient-1" },
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: lab.loinc_guess,
                display: lab.test_name
              }
            ],
            text: lab.test_name
          },
          valueString: lab.value
        }
      });
    });
  }

  // Map Claims
  if (extractedData.claims && Array.isArray(extractedData.claims)) {
      extractedData.claims.forEach((claim, idx) => {
        fhirStructure.entry.push({
          fullUrl: `urn:uuid:claim-${idx}`,
          resource: {
            resourceType: "Claim",
            id: `claim-${idx}`,
            patient: { reference: "urn:uuid:patient-1" },
            item: [
              {
                sequence: 1,
                productOrService: { text: claim.service },
                net: { value: claim.amount, currency: "USD" }
              }
            ]
          }
        });
      });
  }

  return fhirStructure;
}
