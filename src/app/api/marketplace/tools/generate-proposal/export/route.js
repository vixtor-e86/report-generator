import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  WidthType, 
  BorderStyle 
} from 'docx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export async function POST(request) {
  try {
    const { proposalId, format } = await request.json();

    if (!proposalId || !format) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: proposal, error } = await supabaseAdmin
      .from('topic_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (error || !proposal) throw new Error('Proposal not found');

    const content = proposal.proposal_content;
    const title = proposal.topic_title;

    if (format === 'docx') {
      const doc = new Document({
        sections: [{
          properties: {},
          children: convertMarkdownToDocx(content)
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      return NextResponse.json({
        success: true,
        data: buffer.toString('base64'),
        filename: `${title.replace(/\s+/g, '_')}_Proposal.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

    } else if (format === 'pdf') {
      const pdf = new jsPDF();
      
      // Simple Markdown to PDF converter for proposal
      const lines = content.split('\n');
      let cursorY = 20;
      const marginX = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const wrapWidth = pageWidth - (marginX * 2);

      lines.forEach(line => {
        if (cursorY > 270) { pdf.addPage(); cursorY = 20; }

        if (line.startsWith('# ')) {
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18);
          const txt = line.replace('# ', '').toUpperCase();
          const split = pdf.splitTextToSize(txt, wrapWidth);
          pdf.text(split, marginX, cursorY);
          cursorY += (split.length * 8) + 5;
        } else if (line.startsWith('## ')) {
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14);
          const txt = line.replace('## ', '').toUpperCase();
          pdf.text(txt, marginX, cursorY);
          cursorY += 10;
        } else if (line.trim()) {
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11);
          const split = pdf.splitTextToSize(line.trim(), wrapWidth);
          pdf.text(split, marginX, cursorY);
          cursorY += (split.length * 6) + 4;
        } else {
          cursorY += 4;
        }
      });

      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      return NextResponse.json({
        success: true,
        data: pdfBase64,
        filename: `${title.replace(/\s+/g, '_')}_Proposal.pdf`,
        mimeType: 'application/pdf'
      });
    }

    throw new Error('Unsupported format');

  } catch (error) {
    console.error('Proposal Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Minimal markdown parser for docx (reusing logic from standard tier but simplified)
function convertMarkdownToDocx(markdown) {
  const paragraphs = [];
  const lines = markdown.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        text: trimmed.replace('# ', '').toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 }
      }));
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: trimmed.replace('## ', '').toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }));
    } else {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 24, font: 'Times New Roman' })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 }
      }));
    }
  });

  return paragraphs;
}
