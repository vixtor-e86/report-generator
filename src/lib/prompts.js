// src/lib/prompts.js
export const getChapterPrompt = (chapterNumber, projectTitle, department, components, description, context, imagesContext) => {
  const baseInstructions = `
    You are an expert academic writer specialized in Nigerian Engineering Reports.
    Write a technical and professional report chapter. 
    Use British English spelling (e.g., 'modelling', 'programme').
    STRICT RULE: Use ONLY Nigerian Naira (₦) for all financial values, component costs, and pricing. DO NOT use Dollars ($) or USD.
    Ensure technical accuracy and academic depth.
  `;

  const prompts = {
    1: `${baseInstructions}
      Generate CHAPTER ONE: INTRODUCTION.
      Include these sections:
      - 1.1 Background of Study
      - 1.2 Statement of the Problem
      - 1.3 Aims and Objectives (Must align with: ${components})
      - 1.4 Significance of the Study
      - 1.5 Scope and Limitation
      
      Economic Justification: Explain why using [${components}] is cost-effective in the Nigerian market, providing estimates in Naira (₦).`,

    2: `${baseInstructions}
      Generate CHAPTER TWO: LITERATURE REVIEW.
      Include:
      - 2.1 Theoretical Framework
      - 2.2 Review of Related Technologies (Focus on ${components})
      - 2.3 Summary of Gaps in Existing Research`,

    3: `${baseInstructions}
      Generate CHAPTER THREE: METHODOLOGY AND SYSTEM DESIGN.
      Focus on the technical architecture of ${projectTitle}.
      Include:
      - 3.1 System Block Diagram Description
      - 3.2 Component Selection and Specifications (Using ${components})
      - 3.3 Design Calculations and Circuit Analysis`,

    4: `${baseInstructions}
      Generate CHAPTER FOUR: TESTING, RESULTS AND DISCUSSION.
      Include:
      - 4.1 Construction and Assembly (Step-by-step)
      - 4.2 System Testing and Validation
      - 4.3 Discussion of Findings
      - 4.4 Bill of Engineering Measurement and Evaluation (BEME):
        Create a detailed table of components (${components}) with realistic Nigerian market prices in Naira (₦).`,

    5: `${baseInstructions}
      Generate CHAPTER FIVE: CONCLUSION AND RECOMMENDATIONS.
      Include:
      - 5.1 Conclusion
      - 5.2 Recommendations for Further Work`
  };

  return prompts[chapterNumber] || prompts[1];
};
