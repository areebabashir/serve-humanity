import type { OrgRole } from "./roles";

export type DocType =
  | "health"
  | "marriage"
  | "fee"
  | "ration"
  | "monthly_report"
  | "ration_file"
  | "drive"
  | "stat"
  | "reference";

export type FieldKind = "text" | "textarea" | "number" | "date" | "select" | "file" | "file_note";

export interface DocField {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface DocTypeConfig {
  type: DocType;
  title: string;
  description: string;
  fields: DocField[];
}

export const DOC_TYPE_CONFIGS: DocTypeConfig[] = [
  {
    type: "health",
    title: "Regular Case — Health",
    description: "Health case documents for all chapters",
    fields: [
      { key: "caseNumber", label: "Case Number", kind: "text", required: true, placeholder: "e.g. H-2026-001" },
      { key: "caseType", label: "Case Type", kind: "select", required: true, options: ["Health", "Marriage", "Ration", "Fee"] },
      { key: "casePoster", label: "Case Poster", kind: "file" },
      { key: "ref1Name", label: "1st Reference Name", kind: "text", required: true },
      { key: "ref1Contact", label: "1st Reference Contact", kind: "text", required: true },
      { key: "ref2Name", label: "2nd Reference Name", kind: "text" },
      { key: "ref2Contact", label: "2nd Reference Contact", kind: "text" },
      { key: "paymentReceiverName", label: "Payment Receiver Name", kind: "text", required: true },
      { key: "paymentDate", label: "Payment Date", kind: "date", required: true },
      { key: "paymentMode", label: "Payment Mode", kind: "select", required: true, options: ["Online", "Cash"] },
      { key: "paymentAmount", label: "Payment Amount (PKR)", kind: "number", required: true },
      { key: "patientIdDoc", label: "B-Form / CNIC of Patient", kind: "file", required: true },
      { key: "rentAgreement", label: "Rent Agreement (if available)", kind: "file" },
      { key: "utilityBills", label: "Electricity / Gas / Water Bills", kind: "file" },
      { key: "housePics", label: "House Pics", kind: "file" },
      { key: "incomeProof", label: "Income Proof (photo / payslip)", kind: "file_note", required: true },
      { key: "medicalReports", label: "Medical / Tests / Expense Bills", kind: "file", required: true },
      { key: "paymentRecordSs", label: "Payment Record Screenshot", kind: "file", required: true },
      { key: "paymentUsagePics", label: "Payment Usage Pics (if available)", kind: "file" },
      { key: "notes", label: "Any note or description", kind: "textarea" },
    ],
  },
  {
    type: "marriage",
    title: "Regular Case — Marriage",
    description: "Orphan / marriage support case documents",
    fields: [
      { key: "caseNumber", label: "Case Number", kind: "text", required: true },
      { key: "caseType", label: "Case Type", kind: "select", required: true, options: ["Marriage", "Health", "Ration", "Fee"] },
      { key: "casePoster", label: "Case Poster", kind: "file" },
      { key: "ref1Name", label: "1st Reference Name", kind: "text", required: true },
      { key: "ref1Contact", label: "1st Reference Contact", kind: "text", required: true },
      { key: "ref2Name", label: "2nd Reference Name", kind: "text" },
      { key: "ref2Contact", label: "2nd Reference Contact", kind: "text" },
      { key: "paymentReceiverName", label: "Payment Receiver Name", kind: "text", required: true },
      { key: "paymentDate", label: "Payment Date", kind: "date", required: true },
      { key: "paymentMode", label: "Payment Mode", kind: "select", required: true, options: ["Online", "Cash"] },
      { key: "paymentAmount", label: "Payment Amount (PKR)", kind: "number", required: true },
      { key: "girlFatherId", label: "B-Form / CNIC of Girl & Father", kind: "file", required: true },
      { key: "deathCertificate", label: "Death Certificate", kind: "file" },
      { key: "rentAgreement", label: "Rent Agreement (if available)", kind: "file" },
      { key: "incomeProof", label: "Income Proof + utility bills note", kind: "file_note", required: true },
      { key: "housePics", label: "House Pics", kind: "file" },
      { key: "medicalIfAny", label: "Medical Report / Receipts (optional)", kind: "file" },
      { key: "paymentRecordSs", label: "Payment Record Screenshot", kind: "file", required: true },
      { key: "paymentUsagePics", label: "Payment Usage Pics (from Serve Humanity)", kind: "file" },
      { key: "notes", label: "Any note or description", kind: "textarea" },
    ],
  },
  {
    type: "fee",
    title: "Regular Case — Fee",
    description: "Student fee support case documents",
    fields: [
      { key: "caseNumber", label: "Case Number", kind: "text", required: true },
      { key: "caseType", label: "Case Type", kind: "select", required: true, options: ["Fee", "Health", "Marriage", "Ration"] },
      { key: "casePoster", label: "Case Poster", kind: "file" },
      { key: "ref1Name", label: "1st Reference Name", kind: "text", required: true },
      { key: "ref1Contact", label: "1st Reference Contact", kind: "text", required: true },
      { key: "ref2Name", label: "2nd Reference Name", kind: "text" },
      { key: "ref2Contact", label: "2nd Reference Contact", kind: "text" },
      { key: "paymentReceiverName", label: "Payment Receiver Name", kind: "text", required: true },
      { key: "paymentDate", label: "Payment Date", kind: "date", required: true },
      { key: "paymentMode", label: "Payment Mode", kind: "select", required: true, options: ["Online", "Cash"] },
      { key: "paymentAmount", label: "Payment Amount (PKR)", kind: "number", required: true },
      { key: "studentFatherId", label: "B-Form / CNIC of Student & Father", kind: "file", required: true },
      { key: "studentCard", label: "University Student Card", kind: "file", required: true },
      { key: "feeChallan", label: "Fee Challan", kind: "file", required: true },
      { key: "rentAgreement", label: "Rent Agreement (if available)", kind: "file" },
      { key: "incomeProof", label: "Income Proof + utility bills note", kind: "file_note", required: true },
      { key: "housePics", label: "House Pics", kind: "file" },
      { key: "paymentAndPaidChallan", label: "Payment Screenshot + Paid Fee Challan", kind: "file", required: true },
      { key: "notes", label: "Any note or description", kind: "textarea" },
    ],
  },
  {
    type: "ration",
    title: "Regular Case — Ration",
    description: "One-time / regular ration case documents",
    fields: [
      { key: "caseNumber", label: "Case Number", kind: "text", required: true },
      { key: "caseType", label: "Case Type", kind: "select", required: true, options: ["Ration", "Health", "Marriage", "Fee"] },
      { key: "casePoster", label: "Case Poster", kind: "file" },
      { key: "ref1Name", label: "1st Reference Name", kind: "text", required: true },
      { key: "ref1Contact", label: "1st Reference Contact", kind: "text", required: true },
      { key: "ref2Name", label: "2nd Reference Name", kind: "text" },
      { key: "ref2Contact", label: "2nd Reference Contact", kind: "text" },
      { key: "paymentReceiverName", label: "Payment Receiver Name", kind: "text", required: true },
      { key: "paymentDate", label: "Payment Date", kind: "date", required: true },
      { key: "paymentMode", label: "Payment Mode", kind: "select", required: true, options: ["Online", "Cash"] },
      { key: "paymentAmount", label: "Payment Amount (PKR)", kind: "number", required: true },
      { key: "cnicFrontBack", label: "CNIC Front & Back", kind: "file", required: true },
      { key: "deathCertificate", label: "Death Certificate (if available)", kind: "file" },
      { key: "rentAgreement", label: "Rent Agreement (if available)", kind: "file" },
      { key: "incomeProof", label: "Income Proof + utility bills note", kind: "file_note", required: true },
      { key: "housePics", label: "House Pics", kind: "file" },
      { key: "paymentAndDelivery", label: "Payment Screenshot + Ration Delivered Pics", kind: "file", required: true },
      { key: "notes", label: "Any note or description", kind: "textarea" },
    ],
  },
  {
    type: "monthly_report",
    title: "Monthly Report",
    description: "Monthly documentation report for cases, ration & drives",
    fields: [
      { key: "monthYear", label: "Month and Year", kind: "text", required: true, placeholder: "e.g. July 2026" },
      { key: "caseNumber", label: "Case Number(s)", kind: "textarea", required: true },
      { key: "casePaymentSs", label: "Case Payment Screenshot(s)", kind: "file", required: true },
      { key: "caseNotes", label: "Notes for regular cases", kind: "textarea" },
      { key: "rationCaseNumbers", label: "Ration Cases Numbers", kind: "textarea" },
      { key: "rationScreenshots", label: "Ration Cases Screenshots", kind: "file" },
      { key: "drivePaymentSs", label: "Drive Payment SS and details", kind: "file_note" },
      { key: "rationDriveNotes", label: "Notes for Ration cases & Drives", kind: "textarea" },
      { key: "totalCases", label: "Total Number of Cases", kind: "number", required: true },
      { key: "totalAmount", label: "Total Amount Transferred (incl. Drives + Ration + Regular)", kind: "number", required: true },
      { key: "notes", label: "Any note or description", kind: "textarea" },
    ],
  },
  {
    type: "ration_file",
    title: "Ration Cases File",
    description: "Monthly ration case ledger entries",
    fields: [
      { key: "monthYear", label: "Month and Year", kind: "text", required: true },
      { key: "rationCaseNumber", label: "Ration Case Number", kind: "text", required: true },
      { key: "transferAmount", label: "Transfer Amount", kind: "number", required: true },
      { key: "paymentMethod", label: "Payment Method", kind: "select", required: true, options: ["Online", "Cash", "Bank"] },
      { key: "paymentDate", label: "Payment Date", kind: "date", required: true },
      { key: "referenceName", label: "Reference Name", kind: "text", required: true },
      { key: "receiverName", label: "Receiver Name", kind: "text", required: true },
      { key: "phoneNo", label: "Phone No", kind: "text", required: true },
      { key: "accountNo", label: "Account No", kind: "text" },
      { key: "paymentScreenshot", label: "Payment Screenshot", kind: "file", required: true },
      { key: "notes", label: "Any note / description", kind: "textarea" },
    ],
  },
  {
    type: "drive",
    title: "Drive File",
    description: "Applicable for all types of drives",
    fields: [
      { key: "driveNameType", label: "Drive Name / Type", kind: "text", required: true, placeholder: "Winter Drive, Ramadan, Flood…" },
      { key: "poster", label: "Poster", kind: "file" },
      { key: "driveDate", label: "Drive Date", kind: "date", required: true },
      { key: "totalExpense", label: "Total Expense", kind: "number", required: true },
      { key: "expenseBills", label: "Expense Screenshots & Bills (with details)", kind: "file_note", required: true },
      { key: "drivePhotos", label: "Drive Photos (e. and uniforms if available)", kind: "file" },
      { key: "notes", label: "Any note or description", kind: "textarea" },
    ],
  },
  {
    type: "stat",
    title: "Stat File",
    description: "Aggregate statistics across cases and drives",
    fields: [
      { key: "emergencyHealthCount", label: "Emergency (Health) — Count", kind: "number" },
      { key: "emergencyHealthAmount", label: "Emergency (Health) — Amount", kind: "number" },
      { key: "rozgarCount", label: "Rozgar Scheme — Count", kind: "number" },
      { key: "rozgarAmount", label: "Rozgar Scheme — Amount", kind: "number" },
      { key: "messBillCount", label: "Mess Bill Cases — Count", kind: "number" },
      { key: "messBillAmount", label: "Mess Bill Cases — Amount", kind: "number" },
      { key: "oneTimeRashanCount", label: "One-Time Rashan — Count", kind: "number" },
      { key: "oneTimeRashanAmount", label: "One-Time Rashan — Amount", kind: "number" },
      { key: "monthlyRashanCount", label: "Monthly Rashan (Repeated) — Count", kind: "number" },
      { key: "monthlyRashanAmount", label: "Monthly Rashan (Repeated) — Amount", kind: "number" },
      { key: "orphansMarriageCount", label: "Orphans’ Marriage — Count", kind: "number" },
      { key: "orphansMarriageAmount", label: "Orphans’ Marriage — Amount", kind: "number" },
      { key: "studentFeesCount", label: "Student Fees — Count", kind: "number" },
      { key: "studentFeesAmount", label: "Student Fees — Amount", kind: "number" },
      { key: "ramadanDriveCount", label: "Ramadan Rashan Drive — Count", kind: "number" },
      { key: "ramadanDriveAmount", label: "Ramadan Rashan Drive — Amount", kind: "number" },
      { key: "winterDriveCount", label: "Winter Drive — Count", kind: "number" },
      { key: "winterDriveAmount", label: "Winter Drive — Amount", kind: "number" },
      { key: "palestineDriveCount", label: "Palestine Drive — Count", kind: "number" },
      { key: "palestineDriveAmount", label: "Palestine Drive — Amount", kind: "number" },
      { key: "healthMedicineCount", label: "Health and Medicine — Count", kind: "number" },
      { key: "healthMedicineAmount", label: "Health and Medicine — Amount", kind: "number" },
      { key: "medicalCampsCount", label: "Medical Camps — Count", kind: "number" },
      { key: "medicalCampsAmount", label: "Medical Camps — Amount", kind: "number" },
      { key: "collaborationCount", label: "Collaboration — Count", kind: "number" },
      { key: "collaborationAmount", label: "Collaboration — Amount", kind: "number" },
      { key: "floodFoodCount", label: "Flood Food Drive — Count", kind: "number" },
      { key: "floodFoodAmount", label: "Flood Food Drive — Amount", kind: "number" },
      { key: "totalCasesExceptMonthly", label: "Total Cases (except Monthly Rashan)", kind: "number" },
      { key: "totalDrives", label: "Total No. of Drives", kind: "number" },
      { key: "campsCount", label: "Camps (Medical, Food) Numbers", kind: "number" },
      { key: "overallCasesPlusDrives", label: "Overall Cases + Drives", kind: "number" },
      { key: "totalAmountTransferred", label: "Total Amount Transferred", kind: "number" },
      { key: "notes", label: "Any note or description", kind: "textarea" },
    ],
  },
  {
    type: "reference",
    title: "Reference File",
    description: "Reference registry used across cases",
    fields: [
      { key: "referenceNumber", label: "Reference Number", kind: "text", required: true },
      { key: "referenceDetails", label: "Reference Description / Details", kind: "textarea", required: true },
      { key: "date", label: "Date", kind: "date", required: true },
      { key: "notes", label: "Any note or description", kind: "textarea" },
    ],
  },
];

export function getDocConfig(type: string): DocTypeConfig | undefined {
  return DOC_TYPE_CONFIGS.find((c) => c.type === type);
}

export const DOC_EDITOR_ROLES: OrgRole[] = ["ceo", "bog_documentation"];
