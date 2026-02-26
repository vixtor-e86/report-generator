// src/app/api/premium/export/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";
import { jsPDF } from "jspdf";

const ABSTRACT_PROMPT = "You are an academic engineering researcher. " +
"Generate a professional Abstract for the following engineering project. " +
"The abstract should be a single, well-structured paragraph (250-350 words) that includes: " +
"1. The problem statement and objectives. " +
"2. The methodology/design approach used. " +
"3. The expected results and technical significance. " +
"Keep the tone formal, technical, and high-level. " +
"Output ONLY the abstract text. No preamble. " +
"Project Content: ";

export async function POST(request) {
  try {
    const { projectId, userId, type, orderedDocIds, options } = await request.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch ALL Data
    const { data: project } = await supabaseAdmin.from('premium_projects').select('*').eq('id', projectId).single();
    const { data: chapters } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).order('chapter_number', { ascending: true });

    // 2. Optional: Generate Abstract with the same model set for content generation
    let abstract = "";
    if (options.includeAbstract) {
      const summaryContext = chapters.map(c => "Chapter " + c.chapter_number + ": " + c.title + "\n" + (c.content || "").substring(0, 1000)).join("\n\n");
      
      const aiRes = await callAI(ABSTRACT_PROMPT + summaryContext, {
        provider: process.env.AI_PROVIDER || 'gemini',
        model: process.env.AI_MODEL,
        maxTokens: 1000,
        temperature: 0.3
      });
      abstract = aiRes.content;
    }

    // 3. Assemble PDF
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let currentPage = 1;

    const addPageNumber = () => {
      if (options.includePageNumbers) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Page " + currentPage, 105, 285, { align: 'center' });
      }
    };

    // --- Abstract Page ---
    if (abstract) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("ABSTRACT", 105, 40, { align: 'center' });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const splitAbstract = doc.splitTextToSize(abstract, 170);
      doc.text(splitAbstract, 20, 60);
      addPageNumber();
      doc.addPage();
      currentPage++;
    }

    // --- TOC Page ---
    if (options.includeTOC) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("TABLE OF CONTENTS", 20, 40);
      doc.setFontSize(12);
      let y = 60;
      chapters.forEach(ch => {
        doc.text("Chapter " + ch.chapter_number + ": " + ch.title, 20, y);
        doc.text("........", 160, y); 
        y += 10;
      });
      addPageNumber();
      doc.addPage();
      currentPage++;
    }

    // --- Main Content Assembly ---
    for (const ch of chapters) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CHAPTER " + ch.chapter_number, 20, 30);
      doc.text((ch.title || "").toUpperCase(), 20, 40);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      
      const cleanContent = (ch.content || "").replace(/[#*`]/g, '') || "No content generated for this chapter.";
      const splitText = doc.splitTextToSize(cleanContent, 170);
      
      let y = 55;
      for (const line of splitText) {
        if (y > 270) {
          addPageNumber();
          doc.addPage();
          currentPage++;
          y = 30;
        }
        doc.text(line, 20, y);
        y += 6;
      }

      addPageNumber();
      if (ch.chapter_number < chapters.length) {
        doc.addPage();
        currentPage++;
      }
    }

    // 4. Finalize and Upload to R2
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const cleanTitle = (project.title || "Export").replace(/\s+/g, '_');
    const fileName = "exports/" + projectId + "/" + cleanTitle + "_" + Date.now() + ".pdf";

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL + "/" + fileName;

    return NextResponse.json({ 
      success: true, 
      fileUrl: publicUrl 
    });

  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
