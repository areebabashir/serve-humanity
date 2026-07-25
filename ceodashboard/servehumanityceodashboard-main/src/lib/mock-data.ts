export const kpis = {
  totalChapters: 24,
  totalMembers: 3841,
  totalVolunteers: 2160,
  donationsMonth: 8_420_000,
  donationsYTD: 74_180_000,
  activeCases: 312,
  pendingVerifications: 47,
  upcomingEvents: 18,
};

export const donationTrend = [
  { month: "Jan", donations: 4200000, expenses: 3100000 },
  { month: "Feb", donations: 4850000, expenses: 3400000 },
  { month: "Mar", donations: 5100000, expenses: 3800000 },
  { month: "Apr", donations: 6200000, expenses: 4100000 },
  { month: "May", donations: 5900000, expenses: 4500000 },
  { month: "Jun", donations: 7100000, expenses: 4900000 },
  { month: "Jul", donations: 6800000, expenses: 5100000 },
  { month: "Aug", donations: 7400000, expenses: 5300000 },
  { month: "Sep", donations: 7900000, expenses: 5600000 },
  { month: "Oct", donations: 8100000, expenses: 5900000 },
  { month: "Nov", donations: 8300000, expenses: 6100000 },
  { month: "Dec", donations: 8420000, expenses: 6250000 },
];

export type ChapterStatus = "active" | "inactive";
export const chapters: Array<{
  id: string;
  name: string;
  city: string;
  president: string;
  members: number;
  status: ChapterStatus;
  established: string;
  lastActivity: string;
  casesClosed: number;
  fundsRaised: number;
  events: number;
}> = [
  { id: "chp-01", name: "Lahore Central", city: "Lahore", president: "Dr. Ahsan Khan", members: 412, status: "active", established: "2015-03-14", lastActivity: "2h ago", casesClosed: 187, fundsRaised: 12_400_000, events: 34 },
  { id: "chp-02", name: "Karachi South", city: "Karachi", president: "Fatima Zahra", members: 528, status: "active", established: "2014-08-02", lastActivity: "1h ago", casesClosed: 221, fundsRaised: 14_800_000, events: 41 },
  { id: "chp-03", name: "Islamabad", city: "Islamabad", president: "Omar Farooq", members: 306, status: "active", established: "2016-01-20", lastActivity: "35m ago", casesClosed: 154, fundsRaised: 9_200_000, events: 28 },
  { id: "chp-04", name: "Peshawar", city: "Peshawar", president: "Sana Malik", members: 198, status: "active", established: "2017-06-11", lastActivity: "5h ago", casesClosed: 96, fundsRaised: 5_400_000, events: 19 },
  { id: "chp-05", name: "Quetta", city: "Quetta", president: "Bilal Ahmed", members: 142, status: "active", established: "2018-11-04", lastActivity: "1d ago", casesClosed: 72, fundsRaised: 3_900_000, events: 14 },
  { id: "chp-06", name: "Multan", city: "Multan", president: "Ayesha Noor", members: 224, status: "active", established: "2016-09-18", lastActivity: "3h ago", casesClosed: 118, fundsRaised: 6_100_000, events: 22 },
  { id: "chp-07", name: "Faisalabad", city: "Faisalabad", president: "Hassan Raza", members: 267, status: "active", established: "2017-02-08", lastActivity: "4h ago", casesClosed: 133, fundsRaised: 7_800_000, events: 25 },
  { id: "chp-08", name: "Rawalpindi", city: "Rawalpindi", president: "Zainab Iqbal", members: 189, status: "inactive", established: "2019-04-30", lastActivity: "22d ago", casesClosed: 58, fundsRaised: 2_100_000, events: 9 },
];

export const activityFeed = [
  { id: 1, type: "case", text: "New welfare case submitted by Karachi South", meta: "Fatima Zahra • 8m ago" },
  { id: 2, type: "donation", text: "Donation of PKR 250,000 received (Ramzan Campaign)", meta: "Lahore Central • 24m ago" },
  { id: 3, type: "role", text: "Sana Malik promoted to Vice President", meta: "Peshawar • 1h ago" },
  { id: 4, type: "event", text: "Event 'Winter Relief Drive' approved", meta: "Islamabad • 2h ago" },
  { id: 5, type: "case", text: "Case #CS-1287 approved by CEO", meta: "Multan • 3h ago" },
  { id: 6, type: "chapter", text: "New chapter proposal: Hyderabad", meta: "Board • 5h ago" },
  { id: 7, type: "media", text: "Campaign graphic submitted for approval", meta: "Faisalabad • 6h ago" },
];

export const alerts = [
  { id: 1, severity: "danger" as const, title: "12 cases pending verification > 7 days", chapter: "Multi-chapter" },
  { id: 2, severity: "warning" as const, title: "Peshawar budget at 92% utilization", chapter: "Peshawar" },
  { id: 3, severity: "warning" as const, title: "Rawalpindi has no activity in 22 days", chapter: "Rawalpindi" },
  { id: 4, severity: "danger" as const, title: "3 large expense approvals awaiting CEO", chapter: "Finance" },
];

export const verificationQueue = [
  { id: "CS-1420", applicant: "Muhammad Ismail", chapter: "Karachi South", category: "Medical", amount: 180000, urgency: "High", daysPending: 2, status: "Pending" },
  { id: "CS-1421", applicant: "Rukhsana Bibi", chapter: "Lahore Central", category: "Education", amount: 60000, urgency: "Medium", daysPending: 4, status: "Pending" },
  { id: "CS-1422", applicant: "Abdul Rehman", chapter: "Islamabad", category: "Housing", amount: 320000, urgency: "High", daysPending: 8, status: "SLA Breach" },
  { id: "CS-1423", applicant: "Nadia Perveen", chapter: "Multan", category: "Medical", amount: 95000, urgency: "Low", daysPending: 1, status: "Pending" },
  { id: "CS-1424", applicant: "Tariq Mehmood", chapter: "Faisalabad", category: "Livelihood", amount: 140000, urgency: "Medium", daysPending: 5, status: "Pending" },
  { id: "CS-1425", applicant: "Sabra Khatoon", chapter: "Quetta", category: "Medical", amount: 210000, urgency: "High", daysPending: 3, status: "Pending" },
];

export const users = [
  { id: 1, name: "Dr. Ahsan Khan", role: "President", chapter: "Lahore Central", permission: "Full", lastActive: "2h ago" },
  { id: 2, name: "Fatima Zahra", role: "President", chapter: "Karachi South", permission: "Full", lastActive: "1h ago" },
  { id: 3, name: "Omar Farooq", role: "President", chapter: "Islamabad", permission: "Full", lastActive: "35m ago" },
  { id: 4, name: "Hina Sheikh", role: "Finance Head", chapter: "Lahore Central", permission: "Edit", lastActive: "20m ago" },
  { id: 5, name: "Kamran Ali", role: "Media Head", chapter: "Karachi South", permission: "Edit", lastActive: "3h ago" },
  { id: 6, name: "Sana Malik", role: "Vice President", chapter: "Peshawar", permission: "Full", lastActive: "5h ago" },
  { id: 7, name: "Bilal Ahmed", role: "President", chapter: "Quetta", permission: "Full", lastActive: "1d ago" },
  { id: 8, name: "Ayesha Noor", role: "President", chapter: "Multan", permission: "Full", lastActive: "3h ago" },
];

export const donationLedger = [
  { id: "D-9821", donor: "Anonymous", amount: 500000, chapter: "Karachi South", date: "2026-07-18", method: "Bank Transfer", campaign: "Ramzan Relief" },
  { id: "D-9822", donor: "Hassan Textiles", amount: 1200000, chapter: "Lahore Central", date: "2026-07-18", method: "Cheque", campaign: "Winter Fund" },
  { id: "D-9823", donor: "Fatima Group", amount: 300000, chapter: "Islamabad", date: "2026-07-17", method: "Online", campaign: "Education Fund" },
  { id: "D-9824", donor: "Anonymous", amount: 75000, chapter: "Multan", date: "2026-07-17", method: "Online", campaign: "General" },
  { id: "D-9825", donor: "Zubair & Co.", amount: 250000, chapter: "Faisalabad", date: "2026-07-16", method: "Bank Transfer", campaign: "Medical Aid" },
];

export const expenseApprovals = [
  { id: "EX-2201", chapter: "Karachi South", requested: "Fatima Zahra", amount: 480000, category: "Medical supplies", date: "2026-07-19" },
  { id: "EX-2202", chapter: "Lahore Central", requested: "Hina Sheikh", amount: 920000, category: "Winter blankets", date: "2026-07-18" },
  { id: "EX-2203", chapter: "Islamabad", requested: "Omar Farooq", amount: 260000, category: "Event logistics", date: "2026-07-18" },
];

export const boardMembers = [
  { id: 1, name: "Sheikh Abdul Qadir", role: "Chairman", term: "2024-2027", contact: "chairman@servehumanity.org" },
  { id: 2, name: "Dr. Ahsan Khan", role: "CEO", term: "2024-2027", contact: "ceo@servehumanity.org" },
  { id: 3, name: "Amina Rashid", role: "Treasurer", term: "2024-2026", contact: "treasurer@servehumanity.org" },
  { id: 4, name: "Yusuf Chaudhry", role: "Secretary", term: "2024-2026", contact: "secretary@servehumanity.org" },
  { id: 5, name: "Prof. Nasreen Butt", role: "Board Member", term: "2023-2026", contact: "n.butt@servehumanity.org" },
];

export const mediaQueue = [
  { id: "M-501", chapter: "Karachi South", title: "Ramzan Iftar Campaign Poster", type: "Graphic", submitted: "2h ago", status: "Pending" },
  { id: "M-502", chapter: "Lahore Central", title: "Volunteer Recruitment Video", type: "Video", submitted: "5h ago", status: "Pending" },
  { id: "M-503", chapter: "Islamabad", title: "Press Release - New School", type: "Press", submitted: "1d ago", status: "Revision" },
];

export const tasks = [
  { id: "T-1", title: "Approve Q3 budget for Lahore Central", stage: "todo", chapter: "Lahore Central", priority: "High" },
  { id: "T-2", title: "Review new chapter proposal: Hyderabad", stage: "todo", chapter: "Board", priority: "High" },
  { id: "T-3", title: "Sign-off on Ramzan campaign creatives", stage: "progress", chapter: "Media", priority: "Medium" },
  { id: "T-4", title: "Verify 12 medical cases", stage: "progress", chapter: "Multi", priority: "High" },
  { id: "T-5", title: "Board meeting minutes – July", stage: "review", chapter: "Governance", priority: "Medium" },
  { id: "T-6", title: "Publish quarterly transparency report", stage: "done", chapter: "Finance", priority: "Low" },
];

export const events = [
  { id: "E-1", title: "Ramzan Iftar Distribution", chapter: "Karachi South", date: "2026-08-02", status: "Approved" },
  { id: "E-2", title: "Free Medical Camp", chapter: "Lahore Central", date: "2026-08-07", status: "Approved" },
  { id: "E-3", title: "Winter Relief Drive Launch", chapter: "Peshawar", date: "2026-08-14", status: "Pending" },
  { id: "E-4", title: "Fundraising Gala", chapter: "Islamabad", date: "2026-08-22", status: "Pending" },
];

export function fmtPKR(n: number) {
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `PKR ${(n / 100_000).toFixed(2)} Lac`;
  return `PKR ${n.toLocaleString()}`;
}