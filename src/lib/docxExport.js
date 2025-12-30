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
  BorderStyle 
} from 'docx'; //

export async function generateDocx(data) {
  const { project, chapters, images, abstract } = data;

  // Fetch all images as base64
  const imagesData = await Promise.all(
    images.map(async (img) => {
      try {
        const response = await fetch(img.cloudinary_url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        return {
          ...img,
          buffer: Buffer.from(arrayBuffer),
        };
      } catch (error) {
        console.error(`Failed to fetch image ${img.cloudinary_url}:`, error);
        return null;
      }
    })
  );

  const validImages = imagesData.filter(img => img !== null);

  const doc = new Document({
    sections: [
      // ✅ NEW: Abstract Section (before TOC)
      ...(abstract ? [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            text: 'ABSTRACT',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: abstract,
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240, line: 360 },
            children: [new TextRun({ 
              text: abstract,
              font: 'Times New Roman',
              size: 24
            })]
          }),
        ],
      }] : []),
      // Table of Contents Section
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: generateTableOfContents(chapters),
      },

      // Chapters Sections
      ...await Promise.all(chapters.map(async (chapter) => ({
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: await convertMarkdownToDocx(chapter.content || 'Content not available', validImages, chapter.chapter_number),
      }))),
    ],
  });

  return doc;
}

// Helper to parse inline formatting (bold, italic)
function parseInlineFormatting(text, fontSize = 24, isBold = false) {
  // First, process mathematical expressions
  const processedText = parseMathematicalText(text);
  
  const textRuns = [];
  let currentIndex = 0;
  
  const formatRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let match;
  
  while ((match = formatRegex.exec(processedText)) !== null) {
    if (match.index > currentIndex) {
      const plainText = processedText.substring(currentIndex, match.index);
      if (plainText) {
        textRuns.push(new TextRun({ 
          text: plainText,
          font: 'Times New Roman',
          size: fontSize,
          bold: isBold 
        }));
      }
    }
    
    if (match[2]) { // Bold
      textRuns.push(new TextRun({
        text: match[2],
        bold: true,
        font: 'Times New Roman',
        size: fontSize
      }));
    } else if (match[4]) { // Italic
      textRuns.push(new TextRun({
        text: match[4],
        italics: true,
        font: 'Times New Roman',
        size: fontSize,
        bold: isBold
      }));
    }
    
    currentIndex = match.index + match[0].length;
  }
  
  if (currentIndex < processedText.length) {
    const remainingText = processedText.substring(currentIndex);
    if (remainingText) {
      textRuns.push(new TextRun({ 
        text: remainingText,
        font: 'Times New Roman',
        size: fontSize,
        bold: isBold
      }));
    }
  }
  
  if (textRuns.length === 0) {
    textRuns.push(new TextRun({ 
      text: processedText,
      font: 'Times New Roman',
      size: fontSize,
      bold: isBold
    }));
  }
  
  return textRuns;
}
function generateTableOfContents(chapters) {
  const tocParagraphs = [
    new Paragraph({
      text: 'TABLE OF CONTENTS',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({ text: '', spacing: { after: 200 } })
  ];

  chapters.forEach((chapter, chapterIndex) => {
    // Chapter heading
    tocParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `CHAPTER ${chapter.chapter_number}: ${chapter.title.toUpperCase()}`,
            font: 'Times New Roman',
            size: 24,
            bold: true
          })
        ],
        spacing: { before: 200, after: 100 },
        indent: { left: 360 }
      })
    );

    // Extract sections from content
    const sections = extractSections(chapter.content, chapter.chapter_number);
    
    sections.forEach(section => {
      const indentLevel = section.level === 3 ? 720 : section.level === 4 ? 1080 : 720;
      
      tocParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.text,
              font: 'Times New Roman',
              size: 22
            })
          ],
          spacing: { after: 80 },
          indent: { left: indentLevel }
        })
      );
    });

    // Add spacing between chapters
    if (chapterIndex < chapters.length - 1) {
      tocParagraphs.push(new Paragraph({ text: '', spacing: { after: 150 } }));
    }
  });

  return tocParagraphs;
}

// Extract section headings from markdown
function extractSections(markdown, chapterNumber) {
  if (!markdown) return [];
  
  const lines = markdown.split('\n');
  const sections = [];
  let skipFirst = true;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Skip first ## heading (chapter title)
    if (trimmed.startsWith('## ') && skipFirst) {
      skipFirst = false;
      return;
    }
    
    // Extract ### headings (main sections)
    if (trimmed.startsWith('### ')) {
      sections.push({
        text: trimmed.replace('### ', ''),
        level: 3
      });
    }
    // Extract #### headings (subsections)
    else if (trimmed.startsWith('#### ')) {
      sections.push({
        text: trimmed.replace('#### ', ''),
        level: 4
      });
    }
  });

  return sections;
}

// Parse and format mathematical expressions
function parseMathematicalText(text) {
  const textRuns = [];
  
  // Replace common LaTeX/markdown math notations
  let processedText = text
    // Fractions: \frac{a}{b} → a/b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    // Square root: \sqrt{x} → √x
    .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
    // Subscript: _{x} or _x → ₓ (for common subscripts)
    .replace(/_\{([^}]+)\}/g, (match, p1) => convertToSubscript(p1))
    .replace(/_([a-zA-Z0-9])/g, (match, p1) => convertToSubscript(p1))
    // Superscript: ^{x} or ^x → ˣ
    .replace(/\^\{([^}]+)\}/g, (match, p1) => convertToSuperscript(p1))
    .replace(/\^([a-zA-Z0-9])/g, (match, p1) => convertToSuperscript(p1))
    // Clean up dollar signs
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    // Greek letters
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\mu/g, 'μ')
    // Math operators
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠');

  return processedText;
}

// Convert to Unicode subscript
function convertToSubscript(char) {
  const subscripts = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'o': 'ₒ', 'u': 'ᵤ',
    'x': 'ₓ', 'n': 'ₙ', 'h': 'ₕ', 'k': 'ₖ', 'l': 'ₗ',
    'm': 'ₘ', 'p': 'ₚ', 's': 'ₛ', 't': 'ₜ'
  };
  return subscripts[char] || `_${char}`;
}

// Convert to Unicode superscript
function convertToSuperscript(char) {
  const superscripts = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'n': 'ⁿ', '+': '⁺', '-': '⁻', '=': '⁼',
    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ'
  };
  return superscripts[char] || `^${char}`;
}

// Convert Markdown to DOCX paragraphs with real tables
async function convertMarkdownToDocx(markdown, images, chapterNumber) {
  const lines = markdown.split('\n');
  const paragraphs = [];
  let skipNextHeading = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      continue;
    }

    // Skip the first ## heading
    if (line.startsWith('## ') && !skipNextHeading) {
      skipNextHeading = true;
      continue;
    }

    // ✅ NEW: Detect and Build Tables
    if (line.startsWith('|')) {
      const tableLines = [line];
      // Look ahead to capture the full table
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        tableLines.push(lines[j].trim());
        j++;
      }
      // Advance the main loop index
      i = j - 1;

      // Filter out the separator line (e.g. |---|---|)
      const contentLines = tableLines.filter(row => !row.includes('---'));
      
      const tableRows = contentLines.map((rowText, rowIndex) => {
        // Remove leading/trailing pipes and split by pipe
        const cells = rowText.split('|').filter((cell, idx, arr) => {
          // Keep cells between pipes (ignore empty first/last if created by split)
          return idx > 0 && idx < arr.length - 1; 
        });

        return new TableRow({
          children: cells.map(cellText => 
            new TableCell({
              children: [new Paragraph({
                children: parseInlineFormatting(cellText.trim(), 22, rowIndex === 0), // Bold header
                alignment: AlignmentType.CENTER
              })],
              shading: rowIndex === 0 ? { fill: "E0E0E0" } : undefined, // Grey header background
              verticalAlign: "center",
              margins: {
                top: 100, bottom: 100, left: 100, right: 100
              }
            })
          )
        });
      });

      if (tableRows.length > 0) {
        paragraphs.push(new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          }
        }));
        // Add spacing after table
        paragraphs.push(new Paragraph({ text: "", spacing: { after: 300 } }));
      }
      continue;
    }

    // Standard Headings
    if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.replace('## ', '').toUpperCase(), font: 'Times New Roman', size: 28, bold: true })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
      }));
    } else if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.replace('### ', ''), font: 'Times New Roman', size: 26, bold: true })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 300 },
      }));
    } else if (line.startsWith('#### ')) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.replace('#### ', ''), font: 'Times New Roman', size: 24, bold: true })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 200 },
      }));
    }
    // Bullet Points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletText = line.replace(/^[-*] /, '');
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: '• ', font: 'Times New Roman', size: 24 }), ...parseInlineFormatting(bulletText, 24)],
        spacing: { after: 100 },
        indent: { left: 720 },
      }));
    }
    // Numbered Lists
    else if (/^\d+\. /.test(line)) {
      paragraphs.push(new Paragraph({
        children: parseInlineFormatting(line, 24),
        spacing: { after: 100 },
        indent: { left: 720 },
      }));
    }
    // Images
    else if (line.includes('{{figure')) {
      const match = line.match(/\{\{figure(\d+)\.(\d+)\}\}/);
      if (match) {
        const figChapter = parseInt(match[1]);
        const figNumber = parseInt(match[2]);
        const imageIndex = figNumber - 1;
        const image = images.find(img => img.placeholder_id === `figure${figChapter}.${figNumber}`) || images[imageIndex];

        if (image && image.buffer) {
          try {
            paragraphs.push(new Paragraph({
              children: [new ImageRun({ data: image.buffer, transformation: { width: 500, height: 400 } })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 100 },
            }));
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: `Figure ${figChapter}.${figNumber}: ${image.caption}`, font: 'Times New Roman', size: 22, italics: true, bold: true })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }));
          } catch (error) {
            paragraphs.push(new Paragraph({ text: `[Figure ${figChapter}.${figNumber}: ${image?.caption || 'Image'}]`, italics: true, alignment: AlignmentType.CENTER }));
          }
        } else {
          paragraphs.push(new Paragraph({ text: `[Figure ${figChapter}.${figNumber} - Image not available]`, italics: true, alignment: AlignmentType.CENTER }));
        }
      }
    }
    // Standard Paragraph
    else {
      paragraphs.push(new Paragraph({
        children: parseInlineFormatting(line, 24),
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 240, line: 360 },
      }));
    }
  }

  return paragraphs;
}

export async function packDocx(doc) {
  return await Packer.toBlob(doc);
}