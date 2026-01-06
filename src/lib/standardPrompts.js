// /src/lib/standardPrompts.js
// Faculty-Aware Dynamic Standard Tier AI Prompts
// Supports: Regular Projects (all faculties), SIWES/Industrial Training

function getReferenceInstructions(referenceStyle, faculty, isLastChapter, existingReferences = []) {
  if (referenceStyle === 'none') {
    return `DO NOT include any references or in-text citations.`;
  }

  const styleInstructions = {
    'apa': {
      inText: 'Use APA format: (Author, Year) or (Author & Co-author, Year)',
      format: 'Author, A. B. (Year). Title of work. Publisher/Journal Name.',
      example: 'Adeyemi, T. A. (2021). Modern Electronic Systems Design. Lagos: Tech Publishers.'
    },
    'ieee': {
      inText: 'Use IEEE format with numbered citations: [1], [2], [3]',
      format: '[1] A. B. Author, "Title of work," Journal Name, vol. X, no. Y, pp. Z-Z, Year.',
      example: '[1] T. A. Adeyemi, "Modern electronic systems design," Journal of Nigerian Engineering, vol. 15, no. 3, pp. 45-62, 2021.'
    },
    'harvard': {
      inText: 'Use Harvard format: (Author Year) - no comma between author and year',
      format: 'Author, A.B. (Year) Title of work. City: Publisher.',
      example: 'Adeyemi, T.A. (2021) Modern Electronic Systems Design. Lagos: Tech Publishers.'
    }
  };

  const style = styleInstructions[referenceStyle] || styleInstructions['apa'];
  
  // Build existing references list
  let existingRefsText = '';
  if (existingReferences && existingReferences.length > 0) {
    existingRefsText = `\n\n=== EXISTING REFERENCES FROM PREVIOUS CHAPTERS ===\n`;
    existingReferences.forEach(ref => {
      existingRefsText += `${ref.reference_key}: ${ref.reference_text}\n`;
    });
    existingRefsText += `\nIMPORTANT: REUSE these references where applicable instead of creating new ones. Only create NEW references for topics not covered by existing references.\n`;
  }

  return `
REFERENCES AND CITATIONS (${referenceStyle.toUpperCase()} Style):

1. In-Text Citations: ${style.inText}
   - Add 10-15 in-text citations throughout this chapter
   - Distribute citations naturally across all sections
   - Example: "Studies have shown that... ${referenceStyle === 'apa' ? '(Okonkwo, 2021)' : referenceStyle === 'ieee' ? '[1]' : '(Okonkwo 2021)'}"

2. Reference List Format:
   ${style.format}
   
3. Example Reference:
   ${style.example}

${existingRefsText}

4. ${isLastChapter ? `**IMPORTANT - FINAL CHAPTER REFERENCES**: 
   
   At the END of this chapter, include a comprehensive ## REFERENCES section with ALL references from the entire project.
   
   **CRITICAL INSTRUCTIONS FOR FINAL REFERENCE LIST:**
   - Include ALL existing references listed above (${existingReferences.length} references)
   - Add 8-12 NEW references for topics covered in THIS chapter
   - ${referenceStyle === 'ieee' ? `Number them sequentially: [1], [2], [3]... up to [${existingReferences.length + 12}]` : 'List alphabetically by author surname'}
   - Do NOT duplicate any existing references
   - This is the COMPLETE, FINAL reference list for the entire project
   
   **Format for Final Chapter:**
   ${referenceStyle === 'ieee' ? 
     `Start with [1] and continue sequentially to include all ${existingReferences.length} existing plus your new ones` :
     `List all references alphabetically (A-Z by author surname), integrating new ones into correct positions`
   }` 
   : '**DO NOT** include a ## REFERENCES section in this chapter. Only in-text citations are needed. The complete reference list will appear in the final chapter only.'}

5. New references should be realistic Nigerian sources for ${faculty}

6. For ${referenceStyle === 'ieee' ? 'IEEE style, continue numbering from existing references' : referenceStyle === 'apa' ? 'APA style, maintain alphabetical order' : 'Harvard style, maintain alphabetical order'}

7. CRITICAL: ${isLastChapter ? 'This final chapter MUST include the complete reference list from all chapters.' : 'NO REFERENCES section in this chapter - only in-text citations.'}
`;
}

// =====================================================
// SIWES/Industrial Training Prompt (Unchanged)
// =====================================================
function getSIWESPrompt(partNumber, data) {
  const {
    projectTitle,
    department,
    components,
    description,
    images = [],
    context = '',
    customInstruction = '',
    templateStructure,
    referenceStyle = 'apa',
    existingReferences = [] // ✅ NEW
  } = data;

  const companyName = components[0] || 'the organization';
  
  const descriptionLines = description.split('\n');
  const duration = descriptionLines[0]?.replace('Duration:', '').trim() || '';
  const workDescription = descriptionLines.slice(2).join('\n').trim();

  const partInfo = templateStructure?.chapters?.find(ch => ch.number === partNumber);
  
  if (!partInfo) {
    throw new Error(`Part ${partNumber} not found in template structure`);
  }

  let imagesContext = '';
  if (images && images.length > 0) {
    imagesContext = '\n\n=== IMAGES AVAILABLE FOR THIS PART ===\n';
    images.forEach((img, idx) => {
      imagesContext += `{{figure${partNumber}.${idx + 1}}}: ${img.caption}\n`;
    });
    imagesContext += `\n**CRITICAL IMAGE RULES:**\n`;
    imagesContext += `1. You have ${images.length} image(s) available for THIS part (Part ${partNumber})\n`;
    imagesContext += `2. ONLY reference images listed above using: {{figure${partNumber}.1}}, {{figure${partNumber}.2}}, etc.\n`;
    imagesContext += `3. DO NOT reference images from other parts\n`;
    imagesContext += `4. If no relevant image is available from the list above, DO NOT add any figure reference\n`;
    imagesContext += `5. Place figure references naturally where equipment, workplace, or processes are described\n`;
  } else {
    imagesContext = '\n\n=== NO IMAGES AVAILABLE FOR THIS PART ===\n';
    imagesContext += `IMPORTANT: Do NOT reference any images or figures in this part.\n`;
    imagesContext += `Previous parts may have had images, but this part has none assigned.\n`;
  }

  let contextSection = '';
  if (context) {
    contextSection = `\n\n=== CONTEXT FROM PREVIOUS PARTS ===\n${context}\n\nUse this to maintain consistency.\n`;
  }

  let customSection = '';
  if (customInstruction) {
    customSection = `\n\n=== ADDITIONAL INSTRUCTION ===\n${customInstruction}\n`;
  }

  const sectionsText = partInfo.sections.map(section => `${section}`).join('\n');
  
  // Determine if this is the last part
  const totalParts = templateStructure?.chapters?.length || 4;
  const isLastPart = partNumber === totalParts;
  
  // Get reference instructions
   const referenceInstructions = 'DO NOT include any references or in-text citations. SIWES/Industrial Training reports focus on personal work experience, not academic citations.';

  const prompt = `You are an expert writer specializing in SIWES (Student Industrial Work Experience Scheme) and industrial training reports for Nigerian universities.

TRAINING DETAILS:
- Company/Organization: ${companyName}
- Department/Division: ${department}
- Duration: ${duration}
- Work Experience: ${workDescription}
${imagesContext}
${contextSection}
${customSection}

PART TO WRITE:
Part ${partNumber}: ${partInfo.title}

REQUIRED SECTIONS (follow exactly):
${sectionsText}

FORMATTING REQUIREMENTS:
1. Use Markdown format ONLY
2. Start with: ## PART ${partNumber.toString().toUpperCase()}: ${partInfo.title.toUpperCase()}
3. For main sections use: ### ${partNumber}.1 Section Name
4. For subsections use: #### ${partNumber}.1.1 Subsection Name
5. Use **bold** for emphasis
6. Use bullet points with - for lists
7. Keep paragraphs well-spaced

CONTENT REQUIREMENTS:
1. Write 1000-2000 words for this part
2. Use professional Nigerian academic tone
3. Focus on ACTUAL work experience, not theoretical knowledge
4. Be specific about tasks, skills, equipment, people, challenges
5. Use first-person perspective ("I was assigned...", "I learned...")
6. Include practical examples from experience
7. Reference ${department} department work specifically

${referenceInstructions}

CRITICAL RULES:
1. DO NOT include meta-commentary
2. ONLY output actual content starting with ## heading
3. Be honest and realistic about industrial training
4. Focus on learning outcomes and practical skills
5. DO NOT include any references or citations (SIWES reports are experience-based, not research-based)

SPECIFIC GUIDANCE FOR ${partInfo.title.toUpperCase()}:
${getSIWESPartGuidance(partNumber, partInfo.title, companyName, department)}

Now write the complete part following ALL requirements above.`;

  return prompt;
}

function getSIWESPartGuidance(partNumber, partTitle, companyName, department) {
  if (partNumber === 1) {
    return `This is the INTRODUCTION part. Set the stage:
- Background of SIWES: Explain SIWES objectives in Nigerian universities
- Company Profile: Detailed info about ${companyName} (history, structure, products/services)
- SIWES Objectives: List 4-6 specific objectives
- Duration and Scope: State when training started/ended and departments covered`;
  }

  if (partNumber === 2) {
    return `This is the WORK EXPERIENCE part (CORE of report):
- Department Overview: Describe ${department} structure/functions
- Daily Activities: Detail typical day (be specific!)
- Responsibilities: List assigned tasks
- Technical Skills: New skills acquired (software, tools, procedures)
- Equipment/Tools: Describe equipment used
Be VERY specific with concrete examples!`;
  }

  if (partNumber === 3) {
    return `This is the ANALYSIS part:
- Technical Analysis: Discuss specific projects/tasks in detail
- Challenges: Problems encountered
- Solutions: How you/team solved challenges
- Theory vs Practice: How classroom knowledge applied
Show critical thinking and reflection.`;
  }

  if (partNumber === 4) {
    return `This is the CONCLUSION part:
- Summary: Recap key aspects of training
- Personal Development: How you grew professionally
- Recommendations for ${companyName}: Suggest improvements
- Recommendations for Institution: Suggest SIWES improvements
- Conclusion: Final thoughts on training value
Be constructive and show maturity.`;
  }

  return `Write with depth and specificity. Connect to actual experience at ${companyName} in ${department}.`;
}

// =====================================================
// FACULTY-SPECIFIC PROMPT GENERATOR
// =====================================================
function getFacultySpecificPrompt(chapterNumber, data) {
  const {
    projectTitle,
    department,
    components,
    description,
    images = [],
    context = '',
    customInstruction = '',
    templateStructure,
    faculty,
    referenceStyle = 'apa',
    existingReferences = [] // ✅ NEW
  } = data;

  const chapterInfo = templateStructure?.chapters?.find(ch => ch.number === chapterNumber);
  
  if (!chapterInfo) {
    throw new Error(`Chapter ${chapterNumber} not found in template structure`);
  }

  // Build images context
  // Build images context
  let imagesContext = '';
  if (images && images.length > 0) {
    imagesContext = '\n\n=== IMAGES AVAILABLE FOR THIS CHAPTER ===\n';
    images.forEach((img, idx) => {
      imagesContext += `{{figure${chapterNumber}.${idx + 1}}}: ${img.caption}\n`;
    });
    imagesContext += `\n**CRITICAL IMAGE RULES:**\n`;
    imagesContext += `1. You have ${images.length} image(s) available for THIS chapter (Chapter ${chapterNumber})\n`;
    imagesContext += `2. ONLY reference images listed above using: {{figure${chapterNumber}.1}}, {{figure${chapterNumber}.2}}, etc.\n`;
    imagesContext += `3. DO NOT reference images from other chapters (e.g., figure${chapterNumber - 1}.X or figure${chapterNumber + 1}.X)\n`;
    imagesContext += `4. If no relevant image is available from the list above, DO NOT add any figure reference\n`;
    imagesContext += `5. Place figure references naturally in the text where images would be helpful\n`;
  } else {
    imagesContext = '\n\n=== NO IMAGES AVAILABLE FOR THIS CHAPTER ===\n';
    imagesContext += `IMPORTANT: Do NOT reference any images or figures in this chapter.\n`;
    imagesContext += `Previous chapters may have had images, but this chapter has none assigned.\n`;
  }

  let contextSection = '';
  if (context) {
    contextSection = `\n\n=== CONTEXT FROM PREVIOUS CHAPTERS ===\n${context}\n\nMaintain consistency.\n`;
  }

  let customSection = '';
  if (customInstruction) {
    customSection = `\n\n=== ADDITIONAL INSTRUCTION ===\n${customInstruction}\n`;
  }

  const sectionsText = chapterInfo.sections.map(section => `${section}`).join('\n');

  // Get faculty-specific tone and terminology
  const facultyContext = getFacultyContext(faculty);
  
  // Determine if this is the last chapter
  const totalChapters = templateStructure?.chapters?.length || 5;
  const isLastChapter = chapterNumber === totalChapters;
  
  // Get reference instructions
  const referenceInstructions = referenceStyle === 'none' 
    ? 'DO NOT include any references or citations.' 
    : getReferenceInstructions(referenceStyle, faculty, isLastChapter, existingReferences); // ✅ Pass existing refs

  const prompt = `You are an expert academic writer specializing in ${faculty} ${chapterInfo.title === 'Introduction' ? 'project reports' : 'research'} for Nigerian universities.

PROJECT DETAILS:
- Title: ${projectTitle}
- Faculty: ${faculty}
- Department: ${department}
- ${faculty === 'Engineering' ? 'Components' : faculty === 'Sciences' || faculty === 'Agricultural Sciences' ? 'Materials' : 'Focus Areas'}: ${components.join(', ')}
- Description: ${description}
${imagesContext}
${contextSection}
${customSection}

FACULTY-SPECIFIC CONTEXT:
${facultyContext}

REFERENCE EXAMPLES FOR YOUR FACULTY:
${getFacultyReferenceExamples(faculty)}

CHAPTER TO WRITE:
Chapter ${chapterNumber}: ${chapterInfo.title}

REQUIRED SECTIONS (follow exactly):
${sectionsText}

FORMATTING REQUIREMENTS:
1. Use Markdown format ONLY
2. Start with: ## CHAPTER ${chapterNumber.toString().toUpperCase()}: ${chapterInfo.title.toUpperCase()}
3. For main sections: ### ${chapterNumber}.1 Section Name
4. For subsections: #### ${chapterNumber}.1.1 Subsection Name
5. Use **bold** for emphasis
6. Use bullet points with - for lists
7. Use numbered lists for procedures
8. Use proper Markdown tables
9. Keep paragraphs well-spaced

CONTENT REQUIREMENTS:
1. Write 2000-2500 words for this chapter
2. Use professional Nigerian academic tone
3. Be SPECIFIC to: ${components.join(', ')}
4. Include ${faculty}-appropriate technical details
5. Each section: 2-4 substantial paragraphs minimum
6. Use correct terminology for ${faculty}
7. Use Nigerian English spelling
8. ${faculty === 'Management Sciences' || faculty === 'Law' ? 'Include relevant Nigerian context/examples' : ''}
9. ${faculty === 'Sciences' || faculty === 'Agricultural Sciences' || faculty === 'Basic Medical Sciences' ? 'Include experimental/methodological details' : ''}

${referenceInstructions}

CRITICAL RULES:
1. NO meta-commentary like "This chapter will..."
2. NO explanatory phrases about what was covered
3. NO introductory text before ## heading
4. ONLY output actual chapter content starting with ##
5. If images available, reference using {{figureX.Y}} placeholders

FACULTY-SPECIFIC GUIDANCE FOR ${chapterInfo.title.toUpperCase()}:
${getFacultyChapterGuidance(chapterNumber, chapterInfo.title, faculty, components, department)}

Now write the complete chapter following ALL requirements above.`;

  return prompt;
}

// =====================================================
// FACULTY CONTEXT DEFINITIONS
// =====================================================
function getFacultyContext(faculty) {
  const contexts = {
    'Engineering': `Focus on technical specifications, circuit/system design, implementation details, and practical engineering applications. Use engineering terminology and include hardware/software specifics.`,
    
    'Sciences': `Emphasize experimental methodology, scientific rigor, hypothesis testing, and data analysis. Use scientific terminology and focus on reproducibility and validity.`,
    
    'Management Sciences': `Focus on organizational context, business implications, management theories, and practical applications in Nigerian business environment. Include case studies where appropriate.`,
    
    'Social Sciences': `Emphasize social theories, qualitative/quantitative research methods, demographic analysis, and societal implications. Use social science terminology and frameworks.`,
    
    'Arts & Humanities': `Focus on literary/cultural analysis, historical context, theoretical frameworks, and critical interpretation. Use humanities terminology and analytical approaches.`,
    
    'Law': `Emphasize legal principles, statutory provisions, case law analysis, and jurisprudential issues. Use proper legal terminology and cite relevant Nigerian laws where appropriate.`,
    
    'Education': `Focus on pedagogical theories, curriculum development, teaching methodologies, and educational implications. Use education terminology and reference learning theories.`,
    
    'Agricultural Sciences': `Emphasize agronomic principles, field methodology, crop/animal management, and practical agricultural applications. Use agricultural terminology and farming practices.`,
    
    'Environmental Science': `Focus on environmental assessment, ecological principles, sustainability, and policy implications. Use environmental science terminology and Nigerian environmental context.`,
    
    'Basic Medical Sciences': `Emphasize anatomical/physiological principles, clinical relevance, experimental procedures, and medical implications. Use medical terminology appropriately.`
  };

  return contexts[faculty] || contexts['Engineering'];
}

// =====================================================
// FACULTY-SPECIFIC REFERENCE EXAMPLES
// =====================================================
function getFacultyReferenceExamples(faculty) {
  const examples = {
    'Engineering': `
Example References:
- Adeyemi, T. A. (2021). Modern Electronic Systems Design. Lagos: Tech Publishers.
- Okafor, C. N. & Bello, S. M. (2022). Microcontroller Applications in Embedded Systems. Journal of Nigerian Engineering, 15(3), 45-62.
- Ahmed, K. (2020). Power Supply Design and Analysis. Abuja: Engineering Press.
`,
    
    'Sciences': `
Example References:
- Okonkwo, I. F. (2022). Experimental Methods in Natural Sciences. Ibadan: Science Publications.
- Eze, P. N. & Adeleke, R. O. (2021). Analytical Chemistry: Theory and Practice. Nigerian Journal of Pure Sciences, 12(2), 78-95.
- Musa, A. B. (2023). Laboratory Techniques and Safety. Lagos: Academic Publishers.
`,
    
    'Management Sciences': `
Example References:
- Adebayo, O. S. (2021). Strategic Management in Nigerian Organizations. Lagos: Business Press.
- Okafor, J. I. & Nwosu, P. C. (2022). Organizational Behavior and Performance. African Journal of Management Studies, 8(4), 112-128.
- Yusuf, M. A. (2020). Marketing Strategies for Emerging Markets. Abuja: MBA Publishers.
`,
    
    'Law': `
Example References:
- Akinola, S. R. (2022). Nigerian Constitutional Law: Principles and Practice. Lagos: Legal Publications.
- Eze, C. C. (2021). Jurisprudence and Legal Theory. Nigerian Law Review, 19(1), 34-56.
- Balogun, F. A. (2023). Administrative Law in Nigeria. Abuja: Justice Press.
Note: Do NOT cite specific case names like "Ransome-Kuti v. AG Federation" - just reference legal principles and authors.
`,
    
    'Social Sciences': `
Example References:
- Okoro, N. P. (2021). Social Research Methods. Lagos: Social Science Publishers.
- Ibrahim, A. K. & Chukwu, E. O. (2022). Contemporary Nigerian Society: Issues and Perspectives. Journal of Social Studies, 14(3), 89-104.
- Adeola, G. L. (2020). Sociology of Development. Ibadan: Academic Press.
`,
    
    'Arts & Humanities': `
Example References:
- Achebe, N. C. (2021). Literary Criticism and African Literature. Lagos: Humanities Publishers.
- Ogunyemi, T. O. (2022). Cultural Identity in Nigerian Prose. African Literature Review, 16(2), 45-67.
- Babatunde, S. A. (2020). Philosophy and the Nigerian Experience. Ibadan: Philosophy Press.
`,
    
    'Education': `
Example References:
- Oluwole, D. A. (2021). Curriculum Development in Nigerian Schools. Lagos: Education Publishers.
- Akintunde, E. O. & Ogundele, M. B. (2022). Pedagogical Approaches in Science Education. Journal of Educational Research, 11(4), 78-94.
- Yusuf, H. O. (2023). Learning Theories and Classroom Practice. Abuja: Teachers' Press.
`,
    
    'Agricultural Sciences': `
Example References:
- Adekunle, V. A. (2022). Crop Production and Management in Nigeria. Ibadan: Agricultural Publishers.
- Bello, O. S. & Oladipo, F. O. (2021). Soil Science and Fertility Management. Nigerian Journal of Agriculture, 18(3), 56-73.
- Mohammed, A. B. (2020). Sustainable Farming Practices. Kano: Agro Press.
`,
    
    'Environmental Science': `
Example References:
- Ojo, E. O. (2021). Environmental Management in Nigeria. Lagos: Environmental Publishers.
- Chukwu, K. E. & Adebanjo, A. A. (2022). Climate Change and Adaptation Strategies. Nigerian Environmental Journal, 13(2), 89-106.
- Ajayi, S. O. (2023). Environmental Impact Assessment Procedures. Abuja: Green Publishers.
`,
    
    'Basic Medical Sciences': `
Example References:
- Adeyemo, W. L. (2021). Human Anatomy and Physiology. Lagos: Medical Publishers.
- Ogunbiyi, A. O. & Salami, A. T. (2022). Biochemical Principles in Medicine. Nigerian Medical Journal, 25(4), 234-251.
- Ibrahim, N. A. (2020). Pharmacology: Basic Principles and Applications. Ibadan: Health Press.
`
  };

  return examples[faculty] || examples['Engineering'];
}

// =====================================================
// FACULTY-SPECIFIC CHAPTER GUIDANCE
// =====================================================
function getFacultyChapterGuidance(chapterNum, chapterTitle, faculty, components, department) {
  const componentsList = components.join(', ');

  // Chapter 1: Introduction
  if (chapterNum === 1) {
    const introGuidance = {
      'Engineering': `Explain ${department} field and how ${componentsList} fit into modern applications. Identify a specific technical problem these components solve. Write ONE clear aim ("To design and implement..."). List 4-6 SMART objectives. Justify why THIS project matters in Nigeria now.`,
      
      'Sciences': `Explain scientific background of ${componentsList}. State research questions clearly. Define hypotheses if applicable. Explain significance of findings to scientific community. Justify why this research is timely and relevant.`,
      
      'Management Sciences': `Explain organizational/business context. State the management problem clearly. Define research questions tied to Nigerian business environment. Justify practical relevance to organizations in Nigeria.`,
      
      'Social Sciences': `Explain social phenomenon being studied. State research questions about societal issues. Define theoretical framework guiding the study. Justify social relevance and potential policy implications.`,
      
      'Arts & Humanities': `Provide historical/cultural context. State research questions about literary/cultural phenomena. Explain theoretical perspectives to be used. Justify contribution to humanities scholarship.`,
      
      'Law': `Explain legal context and relevant laws. State legal research questions. Define scope within Nigerian legal framework. Justify legal significance and potential impact on jurisprudence.`,
      
      'Education': `Explain educational context and pedagogical issues. State research questions about teaching/learning. Define theoretical framework (learning theories). Justify educational implications for Nigerian schools.`,
      
      'Agricultural Sciences': `Explain agronomic background. State research questions about crop/animal/soil management. Define hypotheses if applicable. Justify agricultural/economic importance to Nigerian farming.`,
      
      'Environmental Science': `Explain environmental issue/context. State research questions about environmental problems. Justify environmental significance and policy implications for Nigeria.`,
      
      'Basic Medical Sciences': `Explain anatomical/physiological background. State research questions about medical phenomena. Define hypotheses if applicable. Justify clinical/medical relevance to healthcare.`
    };

    return introGuidance[faculty] || introGuidance['Engineering'];
  }

  // Chapter 2: Literature Review
  if (chapterNum === 2) {
    const litReviewGuidance = {
      'Engineering': `Review theoretical principles behind ${componentsList}. Discuss 3-5 similar projects. For each component, explain: what it is, how it works, specifications, why chosen. Synthesize and lead to methodology.`,
      
      'Sciences': `Review scientific theories relevant to ${componentsList}. Discuss previous experimental studies. Analyze methodologies used by others. Identify research gaps your study will fill.`,
      
      'Management Sciences': `Review management theories and frameworks. Discuss empirical studies from Nigerian and international contexts. Analyze organizational practices. Identify gaps in management literature.`,
      
      'Social Sciences': `Review social theories and concepts. Discuss empirical studies on the phenomenon. Analyze research methodologies used. Identify gaps in understanding social issues.`,
      
      'Arts & Humanities': `Review theoretical perspectives and critical approaches. Discuss relevant literary/cultural works. Analyze scholarly interpretations. Identify new analytical angles.`,
      
      'Law': `Review legal framework (constitutional, statutory, case law). Analyze judicial pronouncements. Discuss legal principles. Identify gaps or inconsistencies in law.`,
      
      'Education': `Review educational theories (learning theories, pedagogical approaches). Discuss empirical studies in education. Analyze teaching methodologies. Identify gaps in educational research.`,
      
      'Agricultural Sciences': `Review agronomic principles and theories. Discuss previous field/lab studies. Analyze agricultural practices. Identify gaps in agricultural knowledge.`,
      
      'Environmental Science': `Review environmental theories and policies. Discuss previous environmental studies. Analyze assessment methodologies. Identify environmental research gaps.`,
      
      'Basic Medical Sciences': `Review anatomical/physiological theories. Discuss previous medical studies. Analyze clinical methodologies. Identify gaps in medical knowledge.`
    };

    return litReviewGuidance[faculty] || litReviewGuidance['Engineering'];
  }

  // Chapter 3: Methodology
  if (chapterNum === 3) {
    const methodologyGuidance = {
      'Engineering': `Explain system architecture of ${componentsList}. Provide detailed circuit/block diagrams. Analyze each component (specs, pins, interfaces). Give step-by-step implementation. Include BEME with realistic Nigerian prices (₦). Explain testing procedures.`,
      
      'Sciences': `Describe experimental design clearly. List all materials/reagents/equipment. Provide detailed procedures (reproducible). Explain data collection methods. Describe statistical analysis techniques. Address validity and reliability.`,
      
      'Management Sciences': `Describe research design (survey, case study, etc.). Define population and sampling. Explain data collection instruments (questionnaire, interview). Describe data analysis methods (statistical, thematic). Address validity and reliability.`,
      
      'Social Sciences': `Describe research design and approach. Define study area/population. Explain sampling technique. Describe data collection methods. Explain analysis techniques (quantitative/qualitative). Address ethical considerations.`,
      
      'Arts & Humanities': `Describe research approach (textual analysis, historical, etc.). Identify primary and secondary sources. Explain method of data collection. Describe analytical framework to be used. Explain interpretive approach.`,
      
      'Law': `Describe doctrinal/non-doctrinal research approach. Identify sources (primary legal texts, case law, secondary literature). Explain method of legal analysis. Describe interpretive framework. Address scope of legal research.`,
      
      'Education': `Describe research design (experimental, quasi-experimental, descriptive). Define study area and population (schools, students). Explain sampling technique. Describe instruments (tests, questionnaires). Explain data analysis methods. Address validity/reliability.`,
      
      'Agricultural Sciences': `Describe experimental site and design (layout, treatments). List all materials and equipment. Provide detailed field/lab procedures. Explain data collection methods. Describe statistical analysis (ANOVA, etc.). Address experimental controls.`,
      
      'Environmental Science': `Describe study area with details (location, characteristics). Explain sampling design/techniques. Describe data collection methods (field, lab). Explain analysis techniques. Address quality control and limitations.`,
      
      'Basic Medical Sciences': `Describe study design (experimental, observational, clinical). Define study population/sample. List all materials/reagents/equipment. Provide detailed procedures. Explain data collection and statistical analysis. Address ethical considerations.`
    };

    return methodologyGuidance[faculty] || methodologyGuidance['Engineering'];
  }

  // Chapter 4: Results/Data Presentation
  if (chapterNum === 4) {
    const resultsGuidance = {
      'Engineering': `Describe 3-5 tests conducted (unit, integration, system, performance). For EACH test: purpose, procedure, expected result, actual result. Present data in tables. Reference test images. Analyze whether objectives from Chapter 1 were met. Be honest about successes and limitations.`,
      
      'Sciences': `Present experimental results clearly with tables/graphs. Provide statistical analysis (p-values, significance). Interpret data objectively. Compare with expected theoretical values. Be transparent about anomalies or limitations.`,
      
      'Management Sciences': `Present demographic data of respondents. Analyze research questions with appropriate statistics. Test hypotheses (if applicable). Present findings in tables/charts. Discuss findings in relation to management theories from Chapter 2.`,
      
      'Social Sciences': `Present demographic characteristics of participants. Analyze research questions systematically. Test hypotheses (if applicable). Present findings with tables/charts. Discuss in relation to social theories from Chapter 2.`,
      
      'Arts & Humanities': `Present textual/content analysis findings. Discuss thematic patterns identified. Provide critical interpretation with examples. Analyze in relation to theoretical framework from Chapter 2.`,
      
      'Law': `Present key legal findings from analysis. Discuss case law examination results. Analyze statutory interpretations. Present jurisprudential issues identified. Discuss legal implications.`,
      
      'Education': `Present analysis of research questions with appropriate statistics. Test hypotheses (if applicable). Present findings with tables/charts. Discuss findings in relation to educational theories. Explain pedagogical implications.`,
      
      'Agricultural Sciences': `Present experimental results with tables/graphs. Provide statistical analysis (ANOVA, LSD, etc.). Compare treatment effects. Discuss in relation to agronomic principles. Compare with previous studies.`,
      
      'Environmental Science': `Present environmental data with tables/charts/maps. Provide statistical/spatial analysis. Interpret environmental conditions. Discuss environmental implications. Compare with standards/previous studies.`,
      
      'Basic Medical Sciences': `Present experimental/clinical results clearly. Provide statistical analysis. Discuss clinical implications. Compare with physiological/anatomical principles. Relate to previous medical studies.`
    };

    return resultsGuidance[faculty] || resultsGuidance['Engineering'];
  }

  // Chapter 5/6: Conclusion
  if (chapterNum === 5 || chapterNum === 6) {
    const conclusionGuidance = {
      'Engineering': `Recap entire project journey. Highlight KEY results. Assess which objectives were achieved. Evaluate strengths and weaknesses honestly. Recommend 5-7 improvements (additional features, scaling, commercial viability, future research). End with strong closing about project value.`,
      
      'Sciences': `Summarize study and findings. State conclusion based on results. Explain contributions to scientific knowledge. Acknowledge limitations. Recommend future research directions.`,
      
      'Management Sciences': `Summarize research and findings. State conclusions. Explain contributions to management knowledge. Provide managerial/organizational recommendations. Acknowledge limitations. Suggest future research.`,
      
      'Social Sciences': `Summarize research and findings. State conclusions. Explain social implications. Provide policy recommendations. Acknowledge limitations. Suggest future research.`,
      
      'Arts & Humanities': `Summarize analysis and findings. State conclusions. Explain contributions to humanities scholarship. Acknowledge limitations of interpretation. Suggest areas for further study.`,
      
      'Law': `Summarize research. State legal conclusions. Provide legislative, judicial, and policy recommendations. Explain contributions to legal scholarship. Acknowledge limitations. Suggest areas for further legal research.`,
      
      'Education': `Summarize research and findings. State educational conclusions. Explain pedagogical implications for teachers/schools. Provide educational recommendations. Acknowledge limitations. Suggest further educational research.`,
      
      'Agricultural Sciences': `Summarize study and findings. State agronomic conclusions. Explain practical implications for farmers. Provide agricultural recommendations. Acknowledge limitations. Suggest further research.`,
      
      'Environmental Science': `Summarize study and findings. State environmental conclusions. Provide policy and management recommendations. Explain environmental implications. Acknowledge limitations. Suggest further environmental research.`,
      
      'Basic Medical Sciences': `Summarize study and findings. State medical/clinical conclusions. Explain clinical implications for healthcare. Provide research/clinical recommendations. Acknowledge limitations. Suggest further medical research.`
    };

    return conclusionGuidance[faculty] || conclusionGuidance['Engineering'];
  }

  // Default for other chapters
  return `Write this chapter with depth, professionalism, and ${faculty}-specific terminology. Connect everything to ${componentsList} and ${department} principles.`;
}

export {
  getFacultySpecificPrompt as getStandardPrompt,
  getSIWESPrompt
};