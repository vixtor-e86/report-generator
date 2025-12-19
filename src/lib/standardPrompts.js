// /src/lib/standardPrompts.js
// Dynamic Standard Tier AI Prompts - Uses template structure from database
// Supports both Regular Projects and SIWES/Industrial Training

export function getStandardPrompt(chapterNumber, data) {
  const { templateStructure } = data;
  
  // Check if this is a SIWES template
  const isSIWES = templateStructure?.chapters?.some(ch => 
    ch.title?.toLowerCase().includes('siwes') || 
    ch.title?.toLowerCase().includes('industrial') ||
    ch.title?.toLowerCase().includes('work experience')
  );

  // Route to appropriate prompt function
  if (isSIWES) {
    return getSIWESPrompt(chapterNumber, data);
  } else {
    return getRegularPrompt(chapterNumber, data);
  }
}

// SIWES/Industrial Training Prompt Function
function getSIWESPrompt(partNumber, data) {
  const {
    projectTitle, // Will be "Company Name - Industrial Training Report"
    department, // Department/Division attached to
    components, // [0] = Company Name
    description, // Contains duration + work description
    images = [],
    context = '',
    customInstruction = '',
    templateStructure
  } = data;

  const companyName = components[0] || 'the organization';
  
  // Extract duration from description (first line)
  const descriptionLines = description.split('\n');
  const duration = descriptionLines[0]?.replace('Duration:', '').trim() || '';
  const workDescription = descriptionLines.slice(2).join('\n').trim();

  const partInfo = templateStructure?.chapters?.find(ch => ch.number === partNumber);
  
  if (!partInfo) {
    throw new Error(`Part ${partNumber} not found in template structure`);
  }

  // Build images context
  let imagesContext = '';
  if (images && images.length > 0) {
    imagesContext = '\n\n=== AVAILABLE IMAGES ===\n';
    images.forEach((img, idx) => {
      imagesContext += `Image ${idx + 1}: ${img.caption}\n`;
    });
    imagesContext += `\nReference these images using {{figure${partNumber}.1}}, {{figure${partNumber}.2}}, etc.\n`;
    imagesContext += `Place figure references where appropriate (equipment photos, workplace images, diagrams).\n`;
  }

  // Build context from previous parts
  let contextSection = '';
  if (context) {
    contextSection = `\n\n=== CONTEXT FROM PREVIOUS PARTS ===\n${context}\n\nUse this to maintain consistency.\n`;
  }

  // Build custom instruction
  let customSection = '';
  if (customInstruction) {
    customSection = `\n\n=== ADDITIONAL INSTRUCTION ===\n${customInstruction}\n`;
  }

  // Build sections list
  const sectionsText = partInfo.sections.map(section => `${section}`).join('\n');

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
1. Write 2000-2500 words for this part
2. Use professional Nigerian academic tone
3. Focus on ACTUAL work experience, not theoretical knowledge
4. Be specific about:
   - Tasks you performed
   - Skills you acquired
   - Equipment/tools you used
   - People you worked with
   - Challenges you faced
5. Use first-person perspective ("I was assigned...", "I learned...", "I observed...")
6. Include practical examples from your experience
7. Reference ${department} department work specifically

CRITICAL RULES:
1. DO NOT include meta-commentary
2. DO NOT use citation numbers [1], [2]
3. ONLY output the actual content starting with ## heading
4. Be honest and realistic about industrial training experience
5. Focus on learning outcomes and practical skills

SPECIFIC GUIDANCE FOR ${partInfo.title.toUpperCase()}:

${getSIWESPartGuidance(partNumber, partInfo.title, companyName, department)}

Now write the complete part following ALL requirements above.`;

  return prompt;
}

// SIWES Part-Specific Guidance
function getSIWESPartGuidance(partNumber, partTitle, companyName, department) {
  if (partNumber === 1) {
    return `
This is the INTRODUCTION part. Set the stage for your training experience:

- Background of SIWES: Explain what SIWES is, its objectives in Nigerian universities
- Company Profile: Provide detailed information about ${companyName}:
  * Brief history and establishment
  * Core business/services
  * Organizational structure
  * Products/services offered
  * Market position in Nigeria
- SIWES Objectives: List 4-6 specific objectives you hoped to achieve
- Duration and Scope: Clearly state when training started/ended and what departments you covered

Make it informative and professional. Show you understand the company well.`;
  }

  if (partNumber === 2) {
    return `
This is the WORK EXPERIENCE part. This is the CORE of your report:

- Department Overview: Describe ${department} department structure and functions
- Daily Activities: Detail your typical day's activities (be specific!)
- Responsibilities: List tasks you were assigned
- Technical Skills: What new skills did you acquire? (software, tools, procedures)
- Equipment/Tools: What equipment did you use? Describe them.

Be VERY specific. Don't say "I learned about engineering" - say "I learned to use AutoCAD for circuit design, created 5 PCB layouts..."

Use concrete examples! This section should be the longest and most detailed.`;
  }

  if (partNumber === 3) {
    return `
This is the ANALYSIS part. Go deeper into the technical aspects:

- Technical Analysis: Discuss specific projects/tasks you worked on in detail
- Challenges: What problems did you encounter? (technical, interpersonal, resource)
- Solutions: How did you or the team solve these challenges?
- Theory vs Practice: How did your classroom knowledge apply (or not apply) to real work?

Show critical thinking. Don't just describe - analyze and reflect on your experience.`;
  }

  if (partNumber === 4) {
    return `
This is the CONCLUSION part. Wrap up your training experience:

- Summary: Recap the key aspects of your training
- Personal Development: How did you grow professionally? What soft skills improved?
- Recommendations for ${companyName}: Suggest improvements for their training program
- Recommendations for Institution: Suggest how your university can improve SIWES
- Overall Conclusion: Final thoughts on the value of your training

Be constructive with recommendations. Show maturity and professionalism.`;
  }

  return `Write this part with depth and specificity. Connect everything to your actual experience at ${companyName} in the ${department} department.`;
}

// Regular Project Prompt Function (existing logic)
function getRegularPrompt(chapterNumber, data) {
  const {
    projectTitle,
    department,
    components,
    description,
    images = [],
    context = '',
    customInstruction = '',
    templateStructure
  } = data;

  const chapterInfo = templateStructure?.chapters?.find(ch => ch.number === chapterNumber);
  
  if (!chapterInfo) {
    throw new Error(`Chapter ${chapterNumber} not found in template structure`);
  }

  // Rest of existing getStandardPrompt logic...
  // [Keep all the existing code from the original getStandardPrompt]
  
  // Build images context
  let imagesContext = '';
  if (images && images.length > 0) {
    imagesContext = '\n\n=== AVAILABLE IMAGES ===\n';
    images.forEach((img, idx) => {
      imagesContext += `Image ${idx + 1}: ${img.caption}\n`;
    });
    imagesContext += `\nIMPORTANT: Reference these images in your content using placeholders like {{figure${chapterNumber}.1}}, {{figure${chapterNumber}.2}}, etc.\n`;
    imagesContext += `Place figure references WHERE APPROPRIATE in the text, typically:\n`;
    imagesContext += `- After describing a circuit/diagram/system\n`;
    imagesContext += `- When showing test results or data\n`;
    imagesContext += `- When illustrating a concept or design\n`;
    imagesContext += `Example: "The system architecture is shown in {{figure${chapterNumber}.1}}"\n`;
  }

  // Build context from previous chapters
  let contextSection = '';
  if (context) {
    contextSection = `\n\n=== CONTEXT FROM PREVIOUS CHAPTERS ===\n${context}\n\nUse this context to maintain consistency and avoid repetition.\n`;
  }

  // Build custom instruction section
  let customSection = '';
  if (customInstruction) {
    customSection = `\n\n=== ADDITIONAL INSTRUCTION FROM USER ===\n${customInstruction}\n\nIMPORTANT: Incorporate this specific requirement into the chapter generation.\n`;
  }

  // Build sections list from template
  const sectionsText = chapterInfo.sections
    .map(section => `${section}`)
    .join('\n');

  // Main prompt
  const prompt = `You are an expert academic writer specializing in engineering project reports for Nigerian universities. Write a professional, well-structured chapter for an engineering project report.

PROJECT DETAILS:
- Title: ${projectTitle}
- Department: ${department}
- Components: ${components.join(', ')}
- Description: ${description}
${imagesContext}
${contextSection}
${customSection}

CHAPTER TO WRITE:
Chapter ${chapterNumber}: ${chapterInfo.title}

REQUIRED SECTIONS (follow this structure exactly):
${sectionsText}

FORMATTING REQUIREMENTS:
1. Use Markdown format ONLY
2. Start with: ## CHAPTER ${chapterNumber.toString().toUpperCase()}: ${chapterInfo.title.toUpperCase()}
3. For main sections use: ### ${chapterNumber}.1 Section Name
4. For subsections use: #### ${chapterNumber}.1.1 Subsection Name
5. Use **bold** for emphasis on important terms
6. Use bullet points with - for lists
7. Use numbered lists with 1. 2. 3. when showing steps/procedures
8. For tables, use proper Markdown table syntax:
   | Column 1 | Column 2 | Column 3 |
   |----------|----------|----------|
   | Data     | Data     | Data     |
9. Keep paragraphs well-spaced with blank lines between them

CONTENT REQUIREMENTS:
1. Write 2000-2500 words total for this chapter
2. Use professional Nigerian academic tone
3. Be VERY SPECIFIC to the project components: ${components.join(', ')}
4. Include technical details appropriate for ${department}
5. Each section should be substantial (2-4 paragraphs minimum)
6. Use technical terminology correctly
7. For Bill of Materials/BEME tables, use realistic Nigerian Naira (₦) prices
8. Maintain consistency with previous chapters (if context provided)
9. Use Nigerian English spelling (e.g., "organisation" not "organization")

CRITICAL RULES:
1. DO NOT include any meta-commentary like "This chapter will..." or "The structure includes..."
2. DO NOT end with explanatory phrases about what was covered
3. DO NOT use citation numbers like [1], [2], [3] - just reference general knowledge
4. DO NOT add introductory text before the chapter heading
5. ONLY output the actual chapter content starting with the ## heading
6. If the project has no software component, adapt sections accordingly
7. If images are available, naturally reference them using the {{figureX.Y}} placeholders

SPECIFIC GUIDANCE FOR ${chapterInfo.title.toUpperCase()}:

${getChapterSpecificGuidance(chapterNumber, chapterInfo.title, components, department)}

Now write the complete chapter following ALL requirements above.`;

  return prompt;
}

// Chapter-specific detailed guidance (existing function)
function getChapterSpecificGuidance(chapterNum, chapterTitle, components, department) {
  const componentsList = components.join(', ');

  // Generic guidance that applies to all chapter types
  if (chapterNum === 1) {
    return `
This is the INTRODUCTION chapter. Make it compelling and clear:

- In Background: Explain the field of ${department} and how ${componentsList} fit into modern applications
- In Problem Statement: Identify a real, specific problem that ${componentsList} can help solve
- In Aim: Write ONE clear sentence starting with "To design and implement..."
- In Objectives: List 4-6 SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound)
- In Justification: Explain why THIS project matters NOW in Nigeria
- In Scope: Be clear about what the project WILL and WILL NOT cover
- In Project Organization: Briefly preview what each chapter will contain (1-2 sentences each)

Write in a way that makes the reader excited about this project!`;
  }

  if (chapterNum === 2) {
    return `
This is the LITERATURE REVIEW chapter. Show your research and knowledge:

- In Introduction: Set the stage for what theories and work you'll review
- In Theoretical Framework: Explain the core engineering principles behind ${componentsList}
- In Related Work: Discuss 3-5 similar projects/research (can be general, no specific citations needed)
- For each component (${componentsList}): Write detailed subsections explaining:
  * What it is and how it works technically
  * Key specifications and features
  * Advantages and disadvantages
  * Why you chose it for THIS project
- In Summary: Synthesize everything and show how it leads to your methodology

Make sure to demonstrate deep technical understanding of ${department} concepts.`;
  }

  if (chapterNum === 3) {
    return `
This is the METHODOLOGY chapter. Be VERY detailed and technical:

- In System Design: Explain the overall architecture - how ${componentsList} connect and work together
- In Circuit/Block Diagram: Describe connections in detail (reference images if available)
- In Component Analysis: For EACH component in ${componentsList}, explain:
  * Technical specifications
  * Pin configurations (if applicable)
  * How it interfaces with other components
- In Implementation: Provide step-by-step procedures
- In BEME/Bill of Materials: Create a detailed table with:
  * S/N, Component Name, Specification, Quantity, Unit Price (₦), Total (₦)
  * Use realistic Nigerian market prices (2024/2025)
  * Include ALL components needed
  * Add a TOTAL row at the bottom
- In Testing/Verification: Explain how you verified each subsystem works
- In Operational Guide: Write clear steps on HOW TO USE the completed system

This chapter should be the most technical and detailed. A reader should be able to REPLICATE your project from this chapter alone.`;
  }

  if (chapterNum === 4) {
    return `
This is the RESULTS chapter. Show your testing and outcomes:

- In Tests Conducted: Describe 3-5 different tests you performed:
  * Unit tests (testing individual components)
  * Integration tests (testing how components work together)
  * System tests (testing the complete system)
  * Performance tests (speed, accuracy, efficiency)
- For EACH test, explain:
  * Purpose: Why this test?
  * Procedure: How was it done?
  * Expected result: What should happen?
  * Actual result: What actually happened?
- In Results: Present data clearly:
  * Use tables for numerical data
  * Reference test images if available ({{figure4.1}})
  * Be specific with measurements
- In Discussion: Analyze the results:
  * Did it meet objectives from Chapter 1?
  * What worked well?
  * What didn't work as expected and why?
  * Compare with theoretical expectations

Be honest about both successes and limitations. Show critical thinking!`;
  }

  if (chapterNum === 5 || chapterNum === 6) {
    return `
This is the CONCLUSION chapter. Wrap everything up professionally:

- In Summary: Recap the entire project journey in 2-3 paragraphs
- In Findings: Highlight the KEY results from Chapter 4
- In Appraisal/Evaluation: Objectively assess:
  * Which objectives from Chapter 1 were achieved?
  * Overall success rate
  * Strengths of your design
  * Weaknesses and limitations
- In Problems Encountered: Be honest about challenges:
  * Technical difficulties
  * Resource constraints
  * Time limitations
  * How you overcame them (or didn't)
- In Recommendations: Provide 5-7 SPECIFIC suggestions:
  * How to improve this design
  * Additional features to add
  * Different approaches to try
  * Scaling possibilities
  * Commercial viability
  * Future research directions
- In Conclusion: End with strong closing remarks about the project's value and impact

Make this chapter reflective, honest, and forward-thinking!`;
  }

  // Default for SIWES or other chapter types
  return `
Write this chapter with depth and professionalism. Use the section structure provided and ensure each section is substantial and well-developed. Connect everything back to the project components (${componentsList}) and the field of ${department}.`;
}