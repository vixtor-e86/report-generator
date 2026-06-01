// src/app/api/premium/export/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { PDFDocument } from 'pdf-lib';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  ImageRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle,
  LevelFormat,
  PageBreak,
  VerticalAlign,
  ShadingType
} from 'docx';

const ABSTRACT_PROMPT = "You are an academic engineering researcher. Generate a professional Abstract. Project Content: ";

// --- Shared Engineering Parsers ---
function parseMathematicalText(text) {
  if (!text) return "";
  return text
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
    .replace(/\$\$/g, '').replace(/\$/g, '')
    .replace(/\\pi/g, 'π').replace(/\\theta/g, 'θ').replace(/\\omega/g, 'ω')
    .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β')
    .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈').replace(/\\neq/g, '≠')
    .replace(/\\degree/g, '°');
}

function cleanMarkdownStrict(text) {
  if (!text) return "";
  return text
    .replace(/^#+\s+/gm, '') 
    .replace(/\*\*(.*?)\*\*/g, '$1') 
    .replace(/\*(.*?)\*/g, '$1')     
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}.*?`{1,3}/g, '') 
    .trim();
}

function parseTechnicalText(text) {
  const t = parseMathematicalText(text);
  return cleanMarkdownStrict(t);
}

function parseInlineFormatting(text, fontSize = 24, isBold = false) {
  const processedText = parseTechnicalText(text);
  const textRuns = [];
  let currentIndex = 0;
  const formatRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let match;
  while ((match = formatRegex.exec(processedText)) !== null) {
    if (match.index > currentIndex) {
      textRuns.push(new TextRun({ text: processedText.substring(currentIndex, match.index), font: 'Times New Roman', size: fontSize, bold: isBold }));
    }
    if (match[2]) textRuns.push(new TextRun({ text: match[2], bold: true, font: 'Times New Roman', size: fontSize }));
    else if (match[4]) textRuns.push(new TextRun({ text: match[4], italics: true, font: 'Times New Roman', size: fontSize, bold: isBold }));
    currentIndex = match.index + match[0].length;
  }
  if (currentIndex < processedText.length) {
    textRuns.push(new TextRun({ text: processedText.substring(currentIndex), font: 'Times New Roman', size: fontSize, bold: isBold }));
  }
  return textRuns.length > 0 ? textRuns : [new TextRun({ text: processedText, font: 'Times New Roman', size: fontSize, bold: isBold })];
}

// --- DOCX PRELIMINARY PAGES HELPERS ---
function createDocxCover(metadata) {
    return [
        new Paragraph({ children: [new TextRun({ text: metadata.university.toUpperCase(), bold: true, size: 32, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 800 } }),
        new Paragraph({ children: [new TextRun({ text: (metadata.faculty || "").toUpperCase(), bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: (metadata.department || "").toUpperCase(), bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 1200 } }),
        new Paragraph({ children: [new TextRun({ text: (metadata.projectTitle || "").toUpperCase(), bold: true, size: 36, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 1200 } }),
        new Paragraph({ children: [new TextRun({ text: "BY", bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: (metadata.studentName || "").toUpperCase(), bold: true, size: 32, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: metadata.matricNo, bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 1200 } }),
        new Paragraph({ children: [new TextRun({ text: `A PROJECT SUBMITTED TO THE DEPARTMENT OF ${metadata.department.toUpperCase()}, ${metadata.university.toUpperCase()}, IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF BACHELOR OF SCIENCE (B.Sc.) DEGREE IN ${metadata.department.toUpperCase()}.`, size: 24, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 800 } }),
        new Paragraph({ children: [new TextRun({ text: `SUPERVISED BY: ${metadata.supervisor.toUpperCase()}`, bold: true, size: 24, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: metadata.session, bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: metadata.date.toUpperCase(), bold: true, size: 24, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })
    ];
}

function createDocxDeclaration(metadata) {
    return [
        new Paragraph({ text: 'DECLARATION', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 800 } }),
        new Paragraph({ children: [new TextRun({ text: `I, ${metadata.studentName.toUpperCase()}, do hereby declare that this project is entirely my work and composition. The work embodied in this project has not been submitted in candidature for any degree and is not concurrently being submitted for any other degree. All references made to the works of other people have been duly acknowledged.`, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 1200 } }),
        new Paragraph({ children: [new TextRun({ text: "NAME OF STUDENT: _________________________________", font: 'Times New Roman', size: 24 })], spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: "SIGNATURE: _______________________________________", font: 'Times New Roman', size: 24 })], spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: `DATE: ____________________________________________`, font: 'Times New Roman', size: 24 })] })
    ];
}

function createDocxCertification(metadata) {
    return [
        new Paragraph({ text: 'CERTIFICATION', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 800 } }),
        new Paragraph({ children: [new TextRun({ text: `This is to certify that the research work was carried out by ${metadata.studentName.toUpperCase()} in the Department of ${metadata.department.toUpperCase()}, ${metadata.faculty.toUpperCase()}, ${metadata.university.toUpperCase()}. The research work is considered adequate in partial fulfillment of the requirements for the award of B.Sc. in ${metadata.department.toUpperCase()}.`, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 1200 } }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: BorderStyle.NONE,
            rows: [
                new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: metadata.supervisor, bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }), new Paragraph({ text: "Project Supervisor", alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } }),
                    new TableCell({ children: [new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Date", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } })
                ] }),
                new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ text: "", spacing: { before: 800 } }), new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: metadata.hod, bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }), new Paragraph({ text: "Head of Department", alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } }),
                    new TableCell({ children: [new Paragraph({ text: "", spacing: { before: 800 } }), new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Date", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } })
                ] }),
                new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ text: "", spacing: { before: 800 } }), new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: metadata.externalExaminer || "External Examiner", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }), new Paragraph({ text: "External Examiner", alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } }),
                    new TableCell({ children: [new Paragraph({ text: "", spacing: { before: 800 } }), new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Date", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } })
                ] })
            ]
        })
    ];
}

// --- PDF PRELIMINARY PAGES HELPERS ---
function drawPdfCover(pdf, metadata) {
    pdf.setFont("times", "bold"); pdf.setFontSize(22); pdf.text(metadata.university.toUpperCase(), 105, 40, { align: 'center' });
    pdf.setFontSize(16); pdf.text((metadata.faculty || "").toUpperCase(), 105, 55, { align: 'center' });
    pdf.text((metadata.department || "").toUpperCase(), 105, 65, { align: 'center' });
    
    pdf.setFontSize(24); const title = pdf.splitTextToSize((metadata.projectTitle || "").toUpperCase(), 160);
    pdf.text(title, 105, 100, { align: 'center' });
    
    pdf.setFontSize(16); pdf.text("BY", 105, 140, { align: 'center' });
    pdf.setFontSize(20); pdf.text((metadata.studentName || "").toUpperCase(), 105, 155, { align: 'center' });
    pdf.setFontSize(16); pdf.text(metadata.matricNo, 105, 165, { align: 'center' });
    
    pdf.setFont("times", "normal"); pdf.setFontSize(12);
    const subText = `A PROJECT SUBMITTED TO THE DEPARTMENT OF ${metadata.department.toUpperCase()}, ${metadata.university.toUpperCase()}, IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF BACHELOR OF SCIENCE (B.Sc.) DEGREE IN ${metadata.department.toUpperCase()}.`;
    pdf.text(pdf.splitTextToSize(subText, 160), 105, 190, { align: 'center' });
    
    pdf.setFont("times", "bold"); pdf.text(`SUPERVISED BY: ${metadata.supervisor.toUpperCase()}`, 105, 230, { align: 'center' });
    pdf.setFontSize(16); pdf.text(metadata.session, 105, 250, { align: 'center' });
    pdf.setFontSize(14); pdf.text(metadata.date.toUpperCase(), 105, 265, { align: 'center' });
}

function drawPdfDeclaration(pdf, metadata) {
    pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("DECLARATION", 105, 40, { align: 'center' });
    pdf.setFont("times", "normal"); pdf.setFontSize(12);
    const decText = `I, ${metadata.studentName.toUpperCase()}, do hereby declare that this project is entirely my work and composition. The work embodied in this project has not been submitted in candidature for any degree and is not concurrently being submitted for any other degree. All references made to the works of other people have been duly acknowledged.`;
    pdf.text(pdf.splitTextToSize(decText, 170), 20, 70, { align: 'justify' });
    
    pdf.text("NAME OF STUDENT: _________________________________", 20, 120);
    pdf.text("SIGNATURE: _______________________________________", 20, 140);
    pdf.text(`DATE: ____________________________________________`, 20, 160);
}

function drawPdfCertification(pdf, metadata) {
    pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("CERTIFICATION", 105, 40, { align: 'center' });
    pdf.setFont("times", "normal"); pdf.setFontSize(12);
    const certText = `This is to certify that the research work was carried out by ${metadata.studentName.toUpperCase()} in the Department of ${metadata.department.toUpperCase()}, ${metadata.faculty.toUpperCase()}, ${metadata.university.toUpperCase()}. The research work is considered adequate in partial fulfillment of the requirements for the award of B.Sc. in ${metadata.department.toUpperCase()}.`;
    pdf.text(pdf.splitTextToSize(certText, 170), 20, 70, { align: 'justify' });
    
    const sy = 120;
    pdf.text("__________________________", 20, sy); pdf.setFont("times", "bold"); pdf.text(metadata.supervisor, 20, sy + 7); pdf.setFont("times", "normal"); pdf.text("Project Supervisor", 20, sy + 14);
    pdf.text("__________________________", 130, sy); pdf.setFont("times", "bold"); pdf.text("Date", 130, sy + 7);
    
    const hy = 160;
    pdf.setFont("times", "normal"); pdf.text("__________________________", 20, hy); pdf.setFont("times", "bold"); pdf.text(metadata.hod, 20, hy + 7); pdf.setFont("times", "normal"); pdf.text("Head of Department", 20, hy + 14);
    pdf.text("__________________________", 130, hy); pdf.setFont("times", "bold"); pdf.text("Date", 130, hy + 7);
    
    const ey = 200;
    pdf.setFont("times", "normal"); pdf.text("__________________________", 20, ey); pdf.setFont("times", "bold"); pdf.text(metadata.externalExaminer || "External Examiner", 20, ey + 7); pdf.setFont("times", "normal"); pdf.text("External Examiner", 20, ey + 14);
    pdf.text("__________________________", 130, ey); pdf.setFont("times", "bold"); pdf.text("Date", 130, ey + 7);
}

// --- NEW: Reference Extractor Logic ---
function extractMasterReferences(chapters, dbReferences) {
  const masterMap = new Map(); // Key: Normalized title, Value: Original formatted text
  
  const normalize = (text) => {
    if (!text) return "";
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  };

  if (dbReferences) {
    dbReferences.forEach(r => {
      const auths = Array.isArray(r.authors) ? r.authors.join(', ') : (r.authors || 'Unknown');
      const refText = `${auths} (${r.year}). "${r.title}". ${r.venue || 'Research Journal'}.`;
      const key = normalize(r.title);
      if (key && !masterMap.has(key)) masterMap.set(key, refText.trim());
    });
  }

  chapters.forEach(ch => {
    const content = ch.content || "";
    const parts = content.split(/## References|### References/i);
    if (parts.length > 1) {
      const refSection = parts[parts.length - 1].trim();
      const lines = refSection.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        const cleaned = trimmed.replace(/^(\[?\d+\]?\.?|\-|\*)\s+/, '').trim();
        if (cleaned.length > 30) {
          const titleMatch = cleaned.match(/"(.*?)"/) || cleaned.match(/\)\.\s+(.*?)\./);
          const titleKey = titleMatch ? normalize(titleMatch[1]) : normalize(cleaned.substring(0, 100));
          if (titleKey && !masterMap.has(titleKey)) masterMap.set(titleKey, cleaned);
        }
      });
    }
  });

  return Array.from(masterMap.values()).sort();
}

export async function POST(request) {
  try {
    const { projectId, userId, type, orderedDocIds, options } = await request.json();
    if (!projectId || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*, custom_templates(*)').eq('id', projectId).single();
    const { data: chapters } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).order('chapter_number', { ascending: true });
    
    const { data: dbReferences } = await supabaseAdmin.from('premium_research_papers').select('*').eq('project_id', projectId).order('created_at', { ascending: true });

    const finalMasterReferences = extractMasterReferences(chapters, dbReferences);
    const { data: assets } = await supabaseAdmin.from('premium_assets').select('*').eq('project_id', projectId);

    const imageMap = {};
    if (assets) {
      const images = assets.filter(a => a.file_type.startsWith('image/'));
      await Promise.all(images.map(async (img) => {
        try {
          const res = await fetch(img.file_url);
          imageMap[img.id] = Buffer.from(await res.arrayBuffer());
        } catch (e) {}
      }));
    }

    let abstract = "";
    if (options.includeAbstract) {
      const context = chapters.map(c => "Chapter " + c.chapter_number + ": " + c.title + "\n" + (c.content || "").substring(0, 800)).join("\n\n");
      const aiRes = await callAI(ABSTRACT_PROMPT + context, { provider: process.env.AI_PROVIDER || 'gemini', model: process.env.AI_MODEL, maxTokens: 1000, temperature: 0.3 });
      abstract = aiRes.content;
    }

    let finalBuffer;
    let contentType;
    const fileName = "exports/" + projectId + "/Project_Report_" + Date.now() + "." + type;

    if (type === 'docx') {
      const docSections = [];
      const numbering = { config: [{ reference: "numeric-list", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT }] }, { reference: "bullet-list", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT }] }] };

      // 1. Cover
      if (options.coverConfig.type === 'form') {
        docSections.push({ children: createDocxCover(options.metadata) });
      } else if ((options.coverConfig.type === 'asset' || options.coverConfig.type === 'upload')) {
          const imgUrl = options.coverConfig.type === 'asset' ? options.coverConfig.assetUrl : options.coverConfig.uploadUrl;
          if (imgUrl) {
            try {
                const imgData = options.coverConfig.type === 'asset' ? imageMap[options.coverConfig.assetId] : Buffer.from(imgUrl.split(',')[1], 'base64');
                docSections.push({ children: [new Paragraph({ children: [new ImageRun({ data: imgData, transformation: { width: 600, height: 840 } })], alignment: AlignmentType.CENTER })] });
            } catch (e) {}
          }
      }

      // 2. Technical Pages
      if (options.coverConfig.type === 'form') {
          if (options.coverConfig.includeDeclaration) docSections.push({ children: createDocxDeclaration(options.metadata) });
          if (options.coverConfig.includeCertification) docSections.push({ children: createDocxCertification(options.metadata) });
          if (options.coverConfig.includeDedication && options.metadata.dedication) {
            docSections.push({ children: [new Paragraph({ text: 'DEDICATION', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 800 } }), new Paragraph({ children: [new TextRun({ text: options.metadata.dedication, font: 'Times New Roman', size: 24, italics: true })], alignment: AlignmentType.CENTER })] });
          }
          if (options.coverConfig.includeAcknowledgement && options.metadata.acknowledgement) {
            docSections.push({ children: [new Paragraph({ text: 'ACKNOWLEDGEMENT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 800 } }), new Paragraph({ children: [new TextRun({ text: options.metadata.acknowledgement, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED })] });
          }
      }

      // 3. Abstract
      if (abstract) {
        docSections.push({ children: [new Paragraph({ text: 'ABSTRACT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }), new Paragraph({ children: [new TextRun({ text: parseTechnicalText(abstract), font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED })] });
      }

      // 4. TOC
      if (options.includeTOC && project.custom_templates) {
        const tocItems = [new Paragraph({ text: 'TABLE OF CONTENTS', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } })];
        project.custom_templates.structure.chapters.forEach(ch => {
          const chNum = ch.chapter || ch.number || ch.id;
          tocItems.push(new Paragraph({ children: [new TextRun({ text: `Chapter ${chNum}: ${ch.title}`, bold: true, size: 24, font: 'Times New Roman' })], spacing: { before: 200 } }));
          ch.sections?.filter(s => s && s.trim()).forEach(s => tocItems.push(new Paragraph({ text: s, indent: { left: 720 }, spacing: { before: 100 } })));
        });
        docSections.push({ children: tocItems });
      }

      // 5. Chapters
      for (const ch of chapters) {
        const chapterChildren = [
          new Paragraph({ children: [new TextRun({ text: `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`, font: 'Times New Roman', size: 32, bold: true })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } })
        ];

        const contentBody = (ch.content || "").split(/### References|## References/i)[0];
        const rawLines = contentBody.split('\n');
        const filteredLines = rawLines.filter((line, index) => {
          const t = line.trim().toUpperCase();
          if (!t) return true;
          const isTitle = t === `CHAPTER ${ch.chapter_number}` || t === ch.title.toUpperCase() || t === `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`;
          if (index < 5 && isTitle) return false;
          if (line.startsWith('#')) {
            const clean = line.replace(/^#+\s+/, '').toUpperCase();
            if (clean === `CHAPTER ${ch.chapter_number}` || clean === ch.title.toUpperCase() || clean === `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`) return false;
          }
          return true;
        });

        for (let i = 0; i < filteredLines.length; i++) {
          const line = filteredLines[i].trim(); if (!line) continue;
          if (line.startsWith('|')) {
            const tableRows = []; let j = i; let rowCount = 0;
            while (j < filteredLines.length && filteredLines[j].trim().startsWith('|')) {
              const r = filteredLines[j].trim();
              if (!r.includes('---')) {
                const isHeader = rowCount === 0;
                const cells = r.split('|').slice(1, -1).map(c => new TableCell({ 
                  children: [new Paragraph({ children: parseInlineFormatting(c.trim() || "\u00A0", isHeader ? 22 : 20, isHeader), alignment: AlignmentType.CENTER })], 
                  borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
                  shading: isHeader ? { fill: "F3F4F6", type: ShadingType.CLEAR } : undefined,
                  verticalAlign: VerticalAlign.CENTER
                }));
                tableRows.push(new TableRow({ children: cells, tableHeader: isHeader }));
                rowCount++;
              }
              j++;
            }
            chapterChildren.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            chapterChildren.push(new Paragraph({ text: "" })); i = j - 1; continue;
          }

          const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
          if (imgMatch) {
            const asset = assets.find(a => a.file_url === imgMatch[1]);
            if (asset && imageMap[asset.id]) {
              chapterChildren.push(new Paragraph({ children: [new ImageRun({ data: imageMap[asset.id], transformation: { width: 500, height: 350 } })], alignment: AlignmentType.CENTER }));
              chapterChildren.push(new Paragraph({ children: [new TextRun({ text: `Figure: ${asset.caption || asset.original_name}`, italics: true, size: 20, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }));
              continue;
            }
          }

          if (line.startsWith('## ') || line.startsWith('### ')) {
            const cleanText = line.replace(/^#+\s+/, '');
            chapterChildren.push(new Paragraph({ children: [new TextRun({ text: cleanText, font: 'Times New Roman', size: 28, bold: true })], heading: HeadingLevel.HEADING_2, alignment: AlignmentType.LEFT, spacing: { before: 200, after: 200 } }));
          } else if (line.startsWith('#### ')) {
            chapterChildren.push(new Paragraph({ children: [new TextRun({ text: line.replace('#### ', ''), font: 'Times New Roman', size: 24, bold: true })], heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 150 } }));
          } else if (/^\d+\.\s/.test(line)) {
            chapterChildren.push(new Paragraph({ children: parseInlineFormatting(line.replace(/^\d+\.\s/, ''), 24), numbering: { reference: "numeric-list", level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 360 } }));
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            chapterChildren.push(new Paragraph({ children: parseInlineFormatting(line.substring(2), 24), numbering: { reference: "bullet-list", level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 360 } }));
          } else {
            chapterChildren.push(new Paragraph({ children: parseInlineFormatting(line), alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 360 } }));
          }
        }
        docSections.push({ children: chapterChildren });
      }
      
      if (finalMasterReferences.length > 0) {
        docSections.push({ children: [
          new Paragraph({ text: 'REFERENCES', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }), 
          ...finalMasterReferences.map((ref, i) => new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${ref}`, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 150 } }))
        ] });
      }

      finalBuffer = await Packer.toBuffer(new Document({ sections: docSections, numbering }));
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let currPage = 1;
      const footer = () => { if (options.includePageNumbers) { pdf.setFont("times", "normal"); pdf.setFontSize(10); pdf.setTextColor(150, 150, 150); pdf.text("Page " + currPage, 105, 285, { align: 'center' }); pdf.setTextColor(0, 0, 0); } };
      
      // 1. Cover
      if (options.coverConfig.type === 'form') {
        drawPdfCover(pdf, options.metadata);
        footer(); pdf.addPage(); currPage++;
        if (options.coverConfig.includeDeclaration) { drawPdfDeclaration(pdf, options.metadata); footer(); pdf.addPage(); currPage++; }
        if (options.coverConfig.includeCertification) { drawPdfCertification(pdf, options.metadata); footer(); pdf.addPage(); currPage++; }
        if (options.coverConfig.includeDedication && options.metadata.dedication) {
            pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("DEDICATION", 105, 40, { align: 'center' });
            pdf.setFont("times", "italic"); pdf.setFontSize(12); pdf.text(pdf.splitTextToSize(options.metadata.dedication, 160), 105, 70, { align: 'center' });
            footer(); pdf.addPage(); currPage++;
        }
        if (options.coverConfig.includeAcknowledgement && options.metadata.acknowledgement) {
            pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("ACKNOWLEDGEMENT", 105, 40, { align: 'center' });
            pdf.setFont("times", "normal"); pdf.setFontSize(12); pdf.text(pdf.splitTextToSize(options.metadata.acknowledgement, 170), 20, 70, { align: 'justify' });
            footer(); pdf.addPage(); currPage++;
        }
      } else if (options.coverConfig.type === 'asset' || options.coverConfig.type === 'upload') {
        const imgUrl = options.coverConfig.type === 'asset' ? options.coverConfig.assetUrl : options.coverConfig.uploadUrl;
        if (imgUrl) { try { pdf.addImage(imgUrl, 'JPEG', 0, 0, 210, 297); footer(); pdf.addPage(); currPage++; } catch (e) {} }
      }

      // 2. Abstract
      if (abstract) {
        pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("ABSTRACT", 105, 40, { align: 'center' });
        pdf.setFont("times", "normal"); pdf.setFontSize(12); pdf.text(pdf.splitTextToSize(parseTechnicalText(abstract), 170), 20, 60, { align: 'justify' });
        footer(); pdf.addPage(); currPage++;
      }

      // 3. TOC
      if (options.includeTOC && project.custom_templates) {
        pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("TABLE OF CONTENTS", 20, 40);
        pdf.setFontSize(12); let ty = 60;
        project.custom_templates.structure.chapters.forEach(ch => {
          if (ty > 270) { footer(); pdf.addPage(); currPage++; ty = 30; }
          const chNum = ch.chapter || ch.number || ch.id;
          pdf.setFont("times", "bold"); pdf.text(`Chapter ${chNum}: ${ch.title}`, 20, ty); ty += 8;
          pdf.setFont("times", "normal"); ch.sections?.filter(s => s && s.trim()).slice(0,5).forEach(s => { pdf.text("- " + s, 30, ty); ty += 6; }); ty += 4;
        });
        footer(); pdf.addPage(); currPage++;
      }

      // 4. Chapters
      for (const ch of chapters) {
        pdf.setFont("times", "bold"); pdf.setFontSize(22); pdf.text(`CHAPTER ${ch.chapter_number}: ${(ch.title || "").toUpperCase()}`, 105, 30, { align: 'center' });
        pdf.setFont("times", "normal"); pdf.setFontSize(12);
        
        const rawLines = (ch.content || "").split(/### References|## References/i)[0].split('\n');
        const filteredLines = rawLines.filter((line, index) => {
          const t = line.trim().toUpperCase(); if (!t) return true;
          const isTitle = t === `CHAPTER ${ch.chapter_number}` || t === ch.title.toUpperCase() || t === `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`;
          if (index < 5 && isTitle) return false;
          if (line.startsWith('#')) {
            const clean = line.replace(/^#+\s+/, '').toUpperCase();
            if (clean === `CHAPTER ${ch.chapter_number}` || clean === ch.title.toUpperCase() || clean === `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`) return false;
          }
          return true;
        });

        let y = 45;
        for (let i = 0; i < filteredLines.length; i++) {
          const line = filteredLines[i].trim(); if (!line) continue;
          if (line.startsWith('## ') || line.startsWith('### ')) {
            pdf.setFont("times", "bold"); pdf.setFontSize(15);
            if (y > 270) { footer(); pdf.addPage(); currPage++; y = 30; }
            pdf.text(line.replace(/^#+\s+/, ''), 20, y); y += 10;
            pdf.setFont("times", "normal"); pdf.setFontSize(12); continue;
          }
          if (line.startsWith('#### ')) {
            pdf.setFont("times", "bold"); pdf.setFontSize(12);
            if (y > 270) { footer(); pdf.addPage(); currPage++; y = 30; }
            pdf.text(line.replace('#### ', ''), 20, y); y += 8;
            pdf.setFont("times", "normal"); pdf.setFontSize(12); continue;
          }
          if (line.startsWith('|')) {
            const rows = []; let j = i;
            while (j < filteredLines.length && filteredLines[j].trim().startsWith('|')) {
              const r = filteredLines[j].trim();
              if (!r.includes('---')) rows.push(r.split('|').slice(1, -1).map(c => parseTechnicalText(c.trim() || "\u00A0")));
              j++;
            }
            autoTable(pdf, { startY: y, head: [rows[0]], body: rows.slice(1), theme: 'grid', styles: { font: 'times', fontSize: 10, cellPadding: 3 }, headStyles: { fillColor: [243, 244, 246], textColor: [15, 23, 42], fontStyle: 'bold' }, margin: { left: 20, right: 20 } });
            y = pdf.lastAutoTable.finalY + 10; i = j - 1; continue;
          }
          const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
          if (imgMatch) {
            const asset = assets.find(a => a.file_url === imgMatch[1]);
            if (asset && imageMap[asset.id]) {
              if (y > 180) { footer(); pdf.addPage(); currPage++; y = 30; }
              pdf.addImage(imageMap[asset.id], 'JPEG', 30, y, 150, 100); 
              y += 105; pdf.setFontSize(10); pdf.setFont("times", "italic"); pdf.text(`Figure: ${asset.caption || asset.original_name}`, 105, y, { align: 'center' });
              y += 10; pdf.setFontSize(12); pdf.setFont("times", "normal"); continue;
            }
          }
          const splitText = pdf.splitTextToSize(parseTechnicalText(line), 170);
          for (const s of splitText) {
            if (y > 275) { footer(); pdf.addPage(); currPage++; y = 30; }
            pdf.text(s, 20, y, { align: 'justify' }); y += 7;
          }
          y += 3;
        }
        footer(); pdf.addPage(); currPage++;
      }
      
      if (finalMasterReferences.length > 0) {
        pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("REFERENCES", 105, 40, { align: 'center' });
        pdf.setFont("times", "normal"); pdf.setFontSize(11); let ry = 60;
        finalMasterReferences.forEach((ref, idx) => {
          const split = pdf.splitTextToSize(`${idx + 1}. ${ref}`, 170);
          if (ry + (split.length * 6) > 270) { footer(); pdf.addPage(); currPage++; ry = 30; }
          pdf.text(split, 20, ry, { align: 'justify' }); ry += (split.length * 6) + 4;
        });
        footer();
      }

      const generatedDoc = await PDFDocument.load(pdf.output('arraybuffer'));
      const finalPdf = await PDFDocument.create();
      if (orderedDocIds?.length > 0) {
        const sorted = orderedDocIds.map(id => assets.find(a => a.id === id)).filter(Boolean);
        for (const a of sorted) {
          try {
            const res = await fetch(a.file_url);
            const docToMerge = await PDFDocument.load(await res.arrayBuffer());
            const pages = await finalPdf.copyPages(docToMerge, docToMerge.getPageIndices());
            pages.forEach(p => finalPdf.addPage(p));
          } catch (e) {}
        }
      }
      const cPages = await finalPdf.copyPages(generatedDoc, generatedDoc.getPageIndices());
      cPages.forEach(p => finalPdf.addPage(p));
      finalBuffer = Buffer.from(await finalPdf.save());
      contentType = "application/pdf";
    }

    await r2Client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: fileName, Body: finalBuffer, ContentType: contentType }));
    const publicUrl = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/$/, '') + "/" + fileName;
    return NextResponse.json({ success: true, fileUrl: publicUrl, fileSize: finalBuffer.length });
  } catch (error) { console.error('Export Error:', error); return NextResponse.json({ error: error.message }, { status: 500 }); }
}
