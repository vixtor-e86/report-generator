// src/lib/prompts.js

export function getChapterPrompt(chapterNumber, data) {
  const { projectTitle, department, components, description, imagesContext, context } = data;

  const baseInstructions = `
You are an expert academic writer specializing in Nigerian engineering project reports.

PROJECT DETAILS:
- Title: ${projectTitle}
- Department: ${department}
- Components: ${components}
- Description: ${description}
${imagesContext}
${context}

CRITICAL FORMATTING RULES (Markdown Only):
- Do NOT use HTML tags (no <h1>, <p>, <br>).
- Use standard Markdown syntax.
- **Headers:** Use "## " for Chapter Titles and "### " for Section Headers (e.g., ### 1.1 Background).
- **Paragraphs:** You MUST leave a blank line between every paragraph.
- **Bold:** Use **text** for emphasis or defined terms.
- **Lists:** Use "-" for bullet points.
- **Citations:** IEEE style in square brackets, e.g., [1].

WRITING STYLE:
- Tone: Formal, academic, engineering-focused.
- Structure: Long, detailed paragraphs (minimum 5-6 sentences per paragraph).
- Avoid: "In this chapter", "The structure is as follows". Just write the content.
`;

  const prompts = {
    1: `${baseInstructions}

CHAPTER 1: INTRODUCTION

Generate Chapter 1. The output must look exactly like this structure:

## CHAPTER ONE: INTRODUCTION

### 1.1 Background of the Study
(Write 3 detailed paragraphs here about the evolution of this technology, global context, and local context in Nigeria.)

### 1.2 Problem Statement
(Write 2 paragraphs clearly defining the gap this project fills. Why is it needed?)

### 1.3 Aim and Objectives
**Aim:** (State the single main aim)

**Objectives:**
- (Objective 1)
- (Objective 2)
- (Objective 3)
- (Objective 4)
- (Objective 5)

### 1.4 Justification
(Write 2 paragraphs on why this project is technically and economically justified.)

### 1.5 Significance of the Study
(Write 2 paragraphs on who benefits: students, the department, local industry.)

### 1.6 Scope and Limitations
(Write 2 paragraphs defining boundaries and constraints.)

### 1.7 Project Structure
(Briefly list what each chapter covers.)

Total length: approx 2000 words.
`,

    2: `${baseInstructions}

CHAPTER 2: LITERATURE REVIEW

Generate Chapter 2. The output must look exactly like this structure:

## CHAPTER TWO: LITERATURE REVIEW

### 2.1 Introduction
(1 paragraph overview.)

### 2.2 Theoretical Framework
(Explain the engineering principles behind the project. 3-4 paragraphs with citations [x].)

### 2.3 Review of Related Work
(Review 5 similar existing projects. Compare them to your work. Use citations [x].)

### 2.4 Component Review
(Detailed technical review of: ${components}. Explain how they work. 1 paragraph per component.)

### 2.5 Summary
(Synthesize the review and identify the gap.)

Total length: approx 2500 words.
`,

    3: `${baseInstructions}

CHAPTER 3: METHODOLOGY

Generate Chapter 3. The output must look exactly like this structure:

## CHAPTER THREE: METHODOLOGY AND IMPLEMENTATION

### 3.1 Introduction
(1 paragraph overview.)

### 3.2 System Design
(Describe the block diagram and overall architecture. 2 paragraphs.)

### 3.3 Hardware Design
(Explain the circuit connections and schematic logic. 3 paragraphs.)

### 3.4 Software Implementation
(Explain the logic, flowcharts, and algorithms used. 3 paragraphs.)

### 3.5 Bill of Materials
| S/N | Component | Specification | Quantity | Function |
|-----|-----------|---------------|----------|----------|
| 1 | (Item) | (Spec) | (Qty) | (Func) |
| 2 | (Item) | (Spec) | (Qty) | (Func) |
(Fill this table with: ${components})

### 3.6 Assembly and Construction
(Step-by-step assembly process. 2 paragraphs.)

Total length: approx 2500 words.
`,

    4: `${baseInstructions}

CHAPTER 4: TESTS AND RESULTS

Generate Chapter 4. The output must look exactly like this structure:

## CHAPTER FOUR: TESTS AND RESULTS ANALYSIS

### 4.1 Introduction
(1 paragraph.)

### 4.2 Test Setup
(Describe equipment and environment used for testing.)

### 4.3 Tests Conducted
(Describe 3 specific tests performed on the system.)

### 4.4 Results
(Present the data or observations from the tests.)

### 4.5 Discussion of Results
(Analyze if the results met the objectives. 3 paragraphs.)

Total length: approx 2000 words.
`,

    5: `${baseInstructions}

CHAPTER 5: CONCLUSION AND REFERENCES

Generate Chapter 5. The output must look exactly like this structure:

## CHAPTER FIVE: CONCLUSION AND RECOMMENDATIONS

### 5.1 Introduction
(1 paragraph recap.)

### 5.2 Summary of Findings
(Summarize the achievements.)

### 5.3 Conclusion
(Final verdict on the project success.)

### 5.4 Challenges Encountered
(List technical difficulties faced.)

### 5.5 Recommendations
- (Recommendation 1)
- (Recommendation 2)
- (Recommendation 3)

## REFERENCES
(Generate a list of 10-15 realistic IEEE style references that were cited in previous chapters. Use strict IEEE format.)
[1] A. Author, *Book Title*. City: Publisher, Year.
[2] B. Researcher, "Paper Title," *Journal Name*, vol. x, no. x, pp. xx-xx, Year.
[3] (Continue for 10-15 sources relevant to ${components} and ${department})

Total length: approx 2000 words.
`
  };

  return prompts[chapterNumber] || prompts[1];
}