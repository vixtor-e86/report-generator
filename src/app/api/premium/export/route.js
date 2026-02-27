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

const ABSTRACT_PROMPT = "You are an academic engineering researcher. Generate a professional Abstract. Project Content: ";

// --- Enhanced Engineering Parser ---
function cleanMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove Bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove Italic
    .replace(/__(.*?)__/g, '$1')     // Remove alternative bold
    .replace(/_(.*?)_/g, '$1')      // Remove alternative italic
    .replace(/###?\s/g, '')          // Remove headings
    .replace(/`{1,3}.*?`{1,3}/g, '') // Remove code blocks
    .trim();
}

function parseTechnicalText(text) {
  if (!text) return "";
  // First handle tech symbols
  let t = text
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
    .replace(/\$\$/g, '').replace(/\$/g, '')
    .replace(/\\pi/g, 'π').replace(/\\theta/g, 'θ').replace(/\\omega/g, 'ω')
    .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β')
    .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈').replace(/\\neq/g, '≠')
    .replace(/\\degree/g, '°')
    .replace(/\\mu/g, 'μ').replace(/\\Delta/g, 'Δ');
  
  return cleanMarkdown(t);
}

export async function POST(request) {
  try {
    const { projectId, userId, type, orderedDocIds, options } = await request.json();
    if (!projectId || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*, custom_templates(*)').eq('id', projectId).single();
    const { data: chapters } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).order('chapter_number', { ascending: true });
    const { data: references } = await supabaseAdmin.from('project_references').select('*').eq('project_id', projectId).order('order_number', { ascending: true });
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
      const sections = [];
      if (abstract) {
        sections.push({ children: [new Paragraph({ text: 'ABSTRACT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }), new Paragraph({ children: [new TextRun({ text: parseTechnicalText(abstract), font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED })] });
      }
      if (options.includeTOC && project.custom_templates) {
        const tocItems = [new Paragraph({ text: 'TABLE OF CONTENTS', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } })];
        project.custom_templates.structure.chapters.forEach(ch => {
          tocItems.push(new Paragraph({ children: [new TextRun({ text: `Chapter ${ch.chapter || ch.number}: ${ch.title}`, bold: true, size: 24 })], spacing: { before: 200 } }));
          ch.sections?.forEach(s => tocItems.push(new Paragraph({ text: s, indent: { left: 720 }, spacing: { before: 100 } })));
        });
        sections.push({ children: tocItems });
      }
      for (const ch of chapters) {
        const children = [new Paragraph({ children: [new TextRun({ text: `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`, font: 'Times New Roman', size: 28, bold: true })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } })];
        const lines = (ch.content || "").split(/### References|## References/i)[0].split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim(); if (!line) continue;
          if (line.startsWith('|')) {
            const rows = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
              const r = lines[i].trim();
              if (!r.includes('---')) {
                rows.push(new TableRow({ children: r.split('|').filter(c => c.trim()).map(c => new TableCell({ children: [new Paragraph({ children: parseInlineFormatting(c.trim(), 20), alignment: AlignmentType.CENTER })], borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } } })) }));
              }
              i++;
            }
            children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })); continue;
          }
          const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
          if (imgMatch) {
            const asset = assets.find(a => a.file_url === imgMatch[1]);
            if (asset && imageMap[asset.id]) {
              children.push(new Paragraph({ children: [new ImageRun({ data: imageMap[asset.id], transformation: { width: 500, height: 350 } })], alignment: AlignmentType.CENTER }));
              children.push(new Paragraph({ children: [new TextRun({ text: `Figure: ${asset.caption || asset.original_name}`, italics: true, size: 20 })], alignment: AlignmentType.CENTER }));
              continue;
            }
          }
          children.push(new Paragraph({ children: parseInlineFormatting(line), alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 360 } }));
        }
        sections.push({ children });
      }
      if (references?.length > 0) {
        sections.push({ children: [new Paragraph({ text: 'REFERENCES', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }), ...references.map((r, i) => new Paragraph({ text: `${i + 1}. ${r.reference_text}`, alignment: AlignmentType.JUSTIFIED, spacing: { after: 150 } }))] });
      }
      finalBuffer = await Packer.toBuffer(new Document({ sections }));
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let currPage = 1;
      const footer = () => { if (options.includePageNumbers) { pdf.setFontSize(10); pdf.setTextColor(150, 150, 150); pdf.text("Page " + currPage, 105, 285, { align: 'center' }); pdf.setTextColor(0, 0, 0); } };

      if (abstract) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.text("ABSTRACT", 105, 40, { align: 'center' });
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(11); pdf.text(pdf.splitTextToSize(parseTechnicalText(abstract), 170), 20, 60);
        footer(); pdf.addPage(); currPage++;
      }

      if (options.includeTOC && project.custom_templates) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.text("TABLE OF CONTENTS", 20, 40);
        pdf.setFontSize(11); let ty = 60;
        project.custom_templates.structure.chapters.forEach(ch => {
          if (ty > 270) { footer(); pdf.addPage(); currPage++; ty = 30; }
          pdf.setFont("helvetica", "bold"); pdf.text(`Chapter ${ch.chapter || ch.number}: ${ch.title}`, 20, ty); ty += 8;
          pdf.setFont("helvetica", "normal");
          ch.sections?.slice(0,3).forEach(s => { pdf.text("- " + s, 30, ty); ty += 6; }); ty += 4;
        });
        footer(); pdf.addPage(); currPage++;
      }

      for (const ch of chapters) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.text(`CHAPTER ${ch.chapter_number}`, 20, 30);
        pdf.text((ch.title || "").toUpperCase(), 20, 40); pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);
        const lines = (ch.content || "").split(/### References|## References/i)[0].split('\n');
        let y = 55;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim(); if (!line) continue;
          if (line.startsWith('|')) {
            const rows = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
              const r = lines[i].trim();
              if (!r.includes('---')) {
                rows.push(r.split('|').filter(c => c.trim()).map(c => parseTechnicalText(c.trim())));
              }
              i++;
            }
            autoTable(pdf, { startY: y, head: [rows[0]], body: rows.slice(1), theme: 'grid', styles: { fontSize: 9, cellPadding: 2 }, headStyles: { fillColor: [15, 23, 42] }, margin: { left: 20, right: 20 } });
            y = pdf.lastAutoTable.finalY + 10; continue;
          }
          const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
          if (imgMatch) {
            const asset = assets.find(a => a.file_url === imgMatch[1]);
            if (asset && imageMap[asset.id]) {
              if (y > 200) { footer(); pdf.addPage(); currPage++; y = 30; }
              pdf.addImage(imageMap[asset.id], 'PNG', 30, y, 150, 100); y += 110; continue;
            }
          }
          const splitText = pdf.splitTextToSize(parseTechnicalText(line), 170);
          for (const s of splitText) {
            if (y > 275) { footer(); pdf.addPage(); currPage++; y = 30; }
            pdf.text(s, 20, y); y += 6;
          }
        }
        footer(); pdf.addPage(); currPage++;
      }

      if (references?.length > 0) {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.text("REFERENCES", 105, 40, { align: 'center' });
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); let ry = 60;
        references.forEach((r, idx) => {
          const split = pdf.splitTextToSize(`${idx + 1}. ${r.reference_text}`, 170);
          if (ry + (split.length * 5) > 270) { footer(); pdf.addPage(); currPage++; ry = 30; }
          pdf.text(split, 20, ry); ry += (split.length * 5) + 5;
        });
        footer();
      }

      const generatedDoc = await PDFDocument.load(pdf.output('arraybuffer'));
      const finalPdf = await PDFDocument.create();
      if (orderedDocIds?.length > 0) {
        const sorted = orderedDocIds.map(id => assets.find(a => a.id === id)).filter(Boolean);
        for (const a of sorted) {
          try {
            const docToMerge = await PDFDocument.load(await (await fetch(a.file_url)).arrayBuffer());
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
    return NextResponse.json({ 
      success: true, 
      fileUrl: publicUrl,
      fileSize: finalBuffer.length // Return size for meter tracking
    });
  } catch (error) { console.error('Export Error:', error); return NextResponse.json({ error: error.message }, { status: 500 }); }
}
