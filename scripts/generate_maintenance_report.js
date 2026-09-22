const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const { 
  Document, Packer, Paragraph, TextRun, HeadingLevel 
} = require('docx');

const REPO_URL = "https://github.com/vixtor-e86/report-generator.git";
const BRANCH = "main";
const DATE = "September 22, 2026";

const ALL_MAINTENANCE_ITEMS = [
  {
    number: "1",
    title: "Authentic Reference Generation & Disclaimer Removal",
    description: "Removed the 'fictional references' disclaimer across the entire platform. Calibrated generation prompts and citation pipelines to construct authentic, verified academic references and bibliographies."
  },
  {
    number: "2",
    title: "Third-Party AI Shielding in Terms & Privacy Policies",
    description: "Scrubbed all third-party AI service provider disclosures and vendor names from Terms & Conditions and Privacy Policy pages to safeguard proprietary architecture and internal services."
  },
  {
    number: "3",
    title: "Template Access Governance (Standard vs. Premium)",
    description: "Removed the 'Advanced Template' button from the Standard template selection flow. Advanced template workflows are now exclusively reserved for Premium workspace users."
  },
  {
    number: "4",
    title: "Tiered Reference Format Access",
    description: "Free tier is restricted to APA, IEEE, and MLA citation styles. Other formats (Harvard, Chicago, Vancouver, etc.) are visible but locked with an upgrade banner prompting for Standard or Premium. Standard & Premium unlock the complete citation library."
  },
  {
    number: "5",
    title: "Department & University Tagging (Pharmacy Specifics)",
    description: "Added institutional qualification tags beside Pharmacy ('Pharmacy (specific university and specific department)') and added notifications in Standard and Free selection guiding users to the Premium workspace."
  },
  {
    number: "6",
    title: "Workspace Details & Citation Editing Locks",
    description: "Locked reference format editing in the Free tier workspace top bar; reference style editing is exclusive to Standard and Premium tiers. Resolved synchronization where edited references didn't take effect in project output."
  },
  {
    number: "7",
    title: "Interactive Markdown Guide for Workspace Chapter Editing",
    description: "Created a comprehensive in-app Markdown formatting reference guide inside the Chapter Edit section of the workspace, showing students how to format headings, bold text, equations, tables, and bullet lists."
  },
  {
    number: "8",
    title: "Print & PDF Page-Break Overflow Fix",
    description: "Resolved an issue where clicking the print button cut off the references and bibliography page at the end of the report, ensuring complete references print cleanly across pages without truncation."
  },
  {
    number: "9",
    title: "Features Comparison Table Update",
    description: "Updated the marketing features comparison table to showcase the expanded citation formats, advance templates, and tier differences."
  },
  {
    number: "10",
    title: "Premium Thesis Generation Calibration & Token Savings",
    description: "Added strict generation instructions and structure preservation for the Premium Thesis engine. Prevented runaway single-chapter generation (which previously spit out 6,000 words for one chapter and consumed excessive tokens), using balanced guidelines aligned with the Standard 5-template architecture while preserving thesis academic rigor."
  },
  {
    number: "11",
    title: "Plagiarism Checker Guardrails & Wallet Isolation",
    description: "Excluded bibliography and references from scan word counts; enforced a strict 10,000-word ceiling per project; removed the paste custom text and upload feature; completely verified that plagiarism audits do not deduct from the marketplace wallet balance."
  },
  {
    number: "12",
    title: "Presentation Slide Generator Calibration (Marketplace & Premium)",
    description: "Fixed the PowerPoint slide generator on both the Marketplace tools and Premium workspace to strictly obey the requested slide count (e.g. producing exactly 15 slides instead of 27) and fixed layout styling to prevent bullet points from overflowing the page bottom."
  },
  {
    number: "13",
    title: "NUC Accreditation Database Ingestion (20 Faculties & 344 Departments)",
    description: "Imported all 20 accredited faculties and 344 departments from the NUC document into /api/departments and JSON; dynamically connected into Onboarding, Free project creation, Standard project details, and Premium page description forms with case-insensitive pre-filling (template selection modals preserved)."
  },
  {
    number: "14",
    title: "Official Social Media Handles in Footers",
    description: "Added official interactive social icons and external links for Facebook, TikTok, and Instagram across both the main landing page footer and marketplace footer."
  },
  {
    number: "15",
    title: "Dashboard Live Market Floating Action Button ('Hire an Expert')",
    description: "Deployed a persistent floating action button and interactive modal inside the Dashboard's Live Market tab featuring 8 technical specializations (Journal publication, SPSS, Software dev, MATLAB, Proteus, Circuit design, AutoCAD, Hardware fabrication). Positioned at bottom-left to avoid obstructing the feedback modal, with clean top quick-contact cards for WhatsApp (08031797655) and Email (w33writelab@gmail.com)."
  },
  {
    number: "16",
    title: "International Multi-Currency Payments ($5 Standard / $20 Premium)",
    description: "Integrated international payments for Standard ($5) and Premium ($20) featuring automated USD card checkout via Squad and direct USDT (crypto) transfer with instant WhatsApp/Email verification; wallet funding left untouched."
  }
];

const ARCHITECTURE_SECTIONS = [
  {
    title: "Core API & Gateway Layer",
    directory: "src/app/api/",
    items: [
      { file: "squad/initialize & verify", role: "Payment Gateway", detail: "Multi-currency checkout initiation (NGN & USD), webhook verification, and subunit conversion (Kobo & Cents)." },
      { file: "departments/route.js", role: "Academic Directory", detail: "REST endpoint delivering all 20 NUC faculties and 344 accredited departments with search." },
      { file: "plagiarism/route.js", role: "Originality Scanner", detail: "Plagiarism analysis endpoint capped at 10,000 words per project with citation exclusion." },
      { file: "standard/generate & save-edit", role: "Report Engine", detail: "AI chapter drafting, section regeneration, improvement suggestions, and inline edits." },
      { file: "token-refill/route.js", role: "Quota Management", detail: "Token credit top-up and automated account balance replenishment." }
    ]
  },
  {
    title: "Marketplace Ecosystem",
    directory: "src/app/marketplace/",
    items: [
      { file: "projects/page.js", role: "Live Market Catalog", detail: "Real-time searchable catalog with faculty filters, blueprint cards, and ebook downloads." },
      { file: "layout.js", role: "Marketplace Root Wrapper", detail: "Session-protected layout providing authorization across external market routes." },
      { file: "tools/ (Suite)", role: "Academic Productivity Tools", detail: "Self-service utilities: SIWES generator, slide generator, code explainer, AI humanizer, reference finder." },
      { file: "seller-setup & dashboard", role: "Creator Hub", detail: "Seller accreditation onboarding, blueprint submission forms, sales analytics, and wallet payout system." }
    ]
  },
  {
    title: "Workspace & Generation Studios",
    directory: "src/app/",
    items: [
      { file: "premium/workspace", role: "Advanced Thesis Studio", detail: "Deep-research thesis & dissertation studio with real-time AI token tracking and export tools." },
      { file: "standard/[id]", role: "Standard Report Builder", detail: "5-chapter engineering report builder with in-line editing, suggestions, and preview." },
      { file: "onboarding & project/new", role: "Project Setup & Prefill", detail: "Dynamic university, faculty, and department matching forms with automatic pre-fill." },
      { file: "template-select", role: "Template Governance", detail: "Governed blueprint picker routing Standard and Premium users to appropriate templates." }
    ]
  },
  {
    title: "Component Design System",
    directory: "src/components/",
    items: [
      { file: "ManualPaymentModal.js", role: "Dual-Currency Checkout", detail: "Modal supporting Naira (₦5k/₦20k), International USD Cards ($5/$20 via Squad), and USDT crypto transfers." },
      { file: "marketplace/HireExpertFab.js", role: "Freelance Services Widget", detail: "Bottom-left floating action button on Dashboard Live Market with top WhatsApp & Email cards and 8 technical service specializations." },
      { file: "standard/ChapterEdit.js", role: "Markdown Syntax Guide", detail: "Built-in formatting cheat sheet modal for equations, headings, tables, and citations." },
      { file: "ReferenceInfoModal.js", role: "Citation Selector", detail: "Authentic academic reference format selector (APA, IEEE, MLA, Harvard, etc.)." },
      { file: "standard/FreeTopBar.js", role: "Tier Policy Enforcement", detail: "Locks reference style modifications on Free tier while maintaining Standard tier access." }
    ]
  },
  {
    title: "Data, Configuration & Database",
    directory: "src/data/, src/lib/, supabase/",
    items: [
      { file: "data/engineering-departments.json", role: "NUC Master Dataset", detail: "Structured master dataset of 20 Nigerian faculties and 344 accredited departments." },
      { file: "lib/pricing.js", role: "Pricing Configuration", detail: "Centralized pricing constants for NGN (₦5,000 / ₦20,000) and International USD ($5 / $20)." },
      { file: "supabase/migrations/", role: "Database Schemas", detail: "SQL migrations for wallet balances, seller payouts, referral commissions, and project locks." }
    ]
  }
];

// ======================== GENERATE PDF ========================
function generatePDF() {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);
  let y = 40;

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - 50) {
      doc.addPage();
      y = 45;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("W3 WriteLab — Platform Maintenance & Architecture Report", margin, 28);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 33, pageWidth - margin, 33);
    }
  }

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 75, 8, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("W3 WriteLab", margin + 20, y + 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Platform Maintenance & System Architecture Report", margin + 20, y + 49);

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Date: ${DATE}   |   Branch: ${BRANCH}   |   Status: Verified & Production Ready`, margin + 20, y + 64);

  y += 90;

  // Repository Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 36, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("GitHub Repository:", margin + 15, y + 22);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text(REPO_URL, margin + 120, y + 22);

  y += 55;

  // Section 1: Executive Maintenance Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Executive Maintenance & Feature Updates", margin, y);
  y += 6;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin + 270, y);
  y += 18;

  ALL_MAINTENANCE_ITEMS.forEach((item) => {
    checkPageBreak(50);

    // Number Badge + Title
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(margin, y, 18, 14, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(item.number, margin + 9, y + 10, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, margin + 26, y + 10);
    y += 18;

    // Description text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(item.description, contentWidth - 26);
    doc.text(lines, margin + 26, y);
    y += (lines.length * 11) + 10;
  });

  y += 15;
  checkPageBreak(80);

  // Section 2: Architecture & Component Directory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("2. System Architecture & Component Directory", margin, y);
  y += 6;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin + 280, y);
  y += 20;

  ARCHITECTURE_SECTIONS.forEach((sec) => {
    checkPageBreak(80);

    // Category Bar
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 22, 4, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(sec.title, margin + 10, y + 15);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    doc.text(`[${sec.directory}]`, pageWidth - margin - 10, y + 15, { align: 'right' });

    y += 28;

    sec.items.forEach((it) => {
      checkPageBreak(35);

      // Bullet dot
      doc.setFillColor(79, 70, 229);
      doc.circle(margin + 12, y + 3, 2.5, 'F');

      // File / Component name
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(it.file, margin + 22, y + 6);

      // Role tag
      const nameWidth = doc.getTextWidth(it.file);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229);
      doc.text(`(${it.role})`, margin + 26 + nameWidth, y + 6);

      y += 13;

      // Detail description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const detailLines = doc.splitTextToSize(it.detail, contentWidth - 22);
      doc.text(detailLines, margin + 22, y);
      y += (detailLines.length * 10) + 8;
    });

    y += 8;
  });

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("W3 WriteLab — Platform Maintenance & Architecture Report", margin, 28);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 33, pageWidth - margin, 33);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.text("W3 WriteLab Confidential", margin, pageHeight - 20);
    doc.text(DATE, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  const pdfOutput = doc.output('arraybuffer');
  const pdfPath = path.join(__dirname, '..', 'W3_WriteLab_Maintenance_Report.pdf');
  fs.writeFileSync(pdfPath, Buffer.from(pdfOutput));
  console.log(`PDF successfully generated: ${pdfPath}`);
}

// ======================== GENERATE DOCX ========================
async function generateDOCX() {
  const maintenanceParagraphs = [];
  ALL_MAINTENANCE_ITEMS.forEach(item => {
    maintenanceParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${item.number}. ${item.title}`, bold: true, size: 22, color: "0F172A" }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: item.description, size: 20, color: "475569" }),
        ],
      }),
      new Paragraph({ text: "" })
    );
  });

  const architectureParagraphs = [];
  ARCHITECTURE_SECTIONS.forEach(sec => {
    architectureParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: sec.title, bold: true, size: 22, color: "0F172A" }),
          new TextRun({ text: `   [${sec.directory}]`, font: "Courier New", color: "4F46E5", size: 18 }),
        ],
      })
    );

    sec.items.forEach(it => {
      architectureParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${it.file}`, font: "Courier New", bold: true, size: 19, color: "0F172A" }),
            new TextRun({ text: `  (${it.role})`, bold: true, size: 18, color: "4F46E5" }),
          ],
        }),
        new Paragraph({
          indent: { left: 400 },
          children: [
            new TextRun({ text: it.detail, size: 18, color: "475569" }),
          ],
        })
      );
    });

    architectureParagraphs.push(new Paragraph({ text: "" }));
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "W3 WriteLab",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Platform Maintenance & Architecture Report", bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Date: ${DATE} | Branch: ${BRANCH} | Status: Verified & Production Ready`, color: "64748B", size: 20 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `GitHub Repository: ${REPO_URL}`, bold: true, color: "4F46E5", size: 20 }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "1. Executive Maintenance & Feature Updates",
            heading: HeadingLevel.HEADING_2,
          }),
          ...maintenanceParagraphs,
          new Paragraph({
            text: "2. System Architecture & Component Directory",
            heading: HeadingLevel.HEADING_2,
          }),
          ...architectureParagraphs,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const docxPath = path.join(__dirname, '..', 'W3_WriteLab_Maintenance_Report.docx');
  fs.writeFileSync(docxPath, buffer);
  console.log(`DOCX successfully generated: ${docxPath}`);
}

async function run() {
  generatePDF();
  await generateDOCX();
}

run().catch(console.error);
