import { NextResponse } from 'next/server';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  Footer,
  PageNumber,
  ImageRun
} from 'docx';

export async function POST(request) {
  try {
    const { 
      companyName = 'Company', 
      companyAddress = '', 
      department = '', 
      institution = '', 
      course = '', 
      studentName = '', 
      matricNumber = '', 
      duration = '', 
      report = {},
      uploadedVisuals = []
    } = await request.json();

    const { abstract = '', part1 = '', part2 = '', part3 = '', part4 = '' } = report;

    // Helper to convert base64 to Buffer for docx ImageRun
    const base64ToBuffer = (base64Str) => {
      if (!base64Str || typeof base64Str !== 'string') return null;
      try {
        const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
      } catch (e) {
        console.error('Base64 convert error:', e);
        return null;
      }
    };

    // Helper to generate docx image paragraphs for a section
    const getVisualDocxParagraphs = (sectionKey) => {
      if (!Array.isArray(uploadedVisuals)) return [];
      const sectionVisuals = uploadedVisuals.filter(v => v.targetSection === sectionKey && v.data);
      if (sectionVisuals.length === 0) return [];

      const result = [
        new Paragraph({
          text: 'TECHNICAL FIGURES & SCHEMATICS',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 180 }
        })
      ];

      sectionVisuals.forEach((v) => {
        const imageBuffer = base64ToBuffer(v.data);
        if (imageBuffer) {
          result.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: { width: 480, height: 300 }
                })
              ],
              spacing: { before: 180, after: 80 }
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: v.caption ? `${v.caption}` : 'Technical Figure',
                  italic: true,
                  size: 20,
                  color: '555555'
                })
              ],
              spacing: { after: 280 }
            })
          );
        }
      });

      return result;
    };

    // Helper to convert markdown text to docx paragraphs
    const convertMarkdownToDocx = (mdText) => {
      if (!mdText) return [];
      const lines = mdText.split('\n');
      const children = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
          return;
        }

        // Headers
        if (trimmed.startsWith('# ')) {
          children.push(
            new Paragraph({
              text: trimmed.replace('# ', ''),
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 360, after: 180 }
            })
          );
        } else if (trimmed.startsWith('## ')) {
          children.push(
            new Paragraph({
              text: trimmed.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 280, after: 140 }
            })
          );
        } else if (trimmed.startsWith('### ')) {
          children.push(
            new Paragraph({
              text: trimmed.replace('### ', ''),
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 }
            })
          );
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^[\-\*]\s+/, '');
          children.push(
            new Paragraph({
              children: [new TextRun({ text: '• ' + bulletText, size: 24 })],
              spacing: { before: 60, after: 60 },
              indent: { left: 360 }
            })
          );
        } else if (/^\d+\.\s/.test(trimmed)) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, size: 24 })],
              spacing: { before: 60, after: 60 },
              indent: { left: 360 }
            })
          );
        } else {
          // Regular paragraph
          const textWithoutMd = trimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: textWithoutMd,
                  size: 24, // 12pt
                  font: 'Calibri'
                })
              ],
              spacing: { after: 140, line: 276 } // 1.15 line spacing
            })
          );
        }
      });

      return children;
    };

    // Cover Page
    const coverPageChildren = [
      new Paragraph({ text: '', spacing: { before: 720 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: institution ? institution.toUpperCase() : 'TECHNICAL REPORT ON SIWES',
            bold: true,
            size: 32,
            font: 'Calibri'
          })
        ],
        spacing: { after: 360 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: course ? `DEPARTMENT OF ${course.toUpperCase()}` : 'STUDENT INDUSTRIAL WORK EXPERIENCE SCHEME',
            bold: true,
            size: 26,
            color: '404040'
          })
        ],
        spacing: { after: 720 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'TECHNICAL REPORT ON THE STUDENT INDUSTRIAL WORK EXPERIENCE SCHEME (SIWES)',
            bold: true,
            size: 28
          })
        ],
        spacing: { after: 360 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `UNDERTAKEN AT`,
            bold: true,
            size: 22,
            color: '666666'
          })
        ],
        spacing: { after: 180 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: companyName.toUpperCase(),
            bold: true,
            size: 30,
            color: '1A365D'
          })
        ],
        spacing: { after: 120 }
      }),
      companyAddress ? new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: companyAddress, italic: true, size: 22 })],
        spacing: { after: 720 }
      }) : new Paragraph({ text: '', spacing: { after: 720 } }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: duration ? `DURATION: ${duration.toUpperCase()}` : 'DURATION: 6 MONTHS',
            bold: true,
            size: 22
          })
        ],
        spacing: { after: 720 }
      }),

      ...(studentName || matricNumber ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'SUBMITTED BY:',
              bold: true,
              size: 22
            })
          ],
          spacing: { after: 120 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: studentName ? studentName.toUpperCase() : 'STUDENT NAME',
              bold: true,
              size: 24
            })
          ],
          spacing: { after: 60 }
        }),
        matricNumber ? new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `MATRIC NO: ${matricNumber}`,
              bold: true,
              size: 22,
              color: '4A5568'
            })
          ],
          spacing: { after: 720 }
        }) : new Paragraph({ text: '', spacing: { after: 720 } })
      ] : [])
    ];

    // Combine all sections into the document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: coverPageChildren
        },
        {
          properties: {},
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: 'SIWES Technical Report | Page ' }),
                    new TextRun({ children: [PageNumber.CURRENT] })
                  ]
                })
              ]
            })
          },
          children: [
            ...convertMarkdownToDocx(abstract),
            new Paragraph({ text: '', pageBreakBefore: true }),
            ...convertMarkdownToDocx(part1),
            ...getVisualDocxParagraphs('part1'),
            new Paragraph({ text: '', pageBreakBefore: true }),
            ...convertMarkdownToDocx(part2),
            ...getVisualDocxParagraphs('part2'),
            new Paragraph({ text: '', pageBreakBefore: true }),
            ...convertMarkdownToDocx(part3),
            ...getVisualDocxParagraphs('part3'),
            new Paragraph({ text: '', pageBreakBefore: true }),
            ...convertMarkdownToDocx(part4),
            ...getVisualDocxParagraphs('part4')
          ]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `${companyName.replace(/[^a-z0-9]/gi, '_')}_SIWES_Report.docx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('SIWES Export Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export SIWES report' }, { status: 500 });
  }
}
