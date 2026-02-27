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
  BorderStyle 
} from 'docx';

const ABSTRACT_PROMPT = "You are an academic engineering researcher. Generate a professional Abstract for the following project. One paragraph, 250-350 words. Methodology, Design, and Results. Tone: Formal. Output ONLY text. Project Content: ";

// --- Shared Engineering Parser ---
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
    .replace(/\\degree/g, '°')
    .replace(/\\mu/g, 'μ').replace(/\\Delta/g, 'Δ');
}

// --- DOCX Inline Formatter ---
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

export async function POST(request) {
  try {
    const { projectId, userId, type, orderedDocIds, options } = await request.json();
    if (!projectId || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*').eq('id', projectId).single();
    const { data: chapters } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).order('chapter_number', { ascending: true });
    const { data: references } = await supabaseAdmin.from('project_references').select('*').eq('project_id', projectId).order('order_number', { ascending: true });
    const { data: assets } = await supabaseAdmin.from('premium_assets').select('*').eq('project_id', projectId);

    // 1. Fetch Image Buffers for R2 Assets
    const imageMap = {};
    if (assets) {
      const images = assets.filter(a => a.file_type.startsWith('image/'));
      await Promise.all(images.map(async (img) => {
        try {
          const res = await fetch(img.file_url);
          const arrayBuffer = await res.arrayBuffer();
          imageMap[img.id] = Buffer.from(arrayBuffer);
        } catch (e) { console.error("Image Buffer Error:", e); }
      }));
    }

    // 2. Generate Abstract
    let abstract = "";
    if (options.includeAbstract) {
      const summaryContext = chapters.map(c => `Chapter ${c.chapter_number}: ${c.title}\n${c.content?.substring(0, 800)}`).join('\n\n');
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
      const sections = [];
      // Abstract
      if (abstract) {
        sections.push({ children: [new Paragraph({ text: 'ABSTRACT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }), new Paragraph({ children: [new TextRun({ text: parseTechnicalText(abstract), font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED })] });
      }
      // Chapters
      for (const ch of chapters) {
        const chapterChildren = [new Paragraph({ children: [new TextRun({ text: `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`, font: 'Times New Roman', size: 28, bold: true })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } })];
        
        // Remove Reference sections from AI context
        const content = (ch.content || "").split(/### References|## References/i)[0];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Tables in DOCX
          if (line.startsWith('|')) {
            const tableRows = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
              const row = lines[i].trim();
              if (!row.includes('---')) {
                const cells = row.split('|').filter(c => c.trim()).map(c => new TableCell({ children: [new Paragraph({ children: parseInlineFormatting(c.trim(), 20), alignment: AlignmentType.CENTER })], borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } } }));
                tableRows.push(new TableRow({ children: cells }));
              }
              i++;
            }
            chapterChildren.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            chapterChildren.push(new Paragraph({ text: "" }));
            continue;
          }

          // Images in DOCX
          const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
          if (imgMatch) {
            const url = imgMatch[1];
            const asset = assets.find(a => a.file_url === url);
            if (asset && imageMap[asset.id]) {
              chapterChildren.push(new Paragraph({ children: [new ImageRun({ data: imageMap[asset.id], transformation: { width: 500, height: 350 } })], alignment: AlignmentType.CENTER }));
              chapterChildren.push(new Paragraph({ children: [new TextRun({ text: `Figure: ${asset.caption || asset.original_name}`, italics: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
              continue;
            }
          }

          // Headings
          if (line.startsWith('### ')) {
            chapterChildren.push(new Paragraph({ children: [new TextRun({ text: line.replace('### ', ''), font: 'Times New Roman', size: 26, bold: true })], spacing: { before: 200, after: 200 } }));
          } else {
            chapterChildren.push(new Paragraph({ children: parseInlineFormatting(line), alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 360 } }));
          }
        }
        sections.push({ children: chapterChildren });
      }
      // References
      if (references?.length > 0) {
        sections.push({ children: [new Paragraph({ text: 'REFERENCES', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }), ...references.map((r, i) => new Paragraph({ text: `${i + 1}. ${r.reference_text}`, alignment: AlignmentType.JUSTIFIED, spacing: { after: 150 } }))] });
      }
      finalBuffer = await Packer.toBuffer(new Document({ sections }));
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    } else {
      // --- PDF ENGINE ---
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let currPage = 1;
      const footer = () => { if (options.includePageNumbers) { pdf.setFontSize(10); pdf.setTextColor(150, 150, 150); pdf.text("Page " + currPage, 105, 285, { align: 'center' }); pdf.setTextColor(0, 0, 0); } };

      if (abstract) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.text("ABSTRACT", 105, 40, { align: 'center' });
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(11); pdf.text(pdf.splitTextToSize(parseTechnicalText(abstract), 170), 20, 60);
        footer(); pdf.addPage(); currPage++;
      }

      for (const ch of chapters) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.text(`CHAPTER ${ch.chapter_number}`, 20, 30);
        pdf.text((ch.title || "").toUpperCase(), 20, 40);
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);
        
        const content = (ch.content || "").split(/### References|## References/i)[0];
        const lines = content.split('\n');
        let y = 55;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // PDF Table
          if (line.startsWith('|')) {
            const tableRows = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
              const row = lines[i].trim();
              if (!row.includes('---')) {
                tableRows.push(row.split('|').filter(c => c.trim()).map(c => parseTechnicalText(c.trim())));
              }
              i++;
            }
            autoTable(pdf, { startY: y, head: [tableRows[0]], body: tableRows.slice(1), theme: 'grid', headStyles: { fillColor: [15, 23, 42] }, margin: { left: 20, right: 20 } });
            y = pdf.lastAutoTable.finalY + 10;
            continue;
          }

          // PDF Image
          const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
          if (imgMatch) {
            const url = imgMatch[1];
            const asset = assets.find(a => a.file_url === url);
            if (asset && imageMap[asset.id]) {
              if (y > 200) { footer(); pdf.addPage(); currPage++; y = 30; }
              const format = asset.file_type === 'image/png' ? 'PNG' : 'JPEG';
              pdf.addImage(imageMap[asset.id], format, 30, y, 150, 100);
              y += 110;
              continue;
            }
          }

          const splitText = pdf.splitTextToSize(parseTechnicalText(line.replace(/[#*`]/g, '')), 170);
          for (const s of splitText) {
            if (y > 275) { footer(); pdf.addPage(); currPage++; y = 30; }
            pdf.text(s, 20, y); y += 6;
          }
        }
        footer(); pdf.addPage(); currPage++;
      }

      // References at the end
      if (references?.length > 0) {
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
