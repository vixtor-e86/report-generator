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
  BorderStyle,
  LevelFormat,
  PageBreak,
  VerticalAlign,
  ShadingType,
  FootnoteReferenceRun
} from 'docx';

const ABSTRACT_PROMPT = "You are an academic engineering researcher. Generate a professional Abstract. Project Content: ";

// --- Shared Engineering & Mathematical Parsers ---
function parseMathematicalText(text) {
  if (!text) return "";
  let str = text;

  // Remove LaTeX equation wrappers & delimiters
  str = str.replace(/\\begin\{equation\*?\}/gi, '')
           .replace(/\\end\{equation\*?\}/gi, '')
           .replace(/\\begin\{align\*?\}/gi, '')
           .replace(/\\end\{align\*?\}/gi, '')
           .replace(/\\begin\{aligned\}/gi, '')
           .replace(/\\end\{aligned\}/gi, '')
           .replace(/\\\[/g, '').replace(/\\\]/g, '')
           .replace(/\$\$/g, '').replace(/\$/g, '');

  // LaTeX text wrappers: \text{...}, \mathrm{...}, \mathbf{...}
  str = str.replace(/\\(?:text|mathrm|mathbf|mathit|textnormal|operatorname)\s*\{((?:[^{}]|{[^{}]*})*)\}/g, '$1');

  // Common mathematical functions (\cos -> cos, \sin -> sin, etc.)
  str = str.replace(/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp|max|min|lim|det|dim)\b/g, '$1');

  // Fractions (recursively resolve nested braces: \frac{a}{b} -> (a / b))
  const fracRegex = /\\frac\s*\{((?:[^{}]|{[^{}]*})*)\}\s*\{((?:[^{}]|{[^{}]*})*)\}/g;
  let prev = '';
  while (str !== prev) {
    prev = str;
    str = str.replace(fracRegex, '($1 / $2)');
  }

  // Roots
  str = str.replace(/\\sqrt\[3\]\s*\{((?:[^{}]|{[^{}]*})*)\}/g, '³√($1)');
  str = str.replace(/\\sqrt\s*\{((?:[^{}]|{[^{}]*})*)\}/g, '√($1)');

  // Delimiters
  str = str.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')')
           .replace(/\\left\[/g, '[').replace(/\\right\]/g, ']')
           .replace(/\\left\\\{/g, '{').replace(/\\right\\\}/g, '}')
           .replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');

  // Line breaks and spacing
  str = str.replace(/\\\\/g, '\n')
           .replace(/\\quad/g, '   ').replace(/\\qquad/g, '      ')
           .replace(/\\[,;:!]/g, ' ')
           .replace(/\\%/g, '%')
           .replace(/&/g, ' ');

  // Math operators & relations
  str = str.replace(/\\times/g, '×')
           .replace(/\\cdot/g, '·')
           .replace(/\\div/g, '÷')
           .replace(/\\pm/g, '±')
           .replace(/\\mp/g, '∓')
           .replace(/\\approx/g, '≈')
           .replace(/\\neq|\\ne/g, '≠')
           .replace(/\\leq|\\le/g, '≤')
           .replace(/\\geq|\\ge/g, '≥')
           .replace(/\\equiv/g, '≡')
           .replace(/\\sim/g, '∼')
           .replace(/\\ll/g, '≪')
           .replace(/\\gg/g, '≫')
           .replace(/\\infty/g, '∞')
           .replace(/\\propto/g, '∝')
           .replace(/\\to|\\rightarrow/g, '→')
           .replace(/\\leftarrow/g, '←')
           .replace(/\\Rightarrow/g, '⇒')
           .replace(/\\degree|\\circ|\^\\circ/g, '°')
           .replace(/\\partial/g, '∂')
           .replace(/\\nabla/g, '∇')
           .replace(/\\sum/g, '∑')
           .replace(/\\prod/g, '∏')
           .replace(/\\int/g, '∫')
           .replace(/\\iint/g, '∬')
           .replace(/\\oint/g, '∮');

  // Greek letters (lowercase & uppercase)
  str = str.replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β')
           .replace(/\\gamma/g, 'γ').replace(/\\Gamma/g, 'Γ')
           .replace(/\\delta/g, 'δ').replace(/\\Delta/g, 'Δ')
           .replace(/\\epsilon|\\varepsilon/g, 'ε')
           .replace(/\\zeta/g, 'ζ').replace(/\\eta/g, 'η')
           .replace(/\\theta/g, 'θ').replace(/\\Theta/g, 'Θ')
           .replace(/\\iota/g, 'ι').replace(/\\kappa/g, 'κ')
           .replace(/\\lambda/g, 'λ').replace(/\\Lambda/g, 'Λ')
           .replace(/\\mu/g, 'µ').replace(/\\nu/g, 'ν')
           .replace(/\\xi/g, 'ξ').replace(/\\Xi/g, 'Ξ')
           .replace(/\\pi/g, 'π').replace(/\\Pi/g, 'Π')
           .replace(/\\rho/g, 'ρ').replace(/\\sigma/g, 'σ').replace(/\\Sigma/g, 'Σ')
           .replace(/\\tau/g, 'τ').replace(/\\upsilon/g, 'υ')
           .replace(/\\phi|\\varphi/g, 'φ').replace(/\\Phi/g, 'Φ')
           .replace(/\\chi/g, 'χ').replace(/\\psi/g, 'ψ').replace(/\\Psi/g, 'Ψ')
           .replace(/\\omega/g, 'ω').replace(/\\Omega|\\ohm/g, 'Ω');

  // Superscripts (^2, ^{10}, etc.)
  const SUPERSCRIPTS = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','i':'ⁱ','x':'ˣ','y':'ʸ' };
  str = str.replace(/\^{([0-9\+\-\=ni\(\)]+)}/g, (_, p1) => p1.split('').map(c => SUPERSCRIPTS[c] || c).join(''));
  str = str.replace(/\^([0-9\+\-ni])/g, (_, p1) => SUPERSCRIPTS[p1] || p1);

  // Subscripts (_1, _{in}, _{out}, etc.)
  const SUBSCRIPTS = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋','=':'₌','(':'₍',')':'₎','a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ' };
  str = str.replace(/_([0-9])/g, (_, p1) => SUBSCRIPTS[p1] || p1);
  str = str.replace(/_\{([a-z0-9\+\-\=]+)\}/gi, (match, p1) => {
    const chars = p1.toLowerCase().split('');
    if (chars.every(c => SUBSCRIPTS[c])) {
      return chars.map(c => SUBSCRIPTS[c]).join('');
    }
    return `_${p1}`;
  });
  str = str.replace(/_\{([^}]+)\}/g, '_$1');

  return str.replace(/[ \t]+/g, ' ').trim();
}

function cleanMarkdownStrict(text) {
  if (!text) return "";
  return text
    .replace(/^#+\s+/gm, '') 
    .replace(/\*\*(.*?)\*\*/g, '$1') 
    .replace(/\*(.*?)\*/g, '$1')     
    .replace(/__(.*?)__/g, '$1')
    .replace(/(?:^|\s)_([^_]+)_(?=\s|$|[.,;:!?])/g, ' $1')
    .replace(/`([^`]+)`/g, '$1') 
    .replace(/^>\s*/gm, '')
    .trim();
}

function parseTechnicalText(text) {
  const t = parseMathematicalText(text);
  return cleanMarkdownStrict(t);
}

function formatPdfTechnicalText(rawText) {
  if (!rawText) return "";
  let str = parseTechnicalText(rawText);

  // Greek letter mapping for standard PDF WinAnsi fonts
  const GREEK_PDF = {
    'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'Γ': 'Gamma',
    'δ': 'delta', 'Δ': 'Delta', 'ε': 'epsilon', 'ζ': 'zeta',
    'η': 'eta', 'θ': 'theta', 'Θ': 'Theta', 'ι': 'iota',
    'κ': 'kappa', 'λ': 'lambda', 'Λ': 'Lambda', 'µ': 'u',
    'ν': 'nu', 'ξ': 'xi', 'Ξ': 'Xi', 'π': 'pi', 'Π': 'Pi',
    'ρ': 'rho', 'σ': 'sigma', 'Σ': 'Sigma', 'τ': 'tau',
    'υ': 'upsilon', 'φ': 'phi', 'Φ': 'Phi', 'χ': 'chi',
    'ψ': 'psi', 'Ψ': 'Psi', 'ω': 'omega', 'Ω': 'Ohm'
  };
  for (const [k, v] of Object.entries(GREEK_PDF)) {
    str = str.split(k).join(v);
  }

  // Math relations & symbols mapping for WinAnsi
  const MATH_PDF = {
    '≈': '~=', '≠': '!=', '≤': '<=', '≥': '>=', '≡': '==',
    '∼': '~', '≪': '<<', '≫': '>>', '∝': ' proportional to ',
    '∞': 'inf', '→': '->', '←': '<-', '⇒': '=>',
    '√': 'sqrt', '∂': 'd', '∇': 'grad', '∑': 'sum', '∏': 'prod',
    '∫': 'int', '∬': 'iint', '∮': 'oint'
  };
  for (const [k, v] of Object.entries(MATH_PDF)) {
    str = str.split(k).join(v);
  }

  // Subscripts mapping for PDF: e.g. ₁ -> _1
  const SUB_PDF = {
    '₀':'_0','₁':'_1','₂':'_2','₃':'_3','₄':'_4','₅':'_5','₆':'_6','₇':'_7','₈':'_8','₉':'_9',
    '₊':'+','₋':'-','₌':'=','₍':'(','₎':')',
    'ₐ':'_a','ₑ':'_e','ₕ':'_h','ᵢ':'_i','ⱼ':'_j','ₖ':'_k','ₗ':'_l','ₘ':'_m','ₙ':'_n','ₒ':'_o','ₚ':'_p','ᵣ':'_r','ₛ':'_s','ₜ':'_t','ᵤ':'_u','ᵥ':'_v','ₓ':'_x'
  };
  for (const [k, v] of Object.entries(SUB_PDF)) {
    str = str.split(k).join(v);
  }

  // Superscripts mapping for PDF: e.g. ⁴ -> ^4
  const SUPER_PDF = {
    '⁰':'^0','¹':'^1','²':'^2','³':'^3','⁴':'^4','⁵':'^5','⁶':'^6','⁷':'^7','⁸':'^8','⁹':'^9',
    '⁺':'^+','⁻':'^-','⁼':'^=','⁽':'^(','⁾':'^)','ⁿ':'^n','ⁱ':'^i','ˣ':'^x','ʸ':'^y'
  };
  for (const [k, v] of Object.entries(SUPER_PDF)) {
    str = str.split(k).join(v);
  }

  // Group multi-character subscripts (e.g. _o_u_t -> _out)
  str = str.replace(/_([a-zA-Z0-9])(?:_([a-zA-Z0-9]))+/g, match => '_' + match.replace(/_/g, ''));

  // Strip characters outside WinAnsi range to prevent modulo 256 wrap-around corruptions
  str = str.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

  return str.trim();
}

function isEquationLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('$$') || trimmed.endsWith('$$') || trimmed.startsWith('\\[') || trimmed.startsWith('\\begin{equation')) return true;
  if (/^(?:Equation|\(Eq\.?)\s*[\d\.]+/i.test(trimmed)) return true;
  if (trimmed.includes('=') || trimmed.includes('≈') || trimmed.includes('≤') || trimmed.includes('≥') || trimmed.includes('∝')) {
    const words = trimmed.split(/\s+/);
    if (words.length <= 16 && /[\\√\+\-\*\/\^×·÷±_Ωμπθαβγδε]/.test(trimmed)) {
      return true;
    }
  }
  return false;
}

function parseInlineFormatting(text, fontSize = 24, isBold = false) {
  const processedText = parseMathematicalText(text);
  const rawRuns = [];
  let currentIndex = 0;
  // Match bold (**text**), italic (*text*), and inline calculation/code (`calc`)
  const formatRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let match;
  while ((match = formatRegex.exec(processedText)) !== null) {
    if (match.index > currentIndex) {
      rawRuns.push(new TextRun({ 
        text: processedText.substring(currentIndex, match.index), 
        font: 'Times New Roman', 
        size: fontSize, 
        bold: isBold 
      }));
    }
    if (match[2]) {
      // Bold
      rawRuns.push(new TextRun({ 
        text: match[2], 
        bold: true, 
        font: 'Times New Roman', 
        size: fontSize 
      }));
    } else if (match[4]) {
      // Italic
      rawRuns.push(new TextRun({ 
        text: match[4], 
        italics: true, 
        font: 'Times New Roman', 
        size: fontSize, 
        bold: isBold 
      }));
    } else if (match[6]) {
      // Inline Code / Variable / Formula
      rawRuns.push(new TextRun({ 
        text: match[6], 
        font: 'Consolas', 
        size: Math.max(20, fontSize - 2), 
        bold: true, 
        color: '1E293B' 
      }));
    }
    currentIndex = match.index + match[0].length;
  }
  if (currentIndex < processedText.length) {
    rawRuns.push(new TextRun({ 
      text: processedText.substring(currentIndex), 
      font: 'Times New Roman', 
      size: fontSize, 
      bold: isBold 
    }));
  }
  if (rawRuns.length === 0) {
    rawRuns.push(new TextRun({ 
      text: processedText, 
      font: 'Times New Roman', 
      size: fontSize, 
      bold: isBold 
    }));
  }

  // Expand any Footnote references [^1] into native FootnoteReferenceRun
  const finalRuns = [];
  for (const run of rawRuns) {
    const textStr = run.text || '';
    if (textStr.includes('[^')) {
      const parts = textStr.split(/(\[\^\d+\])/g);
      for (const part of parts) {
        const fnMatch = part.match(/^\[\^(\d+)\]$/);
        if (fnMatch) {
          finalRuns.push(new FootnoteReferenceRun(Number(fnMatch[1])));
        } else if (part) {
          finalRuns.push(new TextRun({ 
            text: part, 
            font: run.font || 'Times New Roman', 
            size: fontSize, 
            bold: run.bold, 
            italics: run.italics, 
            color: run.color 
          }));
        }
      }
    } else {
      finalRuns.push(run);
    }
  }

  return finalRuns;
}

// --- DOCX PRELIMINARY PAGES HELPERS ---
function createDocxCover(metadata) {
    return [
        new Paragraph({ children: [new TextRun({ text: metadata.university.toUpperCase(), bold: true, size: 32, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 800 } }),
        new Paragraph({ children: [new TextRun({ text: (metadata.faculty || "").toUpperCase(), bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: (metadata.department || "").toUpperCase(), bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 1200 } }),
        new Paragraph({ children: [new TextRun({ text: (metadata.projectTitle || "").toUpperCase(), bold: true, size: 36, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 1200 } }),
        new Paragraph({ children: [new TextRun({ text: "BY", bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: (metadata.studentName || "").toUpperCase(), bold: true, size: 32, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: metadata.matricNo, bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 1200 } }),
        new Paragraph({ children: [new TextRun({ text: `A PROJECT SUBMITTED TO THE DEPARTMENT OF ${metadata.department.toUpperCase()}, ${metadata.university.toUpperCase()}, IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF BACHELOR OF SCIENCE (B.Sc.) DEGREE IN ${metadata.department.toUpperCase()}.`, size: 24, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 800 } }),
        new Paragraph({ children: [new TextRun({ text: `SUPERVISED BY: ${metadata.supervisor.toUpperCase()}`, bold: true, size: 24, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: metadata.session, bold: true, size: 28, font: 'Times New Roman' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: metadata.date.toUpperCase(), bold: true, size: 24, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })
    ];
}

function createDocxDeclaration(metadata) {
    return [
        new Paragraph({ text: 'DECLARATION', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 800 } }),
        new Paragraph({ children: [new TextRun({ text: `I, ${metadata.studentName.toUpperCase()}, do hereby declare that this project is entirely my work and composition. The work embodied in this project has not been submitted in candidature for any degree and is not concurrently being submitted for any other degree. All references made to the works of other people have been duly acknowledged.`, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 1200 } }),
        new Paragraph({ children: [new TextRun({ text: "NAME OF STUDENT: _________________________________", font: 'Times New Roman', size: 24 })], spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: "SIGNATURE: _______________________________________", font: 'Times New Roman', size: 24 })], spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: `DATE: ____________________________________________`, font: 'Times New Roman', size: 24 })] })
    ];
}

function createDocxCertification(metadata) {
    return [
        new Paragraph({ text: 'CERTIFICATION', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 800 } }),
        new Paragraph({ children: [new TextRun({ text: `This is to certify that the research work was carried out by ${metadata.studentName.toUpperCase()} in the Department of ${metadata.department.toUpperCase()}, ${metadata.faculty.toUpperCase()}, ${metadata.university.toUpperCase()}. The research work is considered adequate in partial fulfillment of the requirements for the award of B.Sc. in ${metadata.department.toUpperCase()}.`, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 1200 } }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: BorderStyle.NONE,
            rows: [
                new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: metadata.supervisor, bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }), new Paragraph({ text: "Project Supervisor", alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } }),
                    new TableCell({ children: [new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Date", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } })
                ] }),
                new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ text: "", spacing: { before: 800 } }), new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: metadata.hod, bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }), new Paragraph({ text: "Head of Department", alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } }),
                    new TableCell({ children: [new Paragraph({ text: "", spacing: { before: 800 } }), new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Date", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } })
                ] }),
                new TableRow({ children: [
                    new TableCell({ children: [new Paragraph({ text: "", spacing: { before: 800 } }), new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: metadata.externalExaminer || "External Examiner", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }), new Paragraph({ text: "External Examiner", alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } }),
                    new TableCell({ children: [new Paragraph({ text: "", spacing: { before: 800 } }), new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Date", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })], borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE } })
                ] })
            ]
        })
    ];
}

// --- PDF PRELIMINARY PAGES HELPERS ---
function drawPdfCover(pdf, metadata) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    pdf.setFont("times", "bold"); pdf.setFontSize(22); 
    const univ = pdf.splitTextToSize(metadata.university.toUpperCase(), 170);
    pdf.text(univ, centerX, 40, { align: 'center' });
    
    pdf.setFontSize(16); 
    const fac = pdf.splitTextToSize((metadata.faculty || "").toUpperCase(), 170);
    pdf.text(fac, centerX, 55 + (univ.length > 1 ? (univ.length - 1) * 8 : 0), { align: 'center' });
    
    const dept = pdf.splitTextToSize((metadata.department || "").toUpperCase(), 170);
    pdf.text(dept, centerX, 65 + (univ.length > 1 ? (univ.length - 1) * 8 : 0) + (fac.length > 1 ? (fac.length - 1) * 6 : 0), { align: 'center' });
    
    let currentY = 100;
    pdf.setFontSize(24); const title = pdf.splitTextToSize((metadata.projectTitle || "").toUpperCase(), 160);
    pdf.text(title, centerX, currentY, { align: 'center' });
    currentY += (title.length * 10) + 10;
    
    pdf.setFontSize(16); pdf.text("BY", centerX, currentY, { align: 'center' });
    currentY += 15;
    pdf.setFontSize(20); 
    const name = pdf.splitTextToSize((metadata.studentName || "").toUpperCase(), 170);
    pdf.text(name, centerX, currentY, { align: 'center' });
    currentY += (name.length * 8);
    pdf.setFontSize(16); pdf.text(metadata.matricNo, centerX, currentY, { align: 'center' });
    currentY += 25;
    
    pdf.setFont("times", "normal"); pdf.setFontSize(12);
    const subText = `A PROJECT SUBMITTED TO THE DEPARTMENT OF ${metadata.department.toUpperCase()}, ${metadata.university.toUpperCase()}, IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF BACHELOR OF SCIENCE (B.Sc.) DEGREE IN ${metadata.department.toUpperCase()}.`;
    const wrappedSubText = pdf.splitTextToSize(subText, 160);
    pdf.text(wrappedSubText, centerX, currentY, { align: 'center' });
    currentY += (wrappedSubText.length * 6) + 15;
    
    pdf.setFont("times", "bold"); 
    const supervisor = pdf.splitTextToSize(`SUPERVISED BY: ${metadata.supervisor.toUpperCase()}`, 170);
    pdf.text(supervisor, centerX, currentY, { align: 'center' });
    currentY += (supervisor.length * 8) + 10;
    
    pdf.setFontSize(16); pdf.text(metadata.session, centerX, currentY, { align: 'center' });
    currentY += 15;
    pdf.setFontSize(14); pdf.text(metadata.date.toUpperCase(), centerX, currentY, { align: 'center' });
}

function drawPdfDeclaration(pdf, metadata) {
    pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("DECLARATION", 105, 40, { align: 'center' });
    pdf.setFont("times", "normal"); pdf.setFontSize(12);
    const decText = `I, ${metadata.studentName.toUpperCase()}, do hereby declare that this project is entirely my work and composition. The work embodied in this project has not been submitted in candidature for any degree and is not concurrently being submitted for any other degree. All references made to the works of other people have been duly acknowledged.`;
    pdf.text(pdf.splitTextToSize(decText, 170), 20, 70, { align: 'justify', maxWidth: 170 });
    
    pdf.text("NAME OF STUDENT: _________________________________", 20, 120);
    pdf.text("SIGNATURE: _______________________________________", 20, 140);
    pdf.text(`DATE: ____________________________________________`, 20, 160);
}

function drawPdfCertification(pdf, metadata) {
    pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("CERTIFICATION", 105, 40, { align: 'center' });
    pdf.setFont("times", "normal"); pdf.setFontSize(12);
    const certText = `This is to certify that the research work was carried out by ${metadata.studentName.toUpperCase()} in the Department of ${metadata.department.toUpperCase()}, ${metadata.faculty.toUpperCase()}, ${metadata.university.toUpperCase()}. The research work is considered adequate in partial fulfillment of the requirements for the award of B.Sc. in ${metadata.department.toUpperCase()}.`;
    pdf.text(pdf.splitTextToSize(certText, 170), 20, 70, { align: 'justify', maxWidth: 170 });
    
    const sy = 120;
    pdf.text("__________________________", 20, sy); pdf.setFont("times", "bold"); pdf.text(metadata.supervisor, 20, sy + 7); pdf.setFont("times", "normal"); pdf.text("Project Supervisor", 20, sy + 14);
    pdf.text("__________________________", 130, sy); pdf.setFont("times", "bold"); pdf.text("Date", 130, sy + 7);
    
    const hy = 160;
    pdf.setFont("times", "normal"); pdf.text("__________________________", 20, hy); pdf.setFont("times", "bold"); pdf.text(metadata.hod, 20, hy + 7); pdf.setFont("times", "normal"); pdf.text("Head of Department", 20, hy + 14);
    pdf.text("__________________________", 130, hy); pdf.setFont("times", "bold"); pdf.text("Date", 130, hy + 7);
    
    const ey = 200;
    pdf.setFont("times", "normal"); pdf.text("__________________________", 20, ey); pdf.setFont("times", "bold"); pdf.text(metadata.externalExaminer || "External Examiner", 20, ey + 7); pdf.setFont("times", "normal"); pdf.text("External Examiner", 20, ey + 14);
    pdf.text("__________________________", 130, ey); pdf.setFont("times", "bold"); pdf.text("Date", 130, ey + 7);
}

// --- NEW: Reference Extractor Logic ---
function extractMasterReferences(chapters, dbReferences, referenceStyle = 'APA') {
  const masterMap = new Map(); // Key: Normalized title, Value: Original formatted text
  
  const normalize = (text) => {
    if (!text) return "";
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  };

  if (dbReferences) {
    dbReferences.forEach(r => {
      const auths = Array.isArray(r.authors) ? r.authors.join(', ') : (r.authors || 'Unknown');
      let refText = "";
      const styleUpper = (referenceStyle || 'APA').toUpperCase();
      if (styleUpper === 'IEEE') {
        refText = `${auths}, "${r.title}," ${r.venue || 'Research Journal'}, ${r.year}.`;
      } else if (styleUpper === 'HARVARD') {
        refText = `${auths} (${r.year}) ${r.title}. ${r.venue || 'Research Journal'}.`;
      } else if (styleUpper === 'MLA') {
        refText = `${auths}. "${r.title}." ${r.venue || 'Research Journal'}, ${r.year}.`;
      } else {
        refText = `${auths} (${r.year}). "${r.title}". ${r.venue || 'Research Journal'}.`;
      }
      const key = normalize(r.title);
      if (key && !masterMap.has(key)) masterMap.set(key, refText.trim());
    });
  }

  chapters.forEach(ch => {
    const content = ch.content || "";
    const parts = content.split(/## References|### References/i);
    if (parts.length > 1) {
      const refSection = parts[parts.length - 1].trim();
      const lines = refSection.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        const cleaned = trimmed.replace(/^(\[?\d+\]?\.?|\-|\*)\s+/, '').trim();
        if (cleaned.length > 30) {
          const titleMatch = cleaned.match(/"(.*?)"/) || cleaned.match(/\)\.\s+(.*?)\./);
          const titleKey = titleMatch ? normalize(titleMatch[1]) : normalize(cleaned.substring(0, 100));
          if (titleKey && !masterMap.has(titleKey)) masterMap.set(titleKey, cleaned);
        }
      });
    }
  });

  return Array.from(masterMap.values()).sort();
}

export async function POST(request) {
  try {
    const { projectId, userId, type, orderedDocIds, options } = await request.json();
    if (!projectId || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const referenceStyle = options?.referenceStyle || 'APA';

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*, custom_templates(*)').eq('id', projectId).single();
    let { data: chapters } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).order('chapter_number', { ascending: true });
    
    // Filter to only selected chapters for Custom Projects
    if (project?.is_custom && Array.isArray(project.selected_chapters) && project.selected_chapters.length > 0) {
      chapters = chapters.filter(c => project.selected_chapters.includes(c.chapter_number));
    }
    
    const { data: dbReferences } = await supabaseAdmin.from('premium_research_papers').select('*').eq('project_id', projectId).order('created_at', { ascending: true });

    const finalMasterReferences = extractMasterReferences(chapters, dbReferences, referenceStyle);
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
      const docSections = [];
      const numbering = { config: [{ reference: "numeric-list", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT }] }, { reference: "bullet-list", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT }] }] };

      // 1. Cover
      if (options.coverConfig.type === 'form') {
        docSections.push({ children: createDocxCover(options.metadata) });
      } else if ((options.coverConfig.type === 'asset' || options.coverConfig.type === 'upload')) {
          const imgUrl = options.coverConfig.type === 'asset' ? options.coverConfig.assetUrl : options.coverConfig.uploadUrl;
          if (imgUrl) {
            try {
                const imgData = options.coverConfig.type === 'asset' ? imageMap[options.coverConfig.assetId] : Buffer.from(imgUrl.split(',')[1], 'base64');
                docSections.push({ children: [new Paragraph({ children: [new ImageRun({ data: imgData, transformation: { width: 600, height: 840 } })], alignment: AlignmentType.CENTER })] });
            } catch (e) {}
          }
      }

      // 2. Technical Pages
      if (options.coverConfig.type === 'form') {
          if (options.coverConfig.includeDeclaration) docSections.push({ children: createDocxDeclaration(options.metadata) });
          if (options.coverConfig.includeCertification) docSections.push({ children: createDocxCertification(options.metadata) });
          if (options.coverConfig.includeDedication && options.metadata.dedication) {
            docSections.push({ children: [new Paragraph({ text: 'DEDICATION', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 800 } }), new Paragraph({ children: [new TextRun({ text: options.metadata.dedication, font: 'Times New Roman', size: 24, italics: true })], alignment: AlignmentType.CENTER })] });
          }
          if (options.coverConfig.includeAcknowledgement && options.metadata.acknowledgement) {
            docSections.push({ children: [new Paragraph({ text: 'ACKNOWLEDGEMENT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 800 } }), new Paragraph({ children: [new TextRun({ text: options.metadata.acknowledgement, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED })] });
          }
      }

      // 3. Abstract
      if (abstract) {
        docSections.push({ children: [new Paragraph({ text: 'ABSTRACT', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }), new Paragraph({ children: [new TextRun({ text: parseTechnicalText(abstract), font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED })] });
      }

      // 4. TOC
      if (options.includeTOC && project.custom_templates) {
        const tocItems = [new Paragraph({ text: 'TABLE OF CONTENTS', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } })];
        const rawChapters = project.custom_templates?.structure?.chapters || [];
        const rawNums = rawChapters.map(c => c.number || c.chapter);
        const hasDuplicates = rawNums.length > 1 && (new Set(rawNums.filter(Boolean)).size !== rawNums.length || rawNums.some(n => !n));

        rawChapters.forEach((ch, idx) => {
          const chNum = hasDuplicates ? (idx + 1) : (ch.chapter || ch.number || ch.id || (idx + 1));
          tocItems.push(new Paragraph({ children: [new TextRun({ text: `Chapter ${chNum}: ${ch.title}`, bold: true, size: 24, font: 'Times New Roman' })], spacing: { before: 200 } }));
          ch.sections?.filter(s => s && s.trim()).forEach(s => tocItems.push(new Paragraph({ text: s, indent: { left: 720 }, spacing: { before: 100 } })));
        });
        docSections.push({ children: tocItems });
      }

      // 5. Chapters
      const docFootnotes = {};

      for (const ch of chapters) {
        const chapterChildren = [
          new Paragraph({ children: [new TextRun({ text: `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`, font: 'Times New Roman', size: 32, bold: true })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } })
        ];

        const contentBody = (ch.content || "").split(/### References|## References|### Bibliography|## Bibliography/i)[0];
        const rawLines = contentBody.split('\n');

        // Pre-scan chapter for footnote definitions [^1]: Text
        for (const rLine of rawLines) {
          const fnMatch = rLine.trim().match(/^\[\^(\d+)\]:\s*(.+)$/);
          if (fnMatch) {
            const id = Number(fnMatch[1]);
            const text = fnMatch[2].trim();
            docFootnotes[id] = {
              children: [
                new Paragraph({
                  children: [new TextRun({ text, font: 'Times New Roman', size: 20 })],
                  spacing: { after: 100 }
                })
              ]
            };
          }
        }

        const filteredLines = rawLines.filter((line, index) => {
          const t = line.trim().toUpperCase();
          if (!t) return true;
          // Skip footnote definitions from body text since Word places them in the page footer
          if (/^\[\^(\d+)\]:/.test(line.trim())) return false;
          const isTitle = t === `CHAPTER ${ch.chapter_number}` || t === ch.title.toUpperCase() || t === `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`;
          if (index < 5 && isTitle) return false;
          if (line.startsWith('#')) {
            const clean = line.replace(/^#+\s+/, '').toUpperCase();
            if (clean === `CHAPTER ${ch.chapter_number}` || clean === ch.title.toUpperCase() || clean === `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`) return false;
          }
          return true;
        });

        for (let i = 0; i < filteredLines.length; i++) {
          const line = filteredLines[i].trim(); if (!line) continue;

          // 1. Multi-line Code / Calculation Block (```...```)
          if (line.startsWith('```')) {
            const codeLines = [];
            let j = i + 1;
            while (j < filteredLines.length && !filteredLines[j].trim().startsWith('```')) {
              codeLines.push(filteredLines[j]);
              j++;
            }
            i = j;

            const cellChildren = codeLines.map(cl => new Paragraph({
              children: [new TextRun({ 
                text: parseMathematicalText(cl), 
                font: 'Consolas', 
                size: 20, 
                color: '0F172A' 
              })],
              spacing: { before: 40, after: 40, line: 240 }
            }));

            if (cellChildren.length === 0) {
              cellChildren.push(new Paragraph({ text: "" }));
            }

            chapterChildren.push(new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "4F46E5" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: cellChildren,
                      shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
                      margins: { top: 160, bottom: 160, left: 240, right: 240 }
                    })
                  ]
                })
              ]
            }));
            chapterChildren.push(new Paragraph({ text: "", spacing: { after: 120 } }));
            continue;
          }

          // 2. Blockquote / Indented Formula (> ...)
          if (line.startsWith('>')) {
            const cleanQuote = line.replace(/^>\s*/, '');
            chapterChildren.push(new Paragraph({
              children: parseInlineFormatting(cleanQuote, 22),
              indent: { left: 720 },
              border: { left: { style: BorderStyle.SINGLE, size: 3, color: "CBD5E1", space: 10 } },
              spacing: { before: 120, after: 120, line: 320 },
              alignment: AlignmentType.LEFT
            }));
            continue;
          }

          // 3. Tables (| ... |)
          if (line.startsWith('|')) {
            const tableRows = []; let j = i; let rowCount = 0;
            while (j < filteredLines.length && filteredLines[j].trim().startsWith('|')) {
              const r = filteredLines[j].trim();
              if (!r.includes('---')) {
                const isHeader = rowCount === 0;
                const cells = r.split('|').slice(1, -1).map(c => new TableCell({ 
                  children: [new Paragraph({ children: parseInlineFormatting(c.trim() || "\u00A0", isHeader ? 22 : 20, isHeader), alignment: AlignmentType.CENTER })], 
                  borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
                  shading: isHeader ? { fill: "F3F4F6", type: ShadingType.CLEAR } : undefined,
                  verticalAlign: VerticalAlign.CENTER
                }));
                tableRows.push(new TableRow({ children: cells, tableHeader: isHeader }));
                rowCount++;
              }
              j++;
            }
            chapterChildren.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            chapterChildren.push(new Paragraph({ text: "" })); i = j - 1; continue;
          }

          // 4. Images (![...](...))
          const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
          if (imgMatch) {
            const asset = assets.find(a => a.file_url === imgMatch[1]);
            if (asset && imageMap[asset.id]) {
              chapterChildren.push(new Paragraph({ children: [new ImageRun({ data: imageMap[asset.id], transformation: { width: 500, height: 350 } })], alignment: AlignmentType.CENTER }));
              chapterChildren.push(new Paragraph({ children: [new TextRun({ text: `Figure: ${asset.caption || asset.original_name}`, italics: true, size: 20, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }));
              continue;
            }
          }

          // 5. Headings
          if (line.startsWith('## ') || line.startsWith('### ')) {
            const cleanText = line.replace(/^#+\s+/, '');
            chapterChildren.push(new Paragraph({ children: [new TextRun({ text: cleanText, font: 'Times New Roman', size: 28, bold: true })], heading: HeadingLevel.HEADING_2, alignment: AlignmentType.LEFT, spacing: { before: 200, after: 200 } }));
          } else if (line.startsWith('#### ')) {
            chapterChildren.push(new Paragraph({ children: [new TextRun({ text: line.replace('#### ', ''), font: 'Times New Roman', size: 24, bold: true })], heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 150 } }));
          } 
          // 6. Lists
          else if (/^\d+\.\s/.test(line)) {
            chapterChildren.push(new Paragraph({ children: parseInlineFormatting(line.replace(/^\d+\.\s/, ''), 24), numbering: { reference: "numeric-list", level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 360 } }));
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            chapterChildren.push(new Paragraph({ children: parseInlineFormatting(line.substring(2), 24), numbering: { reference: "bullet-list", level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 360 } }));
          } 
          // 7. Standalone Equation / Calculation Line (Centered, never justified)
          else if (isEquationLine(line)) {
            chapterChildren.push(new Paragraph({ 
              children: parseInlineFormatting(line, 24, true), 
              alignment: AlignmentType.CENTER, 
              spacing: { before: 160, after: 160, line: 360 } 
            }));
          } 
          // 8. Normal Body Paragraph
          else {
            chapterChildren.push(new Paragraph({ children: parseInlineFormatting(line), alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 360 } }));
          }
        }
        docSections.push({ children: chapterChildren });
      }
      
      if (finalMasterReferences.length > 0) {
        docSections.push({ children: [
          new Paragraph({ text: 'REFERENCES', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }), 
          ...finalMasterReferences.map((ref, i) => new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${ref}`, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 150 } }))
        ] });
      }

      finalBuffer = await Packer.toBuffer(new Document({ 
        sections: docSections, 
        numbering,
        footnotes: Object.keys(docFootnotes).length > 0 ? docFootnotes : undefined 
      }));
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      let currPage = 1;
      const footer = () => { if (options.includePageNumbers) { pdf.setFont("times", "normal"); pdf.setFontSize(10); pdf.setTextColor(150, 150, 150); pdf.text("Page " + currPage, 105, 285, { align: 'center' }); pdf.setTextColor(0, 0, 0); } };
      
      // 1. Cover
      if (options.coverConfig.type === 'form') {
        drawPdfCover(pdf, options.metadata);
        footer(); pdf.addPage(); currPage++;
        if (options.coverConfig.includeDeclaration) { drawPdfDeclaration(pdf, options.metadata); footer(); pdf.addPage(); currPage++; }
        if (options.coverConfig.includeCertification) { drawPdfCertification(pdf, options.metadata); footer(); pdf.addPage(); currPage++; }
        if (options.coverConfig.includeDedication && options.metadata.dedication) {
            pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("DEDICATION", 105, 40, { align: 'center' });
            pdf.setFont("times", "italic"); pdf.setFontSize(12); pdf.text(pdf.splitTextToSize(options.metadata.dedication, 160), 105, 70, { align: 'center' });
            footer(); pdf.addPage(); currPage++;
        }
        if (options.coverConfig.includeAcknowledgement && options.metadata.acknowledgement) {
            pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("ACKNOWLEDGEMENT", 105, 40, { align: 'center' });
            pdf.setFont("times", "normal"); pdf.setFontSize(12); pdf.text(pdf.splitTextToSize(options.metadata.acknowledgement, 170), 20, 70, { align: 'justify' });
            footer(); pdf.addPage(); currPage++;
        }
      } else if (options.coverConfig.type === 'asset' || options.coverConfig.type === 'upload') {
        const imgUrl = options.coverConfig.type === 'asset' ? options.coverConfig.assetUrl : options.coverConfig.uploadUrl;
        if (imgUrl) { try { pdf.addImage(imgUrl, 'JPEG', 0, 0, 210, 297); footer(); pdf.addPage(); currPage++; } catch (e) {} }
      }

      // 2. Abstract
      if (abstract) {
        pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("ABSTRACT", 105, 40, { align: 'center' });
        pdf.setFont("times", "normal"); pdf.setFontSize(12); pdf.text(pdf.splitTextToSize(formatPdfTechnicalText(abstract), 170), 20, 60, { align: 'justify' });
        footer(); pdf.addPage(); currPage++;
      }

      // 3. TOC
      if (options.includeTOC && project.custom_templates) {
        pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("TABLE OF CONTENTS", 20, 40);
        pdf.setFontSize(12); let ty = 60;
        const rawPdfChapters = project.custom_templates?.structure?.chapters || [];
        const rawPdfNums = rawPdfChapters.map(c => c.number || c.chapter);
        const hasPdfDuplicates = rawPdfNums.length > 1 && (new Set(rawPdfNums.filter(Boolean)).size !== rawPdfNums.length || rawPdfNums.some(n => !n));

        rawPdfChapters.forEach((ch, idx) => {
          if (ty > 270) { footer(); pdf.addPage(); currPage++; ty = 30; }
          const chNum = hasPdfDuplicates ? (idx + 1) : (ch.chapter || ch.number || ch.id || (idx + 1));
          pdf.setFont("times", "bold"); pdf.text(`Chapter ${chNum}: ${ch.title}`, 20, ty); ty += 8;
          pdf.setFont("times", "normal"); ch.sections?.filter(s => s && s.trim()).slice(0,5).forEach(s => { pdf.text("- " + s, 30, ty); ty += 6; }); ty += 4;
        });
        footer(); pdf.addPage(); currPage++;
      }

      // 4. Chapters
      for (const ch of chapters) {
        pdf.setFont("times", "bold"); pdf.setFontSize(22); pdf.text(`CHAPTER ${ch.chapter_number}: ${(ch.title || "").toUpperCase()}`, 105, 30, { align: 'center' });
        pdf.setFont("times", "normal"); pdf.setFontSize(12);
        
        const rawLines = (ch.content || "").split(/### References|## References/i)[0].split('\n');
        const filteredLines = rawLines.filter((line, index) => {
          const t = line.trim().toUpperCase(); if (!t) return true;
          const isTitle = t === `CHAPTER ${ch.chapter_number}` || t === ch.title.toUpperCase() || t === `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`;
          if (index < 5 && isTitle) return false;
          if (line.startsWith('#')) {
            const clean = line.replace(/^#+\s+/, '').toUpperCase();
            if (clean === `CHAPTER ${ch.chapter_number}` || clean === ch.title.toUpperCase() || clean === `CHAPTER ${ch.chapter_number}: ${ch.title.toUpperCase()}`) return false;
          }
          return true;
        });

        let y = 45;
        for (let i = 0; i < filteredLines.length; i++) {
          const line = filteredLines[i].trim(); if (!line) continue;

          // A. Multi-line Code / Calculation Block
          if (line.startsWith('```')) {
            const codeLines = [];
            let j = i + 1;
            while (j < filteredLines.length && !filteredLines[j].trim().startsWith('```')) {
              codeLines.push(formatPdfTechnicalText(filteredLines[j]));
              j++;
            }
            i = j; // Advance outer loop past closing backticks

            if (codeLines.length === 0) continue;

            pdf.setFont("courier", "normal");
            pdf.setFontSize(10);
            const lineH = 5.2;
            const padY = 4;
            const estHeight = (codeLines.length * lineH) + (padY * 2);

            if (y + estHeight > 270 && estHeight <= 230) {
              footer(); pdf.addPage(); currPage++; y = 30;
            }

            const startY = y;
            const boxHeight = Math.min(estHeight, 275 - startY);

            // Subtle slate background (#F8FAFC) & light border (#E2E8F0)
            pdf.setFillColor(248, 250, 252);
            pdf.setDrawColor(226, 232, 240);
            pdf.rect(20, startY, 170, boxHeight, 'FD');

            // Left purple accent border (#4F46E5)
            pdf.setFillColor(79, 70, 229);
            pdf.rect(20, startY, 2.5, boxHeight, 'F');

            pdf.setTextColor(30, 41, 59);
            let cy = startY + padY + 3.5;
            for (const cl of codeLines) {
              if (cy > 275) {
                footer(); pdf.addPage(); currPage++; cy = 30;
              }
              pdf.text(cl || " ", 25, cy);
              cy += lineH;
            }

            pdf.setTextColor(0, 0, 0);
            pdf.setFont("times", "normal");
            pdf.setFontSize(12);
            y = cy + 4;
            continue;
          }

          // B. Blockquote
          if (line.startsWith('>')) {
            const quoteText = formatPdfTechnicalText(line.replace(/^>\s*/, ''));
            pdf.setFont("times", "italic");
            pdf.setFontSize(11);
            const splitQuote = pdf.splitTextToSize(quoteText, 160);
            const qHeight = (splitQuote.length * 6) + 4;
            if (y + qHeight > 270) { footer(); pdf.addPage(); currPage++; y = 30; }

            pdf.setDrawColor(79, 70, 229);
            pdf.setLineWidth(0.8);
            pdf.line(22, y - 1, 22, y + qHeight - 3);
            pdf.setLineWidth(0.2);
            pdf.setDrawColor(0, 0, 0);

            pdf.setTextColor(71, 85, 105);
            for (const q of splitQuote) {
              pdf.text(q, 26, y + 3);
              y += 6;
            }
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("times", "normal");
            pdf.setFontSize(12);
            y += 4;
            continue;
          }

          // C. Standalone Equation / Calculation Line
          if (isEquationLine(line)) {
            const parsedEq = formatPdfTechnicalText(line);
            pdf.setFont("times", "bold");
            pdf.setFontSize(12);
            if (y > 270) { footer(); pdf.addPage(); currPage++; y = 30; }
            y += 2;
            pdf.text(parsedEq, 105, y, { align: 'center' });
            y += 8;
            pdf.setFont("times", "normal");
            continue;
          }

          // D. Section Headings
          if (line.startsWith('## ') || line.startsWith('### ')) {
            pdf.setFont("times", "bold"); pdf.setFontSize(15);
            if (y > 270) { footer(); pdf.addPage(); currPage++; y = 30; }
            pdf.text(line.replace(/^#+\s+/, ''), 20, y); y += 10;
            pdf.setFont("times", "normal"); pdf.setFontSize(12); continue;
          }
          if (line.startsWith('#### ')) {
            pdf.setFont("times", "bold"); pdf.setFontSize(12);
            if (y > 270) { footer(); pdf.addPage(); currPage++; y = 30; }
            pdf.text(line.replace('#### ', ''), 20, y); y += 8;
            pdf.setFont("times", "normal"); pdf.setFontSize(12); continue;
          }

          // E. Markdown Tables
          if (line.startsWith('|')) {
            const rows = []; let j = i;
            while (j < filteredLines.length && filteredLines[j].trim().startsWith('|')) {
              const r = filteredLines[j].trim();
              if (!r.includes('---')) rows.push(r.split('|').slice(1, -1).map(c => formatPdfTechnicalText(c.trim() || "\u00A0")));
              j++;
            }
            autoTable(pdf, { startY: y, head: [rows[0]], body: rows.slice(1), theme: 'grid', styles: { font: 'times', fontSize: 10, cellPadding: 3 }, headStyles: { fillColor: [243, 244, 246], textColor: [15, 23, 42], fontStyle: 'bold' }, margin: { left: 20, right: 20 } });
            y = pdf.lastAutoTable.finalY + 10; i = j - 1; continue;
          }

          // F. Figures & Images
          const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
          if (imgMatch) {
            const asset = assets.find(a => a.file_url === imgMatch[1]);
            if (asset && imageMap[asset.id]) {
              if (y > 180) { footer(); pdf.addPage(); currPage++; y = 30; }
              pdf.addImage(imageMap[asset.id], 'JPEG', 30, y, 150, 100); 
              y += 105; pdf.setFontSize(10); pdf.setFont("times", "italic"); pdf.text(`Figure: ${asset.caption || asset.original_name}`, 105, y, { align: 'center' });
              y += 10; pdf.setFontSize(12); pdf.setFont("times", "normal"); continue;
            }
          }

          // G. Bullet List Items
          const bulletMatch = line.match(/^[\*\-\•]\s+(.*)/);
          if (bulletMatch) {
            const bText = formatPdfTechnicalText(bulletMatch[1]);
            const splitBullet = pdf.splitTextToSize(bText, 160);
            pdf.setFont("times", "normal"); pdf.setFontSize(12);
            for (let bIdx = 0; bIdx < splitBullet.length; bIdx++) {
              if (y > 275) { footer(); pdf.addPage(); currPage++; y = 30; }
              if (bIdx === 0) pdf.text("-", 23, y);
              pdf.text(splitBullet[bIdx], 28, y);
              y += 6.5;
            }
            y += 2;
            continue;
          }

          // H. Numbered List Items
          const numMatch = line.match(/^(\d+[\.\)])\s+(.*)/);
          if (numMatch) {
            const nLabel = numMatch[1];
            const nText = formatPdfTechnicalText(numMatch[2]);
            const splitNum = pdf.splitTextToSize(nText, 160);
            pdf.setFont("times", "normal"); pdf.setFontSize(12);
            for (let nIdx = 0; nIdx < splitNum.length; nIdx++) {
              if (y > 275) { footer(); pdf.addPage(); currPage++; y = 30; }
              if (nIdx === 0) pdf.text(nLabel, 21, y);
              pdf.text(splitNum[nIdx], 28, y);
              y += 6.5;
            }
            y += 2;
            continue;
          }

          // I. Standard Body Paragraph
          const splitText = pdf.splitTextToSize(formatPdfTechnicalText(line), 170);
          for (const s of splitText) {
            if (y > 275) { footer(); pdf.addPage(); currPage++; y = 30; }
            pdf.text(s, 20, y, { align: 'justify' }); y += 7;
          }
          y += 3;
        }
        footer(); pdf.addPage(); currPage++;
      }
      
      if (finalMasterReferences.length > 0) {
        pdf.setFont("times", "bold"); pdf.setFontSize(20); pdf.text("REFERENCES", 105, 40, { align: 'center' });
        pdf.setFont("times", "normal"); pdf.setFontSize(11); let ry = 60;
        finalMasterReferences.forEach((ref, idx) => {
          const split = pdf.splitTextToSize(formatPdfTechnicalText(`${idx + 1}. ${ref}`), 170);
          if (ry + (split.length * 6) > 270) { footer(); pdf.addPage(); currPage++; ry = 30; }
          pdf.text(split, 20, ry, { align: 'justify' }); ry += (split.length * 6) + 4;
        });
        footer();
      }

      const generatedDoc = await PDFDocument.load(pdf.output('arraybuffer'));
      const finalPdf = await PDFDocument.create();
      if (orderedDocIds?.length > 0) {
        const sorted = orderedDocIds.map(id => assets.find(a => a.id === id)).filter(Boolean);
        for (const a of sorted) {
          try {
            const res = await fetch(a.file_url);
            const docToMerge = await PDFDocument.load(await res.arrayBuffer());
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
    return NextResponse.json({ success: true, fileUrl: publicUrl, fileSize: finalBuffer.length });
  } catch (error) { console.error('Export Error:', error); return NextResponse.json({ error: error.message }, { status: 500 }); }
}
