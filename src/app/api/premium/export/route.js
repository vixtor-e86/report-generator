// src/app/api/premium/export/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";
import { jsPDF } from "jspdf";
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

// --- DOCX Helpers ---
function parseMathematicalText(text) {
  return (text || "")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
    .replace(/\$\$/g, '').replace(/\$/g, '')
    .replace(/\\pi/g, 'π').replace(/\\theta/g, 'θ').replace(/\\omega/g, 'ω')
    .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β')
    .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\pm/g, '±');
}

function parseInlineFormatting(text, fontSize = 24, isBold = false) {
  const processedText = parseMathematicalText(text);
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
    
    // Fetch references for the references page
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
      // --- DOCX GENERATION ---
      const sections = [];
      
      // Abstract
      if (abstract) {
        sections.push({
          children: [
            new Paragraph({ text: 'ABSTRACT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: abstract, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED })
          ]
        });
      }

      // TOC
      if (options.includeTOC) {
        sections.push({
          children: [
            new Paragraph({ text: 'TABLE OF CONTENTS', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }),
            ...chapters.map(ch => new Paragraph({ text: `Chapter ${ch.chapter_number}: ${ch.title}`, spacing: { before: 200 } }))
          ]
        });
      }

      // Chapters
      for (const ch of chapters) {
        const chapterChildren = [
          new Paragraph({
            children: [new TextRun({ text: `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`, font: 'Times New Roman', size: 28, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 }
          })
        ];

        const lines = (ch.content || "").split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          if (line.startsWith('### ')) {
            chapterChildren.push(new Paragraph({ children: [new TextRun({ text: line.replace('### ', ''), font: 'Times New Roman', size: 26, bold: true })], spacing: { before: 200, after: 200 } }));
          } else {
            chapterChildren.push(new Paragraph({ children: parseInlineFormatting(line), alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 360 } }));
          }
        }
        sections.push({ children: chapterChildren });
      }

      // References Page
      if (references && references.length > 0) {
        sections.push({
          children: [
            new Paragraph({ text: 'REFERENCES', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }),
            ...references.map((r, i) => new Paragraph({ text: `${i + 1}. ${r.reference_text}`, alignment: AlignmentType.JUSTIFIED, spacing: { after: 150 } }))
          ]
        });
      }

      const doc = new Document({ sections });
      finalBuffer = await Packer.toBuffer(doc);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    } else {
      // --- PDF GENERATION (Merging + jsPDF) ---
      const mainDoc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let currentPage = 1;

      const addPageNumber = () => {
        if (options.includePageNumbers) {
          mainDoc.setFontSize(10); mainDoc.setTextColor(150);
          mainDoc.text("Page " + currentPage, 105, 285, { align: 'center' });
        }
      };

      if (abstract) {
        mainDoc.setFont("helvetica", "bold"); mainDoc.setFontSize(18);
        mainDoc.text("ABSTRACT", 105, 40, { align: 'center' });
        mainDoc.setFont("helvetica", "normal"); mainDoc.setFontSize(11);
        const split = mainDoc.splitTextToSize(abstract, 170);
        mainDoc.text(split, 20, 60);
        addPageNumber(); mainDoc.addPage(); currentPage++;
      }

      if (options.includeTOC) {
        mainDoc.setFont("helvetica", "bold"); mainDoc.setFontSize(18);
        mainDoc.text("TABLE OF CONTENTS", 20, 40);
        mainDoc.setFontSize(12);
        chapters.forEach((ch, idx) => { mainDoc.text(`Chapter ${ch.chapter_number}: ${ch.title}`, 20, 60 + (idx * 10)); });
        addPageNumber(); mainDoc.addPage(); currentPage++;
      }

      for (const ch of chapters) {
        mainDoc.setFont("helvetica", "bold"); mainDoc.setFontSize(16);
        mainDoc.text(`CHAPTER ${ch.chapter_number}`, 20, 30);
        mainDoc.text((ch.title || "").toUpperCase(), 20, 40);
        mainDoc.setFont("helvetica", "normal"); mainDoc.setFontSize(11);
        const cleanContent = (ch.content || "").replace(/!\[.*?\]\(.*?\)/g, '').replace(/[#*`]/g, '');
        const splitText = mainDoc.splitTextToSize(cleanContent, 170);
        let y = 55;
        for (const line of splitText) {
          if (y > 270) { addPageNumber(); mainDoc.addPage(); currentPage++; y = 30; }
          mainDoc.text(line, 20, y); y += 6;
        }
        addPageNumber(); mainDoc.addPage(); currentPage++;
      }

      if (references && references.length > 0) {
        mainDoc.setFont("helvetica", "bold"); mainDoc.setFontSize(18);
        mainDoc.text("REFERENCES", 105, 40, { align: 'center' });
        mainDoc.setFont("helvetica", "normal"); mainDoc.setFontSize(10);
        let y = 60;
        references.forEach((r, idx) => {
          const split = mainDoc.splitTextToSize(`${idx + 1}. ${r.reference_text}`, 170);
          if (y + (split.length * 5) > 270) { addPageNumber(); mainDoc.addPage(); currentPage++; y = 30; }
          mainDoc.text(split, 20, y); y += (split.length * 5) + 5;
        });
        addPageNumber();
      }

      const generatedPdfBytes = mainDoc.output('arraybuffer');
      
      // Merge with user attachments
      const finalPdf = await PDFDocument.create();
      const generatedDoc = await PDFDocument.load(generatedPdfBytes);
      
      // 1. Add ordered attachments first
      if (orderedDocIds && orderedDocIds.length > 0) {
        const { data: attachmentAssets } = await supabaseAdmin.from('premium_assets').select('*').in('id', orderedDocIds);
        const sortedAssets = orderedDocIds.map(id => attachmentAssets.find(a => a.id === id)).filter(Boolean);
        
        for (const asset of sortedAssets) {
          try {
            const res = await fetch(asset.file_url);
            const bytes = await res.arrayBuffer();
            const docToMerge = await PDFDocument.load(bytes);
            const copiedPages = await finalPdf.copyPages(docToMerge, docToMerge.getPageIndices());
            copiedPages.forEach(p => finalPdf.addPage(p));
          } catch (e) { console.error("Merge error:", e); }
        }
      }

      // 2. Add generated content
      const contentPages = await finalPdf.copyPages(generatedDoc, generatedDoc.getPageIndices());
      contentPages.forEach(p => finalPdf.addPage(p));

      finalBuffer = Buffer.from(await finalPdf.save());
      contentType = "application/pdf";
    }

    await r2Client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: fileName, Body: finalBuffer, ContentType: contentType }));
    
    // Fix the 404 by using R2_PUBLIC_DOMAIN correctly
    const publicDomain = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/$/, '');
    const publicUrl = publicDomain + "/" + fileName;

    return NextResponse.json({ success: true, fileUrl: publicUrl });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
