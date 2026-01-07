// /src/lib/abstractGenerator.js
// Generate academic abstract from project chapters

export function getAbstractPrompt(project, chapters, faculty, templateType = null) {
  // Check for SIWES template type
  if (templateType === 'siwes') {
    return getSIWESAbstractPrompt(project, chapters);
  }

  const chaptersContext = chapters
    .map(ch => `${ch.title}: ${ch.content?.substring(0, 300)}...`)
    .join('\n\n');

  return `You are an expert academic writer. Generate a professional ABSTRACT for this ${faculty} project report.

PROJECT TITLE: ${project.title}
DEPARTMENT: ${project.department}
COMPONENTS/FOCUS: ${project.components?.join(', ')}

CHAPTER SUMMARIES:
${chaptersContext}

WRITE A PROFESSIONAL ABSTRACT (200-250 words) that includes:

1. **Background/Context** (2-3 sentences)
   - What problem/topic does this project address?
   - Why is it important?

2. **Aim/Objectives** (1-2 sentences)
   - What did the project set out to achieve?

3. **Methodology** (2-3 sentences)
   - What approach/methods were used?
   - What components/materials/techniques?

4. **Key Results** (2-3 sentences)
   - What were the main findings/outcomes?
   - Did it meet objectives?

5. **Conclusion/Significance** (1-2 sentences)
   - What is the impact/contribution?
   - Future implications?

FORMATTING RULES:
- Write in PAST TENSE (the project has been completed)
- Use THIRD PERSON ("The project developed...", not "I developed...")
- Be SPECIFIC - mention actual components/methods used
- NO headings or sections - just continuous prose
- NO citations or references
- Start directly with content (no "Abstract:" label)
- Keep to 200-250 words total
- Use professional Nigerian academic English

FACULTY-SPECIFIC FOCUS:
${getFacultyAbstractGuidance(faculty)}

Now write the abstract:`;
}

function getSIWESAbstractPrompt(project, chapters) {
  const chaptersContext = chapters
    .map(ch => `${ch.title}: ${ch.content?.substring(0, 300)}...`)
    .join('\n\n');

  return `You are an expert technical writer. Generate a professional EXECUTIVE SUMMARY (ABSTRACT) for this SIWES (Student Industrial Work Experience Scheme) technical report.

REPORT TITLE: ${project.title}
DEPARTMENT: ${project.department}
FOCUS AREAS: ${project.components?.join(', ')}

PART SUMMARIES:
${chaptersContext}

WRITE A CONCISE EXECUTIVE SUMMARY (MAXIMUM 200 WORDS) that covers:

1. **Placement Details**: Where the training was conducted and the duration (briefly).
2. **Departments/Units**: Which sections of the organization were covered.
3. **Key Activities**: The main practical tasks and operations performed.
4. **Skills Acquired**: Specific technical and professional skills gained.
5. **Conclusion**: The value of the experience to your academic and professional growth.

STRICT FORMATTING RULES:
- **MAXIMUM 200 WORDS** - Do not exceed this limit.
- Write in **PAST TENSE**.
- Use **THIRD PERSON** perspective (e.g., "This report documents...", "The training covered...", "Experience was gained in...").
- **NO** headings or bullet points - just 1-2 solid paragraphs of continuous prose.
- **NO** citations.
- Focus purely on the **industrial experience** and **technical skills**, not academic theory.
- Start directly with the text.

Example Start: "This technical report documents the Student Industrial Work Experience Scheme (SIWES) undertaken at [Company Name]..."

Now write the executive summary:`;
}

function getFacultyAbstractGuidance(faculty) {
  const guidance = {
    'Engineering': 'Focus on: technical specifications, system design, implementation, testing results, performance metrics',
    'Sciences': 'Focus on: experimental methodology, materials, procedures, results, statistical significance, scientific implications',
    'Management Sciences': 'Focus on: research design, population/sample, data collection methods, findings, business implications',
    'Social Sciences': 'Focus on: research design, study population, data collection, key findings, social implications',
    'Law': 'Focus on: legal issues examined, methodology, key findings, jurisprudential implications, recommendations',
    'Arts & Humanities': 'Focus on: analytical approach, sources examined, theoretical framework, key arguments, scholarly contribution',
    'Education': 'Focus on: educational context, methodology, participants, findings, pedagogical implications',
    'Agricultural Sciences': 'Focus on: experimental design, treatments, field/lab procedures, results, agricultural implications',
    'Environmental Science': 'Focus on: environmental issue, methodology, assessment techniques, findings, environmental implications',
    'Basic Medical Sciences': 'Focus on: research design, materials/methods, results, clinical significance, medical implications'
  };

  return guidance[faculty] || guidance['Engineering'];
}
