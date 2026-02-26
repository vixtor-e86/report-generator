// src/app/api/premium/export/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";
import { jsPDF } from "jspdf";
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

const ABSTRACT_PROMPT = "You are an academic engineering researcher. " +
"Generate a professional Abstract for the following engineering project. " +
"The abstract should be a single, well-structured paragraph (250-350 words) that includes: " +
"1. The problem statement and objectives. " +
"2. The methodology/design approach used. " +
"3. The expected results and technical significance. " +
"Keep the tone formal, technical, and high-level. " +
"Output ONLY the abstract text. No preamble. " +
"Project Content: ";

// --- DOCX Helpers (Adapted from standard docxExport.js) ---
function parseMathematicalText(text) {
  return text
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
    const { projectId, userId, type, options } = await request.json();

    if (!projectId || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*').eq('id', projectId).single();
    const { data: chapters } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).order('chapter_number', { ascending: true });
    const { data: assets } = await supabaseAdmin.from('premium_assets').select('*').eq('project_id', projectId).filter('file_type', 'ilike', 'image/%');

    // 1. Abstract
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

    let fileBuffer;
    let contentType;
    const cleanTitle = (project.title || "Project").replace(/\s+/g, '_');
    const fileName = "exports/" + projectId + "/" + cleanTitle + "_" + Date.now() + "." + type;

    if (type === 'docx') {
      // --- DOCX GENERATION ---
      const sections = [];

      // TOC
      if (options.includeTOC) {
        sections.push({
          children: [
            new Paragraph({ text: 'TABLE OF CONTENTS', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            ...chapters.map(ch => new Paragraph({ text: `Chapter ${ch.chapter_number}: ${ch.title}`, spacing: { before: 200 } }))
          ]
        });
      }

      // Abstract
      if (abstract) {
        sections.push({
          children: [
            new Paragraph({ text: 'ABSTRACT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: abstract, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED })
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

      const doc = new Document({ sections });
      fileBuffer = await Packer.toBuffer(doc);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    } else {
      // --- PDF GENERATION (jsPDF) ---
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let y = 40;
      if (abstract) {
        doc.setFont("helvetica", "bold"); doc.text("ABSTRACT", 105, 40, { align: 'center' });
        doc.setFont("helvetica", "normal"); doc.setFontSize(11);
        doc.text(doc.splitTextToSize(abstract, 170), 20, 60);
        doc.addPage();
      }
      for (const ch of chapters) {
        doc.setFontSize(16); doc.text(`CHAPTER ${ch.chapter_number}: ${ch.title}`, 20, 30);
        doc.setFontSize(11);
        const cleanContent = (ch.content || "").replace(/!\[.*?\]\(.*?\)/g, '').replace(/[#*`]/g, '');
        doc.text(doc.splitTextToSize(cleanContent, 170), 20, 50);
        doc.addPage();
      }
      fileBuffer = Buffer.from(doc.output('arraybuffer'));
      contentType = "application/pdf";
    }

    await r2Client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: fileName, Body: fileBuffer, ContentType: contentType }));
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL + "/" + fileName;

    return NextResponse.json({ success: true, fileUrl: publicUrl });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
