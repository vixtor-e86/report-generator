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
  PageBreak
} from 'docx';

export async function generateDocx(data) {
  const { project, chapters, images, abstract } = data;

  const imagesData = await Promise.all(
    images.map(async (img) => {
      try {
        const response = await fetch(img.cloudinary_url);
        const arrayBuffer = await (await response.blob()).arrayBuffer();
        // Use Uint8Array for better cross-environment compatibility (Word on PC is picky)
        return { ...img, buffer: new Uint8Array(arrayBuffer) };
      } catch (e) { return null; }
    })
  );
  const validImages = imagesData.filter(img => img !== null);

  // --- REFERENCE EXTRACTION LOGIC ---
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

    // Add page break after every chapter except the last one if there are references
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

  // Word PC likes single-section documents better for simple reports
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

function parseTechnicalText(text) {
  return text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)').replace(/\\sqrt\{([^}]+)\}/g, '√$1').replace(/\$/g, '').trim();
}

function parseInlineFormatting(text, fontSize = 24, isBold = false) {
  const clean = parseTechnicalText(text);
  if (!clean) return [new TextRun({ text: "", font: 'Times New Roman', size: fontSize })];

  const runs = [];
  let cur = 0;
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let m;
  while ((m = regex.exec(clean)) !== null) {
    if (m.index > cur) {
      runs.push(new TextRun({ text: clean.substring(cur, m.index), font: 'Times New Roman', size: fontSize, bold: isBold }));
    }
    if (m[2]) {
      runs.push(new TextRun({ text: m[2], bold: true, font: 'Times New Roman', size: fontSize }));
    } else if (m[4]) {
      runs.push(new TextRun({ text: m[4], italics: true, font: 'Times New Roman', size: fontSize }));
    }
    cur = m.index + m[0].length;
  }
  if (cur < clean.length) {
    runs.push(new TextRun({ text: clean.substring(cur), font: 'Times New Roman', size: fontSize, bold: isBold }));
  }
  return runs.length > 0 ? runs : [new TextRun({ text: clean, font: 'Times New Roman', size: fontSize, bold: isBold })];
}

async function convertMarkdownToDocx(markdown, images, chapterNumber) {
  const paragraphs = [];
  const lines = markdown.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { 
      // Avoid excessive empty paragraphs
      if (paragraphs.length > 0 && paragraphs[paragraphs.length - 1] instanceof Paragraph) continue;
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 200 } })); 
      continue; 
    }

    // Robust Table Parsing
    if (line.startsWith('|')) {
      const rows = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        const rawRow = lines[j].trim();
        // Skip separator rows like |---|---|
        if (rawRow.includes('---') && (rawRow.match(/-/g) || []).length > 5) {
          j++;
          continue;
        }

        // Split by pipe and remove empty first/last elements if they exist
        let cells = rawRow.split('|').map(c => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();

        if (cells.length > 0) {
          rows.push(new TableRow({ 
            children: cells.map(c => new TableCell({ 
              children: [new Paragraph({ 
                children: parseInlineFormatting(c, 20), 
                alignment: AlignmentType.CENTER 
              })], 
              borders: { 
                top: { style: BorderStyle.SINGLE, size: 1 }, 
                bottom: { style: BorderStyle.SINGLE, size: 1 }, 
                left: { style: BorderStyle.SINGLE, size: 1 }, 
                right: { style: BorderStyle.SINGLE, size: 1 } 
              },
              verticalAlign: AlignmentType.CENTER
            })) 
          }));
        }
        j++;
      }
      
      if (rows.length > 0) {
        paragraphs.push(new Table({ 
          rows, 
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        }));
      }
      i = j - 1; 
      continue;
    }

    if (line.startsWith('## ')) continue; // Skip redundant chapter title
    if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({ 
        children: [new TextRun({ text: line.replace('### ', '').trim(), font: 'Times New Roman', size: 28, bold: true })], 
        heading: HeadingLevel.HEADING_2, 
        spacing: { before: 300, after: 300 } 
      }));
    } else if (line.startsWith('#### ')) {
      paragraphs.push(new Paragraph({ 
        children: [new TextRun({ text: line.replace('#### ', '').trim(), font: 'Times New Roman', size: 26, bold: true })], 
        heading: HeadingLevel.HEADING_3, 
        spacing: { before: 200, after: 200 } 
      }));
    } else if (line.includes('{{figure')) {
      const m = line.match(/\{\{figure(\d+)\.(\d+)\}\}/);
      if (m) {
        const img = images.find(ig => ig.placeholder_id === `figure${m[1]}.${m[2]}`);
        if (img?.buffer) {
          paragraphs.push(new Paragraph({ 
            children: [new ImageRun({ data: img.buffer, transformation: { width: 500, height: 400 } })], 
            alignment: AlignmentType.CENTER 
          }));
          paragraphs.push(new Paragraph({ 
            children: [new TextRun({ text: `Figure ${m[1]}.${m[2]}: ${img.caption}`, italics: true, size: 22, font: 'Times New Roman' })], 
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }));
        }
      }
    } else {
      paragraphs.push(new Paragraph({ 
        children: parseInlineFormatting(line), 
        alignment: AlignmentType.JUSTIFIED, 
        spacing: { after: 240, line: 360 } 
      }));
    }
  }
  return paragraphs;
}

export async function packDocx(doc) { return await Packer.toBlob(doc); }
