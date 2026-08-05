import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      companyName = 'Industrial Firm',
      companyAddress = '',
      department = 'Technical Operations',
      duration = '6 Months (24 Weeks)',
      institution = 'University',
      course = 'Engineering & Applied Sciences',
      studentName = '',
      matricNumber = '',
      objectives = [],
      workDescription = '',
      equipment = '',
      refinePart = null, // null for full generation, or 'abstract'|'part1'|'part2'|'part3'|'part4'
      existingPartContent = ''
    } = body;

    // Optional Auth check for security
    const authHeader = request.headers.get('Authorization');
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    }

    const formattedObjectives = Array.isArray(objectives) && objectives.length > 0
      ? objectives.filter(Boolean).map((obj, i) => `${i + 1}. ${obj}`).join('\n')
      : '1. Gain practical hands-on experience in technical and industrial processes.\n2. Bridge theoretical knowledge with industrial application.\n3. Understand safety protocols, machinery operation, and workflow management.';

    const commonContext = `
STUDENT & PLACEMENT PROFILE:
- Organization / Company: ${companyName} ${companyAddress ? `(${companyAddress})` : ''}
- Department / Section: ${department}
- Duration of SIWES Training: ${duration}
- Institution: ${institution}
- Course of Study: ${course}
${studentName ? `- Student Name: ${studentName}` : ''}
${matricNumber ? `- Matriculation No: ${matricNumber}` : ''}

TRAINING OBJECTIVES:
${formattedObjectives}

TECHNICAL WORK & DUTIES PERFORMED:
${workDescription || 'Participated in day-to-day maintenance, system inspections, technical operations, safety compliance reviews, and equipment troubleshooting.'}

SPECIALIZED TOOLS, EQUIPMENT & SOFTWARE USED:
${equipment || 'Safety Gear (PPE), Technical Hand Tools, Diagnostic Equipment, Calibration Units, CAD/Software Tools.'}
`;

    // Handle single section refinement / regeneration
    if (refinePart) {
      let partPrompt = '';
      if (refinePart === 'abstract') {
        partPrompt = `You are an expert SIWES report writer. Write a comprehensive, professional EXECUTIVE SUMMARY (ABSTRACT) for a SIWES (Students Industrial Work Experience Scheme) technical report.
${commonContext}

REQUIREMENTS:
- Word count: 300 - 500 words.
- Tone: Formal, academic, professional technical writing.
- Style: First-person narrative ("During my 6-month SIWES attachment at...").
- Do NOT output a top main heading like "## EXECUTIVE SUMMARY" (the UI header already displays it). Start directly with paragraphs.`;
      } else if (refinePart === 'part1') {
        partPrompt = `You are an expert SIWES report writer. Write PART 1 of a SIWES technical report.
${commonContext}

REQUIREMENTS:
- Do NOT output a top main heading like "## PART 1: INTRODUCTION" (the UI header already displays it). Start directly with ### 1.1.
- Include these exact sections with ### subheadings:
  ### 1.1 Background & Objectives of SIWES (ITF Policy & Objectives)
  ### 1.2 Company History & Profile of ${companyName}
  ### 1.3 Organizational Structure & Key Operations
  ### 1.4 Profile & Functions of the ${department} Department
- Minimum 1200 words. Exhaustive technical detail.`;
      } else if (refinePart === 'part2') {
        partPrompt = `You are an expert SIWES report writer. Write PART 2 of a SIWES technical report.
${commonContext}

REQUIREMENTS:
- Do NOT output a top main heading like "## PART 2: SAFETY REGULATIONS" (the UI header already displays it). Start directly with ### 2.1.
- Include these exact sections with ### subheadings:
  ### 2.1 Health, Safety & Environment (HSE) Policy & Rules
  ### 2.2 Personal Protective Equipment (PPE) & Mandatory Regulations
  ### 2.3 Technical Tools & Specialized Equipment Description (Elaborate on: ${equipment})
  ### 2.4 Operating Procedures & Safety Protocols
- Minimum 1200 words. Detailed technical descriptions of equipment and safety protocols.`;
      } else if (refinePart === 'part3') {
        partPrompt = `You are an expert SIWES report writer. Write PART 3 of a SIWES technical report.
${commonContext}

REQUIREMENTS:
- Do NOT output a top main heading like "## PART 3: DETAILED WORK EXPERIENCE" (the UI header already displays it). Start directly with ### 3.1.
- Include these exact sections with ### subheadings:
  ### 3.1 Overview of Weekly & Monthly Practical Assignments
  ### 3.2 Key Technical Operations & Maintenance Tasks Performed (Detailing: ${workDescription})
  ### 3.3 Case Studies, Project Involvement & Practical Workflows
  ### 3.4 Technical Problem Solving & Troubleshooting Procedures
- Minimum 1500 words. First-person narrative ("I was assigned to...", "I carried out..."). Highly specific industrial processes.`;
      } else if (refinePart === 'part4') {
        partPrompt = `You are an expert SIWES report writer. Write PART 4 of a SIWES technical report.
${commonContext}

REQUIREMENTS:
- Do NOT output a top main heading like "## PART 4: CHALLENGES" (the UI header already displays it). Start directly with ### 4.1.
- Include these exact sections with ### subheadings:
  ### 4.1 Technical & Operational Challenges Encountered
  ### 4.2 Practical Skills & Competencies Acquired
  ### 4.3 Recommendations for ${companyName}
  ### 4.4 Recommendations for ${institution} & Industrial Training Fund (ITF)
  ### 4.5 Conclusion
- Minimum 1000 words. Practical, reflective, and professional.`;
      }

      const res = await callAI(partPrompt, { maxTokens: 4500, temperature: 0.7 });
      return NextResponse.json({ success: true, part: refinePart, content: res.content });
    }

    // Full Generation: Run parallel generation for all 5 sections
    const prompts = {
      abstract: `You are an expert SIWES report writer. Write a formal EXECUTIVE SUMMARY (ABSTRACT) for a SIWES technical report.
${commonContext}
REQUIREMENTS:
- Do NOT output a top main heading like "## EXECUTIVE SUMMARY" or "# ABSTRACT" (the UI header already displays it). Start directly with the opening paragraph.
- 300 - 500 words.
- Professional academic tone covering training overview, key activities at ${companyName}, technical achievements, and conclusion.`,

      part1: `You are an expert SIWES report writer. Write PART 1 of a SIWES technical report.
${commonContext}
REQUIREMENTS:
- Do NOT output a top main heading like "## PART 1: INTRODUCTION" (the UI header already displays it). Start directly with ### 1.1.
- Include subheadings:
  ### 1.1 Background & Objectives of SIWES (ITF Policy & Objectives)
  ### 1.2 Company History & Profile of ${companyName}
  ### 1.3 Organizational Structure & Key Operations
  ### 1.4 Profile & Functions of the ${department} Department
- Minimum 1200 words. Exhaustive technical detail.`,

      part2: `You are an expert SIWES report writer. Write PART 2 of a SIWES technical report.
${commonContext}
REQUIREMENTS:
- Do NOT output a top main heading like "## PART 2: SAFETY REGULATIONS" (the UI header already displays it). Start directly with ### 2.1.
- Include subheadings:
  ### 2.1 Health, Safety & Environment (HSE) Policy & Rules
  ### 2.2 Personal Protective Equipment (PPE) & Mandatory Regulations
  ### 2.3 Technical Tools & Specialized Equipment Description (Elaborate on: ${equipment})
  ### 2.4 Operating Procedures & Safety Protocols
- Minimum 1200 words. Detailed technical descriptions of equipment and safety protocols.`,

      part3: `You are an expert SIWES report writer. Write PART 3 of a SIWES technical report.
${commonContext}
REQUIREMENTS:
- Do NOT output a top main heading like "## PART 3: DETAILED WORK EXPERIENCE" (the UI header already displays it). Start directly with ### 3.1.
- Include subheadings:
  ### 3.1 Overview of Weekly & Monthly Practical Assignments
  ### 3.2 Key Technical Operations & Maintenance Tasks Performed (Detailing: ${workDescription})
  ### 3.3 Case Studies, Project Involvement & Practical Workflows
  ### 3.4 Technical Problem Solving & Troubleshooting Procedures
- Minimum 1500 words. Use first-person narrative ("I was assigned...", "I operated..."). Highly specific industrial processes.`,

      part4: `You are an expert SIWES report writer. Write PART 4 of a SIWES technical report.
${commonContext}
REQUIREMENTS:
- Do NOT output a top main heading like "## PART 4: CHALLENGES" (the UI header already displays it). Start directly with ### 4.1.
- Include subheadings:
  ### 4.1 Technical & Operational Challenges Encountered
  ### 4.2 Practical Skills & Competencies Acquired
  ### 4.3 Recommendations for ${companyName}
  ### 4.4 Recommendations for ${institution} & Industrial Training Fund (ITF)
  ### 4.5 Conclusion
- Minimum 1000 words. Reflective, practical, and constructive.`
    };

    // Execute prompts concurrently
    const [abstractRes, part1Res, part2Res, part3Res, part4Res] = await Promise.all([
      callAI(prompts.abstract, { maxTokens: 2500, temperature: 0.7 }),
      callAI(prompts.part1, { maxTokens: 4500, temperature: 0.7 }),
      callAI(prompts.part2, { maxTokens: 4500, temperature: 0.7 }),
      callAI(prompts.part3, { maxTokens: 5000, temperature: 0.7 }),
      callAI(prompts.part4, { maxTokens: 4000, temperature: 0.7 })
    ]);

    const report = {
      abstract: abstractRes.content,
      part1: part1Res.content,
      part2: part2Res.content,
      part3: part3Res.content,
      part4: part4Res.content
    };

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('SIWES Generator Error:', error);
    return NextResponse.json({
      error: error.message || 'SIWES generation failed. Please check parameters and try again.'
    }, { status: 500 });
  }
}
