// src/lib/abstractGenerator.js
export const getAbstractPrompt = (project, chapters, faculty) => {
  const chapterSummary = chapters
    .map(ch => `${ch.title}: ${ch.content?.substring(0, 300)}...`)
    .join('\n');

  return `You are an expert academic writer. Generate a professional ABSTRACT for this ${faculty} project report.
    
    PROJECT TITLE: ${project.title}
    DEPARTMENT: ${project.department}
    COMPONENTS/FOCUS: ${project.components?.join(', ')}
    
    STRICT RULE: Use ONLY Nigerian Naira (₦) if any financial or cost analysis is mentioned.
    
    Structure:
    1. Background and Motivation
    2. Problem Statement
    3. Methodology and Technical Implementation
    4. Key Findings and Results
    5. Conclusion and Economic Significance
    
    Chapter Data:
    ${chapterSummary}
    
    Ensure the abstract is between 250-350 words, academically dense, and professional.`;
};
