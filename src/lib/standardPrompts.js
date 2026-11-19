// /src/lib/standardPrompts.js
// Faculty-Aware Dynamic Standard Tier AI Prompts

function getReferenceInstructions(referenceStyle, faculty, chapterNumber, isLastChapter, existingReferences = []) {
  if (referenceStyle === 'none') return `DO NOT include any references or citations.`;

  const styleInstructions = {
    'apa': { inText: '(Author, Year)', format: 'Author, A. B. (Year). Title. Journal/Publisher.' },
    'ieee': { inText: '[1]', format: '[1] A. B. Author, "Title," Journal, vol. X, no. Y, pp. Z-Z, Year.' },
    'harvard': { inText: '(Author Year)', format: 'Author, A.B. (Year) Title. City: Publisher.' },
    'mla': { inText: '(Author Page)', format: "Author's Last Name, First Name. \"Title of Work.\" Publisher, Year, Pages." },
    'oscola': { inText: 'numbered markdown footnotes [^1], [^2] placed after punctuation (NO in-text author brackets)', format: 'Author, Title (Publisher Year) / Case Name [Year] Report Page / Act Name Year, s X' },
    'chicago': { inText: 'numbered markdown footnotes [^1], [^2] placed after punctuation', format: 'Author, Title (City: Publisher, Year), Page.' },
    'vancouver': { inText: 'sequential numbers in square brackets [1], [2] in exact order of appearance in text', format: '[1] Author AA, Author BB. Title of article. Abbreviated Journal Title. Year;Volume(Issue):Pages.' }
  };

  const isFootnoteStyle = referenceStyle === 'oscola' || referenceStyle === 'chicago';
  const style = styleInstructions[referenceStyle] || styleInstructions['apa'];
  
  // Dynamic Citation Count based on chapter requirements:
  // Chapter 1: Maximum 10 references (6-10)
  // Chapter 2: Minimum 20 references (20-30 mandatory)
  let countRange = "6-10";
  let countInstruction = "between 6 and 10 references";
  if (chapterNumber === 1) {
    countRange = "6-10";
    countInstruction = "between 6 and 10 references (STRICT MAXIMUM: 10 references, DO NOT exceed 10)";
  } else if (chapterNumber === 2) {
    countRange = "20-30";
    countInstruction = "at least 20 references (MANDATORY STRICT MINIMUM: 20 references. Target: 20 to 30 distinct academic references. Under NO circumstances should you generate fewer than 20 references)";
  } else if (chapterNumber === 3) {
    countRange = "8-12";
    countInstruction = "between 8 and 12 references";
  } else {
    countRange = "6-10";
    countInstruction = "between 6 and 10 references (Maximum 10)";
  }

  let existingRefsText = '';
  if (existingReferences && existingReferences.length > 0) {
    existingRefsText = `\n\n=== SCRAPED WEB & PROJECT-WIDE REFERENCES (REUSE THESE TO AVOID DUPLICATES) ===\n`;
    existingReferences.forEach((ref, i) => {
      const auths = Array.isArray(ref.authors) ? ref.authors.map(a => typeof a === 'object' ? a.name : a).join(', ') : (ref.authors || '');
      const urlSuffix = ref.url ? ` Available at: ${ref.url}` : '';
      const text = ref.reference_text || `${auths} (${ref.year || 2023}). "${ref.title}". ${ref.venue || 'Technical Publication'}.${urlSuffix}`;
      existingRefsText += `SOURCE [${i + 1}]: ${text}\n`;
    });
    existingRefsText += `\nSTRICT RULE: You MUST prioritize citing the sources listed above. ONLY supplement with additional verifiable sources when covering specific technical claims not already addressed above.\n`;
  }

  return `
CITATION & REFERENCING RULES (${referenceStyle.toUpperCase()}):
1. Citations Method: Use ${style.inText}. Distribute citations naturally throughout the technical analysis.
${isFootnoteStyle ? `   - FOOTNOTE RULE: Whenever citing a source, place a superscript footnote [^1], [^2] immediately following the punctuation mark.
   - At the end of the chapter, list each footnote definition as:
     [^1]: Author, Title (Publisher Year) page. (Or Case citation / Statute citation)
   - DO NOT put (Author, Year) in brackets inside the paragraphs.` : ''}
2. **CITE EXACTLY WHAT THE USER WROTE (CRITICAL FIDELITY RULE)**:
   - If the user wrote or specified any authors, books, articles, websites, journals, standards, components, or specific technical claims in their project description, objectives, continuation baseline, or custom instructions, you MUST cite **EXACTLY what the user wrote**.
   - Every single in-text citation MUST directly correspond to the exact statement, component, methodology, or topic written in that sentence—NEVER insert random, generic, or unrelated citations that do not match the exact topic written.
   - Every in-text citation MUST have an exact 1-to-1 matching entry in the final reference list, and every reference in the final list MUST be cited in the text.
3. Citation Count Requirement: Include ${countInstruction} in your technical analysis.
   ${chapterNumber === 1 ? '- CHAPTER 1 RULE: Maximum of 10 references allowed.' : ''}
   ${chapterNumber === 2 ? `- CHAPTER 2 RULE (LITERATURE REVIEW - MANDATORY MINIMUM 20 REFERENCES):
   * You MUST cite at least 20 separate, verifiable sources in this chapter.
   * Distribute in-text citations thoroughly across ALL subsections of the literature review (at least 20 in-text citations throughout the text).
   * At the end of Chapter 2, provide the complete numbered list of all 20+ sources cited (1 to 20+).
   * Under NO circumstances should you output fewer than 20 references.` : ''}
4. **DIVERSE SOURCING (DO NOT CITE ONLY JOURNALS)**:
   Combine the scraped web & project references provided below with a realistic, balanced variety of source types (not just journals):
   - Peer-Reviewed Academic & Technical Journals (2020-2026).
   - Authoritative Web / Online Articles, Technical Portals & Industry Reports (e.g., IEEE Spectrum, MIT Technology Review, ScienceDirect, World Bank, WHO, NASA, NIST, official industry portals—include publisher/URL where available).
   - Textbooks, Monographs, Official Documentation, Statutes, Law Reports, Standards (ISO/SON/IEEE), and Manufacturer Datasheets.
5. **STRICT NO DUPLICATES**: Do not list the same reference twice. Cross-check your final list against the "SCRAPED WEB & PROJECT-WIDE REFERENCES" provided below.
${existingRefsText}
6. **MANDATORY**: At the end of THIS chapter, you MUST include a "${referenceStyle === 'oscola' ? '## Bibliography' : '## References'}" section. 
   - **STRICT FORMAT**: Use a Markdown numbered list (1. [Reference]).
   - **CLEANLINESS**: Each reference must be its own list item. Ensure there is exactly one blank line between each numbered item to prevent text bunching.
   - **CONTENT**: List only the sources actually cited in this chapter (100% exact match with in-text citations).
   - **NO FORGING**: Do NOT hallucinate or "make up" fake references. Ensure all sources are real and verifiable.
   - If this is the FINAL chapter, ensure the list is comprehensive for the whole project.
   - Max 40 unique references for the entire project.
   - RECENCY: All sources must be between 2020-2026.
`;
}

function getSIWESPrompt(partNumber, data) {
  const { projectTitle, department, components = [], description, images = [], context = '', manualObjectives = [], customInstruction = '' } = data;
  const companyName = components[0] || 'the organization';
  
  let objectivesInstruction = '';
  if (partNumber === 1 && manualObjectives.length > 0) {
    objectivesInstruction = `\n\n### MANDATORY TRAINING OBJECTIVES:\n${manualObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n`;
  }

  let customInstructionText = '';
  if (customInstruction && customInstruction.trim()) {
    customInstructionText = `\n\n### USER MODIFICATIONS / SPECIAL INSTRUCTIONS:\n${customInstruction.trim()}\n`;
  }

  return `You are an expert SIWES report writer.
  
TRAINING: ${companyName} (${department})
SCOPE: ${description}
${objectivesInstruction}
${customInstructionText}
${context ? `CONTEXT: ${context}` : ''}

PART: Part ${partNumber}
TASK: Write a 1500-word professional report part. Focus on ACTUAL industrial experience.
START WITH: ## PART ${partNumber}: [Title]
RULES: Use first-person ("I assigned..."). No AI fluff. Nigerian university standard.`;
}

function getFacultySpecificPrompt(chapterNumber, data) {
  const { 
    projectTitle, 
    department, 
    components = [], 
    description, 
    images = [], 
    context = '', 
    templateStructure, 
    faculty = 'Engineering', 
    referenceStyle = 'apa', 
    existingReferences = [], 
    manualObjectives = [],
    customInstruction = '',
    aiInstruction = '',
    isCustom = false
  } = data;

  const chapterInfo = templateStructure?.chapters?.find(ch => ch.number === chapterNumber);
  if (!chapterInfo) throw new Error(`Chapter ${chapterNumber} missing from template structure`);

  let objectivesInstruction = '';
  if (chapterNumber === 1 && manualObjectives.length > 0) {
    objectivesInstruction = `\n\n### MANDATORY RESEARCH OBJECTIVES:\nYou MUST include these EXACT objectives word-for-word in the 'Objectives' section:\n${manualObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n`;
  }

  // ✅ Image Placeholder Instructions
  let imageInstructions = '';
  if (images && images.length > 0) {
    imageInstructions = `\n\n### VISUAL ASSETS (MANDATORY):
    You MUST insert the following image placeholders at logically relevant points in your technical description. 
    Do NOT group them all at the end; distribute them where they best support the text.
    ${images.map(img => `- ${img.placeholder}: ${img.caption}`).join('\n')}
    
    STRICT RULE: Use the exact format {{figureX.Y}} when placing images.`;
  }

  let customInstructionText = '';
  if (customInstruction && customInstruction.trim()) {
    customInstructionText += `\n\n======================================================
### USER MODIFICATIONS / SPECIAL INSTRUCTIONS (CRITICAL OVERRIDE - HIGHEST PRIORITY):
The user has provided the following specific instruction for this modification/regeneration:
"${customInstruction.trim()}"

STRICT COMPLIANCE MANDATE:
1. You MUST prioritize and strictly execute the user's instruction above all default templates.
2. If the user specifies adding, expanding, or increasing references or citations, ensure you include the requested number of references (and at least 20 references if this is Chapter 2) both as in-text citations and in the final ## References section.
3. NEVER omit or drop the ## References section when modifying or regenerating content.
4. Thoroughly incorporate any requested technical details, calculations, or stylistic adjustments.
======================================================\n`;
  }
  
  if (aiInstruction && aiInstruction.trim()) {
    customInstructionText += `\n\n### ADVANCED TEMPLATE INSTRUCTIONS (CRITICAL PRIORITY):\n${aiInstruction.trim()}\n`;
  }

  const totalChapters = templateStructure?.chapters?.length || 5;
  const isLastChapter = chapterNumber === totalChapters;

  const prompt = `You are a senior academic researcher. 
  TASK: Author Chapter ${chapterNumber}: ${chapterInfo.title} for the project "${projectTitle}".
  
  PROJECT: ${description}
  FIELD: ${faculty} (${department})
  COMPONENTS: ${Array.isArray(components) ? components.join(', ') : components}
  ${objectivesInstruction}
  ${imageInstructions}
  ${customInstructionText}
  ${context ? `\nPREVIOUS CONTEXT:\n${context}` : ''}

  ${isCustom ? `## CONTINUATION & REFERENCES REUSE DIRECTIVE (MANDATORY):
  1. CONTINUATION PROJECT: This project is a continuation of an ongoing student report. The student has written earlier chapters (~3,000 words each).
  2. TARGET LENGTH: Strictly author between 2,500 - 3,500 words (~3,000 words). DO NOT exceed 3,500 words.
  3. REFERENCES AT BOTTOM: Re-use and cite any references provided in the continuation context where applicable.
  4. CONTINUITY: Match the student's established terminology, tone, and methodology.
  ` : ''}

  REQUIRED SECTIONS:
  ${chapterInfo.sections.join('\n')}
  ${getReferenceInstructions(referenceStyle, faculty, chapterNumber, isLastChapter, existingReferences)}

  WRITING RULES:
  1. Target: 2,500 - 3,500 words (~3,000 words). Make the content comprehensive, detailed, and technically complete. STRICT LIMIT: Keep within ~3,000 words (do not exceed 3,500 words). Ensure it does not end prematurely or get cut off.
  2. Tone: Formal, Technical, Academic.
  3. Format: Markdown (## H1, ### H2).
  4. Currency: ₦ (NGN).
  5. RECENCY: Citations must be 2020-2026.
  6. NO conversational filler. Start directly with ## heading.
  7. NO EM-DASHES: Do NOT use the long dash symbol (—) as a separator or watermark. Use standard hyphens (-) or colons (:) instead.
  8. NO LATEX DOLLAR SIGNS ($) OR RAW LATEX CODE: NEVER wrap mathematical equations, formulas, or variables in LaTeX dollar signs ($...$ or $$...$$) and NEVER use raw LaTeX commands like \\frac, \\times, \\div, \\approx, \\mu, \\Omega, \\eta, \\theta, \\sqrt. Write all equations and symbols in clean, plain readable Unicode text (e.g., "V_out = (R₂ / (R₁ + R₂)) × V_in", "Efficiency (η) = 92.5%", "R = 10 kΩ", "± 5%", "x²").
  9. STRICT MARKDOWN TABLE INTEGRITY: Whenever you write a Markdown table, every row MUST be on a single line starting and ending with |, every row MUST have the exact same number of | pipe columns as the header row, and you MUST NOT insert blank lines between rows of the same table.
  ${customInstruction && customInstruction.trim() ? `10. USER MODIFICATION COMPLIANCE (STRICT): You MUST fulfill the user's specific modification request: "${customInstruction.trim()}".` : ''}`;

  return prompt;
}

export { getFacultySpecificPrompt as getStandardPrompt, getSIWESPrompt };
