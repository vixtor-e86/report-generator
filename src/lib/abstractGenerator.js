// /src/lib/abstractGenerator.js
// Generate academic abstract from project chapters

export function getAbstractPrompt(project, chapters, faculty) {
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