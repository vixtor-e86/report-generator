// src/app/api/premium/export/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Ensure autotable is available for grids
import { PDFDocument } from 'pdf-lib';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle 
} from 'docx';

const ABSTRACT_PROMPT = "You are an academic engineering researcher. " +
"Generate a professional Abstract for the following engineering project. " +
"The abstract should be a single, well-structured paragraph (250-350 words) that includes: " +
"1. The problem statement and objectives. " +
"2. The methodology/design approach used. " +
"3. The expected results and technical significance. " +
"Keep the tone formal, technical, and high-level. " +
"Output ONLY the abstract text. No preamble. " +
"Project Content: ";

// --- Shared Engineering Parsers ---
function parseTechnicalText(text) {
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

export async function POST(request) {
  try {
    const { projectId, userId, type, orderedDocIds, options } = await request.json();

    if (!projectId || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*').eq('id', projectId).single();
    const { data: chapters } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).order('chapter_number', { ascending: true });
    const { data: references } = await supabaseAdmin.from('project_references').select('*').eq('project_id', projectId).order('order_number', { ascending: true });

    // 1. Generate Abstract
    let abstract = "";
    if (options.includeAbstract) {
      const summaryContext = chapters.map(c => "Chapter " + c.chapter_number + ": " + c.title + "\n" + (c.content || "").substring(0, 800)).join("\n\n");
      const aiRes = await callAI(ABSTRACT_PROMPT + summaryContext, {
        provider: process.env.AI_PROVIDER || 'gemini',
        model: process.env.AI_MODEL,
        maxTokens: 1000,
        temperature: 0.3
      });
      abstract = aiRes.content;
    }

    let finalBuffer;
    let contentType;
    const cleanTitle = (project.title || "Project").replace(/\s+/g, '_');
    const fileName = "exports/" + projectId + "/" + cleanTitle + "_" + Date.now() + "." + type;

    if (type === 'docx') {
      // --- DOCX ENGINE ---
      const sections = [];
      if (abstract) {
        sections.push({ children: [new Paragraph({ text: 'ABSTRACT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }), new Paragraph({ children: [new TextRun({ text: parseTechnicalText(abstract), font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED })] });
      }
      if (options.includeTOC) {
        sections.push({ children: [new Paragraph({ text: 'TABLE OF CONTENTS', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }), ...chapters.map(ch => new Paragraph({ text: `Chapter ${ch.chapter_number}: ${ch.title}`, spacing: { before: 200 } }))] });
      }
      for (const ch of chapters) {
        const chapterChildren = [new Paragraph({ children: [new TextRun({ text: `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`, font: 'Times New Roman', size: 28, bold: true })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } })];
        const lines = (ch.content || "").split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          chapterChildren.push(new Paragraph({ children: [new TextRun({ text: parseTechnicalText(line), font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 360 } }));
        }
        sections.push({ children: chapterChildren });
      }
      if (references && references.length > 0) {
        sections.push({ children: [new Paragraph({ text: 'REFERENCES', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }), ...references.map((r, i) => new Paragraph({ text: `${i + 1}. ${r.reference_text}`, alignment: AlignmentType.JUSTIFIED, spacing: { after: 150 } }))] });
      }
      finalBuffer = await Packer.toBuffer(new Document({ sections }));
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    } else {
      // --- ADVANCED PDF ENGINE ---
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let currPage = 1;

      const footer = () => {
        if (options.includePageNumbers) {
          pdf.setFontSize(10); pdf.setTextColor(150, 150, 150);
          pdf.text("Page " + currPage, 105, 285, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
      };

      // Abstract
      if (abstract) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.text("ABSTRACT", 105, 40, { align: 'center' });
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);
        pdf.text(pdf.splitTextToSize(parseTechnicalText(abstract), 170), 20, 60);
        footer(); pdf.addPage(); currPage++;
      }

      // TOC
      if (options.includeTOC) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.text("TABLE OF CONTENTS", 20, 40);
        pdf.setFontSize(12);
        chapters.forEach((ch, idx) => { pdf.text(`Chapter ${ch.chapter_number}: ${ch.title}`, 20, 60 + (idx * 10)); });
        footer(); pdf.addPage(); currPage++;
      }

      // Chapters with Table Support
      for (const ch of chapters) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(16);
        pdf.text(`CHAPTER ${ch.chapter_number}`, 20, 30);
        pdf.text((ch.title || "").toUpperCase(), 20, 40);
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);

        const lines = (ch.content || "").split('\n');
        let y = 55;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Detect Table
          if (line.startsWith('|')) {
            const tableRows = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
              const row = lines[i].trim();
              if (!row.includes('---')) {
                tableRows.push(row.split('|').filter(c => c.trim()).map(c => parseTechnicalText(c.trim())));
              }
              i++;
            }
            pdf.autoTable({
              startY: y, head: [tableRows[0]], body: tableRows.slice(1),
              theme: 'grid', headStyles: { fillStyle: [15, 23, 42] }, margin: { left: 20, right: 20 }
            });
            y = pdf.lastAutoTable.finalY + 10;
            continue;
          }

          // Technical Text
          const cleanLine = parseTechnicalText(line.replace(/!\[.*?\]\(.*?\)/g, '').replace(/[#*`]/g, ''));
          const splitText = pdf.splitTextToSize(cleanLine, 170);
          for (const s of splitText) {
            if (y > 270) { footer(); pdf.addPage(); currPage++; y = 30; }
            pdf.text(s, 20, y); y += 6;
          }
        }
        footer(); pdf.addPage(); currPage++;
      }

      // References (Final Page)
      if (references && references.length > 0) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.text("REFERENCES", 105, 40, { align: 'center' });
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(10);
        let y = 60;
        references.forEach((r, idx) => {
          const split = pdf.splitTextToSize(`${idx + 1}. ${r.reference_text}`, 170);
          if (y + (split.length * 5) > 270) { footer(); pdf.addPage(); currPage++; y = 30; }
          pdf.text(split, 20, y); y += (split.length * 5) + 5;
        });
        footer();
      }

      const generatedPdfBytes = pdf.output('arraybuffer');
      const finalPdf = await PDFDocument.create();
      const generatedDoc = await PDFDocument.load(generatedPdfBytes);

      if (orderedDocIds && orderedDocIds.length > 0) {
        const { data: atts } = await supabaseAdmin.from('premium_assets').select('*').in('id', orderedDocIds);
        const sorted = orderedDocIds.map(id => atts.find(a => a.id === id)).filter(Boolean);
        for (const a of sorted) {
          try {
            const res = await fetch(a.file_url);
            const docToMerge = await PDFDocument.load(await res.arrayBuffer());
            const pages = await finalPdf.copyPages(docToMerge, docToMerge.getPageIndices());
            pages.forEach(p => finalPdf.addPage(p));
          } catch (e) {}
        }
      }

      const contentPages = await finalPdf.copyPages(generatedDoc, generatedDoc.getPageIndices());
      contentPages.forEach(p => finalPdf.addPage(p));
      finalBuffer = Buffer.from(await finalPdf.save());
      contentType = "application/pdf";
    }

    await r2Client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: fileName, Body: finalBuffer, ContentType: contentType }));
    const publicUrl = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/$/, '') + "/" + fileName;
    return NextResponse.json({ success: true, fileUrl: publicUrl });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
