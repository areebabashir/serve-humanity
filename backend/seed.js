/**
 * Seed the database with sample data matching the dashboards.
 * Run once: npm run seed
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Chapter from "./models/Chapter.js";
import Member from "./models/Member.js";
import WelfareCase from "./models/WelfareCase.js";
import Donation from "./models/Donation.js";
import Expense from "./models/Expense.js";
import Event from "./models/Event.js";
import DocumentationFile from "./models/DocumentationFile.js";

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Chapter.deleteMany({}),
    Member.deleteMany({}),
    WelfareCase.deleteMany({}),
    Donation.deleteMany({}),
    Expense.deleteMany({}),
    Event.deleteMany({}),
    DocumentationFile.deleteMany({}),
  ]);

  console.log("Cleared existing data.");

  const password = await bcrypt.hash("Password123!", 12);

  // ── Org users (CEO dashboard) ─────────────────────────────────────────────
  const orgUsers = await User.insertMany([
    { name: "Dr. Ahsan Khan", email: "ceo@servehumanity.org", password, systemRole: "ceo", chapterRole: "member" },
    { name: "Amina Rashid", email: "bog.verification@servehumanity.org", password, systemRole: "bog_verification", chapterRole: "member" },
    { name: "Yusuf Chaudhry", email: "bog.operations@servehumanity.org", password, systemRole: "bog_operations", chapterRole: "member" },
    { name: "Prof. Nasreen Butt", email: "bog.media@servehumanity.org", password, systemRole: "bog_media", chapterRole: "member" },
    { name: "Sheikh Abdul Qadir", email: "bog.finance@servehumanity.org", password, systemRole: "bog_finance", chapterRole: "member" },
    { name: "Hina Sheikh", email: "bog.documentation@servehumanity.org", password, systemRole: "bog_documentation", chapterRole: "member" },

    // ── Chapter users (chapter dashboard) ───────────────────────────────────
    { name: "Ayesha Khan", email: "ayesha@sh.org", password, systemRole: "president", chapterRole: "president" },
    { name: "Bilal Ahmed", email: "bilal@sh.org", password, systemRole: "member", chapterRole: "vice_president" },
    { name: "Fatima Noor", email: "fatima@sh.org", password, systemRole: "member", chapterRole: "finance_head" },
    { name: "Hamza Iqbal", email: "hamza@sh.org", password, systemRole: "member", chapterRole: "operations_head" },
    { name: "Sana Riaz", email: "sana@sh.org", password, systemRole: "member", chapterRole: "verification_head" },
    { name: "Zara Malik", email: "zara@sh.org", password, systemRole: "member", chapterRole: "media_head" },
    { name: "Iqra Docs", email: "docs@sh.org", password, systemRole: "member", chapterRole: "documentation_head" },
    // Plain members (must pick a director team — seeded under Operations)
    { name: "Usman Tariq", email: "usman@sh.org", password, systemRole: "member", chapterRole: "member" },
    { name: "Rehan Shah", email: "rehan@sh.org", password, systemRole: "member", chapterRole: "member" },
    { name: "Kashif Aslam", email: "kashif@sh.org", password, systemRole: "member", chapterRole: "member" },
  ]);

  const ceoUser = orgUsers.find((u) => u.email === "ceo@servehumanity.org");
  const bogDocs = orgUsers.find((u) => u.email === "bog.documentation@servehumanity.org");
  const lahorePresident = orgUsers.find((u) => u.email === "ayesha@sh.org");

  console.log(`Created ${await User.countDocuments()} users.`);

  const chapters = await Chapter.insertMany([
    { name: "Lahore Central", city: "Lahore", president: lahorePresident._id, status: "active", established: new Date("2015-03-14"), monthlyBudget: 800000, budgetThreshold: 100000, memberCount: 16, fundsRaised: 12400000, casesClosed: 187, totalEvents: 34 },
    { name: "Karachi South", city: "Karachi", status: "active", established: new Date("2014-08-02"), monthlyBudget: 1000000, budgetThreshold: 100000, memberCount: 528, fundsRaised: 14800000, casesClosed: 221, totalEvents: 41 },
    { name: "Islamabad", city: "Islamabad", status: "active", established: new Date("2016-01-20"), monthlyBudget: 700000, budgetThreshold: 100000, memberCount: 306, fundsRaised: 9200000, casesClosed: 154, totalEvents: 28 },
    { name: "Peshawar", city: "Peshawar", status: "active", established: new Date("2017-06-11"), monthlyBudget: 500000, budgetThreshold: 100000, memberCount: 198, fundsRaised: 5400000, casesClosed: 96, totalEvents: 19 },
    { name: "Quetta", city: "Quetta", status: "active", established: new Date("2018-11-04"), monthlyBudget: 400000, budgetThreshold: 100000, memberCount: 142, fundsRaised: 3900000, casesClosed: 72, totalEvents: 14 },
    { name: "Multan", city: "Multan", status: "active", established: new Date("2016-09-18"), monthlyBudget: 600000, budgetThreshold: 100000, memberCount: 224, fundsRaised: 6100000, casesClosed: 118, totalEvents: 22 },
    { name: "Faisalabad", city: "Faisalabad", status: "active", established: new Date("2017-02-08"), monthlyBudget: 650000, budgetThreshold: 100000, memberCount: 267, fundsRaised: 7800000, casesClosed: 133, totalEvents: 25 },
    { name: "Rawalpindi", city: "Rawalpindi", status: "inactive", established: new Date("2019-04-30"), monthlyBudget: 400000, budgetThreshold: 100000, memberCount: 189, fundsRaised: 2100000, casesClosed: 58, totalEvents: 9 },
  ]);

  const lahoreChapter = chapters[0];
  // Assign all chapter dashboard users to Lahore Central
  const chapterUserEmails = [
    "ayesha@sh.org",
    "bilal@sh.org",
    "fatima@sh.org",
    "hamza@sh.org",
    "sana@sh.org",
    "usman@sh.org",
    "zara@sh.org",
    "rehan@sh.org",
    "kashif@sh.org",
    "docs@sh.org",
  ];
  await User.updateMany(
    { email: { $in: chapterUserEmails } },
    { $set: { chapter: lahoreChapter._id } },
  );

  const opsDirector = orgUsers.find((u) => u.email === "hamza@sh.org");
  await User.updateMany(
    { email: { $in: ["usman@sh.org", "rehan@sh.org", "kashif@sh.org"] } },
    { $set: { teamDirector: opsDirector._id } },
  );

  console.log(`Created ${chapters.length} chapters.`);

  const memberDefs = [
    { name: "Ayesha Khan", email: "ayesha@sh.org", role: "president", status: "active", attendance: 96, volunteerHours: 312 },
    { name: "Bilal Ahmed", email: "bilal@sh.org", role: "vice_president", status: "active", attendance: 91, volunteerHours: 244 },
    { name: "Fatima Noor", email: "fatima@sh.org", role: "finance_head", status: "active", attendance: 88, volunteerHours: 190 },
    { name: "Hamza Iqbal", email: "hamza@sh.org", role: "operations_head", status: "active", attendance: 84, volunteerHours: 178 },
    { name: "Sana Riaz", email: "sana@sh.org", role: "verification_head", status: "active", attendance: 92, volunteerHours: 205 },
    { name: "Zara Malik", email: "zara@sh.org", role: "media_head", status: "active", attendance: 86, volunteerHours: 160 },
    { name: "Iqra Docs", email: "docs@sh.org", role: "documentation_head", status: "active", attendance: 90, volunteerHours: 155 },
    { name: "Usman Tariq", email: "usman@sh.org", role: "member", status: "active", attendance: 79, volunteerHours: 142 },
    { name: "Rehan Shah", email: "rehan@sh.org", role: "member", status: "active", attendance: 90, volunteerHours: 155 },
    { name: "Kashif Aslam", email: "kashif@sh.org", role: "member", status: "active", attendance: 88, volunteerHours: 148 },
    { name: "Nadia Farooq", email: "nadia@sh.org", role: "member", status: "active", attendance: 74, volunteerHours: 88 },
    { name: "Omar Javed", email: "omar@sh.org", role: "member", status: "active", attendance: 68, volunteerHours: 62 },
    { name: "Hira Sultan", email: "hira@sh.org", role: "member", status: "active", attendance: 81, volunteerHours: 71 },
    { name: "Talha Munir", email: "talha@sh.org", role: "member", status: "active", attendance: 60, volunteerHours: 40 },
    { name: "Mariam Ali", email: "mariam@sh.org", role: "member", status: "pending", attendance: 0, volunteerHours: 0 },
    { name: "Faisal Raza", email: "faisal@sh.org", role: "member", status: "pending", attendance: 0, volunteerHours: 0 },
  ];

  await Member.insertMany(memberDefs.map((m) => ({ ...m, chapter: lahoreChapter._id, phone: "+92 300 0000000", avatarSeed: m.name.split(" ")[0] })));
  console.log(`Created ${memberDefs.length} members.`);

  await WelfareCase.insertMany([
    { caseId: "C-1042", applicant: "Amir Hussain", category: "Medical", amount: 85000, urgency: "high", status: "sent_to_ceo", chapter: lahoreChapter._id, submittedBy: lahorePresident._id, notes: [{ author: "Sana Riaz", text: "Hospital bill verified. Escalating to CEO for final approval." }] },
    { caseId: "C-1041", applicant: "Rukhsana Bibi", category: "Food", amount: 12000, urgency: "medium", status: "disbursed", chapter: lahoreChapter._id, submittedBy: lahorePresident._id, disbursedAt: new Date() },
    { caseId: "C-1040", applicant: "Ali Raza", category: "Education", amount: 32000, urgency: "medium", status: "approved", chapter: lahoreChapter._id, submittedBy: lahorePresident._id },
    { caseId: "C-1039", applicant: "Shazia Kausar", category: "Emergency", amount: 60000, urgency: "high", status: "under_review", chapter: lahoreChapter._id, submittedBy: lahorePresident._id },
    { caseId: "C-1038", applicant: "Junaid Latif", category: "Medical", amount: 45000, urgency: "medium", status: "submitted", chapter: lahoreChapter._id, submittedBy: lahorePresident._id },
  ]);
  console.log("Created welfare cases.");

  await Donation.insertMany([
    { donationId: "D-201", donor: "Hafiz Trust", amount: 250000, method: "Bank", campaign: "Ramadan Relief", cause: "General", chapter: lahoreChapter._id, donorEmail: "" },
    { donationId: "D-200", donor: "Anonymous", amount: 15000, method: "Cash", campaign: "General", cause: "Food", chapter: lahoreChapter._id },
    { donationId: "D-199", donor: "Zeeshan Corp", amount: 100000, method: "Online", campaign: "Winter Drive", cause: "Emergency", chapter: lahoreChapter._id },
    { donationId: "D-198", donor: "Sadia Khan", amount: 25000, method: "Online", campaign: "Medical Cases", cause: "Healthcare", chapter: lahoreChapter._id },
    { donationId: "D-197", donor: "Local Bakery", amount: 8000, method: "Cash", campaign: "General", cause: "Food", chapter: lahoreChapter._id },
    { donationId: "D-196", donor: "Ali Enterprises", amount: 60000, method: "Bank", campaign: "Education Fund", cause: "Education", chapter: lahoreChapter._id },
  ]);
  console.log("Created donations.");

  await Expense.insertMany([
    { expenseId: "E-88", title: "Medical bill - C-1041", amount: 12000, category: "Welfare", status: "approved", chapter: lahoreChapter._id, submittedBy: lahorePresident._id },
    { expenseId: "E-87", title: "Ration packs (100 units)", amount: 180000, category: "Relief", status: "sent_to_ceo", chapter: lahoreChapter._id, submittedBy: lahorePresident._id },
    { expenseId: "E-86", title: "Office rent - Nov", amount: 45000, category: "Operations", status: "approved", chapter: lahoreChapter._id, submittedBy: lahorePresident._id },
    { expenseId: "E-85", title: "Event catering", amount: 22000, category: "Events", status: "pending", chapter: lahoreChapter._id, submittedBy: lahorePresident._id },
  ]);
  console.log("Created expenses.");

  await Event.insertMany([
    { title: "Ramzan Iftar Distribution", date: new Date("2026-08-02"), chapter: lahoreChapter._id, organizer: lahorePresident._id, status: "Approved", expectedAttendees: 300, budget: 150000 },
    { title: "Free Medical Camp", date: new Date("2026-08-07"), chapter: lahoreChapter._id, organizer: lahorePresident._id, status: "Approved", expectedAttendees: 500, budget: 200000 },
    { title: "Winter Relief Drive Launch", date: new Date("2026-08-14"), chapter: chapters[3]._id, organizer: ceoUser._id, status: "Pending", expectedAttendees: 200, budget: 100000 },
    { title: "Fundraising Gala", date: new Date("2026-08-22"), chapter: chapters[2]._id, organizer: ceoUser._id, status: "Pending", expectedAttendees: 400, budget: 500000 },
  ]);
  console.log("Created events.");

  // ── Documentation samples (all chapters visible to BOG Documentation) ─────
  const docAuthor = bogDocs._id;
  await DocumentationFile.insertMany([
    {
      type: "health",
      title: "H-2401 Medical Assistance",
      caseNumber: "H-2401",
      chapter: lahoreChapter._id,
      status: "submitted",
      fields: {
        caseTypeLabel: "Health",
        ref1Name: "Imran Ali",
        ref1Contact: "+92 300 1112233",
        ref2Name: "Sana Bibi",
        ref2Contact: "+92 301 2223344",
        paymentReceiverName: "Amir Hussain",
        paymentDate: "2026-07-10",
        paymentMode: "Online",
        amount: 85000,
        incomeProofNote: "Daily wage labourer, ~PKR 25k/month",
      },
      notes: "Hospital bill verified by chapter verification head.",
      createdBy: docAuthor,
      updatedBy: docAuthor,
    },
    {
      type: "marriage",
      title: "M-118 Orphan Marriage",
      caseNumber: "M-118",
      chapter: chapters[1]._id,
      status: "submitted",
      fields: {
        caseTypeLabel: "Marriage",
        ref1Name: "Fatima Zahra",
        ref1Contact: "+92 321 5556677",
        paymentReceiverName: "Guardian of bride",
        paymentDate: "2026-06-20",
        paymentMode: "Cash",
        amount: 120000,
      },
      notes: "Karachi South chapter marriage support.",
      createdBy: docAuthor,
      updatedBy: docAuthor,
    },
    {
      type: "fee",
      title: "F-55 Student Fee",
      caseNumber: "F-55",
      chapter: lahoreChapter._id,
      status: "draft",
      fields: {
        caseTypeLabel: "Fee",
        ref1Name: "Omar Javed",
        ref1Contact: "+92 333 4445566",
        paymentReceiverName: "University Accounts",
        paymentDate: "2026-07-01",
        paymentMode: "Online",
        amount: 45000,
      },
      createdBy: docAuthor,
      updatedBy: docAuthor,
    },
    {
      type: "ration",
      title: "R-902 Ration Support",
      caseNumber: "R-902",
      chapter: chapters[2]._id,
      status: "submitted",
      fields: {
        caseTypeLabel: "Ration",
        ref1Name: "Local Masjid Committee",
        ref1Contact: "+92 51 1112233",
        paymentReceiverName: "Family head",
        paymentDate: "2026-07-05",
        paymentMode: "Cash",
        amount: 15000,
      },
      createdBy: docAuthor,
      updatedBy: docAuthor,
    },
    {
      type: "monthly_report",
      title: "July 2026 Monthly Report — Lahore",
      caseNumber: "MR-2026-07-LHR",
      chapter: lahoreChapter._id,
      status: "submitted",
      fields: {
        month: "July",
        year: 2026,
        caseNumbers: "H-2401, F-55, R-880",
        totalCases: 3,
        totalAmount: 145000,
        driveDetails: "Winter prep drive advance PKR 20,000",
      },
      notes: "Includes one drive advance.",
      createdBy: docAuthor,
      updatedBy: docAuthor,
    },
    {
      type: "ration_file",
      title: "RF-301",
      caseNumber: "RF-301",
      chapter: chapters[1]._id,
      status: "submitted",
      fields: {
        month: "July",
        year: 2026,
        rationCaseNumber: "RF-301",
        transferAmount: 18000,
        paymentMethod: "Online",
        paymentDate: "2026-07-12",
        referenceName: "Chapter Media Head",
        receiverName: "Rukhsana Bibi",
        phone: "+92 300 9998877",
        accountNo: "PK00XXXX1234",
      },
      createdBy: docAuthor,
      updatedBy: docAuthor,
    },
    {
      type: "drive",
      title: "Winter Uniform Drive 2026",
      caseNumber: "DRV-WIN-26",
      chapter: lahoreChapter._id,
      status: "submitted",
      fields: {
        driveName: "Winter Uniform Drive",
        driveType: "Winter Drive",
        driveDate: "2026-08-14",
        totalExpense: 250000,
        expenseDetails: "Blankets PKR 150k; Uniforms PKR 100k",
      },
      createdBy: docAuthor,
      updatedBy: docAuthor,
    },
    {
      type: "stat",
      title: "H1 2026 Stats — Org",
      caseNumber: "STAT-2026-H1",
      chapter: null,
      status: "reviewed",
      fields: {
        periodLabel: "2026-H1",
        emergencyHealthCount: 42,
        emergencyHealthAmount: 3200000,
        studentFeesCount: 18,
        studentFeesAmount: 890000,
        winterDriveCount: 1,
        winterDriveAmount: 250000,
        totalCasesExceptMonthlyRashan: 120,
        totalDrives: 4,
        campsCount: 2,
        overallCasesPlusDrives: 126,
        totalAmountTransferred: 8500000,
      },
      createdBy: docAuthor,
      updatedBy: docAuthor,
    },
    {
      type: "reference",
      title: "REF-77 Community Elder",
      caseNumber: "REF-77",
      chapter: lahoreChapter._id,
      status: "submitted",
      fields: {
        referenceNumber: "REF-77",
        description: "Long-time community elder referring medical cases in Gulberg area.",
        date: "2026-05-01",
      },
      createdBy: docAuthor,
      updatedBy: docAuthor,
    },
  ]);
  console.log(`Created ${await DocumentationFile.countDocuments()} documentation files.`);

  console.log("\n✅  Seed complete!");
  console.log("\nCEO / BOG dashboard (password: Password123!):");
  console.log("  CEO              → ceo@servehumanity.org");
  console.log("  BOG Verification → bog.verification@servehumanity.org");
  console.log("  BOG Operations   → bog.operations@servehumanity.org");
  console.log("  BOG Media        → bog.media@servehumanity.org");
  console.log("  BOG Finance      → bog.finance@servehumanity.org");
  console.log("  BOG Documentation→ bog.documentation@servehumanity.org");
  console.log("\nChapter dashboard:");
  console.log("  President        → ayesha@sh.org");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
