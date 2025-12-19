// /src/lib/docxExport.js
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';

export async function generateDocx(data) {
  const { project, chapters, images } = data;

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
      // Table of Contents Section
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          new Paragraph({
            text: 'TABLE OF CONTENTS',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),
          ...chapters.map((chapter, index) => 
            new Paragraph({
              text: `CHAPTER ${chapter.chapter_number}: ${chapter.title.toUpperCase()}`,
              spacing: { after: 300, before: 100 },
              indent: { left: 720 },
            })
          ),
        ],
      },

      // Chapters Sections
      ...await Promise.all(chapters.map(async (chapter) => ({
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: await convertMarkdownToDocx(chapter.content || 'Content not available', validImages, chapter.chapter_number),
      }))),
    ],
  });

  return doc;
}

// ✅ Helper function to parse inline formatting (bold, italic)
function parseInlineFormatting(text, fontSize = 24) {
  const textRuns = [];
  let currentIndex = 0;
  
  // Match **bold** or *italic*
  const formatRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let match;
  
  while ((match = formatRegex.exec(text)) !== null) {
    // Add plain text before the match
    if (match.index > currentIndex) {
      const plainText = text.substring(currentIndex, match.index);
      if (plainText) {
        textRuns.push(new TextRun({ 
          text: plainText,
          font: 'Times New Roman',
          size: fontSize
        }));
      }
    }
    
    // Add formatted text
    if (match[2]) {
      // Bold text (**text**)
      textRuns.push(new TextRun({
        text: match[2],
        bold: true,
        font: 'Times New Roman',
        size: fontSize
      }));
    } else if (match[4]) {
      // Italic text (*text*)
      textRuns.push(new TextRun({
        text: match[4],
        italics: true,
        font: 'Times New Roman',
        size: fontSize
      }));
    }
    
    currentIndex = match.index + match[0].length;
  }
  
  // Add remaining plain text
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    if (remainingText) {
      textRuns.push(new TextRun({ 
        text: remainingText,
        font: 'Times New Roman',
        size: fontSize
      }));
    }
  }
  
  // If no formatting found, return plain text
  if (textRuns.length === 0) {
    textRuns.push(new TextRun({ 
      text: text,
      font: 'Times New Roman',
      size: fontSize
    }));
  }
  
  return textRuns;
}

// Convert Markdown to DOCX paragraphs with image embedding
async function convertMarkdownToDocx(markdown, images, chapterNumber) {
  const lines = markdown.split('\n');
  const paragraphs = [];
  let skipNextHeading = false; // Flag to skip AI-generated chapter heading

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      // Empty line - add spacing
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      continue;
    }

    // Skip the first ## heading (AI already adds "CHAPTER X: Title")
    if (line.startsWith('## ') && !skipNextHeading) {
      skipNextHeading = true;
      continue;
    }

    // Handle headings
    if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: line.replace('## ', '').toUpperCase(),
            font: 'Times New Roman',
            size: 28, // 14pt
            bold: true,
          })
        ],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
      }));
    } else if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: line.replace('### ', ''),
            font: 'Times New Roman',
            size: 26, // 13pt
            bold: true,
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 300 },
      }));
    } else if (line.startsWith('#### ')) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: line.replace('#### ', ''),
            font: 'Times New Roman',
            size: 24, // 12pt
            bold: true,
          })
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 200 },
      }));
    }
    // Handle bullet points - ✅ FIXED: Now handles bold text in bullets
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletText = line.replace(/^[-*] /, '');
      const formattedRuns = parseInlineFormatting(bulletText, 24); // 12pt
      
      // Add bullet manually
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ 
            text: '• ',
            font: 'Times New Roman',
            size: 24
          }),
          ...formattedRuns
        ],
        spacing: { after: 100 },
        indent: { left: 720 },
      }));
    }
    // Handle numbered lists - ✅ FIXED: Now handles bold text in lists
    else if (/^\d+\. /.test(line)) {
      paragraphs.push(new Paragraph({
        children: parseInlineFormatting(line, 24), // 12pt
        spacing: { after: 100 },
        indent: { left: 720 },
      }));
    }
    // Handle figure placeholders - EMBED ACTUAL IMAGES (UNCHANGED - this was working!)
    else if (line.includes('{{figure')) {
      const match = line.match(/\{\{figure(\d+)\.(\d+)\}\}/);
      if (match) {
        const figChapter = parseInt(match[1]);
        const figNumber = parseInt(match[2]);
        
        // Find the corresponding image (your original logic - it was working!)
        const imageIndex = figNumber - 1;
        const image = images.find(img => 
          img.placeholder_id === `figure${figChapter}.${figNumber}`
        ) || images[imageIndex];

        if (image && image.buffer) {
          try {
            // Add the actual image
            paragraphs.push(new Paragraph({
              children: [
                new ImageRun({
                  data: image.buffer,
                  transformation: {
                    width: 500,
                    height: 400,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 100 },
            }));

            // Add caption below image
            paragraphs.push(new Paragraph({
              children: [
                new TextRun({
                  text: `Figure ${figChapter}.${figNumber}: ${image.caption}`,
                  font: 'Times New Roman',
                  size: 22, // 11pt for captions
                  italics: true,
                  bold: true,
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }));
          } catch (error) {
            console.error('Error embedding image:', error);
            // Fallback to placeholder text
            paragraphs.push(new Paragraph({
              text: `[Figure ${figChapter}.${figNumber}: ${image?.caption || 'Image'}]`,
              italics: true,
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 },
            }));
          }
        } else {
          // No image found, show placeholder
          paragraphs.push(new Paragraph({
            text: `[Figure ${figChapter}.${figNumber} - Image not available]`,
            italics: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }));
        }
      }
    }
    // Handle tables - ✅ FIXED: Now handles bold text in tables
    else if (line.startsWith('|')) {
      if (!line.includes('---')) {
        paragraphs.push(new Paragraph({
          children: parseInlineFormatting(line.replace(/\|/g, ' | '), 22), // 11pt for tables
          spacing: { after: 100 },
        }));
      }
    }
    // Regular paragraphs - ✅ FIXED: Better bold/italic handling
    else {
      paragraphs.push(new Paragraph({
        children: parseInlineFormatting(line, 24), // 12pt
        alignment: AlignmentType.JUSTIFIED,
        spacing: { 
          after: 240,
          line: 360, // 1.5 line spacing
        },
      }));
    }
  }

  return paragraphs;
}

export async function packDocx(doc) {
  return await Packer.toBlob(doc);
}