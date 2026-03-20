// src/lib/standardPrompts.js
export const getStandardPrompt = (type, data) => {
  const baseInstructions = `
    You are an expert technical writer for Nigerian Engineering projects.
    Use British English (e.g., 'modelling', 'analysis').
    STRICT RULE: Use ONLY Nigerian Naira (₦) for all pricing and costs. DO NOT use Dollars ($) or USD.
  `;

  if (type === 'it_report') {
    const { companyName, department, description, partNumber } = data;
    return `${baseInstructions}
      Generate Part ${partNumber} of an Industrial Training (IT) Report for ${companyName} (${department}).
      
      Part ${partNumber} Focus: ${description}
      
      Budgetary Analysis: If discussing any component costs or logistics during training, use Nigerian Naira (₦) exclusively.`;
  }

  // Chapter-based standard prompts
  const { chapterNumber, projectTitle, faculty, department, components, description } = data;
  return `${baseInstructions}
    Generate CHAPTER ${chapterNumber} for an engineering project titled "${projectTitle}".
    
    Field: ${faculty} - ${department}
    Project Context: ${description}
    Technical Components: ${components.join(', ')}
    
    BEME & Pricing: If generating a cost table or economic justification, ensure all unit prices are in Nigerian Naira (₦) based on current Nigerian market trends.`;
};
