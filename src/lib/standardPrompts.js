// /src/lib/standardPrompts.js
// Faculty-Aware Dynamic Standard Tier AI Prompts

function getReferenceInstructions(referenceStyle, faculty, isLastChapter, existingReferences = []) {
  if (referenceStyle === 'none') return `DO NOT include any references or citations.`;

  const styleInstructions = {
    'apa': { inText: '(Author, Year)', format: 'Author, A. B. (Year). Title. Journal/Publisher.' },
    'ieee': { inText: '[1]', format: '[1] A. B. Author, "Title," Journal, vol. X, no. Y, pp. Z-Z, Year.' },
    'harvard': { inText: '(Author Year)', format: 'Author, A.B. (Year) Title. City: Publisher.' }
  };

  const style = styleInstructions[referenceStyle] || styleInstructions['apa'];
  
  let existingRefsText = '';
  if (existingReferences && existingReferences.length > 0) {
    existingRefsText = `\n\n=== PROJECT-WIDE REFERENCES (REUSE THESE) ===\n`;
    existingReferences.forEach((ref, i) => {
      const text = ref.reference_text || `${ref.authors?.map(a => typeof a === 'object' ? a.name : a).join(', ')} (${ref.year}). "${ref.title}". ${ref.venue}.`;
      existingRefsText += `SOURCE [${i + 1}]: ${text}\n`;
    });
    existingRefsText += `\nSTRICT RULE: Prioritize citing the sources above before finding others. Max 40 unique references per project.\n`;
  }

  return `
CITATION RULES (${referenceStyle.toUpperCase()}):
1. In-Text: Use ${style.inText}. Distribute 8-12 citations naturally.
2. Sourcing: Use the provided project references. If more are needed, find REAL academic papers from 2022-2026.
3. Fulfillment: You MUST include exactly 8-12 references in your technical analysis.
${existingRefsText}
4. **MANDATORY**: At the end of THIS chapter, you MUST include a "## References" section. 
   - **STRICT FORMAT**: Use a Markdown numbered list (1. [Reference]).
   - **CLEANLINESS**: Each reference must be its own list item. Ensure there is exactly one blank line between each numbered item to prevent text bunching.
   - **CONTENT**: List only the sources actually cited in this chapter.
   - If this is the FINAL chapter, ensure the list is comprehensive for the whole project.
   - Max 40 unique references for the entire project.
   - RECENTCY: All sources must be between 2022-2026.
`;
}

function getSIWESPrompt(partNumber, data) {
  const { projectTitle, department, components, description, images = [], context = '', manualObjectives = [] } = data;
  const companyName = components[0] || 'the organization';
  
  let objectivesInstruction = '';
  if (partNumber === 1 && manualObjectives.length > 0) {
    objectivesInstruction = `\n\n### MANDATORY TRAINING OBJECTIVES:\n${manualObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n`;
  }

  return `You are an expert SIWES report writer.
  
TRAINING: ${companyName} (${department})
SCOPE: ${description}
${objectivesInstruction}
${context ? `CONTEXT: ${context}` : ''}

PART: Part ${partNumber}
TASK: Write a 1500-word professional report part. Focus on ACTUAL industrial experience.
START WITH: ## PART ${partNumber}: [Title]
RULES: Use first-person ("I assigned..."). No AI fluff. Nigerian university standard.`;
}

function getFacultySpecificPrompt(chapterNumber, data) {
  const { projectTitle, department, components, description, images = [], context = '', templateStructure, faculty, referenceStyle = 'apa', existingReferences = [], manualObjectives = [] } = data;
  const chapterInfo = templateStructure?.chapters?.find(ch => ch.number === chapterNumber);
  if (!chapterInfo) throw new Error(`Chapter ${chapterNumber} missing`);

  let objectivesInstruction = '';
  if (chapterNumber === 1 && manualObjectives.length > 0) {
    objectivesInstruction = `\n\n### MANDATORY RESEARCH OBJECTIVES:\nYou MUST include these EXACT objectives word-for-word in the 'Objectives' section:\n${manualObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n`;
  }

  const prompt = `You are a senior academic researcher. 
  TASK: Author Chapter ${chapterNumber}: ${chapterInfo.title} for the project "${projectTitle}".
  
  PROJECT: ${description}
  FIELD: ${faculty} (${department})
  COMPONENTS: ${components.join(', ')}
  ${objectivesInstruction}
  ${context ? `\nPREVIOUS CONTEXT:\n${context}` : ''}

  REQUIRED SECTIONS:
  ${chapterInfo.sections.join('\n')}

  ${getReferenceInstructions(referenceStyle, faculty, chapterNumber === (templateStructure?.chapters?.length || 5), existingReferences)}

  WRITING RULES:
  1. Target: 2000 words. 
  2. Tone: Formal, Technical, Academic.
  3. Format: Markdown (## H1, ### H2).
  4. Currency: ₦ (NGN).
  5. RECENTCY: Citations must be 2022-2026.
  6. NO conversational filler. Start directly with ## heading.`;

  return prompt;
}

export { getFacultySpecificPrompt as getStandardPrompt, getSIWESPrompt };
