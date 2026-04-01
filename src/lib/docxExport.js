// /src/lib/docxExport.js
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
  PageBreak,
  VerticalAlign,
  ShadingType
} from 'docx';

export async function generateDocx(data) {
  const { project, chapters, images, abstract } = data;

  const imagesData = await Promise.all(
    images.map(async (img) => {
      try {
        const response = await fetch(img.cloudinary_url);
        const arrayBuffer = await (await response.blob()).arrayBuffer();
        return { ...img, buffer: new Uint8Array(arrayBuffer) };
      } catch (e) { return null; }
    })
  );
  const validImages = imagesData.filter(img => img !== null);

  // --- REFERENCE EXTRACTION ---
  const masterRefs = new Set();
  chapters.forEach(ch => {
    const parts = (ch.content || "").split(/## References|### References/i);
    if (parts.length > 1) {
      parts[parts.length - 1].split('\n').forEach(line => {
        const cleaned = line.trim().replace(/^(\[?\d+\]?\.?|\-|\*)\s+/, '').trim();
        if (cleaned.length > 30) masterRefs.add(cleaned);
      });
    }
  });
  const finalRefs = Array.from(masterRefs).sort();

  const children = [];

  // 1. Abstract
  if (abstract) {
    children.push(new Paragraph({ text: 'ABSTRACT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: abstract, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 400 } }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // 2. TOC
  children.push(...generateTableOfContents(chapters));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 3. Chapters
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const contentBody = (ch.content || "").split(/## References|### References/i)[0];
    
    children.push(new Paragraph({ 
      children: [new TextRun({ text: `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`, font: 'Times New Roman', size: 32, bold: true })], 
      alignment: AlignmentType.CENTER, 
      spacing: { before: 400, after: 400 } 
    }));

    const chapterChildren = await convertMarkdownToDocx(contentBody, validImages, ch.chapter_number);
    children.push(...chapterChildren);

    if (i < chapters.length - 1 || finalRefs.length > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // 4. Master References
  if (finalRefs.length > 0) {
    children.push(new Paragraph({ text: 'REFERENCES', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }));
    finalRefs.forEach((ref, i) => {
      children.push(new Paragraph({ 
        children: [new TextRun({ text: `${i + 1}. ${ref}`, font: 'Times New Roman', size: 24 })], 
        alignment: AlignmentType.JUSTIFIED, 
        spacing: { after: 150 } 
      }));
    });
  }

  return new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });
}

function generateTableOfContents(chapters) {
  const toc = [new Paragraph({ text: 'TABLE OF CONTENTS', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 600 } })];
  chapters.forEach(ch => {
    toc.push(new Paragraph({ children: [new TextRun({ text: `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`, bold: true, size: 24, font: 'Times New Roman' })], indent: { left: 360 }, spacing: { before: 200 } }));
    const lines = (ch.content || "").split('\n');
    lines.forEach(l => {
      if (l.trim().startsWith('### ')) {
        toc.push(new Paragraph({ 
          children: [new TextRun({ text: l.replace('### ', '').trim(), font: 'Times New Roman', size: 22 })],
          indent: { left: 720 }, 
          spacing: { after: 80 } 
        }));
      }
    });
  });
  return toc;
}

/**
 * Advanced Inline Formatter
 * Handles: **Bold**, *Italics*, `Code`, and mixtures
 */
function parseInlineFormatting(text, fontSize = 24, isBold = false) {
  if (!text) return [new TextRun({ text: "", font: 'Times New Roman', size: fontSize })];

  // Clean technical symbols
  let clean = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
                  .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
                  .replace(/\$/g, '');

  const runs = [];
  
  // This regex looks for:
  // 1. ***bold-italic***
  // 2. **bold**
  // 3. *italic*
  // 4. `code`
  const regex = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(clean)) !== null) {
    // Add plain text before match
    if (match.index > lastIndex) {
      runs.push(new TextRun({ 
        text: clean.substring(lastIndex, match.index), 
        font: 'Times New Roman', 
        size: fontSize, 
        bold: isBold 
      }));
    }

    if (match[1]) { // ***bold-italic***
      runs.push(new TextRun({ text: match[2], bold: true, italics: true, font: 'Times New Roman', size: fontSize }));
    } else if (match[3]) { // **bold**
      runs.push(new TextRun({ text: match[4], bold: true, font: 'Times New Roman', size: fontSize }));
    } else if (match[5]) { // *italic*
      runs.push(new TextRun({ text: match[6], italics: true, font: 'Times New Roman', size: fontSize }));
    } else if (match[7]) { // `code`
      runs.push(new TextRun({ 
        text: match[8], 
        font: 'Courier New', 
        size: fontSize - 2, 
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR } 
      }));
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < clean.length) {
    runs.push(new TextRun({ 
      text: clean.substring(lastIndex), 
      font: 'Times New Roman', 
      size: fontSize, 
      bold: isBold 
    }));
  }

  return runs.length > 0 ? runs : [new TextRun({ text: clean, font: 'Times New Roman', size: fontSize, bold: isBold })];
}

async function convertMarkdownToDocx(markdown, images, chapterNumber) {
  const paragraphs = [];
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeBlockLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    // --- CODE BLOCK HANDLER (```) ---
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // Closing block - render now
        paragraphs.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "111827", type: ShadingType.CLEAR }, // Dark background like editor
                  children: codeBlockLines.map(code => new Paragraph({
                    children: [new TextRun({ text: code, font: 'Courier New', size: 18, color: "E5E7EB" })],
                    spacing: { before: 40, after: 40 }
                  })),
                  margins: { top: 200, bottom: 200, left: 200, right: 200 }
                })
              ]
            })
          ]
        }));
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    if (!trimmedLine) { 
      if (paragraphs.length > 0 && paragraphs[paragraphs.length - 1] instanceof Paragraph) continue;
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 200 } })); 
      continue; 
    }

    // --- TABLE HANDLER ---
    if (trimmedLine.startsWith('|')) {
      const rows = [];
      let j = i;
      let rowCount = 0;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        const rawRow = lines[j].trim();
        if (rawRow.includes('---') && (rawRow.match(/-/g) || []).length > 5) {
          j++; continue;
        }
        let cells = rawRow.split('|').map(c => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();

        if (cells.length > 0) {
          const isHeader = rowCount === 0;
          rows.push(new TableRow({ 
            tableHeader: isHeader,
            children: cells.map(c => new TableCell({ 
              children: [new Paragraph({ children: parseInlineFormatting(c, isHeader ? 22 : 20, isHeader), alignment: AlignmentType.CENTER })], 
              borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
              verticalAlign: VerticalAlign.CENTER,
              shading: isHeader ? { fill: "F3F4F6", type: ShadingType.CLEAR } : undefined
            })) 
          }));
          rowCount++;
        }
        j++;
      }
      if (rows.length > 0) {
        paragraphs.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, margins: { top: 100, bottom: 100, left: 100, right: 100 } }));
      }
      i = j - 1; continue;
    }

    // --- HEADING & IMAGE HANDLERS ---
    if (trimmedLine.startsWith('## ')) continue;
    if (trimmedLine.startsWith('### ')) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: trimmedLine.replace('### ', '').trim(), font: 'Times New Roman', size: 28, bold: true })], heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 300 } }));
    } else if (trimmedLine.startsWith('#### ')) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: trimmedLine.replace('#### ', '').trim(), font: 'Times New Roman', size: 26, bold: true })], heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 200 } }));
    } else if (trimmedLine.includes('{{figure')) {
      const m = trimmedLine.match(/\{\{figure(\d+)\.(\d+)\}\}/);
      if (m) {
        const chapterNumber = parseInt(m[1]);
        const figureIndex = parseInt(m[2]);
        const chapterImages = images?.filter(img => img.chapter_number === chapterNumber || img.chapter_number === null).sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
        const img = chapterImages?.[figureIndex - 1];
        if (img?.buffer) {
          paragraphs.push(new Paragraph({ children: [new ImageRun({ data: img.buffer, transformation: { width: 500, height: 400 } })], alignment: AlignmentType.CENTER }));
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: `Figure ${m[1]}.${m[2]}: ${img.caption}`, italics: true, size: 22, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
        }
      }
    } else {
      // --- STANDARD PARAGRAPH ---
      paragraphs.push(new Paragraph({ 
        children: parseInlineFormatting(trimmedLine), 
        alignment: AlignmentType.JUSTIFIED, 
        spacing: { after: 240, line: 360 } 
      }));
    }
  }
  return paragraphs;
}

export async function packDocx(doc) { return await Packer.toBlob(doc); }
