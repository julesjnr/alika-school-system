export interface AcademicProgram {
  id: string;
  code: string;
  name: string;
  duration: string;
  entryRequirement: string;
  careerPathways: string[];
  description: string;
  fees: number;
}

export interface CurriculumModule {
  code: string;
  title: string;
  credits: number;
  description: string;
}

export interface MedicalService {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  badge?: string;
}

export interface InstitutionConfig {
  name: string;
  shortName: string;
  legalName: string;
  tagline: string;
  portalName: string;
  studentPortalName: string;
  adminPortalName: string;
  lecturerPortalName: string;
  libraryPortalName: string;
  email: string;
  admissionsEmail: string;
  supportEmail: string;
  phonePrimary: string;
  phoneSecondary: string;
  website: string;
  address: string;
  location: string;
  town: string;
  subCounty: string;
  county: string;
  country: string;
  operatingHours: {
    weekdays: string;
    sunday: string;
    summary: string;
  };
  accreditationBodies: string[];
  accreditationNote: string;
  programs: AcademicProgram[];
  caregiverCurriculum: CurriculumModule[];
  medicalCenterServices: MedicalService[];
}

export const institution: InstitutionConfig = {
  name: "Alika Medical Training College & Medical Center",
  shortName: "Alika Medical",
  legalName: "Alika Medical Training College & Medical Center",
  tagline: "Integrated Medical Training & Community Healthcare",
  portalName: "Alika Medical Portal",
  studentPortalName: "Alika Student Portal",
  adminPortalName: "Alika Administration",
  lecturerPortalName: "Alika Faculty Workstation",
  libraryPortalName: "Alika Medical Library",
  email: "info@alikamedical.co.ke",
  admissionsEmail: "info@alikamedical.co.ke",
  supportEmail: "info@alikamedical.co.ke",
  phonePrimary: "+254 721 578 290",
  phoneSecondary: "+254 723 940 093",
  website: "www.alikamedical.co.ke",
  address: "ACK St. Peters Church Ndunyu Compound, Wangige Town, Kabete Ward, Kabete Sub-County, Kiambu County, Kenya",
  location: "Wangige, Kiambu County, Kenya",
  town: "Wangige Town",
  subCounty: "Kabete Sub-County",
  county: "Kiambu County",
  country: "Kenya",
  operatingHours: {
    weekdays: "Monday – Saturday: 9:00 AM – 5:00 PM",
    sunday: "Closed",
    summary: "Monday – Saturday: 9:00 AM – 5:00 PM | Sunday: Closed",
  },
  accreditationBodies: ["TVETA", "TVET CDACC", "NITA"],
  accreditationNote: "Programs and institutional operations are presented in accordance with the accreditation and training information supplied by the institution.",
  programs: [
    {
      id: "prog-caregiver",
      code: "CERT-CG",
      name: "Certificate in Caregiver",
      duration: "4 Months",
      entryRequirement: "KCSE Certificate / High School Equivalent",
      careerPathways: [
        "Homecare Specialist",
        "Nursing Home Aide",
        "Elderly Caregiver",
      ],
      description: "Comprehensive practical training covering patient care foundations, vital signs monitoring, geriatric assistance, and supportive healthcare delivery.",
      fees: 45000,
    },
    {
      id: "prog-nurse-assistant",
      code: "CERT-NA",
      name: "Certificate in Nurse Assistant",
      duration: "4 Months",
      entryRequirement: "KCSE Certificate / High School Equivalent",
      careerPathways: [
        "Certified Nurse Assistant",
        "Hospital Support Staff",
        "Ward Assistant",
      ],
      description: "Practical clinical fundamentals, patient care support, infection control, and hospital ward assistance procedures under professional clinical supervision.",
      fees: 45000,
    },
    {
      id: "prog-homecare-assistant",
      code: "CERT-HA",
      name: "Certificate in Homecare Assistant",
      duration: "4 Months",
      entryRequirement: "KCSE Certificate / High School Equivalent",
      careerPathways: [
        "Domestic Health Officer",
        "Private Family Medical Assistant",
      ],
      description: "Specialized training for in-home patient assistance, personal care, chronic disease management support, and home-based clinical rehabilitation.",
      fees: 45000,
    },
  ],
  caregiverCurriculum: [
    {
      code: "CG-101",
      title: "Patient Care Foundations",
      credits: 4,
      description: "Core competencies in patient hygiene, bed making, mobility assistance, and primary comfort measures in clinical and domestic settings.",
    },
    {
      code: "CG-102",
      title: "Basic Human Anatomy & Physiology",
      credits: 3,
      description: "Overview of human biological systems, anatomical landmarks, and physiological functions.",
    },
    {
      code: "CG-103",
      title: "Basic Pharmacology & Safety Protocols",
      credits: 3,
      description: "Medication administration assistance, storage safety, dosage observance, and safety protocols.",
    },
    {
      code: "CG-104",
      title: "Basic Physiotherapy & Rehabilitation",
      credits: 3,
      description: "Assisting patients with mobility exercises, range-of-motion drills, safe transfer techniques, and adaptive aids.",
    },
    {
      code: "CG-105",
      title: "Mental Health & Dementia Care",
      credits: 4,
      description: "Understanding cognitive care, managing dementia behavioral patterns, and providing empathetic emotional support.",
    },
    {
      code: "CG-106",
      title: "Basic Hospital Procedures & Triage",
      credits: 4,
      description: "Vital signs measurement (blood pressure, pulse, temperature, SpO2), intake triage workflows, and emergency escalation protocols.",
    },
    {
      code: "CG-107",
      title: "Nutrition & Dietary Meal Planning",
      credits: 3,
      description: "Therapeutic meal planning, hydration management, assisted feeding techniques, and nutritional support.",
    },
    {
      code: "CG-108",
      title: "Common Diseases & Chronic Management",
      credits: 4,
      description: "Supportive care protocols for diabetes, hypertension, arthritis, respiratory conditions, and chronic condition management.",
    },
    {
      code: "CG-109",
      title: "Empathy-Driven Communication",
      credits: 3,
      description: "Active listening, non-verbal communication, patient dignity preservation, and empathetic family interaction.",
    },
    {
      code: "CG-110",
      title: "Infection Prevention, Control & Microbiology",
      credits: 7,
      description: "Aseptic techniques, sterilization, PPE protocols, biomedical waste segregation, and infection prevention standards.",
    },
  ],
  medicalCenterServices: [
    {
      id: "srv-outpatient",
      title: "General Outpatient Consultation",
      shortDescription: "Comprehensive primary healthcare consultations, clinical evaluations, and treatment plans.",
      description: "Outpatient primary healthcare consultations with qualified clinical staff for acute and routine community health needs.",
      badge: "Primary Care",
    },
    {
      id: "srv-family-planning",
      title: "Family Planning & Reproductive Health",
      shortDescription: "Counseling, maternal health guidance, and modern reproductive healthcare services.",
      description: "Reproductive healthcare counseling, maternal wellness guidance, and family planning support services.",
      badge: "Maternal Health",
    },
    {
      id: "srv-infection-control",
      title: "Infection Prevention & Control",
      shortDescription: "Rigorous sterilization, immunization support, and wound management protocols.",
      description: "Sterile clinical procedures, routine immunizations, antiseptic wound dressings, and infection control standards.",
      badge: "Clinical Safety",
    },
    {
      id: "srv-chronic-disease",
      title: "Chronic Disease Management Support",
      shortDescription: "Ongoing monitoring and lifestyle support for hypertension, diabetes, and asthma.",
      description: "Chronic condition tracking, blood sugar and blood pressure monitoring, and supportive disease management counseling.",
      badge: "Chronic Care",
    },
    {
      id: "srv-triage-vitals",
      title: "Triage & Vital Signs Monitoring",
      shortDescription: "Fast-track clinical triage, precise vital signs tracking, and urgent stabilization.",
      description: "Rapid clinical assessment, digital vitals logging (blood pressure, pulse, temperature, SpO2, BMI), and urgent stabilization triage.",
      badge: "Diagnostics",
    },
    {
      id: "srv-clinical-training",
      title: "Clinical Practical Training",
      shortDescription: "Supervised practical healthcare training within an integrated clinical environment.",
      description: "Supervised clinical exposure, practical medical training, clinical attachment, and homecare attachment experience.",
      badge: "Practical Training",
    },
  ],
};

export default institution;
