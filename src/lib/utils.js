import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, currency = 'NGN') {
  const safeAmount = Number(amount) || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Clean LaTeX math symbols ($...$, \frac, \times, Greek letters) into readable Unicode
 * and repair broken/crumbled Markdown tables so remark-gfm always renders full tables cleanly.
 */
export function normalizeChapterMarkdown(rawMarkdown) {
  if (!rawMarkdown || typeof rawMarkdown !== 'string') return '';

  let str = rawMarkdown.replace(/\r\n/g, '\n');

  // 1. Clean LaTeX wrappers & commands into clean Unicode
  str = str
    .replace(/\\begin\{(?:equation|align|aligned)\*?\}/gi, '')
    .replace(/\\end\{(?:equation|align|aligned)\*?\}/gi, '')
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    .replace(/\$\$/g, '');

  // Strip inline math dollar signs $...$ (when enclosing math expressions/variables)
  str = str.replace(/\$([^$\n]{1,120})\$/g, '$1');

  // LaTeX text wrappers: \text{...}, \mathrm{...}, \mathbf{...}
  str = str.replace(/\\(?:text|mathrm|mathbf|mathit|textnormal|operatorname)\s*\{((?:[^{}]|{[^{}]*})*)\}/g, '$1');

  // Fractions: \frac{a}{b} -> (a / b)
  const fracRegex = /\\frac\s*\{((?:[^{}]|{[^{}]*})*)\}\s*\{((?:[^{}]|{[^{}]*})*)\}/g;
  let prev = '';
  while (str !== prev) {
    prev = str;
    str = str.replace(fracRegex, '($1 / $2)');
  }

  // Roots & common functions
  str = str
    .replace(/\\sqrt\[3\]\s*\{((?:[^{}]|{[^{}]*})*)\}/g, '³√($1)')
    .replace(/\\sqrt\s*\{((?:[^{}]|{[^{}]*})*)\}/g, '√($1)')
    .replace(/\\(sin|cos|tan|cot|sec|csc|ln|log|exp|max|min|lim)\b/g, '$1')
    .replace(/\\left\(/g, '(').replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[').replace(/\\right\]/g, ']')
    .replace(/\\times/g, '×')
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
    .replace(/\\infty/g, '∞')
    .replace(/\\propto/g, '∝')
    .replace(/\\to|\\rightarrow/g, '→')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\degree|\\circ|\^\\circ/g, '°')
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\int/g, '∫')
    .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ').replace(/\\Gamma/g, 'Γ')
    .replace(/\\delta/g, 'δ').replace(/\\Delta/g, 'Δ')
    .replace(/\\epsilon|\\varepsilon/g, 'ε')
    .replace(/\\zeta/g, 'ζ').replace(/\\eta/g, 'η')
    .replace(/\\theta/g, 'θ').replace(/\\Theta/g, 'Θ')
    .replace(/\\kappa/g, 'κ').replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'µ').replace(/\\nu/g, 'ν')
    .replace(/\\pi/g, 'π').replace(/\\rho/g, 'ρ')
    .replace(/\\sigma/g, 'σ').replace(/\\Sigma/g, 'Σ')
    .replace(/\\tau/g, 'τ').replace(/\\phi|\\varphi/g, 'φ')
    .replace(/\\omega/g, 'ω').replace(/\\Omega|\\ohm/g, 'Ω');

  // Superscripts & Subscripts in math expressions
  const SUPERSCRIPTS = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','n':'ⁿ' };
  str = str.replace(/\^\{([0-9\+\-n]+)\}/g, (_, p1) => p1.split('').map(c => SUPERSCRIPTS[c] || c).join(''));
  str = str.replace(/\^([0-9])/g, (_, p1) => SUPERSCRIPTS[p1] || p1);
  str = str.replace(/_\{([a-zA-Z0-9\+\-]+)\}/g, '_$1');

  // 2. Repair & Normalize Markdown Tables so rows never crumble mid-table
  // Step 2a: Collapse blank lines between consecutive pipe-table rows
  let prevTableStr = '';
  while (str !== prevTableStr) {
    prevTableStr = str;
    str = str.replace(/(\n[ \t]*\|[^\n]+\|)[ \t]*\n(?:[ \t]*\n)+([ \t]*\|)/g, '$1\n$2');
  }

  const lines = str.split('\n');
  const mergedLines = [];

  // Step 2b: Join table rows that accidentally wrapped onto the next line mid-cell
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (
      trimmed.startsWith('|') &&
      !trimmed.endsWith('|') &&
      i + 1 < lines.length &&
      !lines[i + 1].trim().startsWith('#') &&
      !lines[i + 1].trim().startsWith('|') &&
      lines[i + 1].includes('|')
    ) {
      mergedLines.push(`${trimmed} ${lines[i + 1].trim()}`);
      i++;
    } else {
      mergedLines.push(line);
    }
  }

  // Step 2c: Normalize each contiguous table block (consistent column count, valid separator row)
  const finalLines = [];
  let idx = 0;
  while (idx < mergedLines.length) {
    const tLine = mergedLines[idx].trim();
    const isTableLine = tLine.startsWith('|') && (tLine.match(/\|/g) || []).length >= 2;

    if (!isTableLine) {
      finalLines.push(mergedLines[idx]);
      idx++;
      continue;
    }

    // Collect full contiguous table block
    const rawTableLines = [];
    while (idx < mergedLines.length) {
      const candidate = mergedLines[idx].trim();
      if (candidate.startsWith('|') && (candidate.match(/\|/g) || []).length >= 2) {
        rawTableLines.push(candidate);
        idx++;
      } else if (candidate === '' && idx + 1 < mergedLines.length && mergedLines[idx + 1].trim().startsWith('|')) {
        // Skip accidental empty line inside a table block
        idx++;
      } else {
        break;
      }
    }

    if (rawTableLines.length < 2) {
      finalLines.push(...rawTableLines);
      continue;
    }

    const parseCells = (rowStr) => {
      let cleanRow = rowStr.trim();
      if (!cleanRow.startsWith('|')) cleanRow = '|' + cleanRow;
      if (!cleanRow.endsWith('|')) cleanRow = cleanRow + '|';
      return cleanRow.slice(1, -1).split('|').map(c => c.trim());
    };

    const isSeparatorRow = (cells) =>
      cells.length > 0 && cells.every(c => /^:?-{2,}:?$/.test(c) || c === '');

    const parsedRows = rawTableLines.map(parseCells);
    // Filter out all separator rows so we can place a clean one right at index 1
    const contentRows = parsedRows.filter(cells => !isSeparatorRow(cells));

    if (contentRows.length === 0) {
      finalLines.push(...rawTableLines);
      continue;
    }

    const headerCells = contentRows[0];
    const colCount = Math.max(headerCells.length, 2);

    const formatRow = (cells) => {
      const normalized = [...cells];
      while (normalized.length < colCount) normalized.push('');
      if (normalized.length > colCount) {
        const head = normalized.slice(0, colCount - 1);
        const tail = normalized.slice(colCount - 1).join(' / ');
        return `| ${[...head, tail].join(' | ')} |`;
      }
      return `| ${normalized.join(' | ')} |`;
    };

    // Ensure blank line before table for remark-gfm
    if (finalLines.length > 0 && finalLines[finalLines.length - 1].trim() !== '') {
      finalLines.push('');
    }

    finalLines.push(formatRow(headerCells));
    finalLines.push(`| ${Array(colCount).fill('---').join(' | ')} |`);
    for (let r = 1; r < contentRows.length; r++) {
      finalLines.push(formatRow(contentRows[r]));
    }

    // Ensure blank line after table
    finalLines.push('');
  }

  return finalLines.join('\n');
}
