// src/app/api/premium/generate/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI, sanitizeAIError } from '@/lib/aiProvider';
import { fetchDiverseReferences } from '@/lib/referenceExtractor';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Polyfills for Vercel
if (typeof global.DOMMatrix === 'undefined') { global.DOMMatrix = class DOMMatrix { constructor() { this.a = 1; this.d = 1; } }; }
if (typeof global.ImageData === 'undefined') { global.ImageData = class ImageData { constructor(w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); } }; }

export const maxDuration = 120; // 2 minutes max duration for full comprehensive chapter generation

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      projectId, chapterNumber, userId, 
      selectedContextFiles = [],
      projectTitle = "", projectDescription = "", componentsUsed = "", researchBooks = "",
      userPrompt = "", referenceStyle = "APA", maxReferences = 10, targetWordCount = 2000,
      selectedImages = [], selectedPapers = [], skipReferences = false,
      isModification = false, modificationType = "whole_chapter", fullContent = "", targetContent = "",
      tableData = null
    } = body;

    if (!projectId || chapterNumber === undefined || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*, custom_templates(*)').eq('id', projectId).single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Custom Project verification
    if (project.is_custom && Array.isArray(project.selected_chapters) && !project.selected_chapters.includes(chapterNumber)) {
      return NextResponse.json(
        { error: `Chapter ${chapterNumber} was provided by you as part of your Custom Continuation package and cannot be re-generated.` },
        { status: 400 }
      );
    }

    const provider = process.env.PREMIUM_AI_PROVIDER || 'deepseek';
    const model = process.env.PREMIUM_AI_MODEL || 'deepseek-v4-pro';

    // --- 1.5 Table Processing ---
    let technicalTableInstruction = "";
    if (tableData && tableData.rows?.length > 0) {
      const headerRow = `| ${tableData.headers.join(' | ')} |`;
      const separatorRow = `| ${tableData.headers.map(() => '---').join(' | ')} |`;
      const dataRows = tableData.rows.map(row => `| ${row.join(' | ')} |`).join('\n');
      const markdownTable = `${headerRow}\n${separatorRow}\n${dataRows}`;
      
      technicalTableInstruction = `\n\n### MANDATORY TECHNICAL DATA TABLE:\nYou MUST analyze and include the following experimental/technical data in this chapter:\n\n${markdownTable}\n\nSTRICT: Use this specific data for any calculations or results analysis discussed in the text.`;
    }

    // --- 1. Surgical Modification Logic (ROBUST) ---
    if (isModification && targetContent) {
      const isPartial = modificationType === 'partial';
      
      // CRITICAL: Normalize newlines for reliable string replacement
      const normalizedFull = fullContent.replace(/\r\n/g, '\n');
      const normalizedTarget = targetContent.replace(/\r\n/g, '\n');

      const surgicalPrompt = `You are a high-end academic system architect and expert editor.
      TASK: ${isPartial ? 'Rewrite ONLY the specific section(s) provided.' : 'Rewrite the entire chapter based on user instructions.'}
      PROJECT: "${project.title}"
      CHAPTER: ${chapterNumber}

      ## ORIGINAL CONTENT TO BE FIXED:
      ${normalizedTarget}

      ${isPartial ? `## CONTEXT: 
      This section is part of a larger report. Ensure your new content flows perfectly into the existing text.` : ''}

      ## USER INSTRUCTIONS FOR MODIFICATION:
      ${userPrompt}

      ## STRICT REQUIREMENTS (FAILURE TO FOLLOW WILL BREAK THE DOCUMENT):
      1. ONLY return the rewritten text. No conversational filler.
      2. Keep the exact same Markdown formatting.
      3. MANDATORY: You MUST include the same Section Headers (## or ###) that were in the original content. Do not omit them.
      4. Maintain technical accuracy and respect the ${referenceStyle.toUpperCase()} citation style.
      5. NO EM-DASHES: Do NOT use the long dash symbol (—) as a separator or watermark. Use standard hyphens (-) or colons (:) instead.`;

      const aiResponse = await callAI(surgicalPrompt, { provider, model, maxTokens: 8000, temperature: 0.4 });
      
      let finalAiContent = aiResponse.content.trim();
      
      // Merge logic with normalization safety
      let updatedFullContent;
      if (isPartial) {
        if (normalizedFull.includes(normalizedTarget)) {
          updatedFullContent = normalizedFull.replace(normalizedTarget, finalAiContent);
        } else {
          // Fallback if exact match fails due to hidden whitespace
          console.warn("Exact match failed, attempting trimmed match");
          const trimmedTarget = normalizedTarget.trim();
          if (normalizedFull.includes(trimmedTarget)) {
            updatedFullContent = normalizedFull.replace(trimmedTarget, finalAiContent);
          } else {
            throw new Error("Could not locate the selected section in the document. Try selecting a different part.");
          }
        }
      } else {
        updatedFullContent = finalAiContent;
      }

      // Save version
      const { data: chapter } = await supabaseAdmin.from('premium_chapters').select('id').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
      if (chapter) {
        await supabaseAdmin.from('premium_chapters').update({ content: updatedFullContent, updated_at: new Date().toISOString() }).eq('id', chapter.id);
        await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: updatedFullContent, prompt_used: `MODIFICATION: ${userPrompt.substring(0, 50)}...`, model_used: aiResponse.model });
      }

      return NextResponse.json({ success: true, content: updatedFullContent });
    }

    // --- 2. Data Extraction & Strict Claude Multimodal Attachment Processing ---
    const isClaudeProvider = provider === 'claude';
    let contextualSourceData = "";
    const claudeAttachments = [];

    const MAX_ANALYSIS_IMAGES = 3;
    const MAX_ANALYSIS_DOCS = 2;
    const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024; // 3.5 MB
    const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5.0 MB
    const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10.0 MB

    let processedImagesCount = 0;
    let processedDocsCount = 0;
    let processedTotalBytes = 0;

    const detectImageMediaType = (buf, lowerName) => {
      if (buf.length >= 4) {
        if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
        if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
        if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
        if (buf.length >= 12 && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
      }
      if (lowerName.endsWith('.png')) return 'image/png';
      if (lowerName.endsWith('.webp')) return 'image/webp';
      if (lowerName.endsWith('.gif')) return 'image/gif';
      return 'image/jpeg';
    };

    if (Array.isArray(selectedContextFiles) && selectedContextFiles.length > 0) {
      for (const file of selectedContextFiles) {
        try {
          const fileName = file.name || file.original_name || "File";
          const lowerName = fileName.toLowerCase();
          const isImg = file.file_type?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(lowerName);

          // STRICT RULE: If provider is switched away from Claude (e.g., to DeepSeek), NEVER analyze images
          if (isImg) {
            if (!isClaudeProvider) continue;
            if (processedImagesCount >= MAX_ANALYSIS_IMAGES) continue;

            const res = await fetch(file.file_url || file.src);
            if (!res.ok) continue;
            const buffer = Buffer.from(await res.arrayBuffer());

            if (buffer.length > MAX_IMAGE_BYTES || (processedTotalBytes + buffer.length) > MAX_TOTAL_BYTES) {
              continue;
            }

            const mediaType = detectImageMediaType(buffer, lowerName);
            claudeAttachments.push({
              type: 'text',
              text: `[AI Reference Image for Chapter ${chapterNumber} Visual Analysis (Context Only - DO NOT embed as a figure URL): "${fileName}"]`
            });
            claudeAttachments.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: buffer.toString('base64')
              }
            });

            processedImagesCount++;
            processedTotalBytes += buffer.length;
            continue;
          }

          // Document Processing (.docx, .xlsx, .csv, .txt, .pdf)
          if (processedDocsCount >= MAX_ANALYSIS_DOCS) continue;

          const res = await fetch(file.file_url || file.src);
          if (!res.ok) continue;
          const buffer = Buffer.from(await res.arrayBuffer());

          if (buffer.length > MAX_DOC_BYTES || (processedTotalBytes + buffer.length) > MAX_TOTAL_BYTES) {
            continue;
          }

          if (lowerName.endsWith('.pdf')) {
            // Native PDF analysis strictly on Claude
            if (isClaudeProvider) {
              claudeAttachments.push({
                type: 'text',
                text: `[AI Reference PDF Document for Chapter ${chapterNumber} Analysis: "${fileName}"]`
              });
              claudeAttachments.push({
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: buffer.toString('base64')
                }
              });
              processedDocsCount++;
              processedTotalBytes += buffer.length;
            }
          } else if (lowerName.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            const extractedText = (result.value || '').trim();
            if (extractedText) {
              contextualSourceData += `\n--- DATA FROM DOCUMENT: ${fileName} ---\n${extractedText.split(/\s+/).slice(0, 1800).join(" ")}\n`;
              processedDocsCount++;
              processedTotalBytes += buffer.length;
            }
          } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const firstSheetName = workbook.SheetNames[0];
            if (firstSheetName) {
              const csvText = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
              const rows = csvText.split('\n').slice(0, 120).join('\n');
              contextualSourceData += `\n--- DATASET FROM SPREADSHEET: ${fileName} ---\n${rows.split(/\s+/).slice(0, 1800).join(" ")}\n`;
              processedDocsCount++;
              processedTotalBytes += buffer.length;
            }
          } else {
            const extractedText = buffer.toString('utf-8').trim();
            if (extractedText) {
              contextualSourceData += `\n--- DATA FROM FILE: ${fileName} ---\n${extractedText.split(/\s+/).slice(0, 1800).join(" ")}\n`;
              processedDocsCount++;
              processedTotalBytes += buffer.length;
            }
          }
        } catch (e) {
          console.warn('Context file extraction skipped:', e.message);
        }
      }
    }

    // If Custom Project, inject student's existing chapter texts as high-priority research context
    const extractedStudentRefs = [];
    if (project.is_custom && project.uploaded_chapters) {
      for (let ch = 1; ch <= 5; ch++) {
        if (ch === chapterNumber) continue;
        const chData = project.uploaded_chapters[`chapter_${ch}`];
        const text = typeof chData === 'string' ? chData : chData?.content || '';
        if (text && text.trim()) {
          contextualSourceData += `\n--- EXISTING CHAPTER ${ch} (STUDENT WRITTEN CONTINUATION BASELINE) ---\n${text.split(/\s+/).slice(0, 2000).join(" ")}\n`;

          // Detect references/bibliography section at the end of the chapter
          const refMatch = text.match(/(?:##?\s*(?:references|bibliography|works cited)|references:)([\s\S]*)/i);
          if (refMatch && refMatch[1]) {
            const lines = refMatch[1].split('\n').map(l => l.trim()).filter(l => l.length > 10);
            extractedStudentRefs.push(...lines);
          }
        }
      }
    }

    // --- 3. Citation & Reference Logic ---
    const refStyleUpper = (referenceStyle || 'apa').toUpperCase();
    const citationStyleInst = refStyleUpper === 'IEEE'
      ? `### CITATION STYLE: STRICT IEEE\n1. IN-TEXT: [1], [2].\n2. BIBLIOGRAPHY: Numerical order.`
      : refStyleUpper === 'HARVARD'
      ? `### CITATION STYLE: STRICT HARVARD\n1. IN-TEXT: (Author Year).\n2. BIBLIOGRAPHY: Alphabetical order. Format: Author, A.A. (Year) Title. City: Publisher.`
      : refStyleUpper === 'MLA'
      ? `### CITATION STYLE: STRICT MLA\n1. IN-TEXT: (Author Page) e.g., (Okonkwo 45).\n2. BIBLIOGRAPHY: Alphabetical order. Format: Author's Last Name, First Name. "Title of Article." Journal or Book, Publisher, Year, Pages.`
      : refStyleUpper === 'OSCOLA'
      ? `### CITATION STYLE: STRICT OSCOLA (OXFORD STANDARD FOR CITATION OF LEGAL AUTHORITIES)
1. CITATION METHOD: Numbered Markdown Footnotes [^1], [^2], [^3] placed immediately after punctuation. DO NOT use in-text bracketed author-year citations like (Author, 2022).
2. FOOTNOTE DEFINITIONS: At the bottom of the chapter, define every footnote using:
   [^1]: Author, *Title* (Publisher Year) page. (Or Case: *Party v Party* [Year] Volume Report Page, or Statute: Title of Act Year, s Section).
3. BIBLIOGRAPHY / AUTHORITIES: Conclude the chapter with a structured "## Bibliography" listing all authorities.`
      : refStyleUpper === 'CHICAGO'
      ? `### CITATION STYLE: STRICT CHICAGO (NOTES & BIBLIOGRAPHY)
1. CITATION METHOD: Numbered Markdown Footnotes [^1], [^2], [^3] placed immediately after punctuation.
2. FOOTNOTE DEFINITIONS: Define each footnote at the bottom of the chapter using:
   [^1]: Author, *Title* (City: Publisher, Year), Page.
3. BIBLIOGRAPHY: Conclude the chapter with an alphabetical "## Bibliography".`
      : refStyleUpper === 'VANCOUVER'
      ? `### CITATION STYLE: STRICT VANCOUVER (MEDICINE & HEALTH SCIENCES)
1. IN-TEXT: Sequential numbers in square brackets [1], [2] or (1), (2), placed immediately after punctuation. Numbering MUST strictly follow the order in which citations first appear in the chapter.
2. BIBLIOGRAPHY / REFERENCES: Conclude the chapter with a numbered "## References" section ordered sequentially:
   [1] Author AA, Author BB. Title of article. Abbreviated Journal Title. Year;Volume(Issue):Pages.
   [2] Author AA. Title of book. Edition. Place of publication: Publisher; Year.`
      : `### CITATION STYLE: STRICT APA\n1. IN-TEXT: (Author, Year).\n2. BIBLIOGRAPHY: Alphabetical order. Format: Author, A. A. (Year). Title. Publisher.`;

    // --- 4. Enhanced Reference Sourcing ---
    const { data: existingPapers } = await supabaseAdmin.from('premium_research_papers').select('*').eq('project_id', projectId);
    let finalReferencesList = [...selectedPapers];

    // If Custom Project, include student's existing references (from chapter bottom or project)
    if (project.is_custom && !skipReferences) {
      const combinedStudentRefs = [
        ...extractedStudentRefs,
        ...(project.existing_references ? project.existing_references.split('\n') : [])
      ].map(r => r.trim()).filter(r => r.length > 8);

      const uniqueStudentRefs = [...new Set(combinedStudentRefs)];
      const studentPaperObjs = uniqueStudentRefs.map((r, idx) => ({
        external_id: `student-ref-${idx}`,
        title: r,
        authors: 'Student Baseline Citation',
        year: 'Baseline',
        venue: 'Original Student Bibliography'
      }));
      finalReferencesList = [...studentPaperObjs, ...finalReferencesList];
    }
    
    // Dynamic reference count: Chapter 2 needs more for deep literature review
    let totalNeeded = maxReferences || 10;
    if (chapterNumber === 2) {
      totalNeeded = Math.max(totalNeeded, 20); // Literature review usually needs at least 20
    }
    
    if (existingPapers && !skipReferences) {
      for (const ep of existingPapers) {
        if (finalReferencesList.length >= totalNeeded) break;
        if (!finalReferencesList.some(p => (p.external_id && p.external_id === ep.external_id) || p.title.toLowerCase() === ep.title.toLowerCase())) {
          finalReferencesList.push(ep);
        }
      }
    }

    if (finalReferencesList.length < totalNeeded && !skipReferences) {
      try {
        const scrapedRefs = await fetchDiverseReferences({
          title: project.title,
          department: project.department,
          limit: Math.max(totalNeeded, 15)
        });
        const existingTitles = new Set(finalReferencesList.map(p => (p.title || '').toLowerCase()));
        for (const paper of scrapedRefs) {
          if (paper.title && !existingTitles.has(paper.title.toLowerCase()) && finalReferencesList.length < totalNeeded) {
            existingTitles.add(paper.title.toLowerCase());
            finalReferencesList.push(paper);
          }
        }
      } catch (err) {}
    }

    const referencesMapping = !skipReferences && finalReferencesList.length > 0
      ? `\n\n### CORE RESEARCH REFERENCES (MANDATORY):\n` +
        `STRICT RULE: Prioritize reusing these specific references. Consistency is required.\n\n` +
        finalReferencesList.slice(0, totalNeeded).map((p, idx) => {
          const auths = Array.isArray(p.authors) ? p.authors.map(a => typeof a === 'object' ? a.name : a).join(', ') : (p.authors || 'Unknown');
          const urlSuffix = p.url ? ` Available at: ${p.url}` : '';
          return `SOURCE [${idx + 1}]: ${auths} (${p.year}). "${p.title}". ${p.venue || 'Technical Publication'}.${urlSuffix}`;
        }).join('\n\n')
      : '';

    // --- 5. Aims & Objectives Logic ---
    let objectiveInstruction = "";
    if (chapterNumber === 1) {
      if (project.use_manual_objectives && project.manual_objectives?.length > 0) {
        const list = project.manual_objectives.map((o, i) => `${i + 1}. ${o}`).join('\n');
        objectiveInstruction = `\n\n### MANDATORY RESEARCH OBJECTIVES:\nInclude these EXACT objectives:\n${list}`;
      } else {
        objectiveInstruction = `\n\n### AIMS & OBJECTIVES REQUIREMENT:\nGenerate technically-focused research objectives using action verbs.`;
      }
    }

    const rawChapters = project.custom_templates?.structure?.chapters || [];
    const rawNums = rawChapters.map(ch => ch.number || ch.chapter);
    const hasDuplicates = rawNums.length > 1 && (new Set(rawNums.filter(Boolean)).size !== rawNums.length || rawNums.some(n => !n));
    const currentChapterData = rawChapters.find((ch, idx) => {
      const num = hasDuplicates ? (idx + 1) : (ch.number || ch.chapter || (idx + 1));
      return num === chapterNumber;
    });
    const chapterTitle = currentChapterData?.title || `Chapter ${chapterNumber}`;
    const mandatorySections = currentChapterData?.sections?.length > 0 ? `## MANDATORY SECTIONS\n` + currentChapterData.sections.map(s => `- ${s}`).join('\n') : '';

    const visualAnalysisInstruction = (isClaudeProvider && claudeAttachments.length > 0)
      ? `\n\n### MANDATORY AI VISUAL & DOCUMENT CONTEXT ANALYSIS:\n` +
        `You have been provided with attached reference image(s) and/or PDF document(s) in this request for visual and technical inspection.\n` +
        `1. Carefully inspect all attached reference images (charts, circuit schematics, diagrams, experimental results, tables, or notes) and attached PDF documents.\n` +
        `2. Extract and integrate the exact technical parameters, numerical values, architectural flows, trends, and findings directly into your academic prose and analysis for Chapter ${chapterNumber}.\n` +
        `3. STRICT SEPARATION OF ROLES: Attached reference images are for your visual analysis ONLY—do NOT create or invent markdown image tags (![...](...)) for reference images. ONLY insert markdown image placeholders for the explicit "MANDATORY IMAGE ATTACHMENTS (REPORT FIGURES)" listed below (if any).`
      : '';

    const imageInstruction = selectedImages.length > 0
      ? `\n\n### MANDATORY IMAGE ATTACHMENTS (REPORT FIGURES TO INSERT AS PLACEHOLDERS):\n` +
        `Insert ONLY these specific report figures into the chapter using: ![Caption](URL). Reference them naturally in the text (e.g. "see Fig X").\n` +
        selectedImages.map(img => `- Caption: "${img.caption || img.original_name}", URL: ${img.file_url}`).join('\n')
      : '';

    const referenceRequirements = !skipReferences ? `
    ## CITATION AND REFERENCE REQUIREMENTS
    ${citationStyleInst}
    - COUNT: Exactly ${totalNeeded} references.
    - CITE EXACTLY WHAT THE USER WROTE (CRITICAL FIDELITY):
      1. If the user specified any authors, books, journals, websites, standards, or references in their Description, Components, Research Context, Uploaded Documents, Continuation Baseline, or Custom Instructions, you MUST cite **EXACTLY what the user wrote**.
      2. Every single in-text citation MUST directly correspond to the exact technical concept, statement, component, or methodology written in that sentence—NEVER insert generic, random, or off-topic citations that do not match what is written.
      3. Every in-text citation MUST have a 1-to-1 matching entry in the final reference list, and every item in the reference list MUST be cited in-text.
    - DIVERSE SOURCING (NOT JUST JOURNALS): Combine the scraped web & technical references provided above with a balanced variety of verifiable sources:
      1. Peer-Reviewed Academic & Technical Journals (2020-2026).
      2. High-Authority Web / Online Articles, Technical Portals & Industry Reports (e.g., IEEE Spectrum, MIT Technology Review, ScienceDirect, World Bank, WHO, NASA, NIST—include publisher/URL where available).
      3. Textbooks, Monographs, Official Documentation, Standards (ISO/SON/IEEE), Statutes, and Datasheets.
    - RECENCY: Focus on 2020-2026.
    - NO FORGING: Do NOT hallucinate or "make up" fake references. Ensure all sources are real, verifiable sources. 
    - CONSISTENCY: Ensure in-text citations match the final reference list perfectly.` : '';

    let templateAiInstruction = project.custom_templates?.ai_instruction || "";
    if (!templateAiInstruction && project.custom_templates?.source_template_id) {
      try {
        const { data: st } = await supabaseAdmin.from('templates').select('ai_instruction').eq('id', project.custom_templates.source_template_id).single();
        if (st?.ai_instruction) {
          templateAiInstruction = st.ai_instruction;
        }
      } catch (err) {}
    }

    const systemPrompt = `You are a senior academic researcher and system architect. 
    TASK: Author Chapter ${chapterNumber}: ${chapterTitle} for the project "${project.title}".

    ## ACADEMIC FIELD FOCUS
    - FACULTY: ${project.faculty}
    - DEPARTMENT: ${project.department}
    - TECHNICAL ANGLE: All analysis, terminology, and citations MUST be specialized for the ${project.department} field.

    ## PROJECT CONTEXT
    - DESCRIPTION: ${project.description}
    - COMPONENTS: ${componentsUsed || project.components_used}
    - RESEARCH CONTEXT: ${researchBooks || project.research_papers_context}
    ${objectiveInstruction}

    ${mandatorySections}
    ${templateAiInstruction ? `\n\n### ADVANCED TEMPLATE INSTRUCTIONS (CRITICAL PRIORITY):\n${templateAiInstruction}` : ''}
    ${technicalTableInstruction}
    ${contextualSourceData ? `## MANDATORY EXPERIMENTAL & DOCUMENT DATA ANALYSIS\n${contextualSourceData}` : ''}
    ${visualAnalysisInstruction}
    ${imageInstruction}
    ${referencesMapping}
    ${referenceRequirements}

    ${project.is_custom ? `## CONTINUATION & REFERENCES REUSE DIRECTIVE (MANDATORY):
    1. CONTINUATION PROJECT: This project is a continuation of an ongoing student report. The student has written earlier chapters and pasted them above.
    2. REFERENCES AT BOTTOM OF CHAPTERS: The student may have pasted their existing bibliography or reference list at the bottom of their last provided chapter.
    3. SEPARATION: Intelligently distinguish between the student's chapter body content and their bibliography list.
    4. REUSE AND EXPAND: Seamlessly reuse, cite, and expand upon the student's existing references where relevant in Chapter ${chapterNumber}, matching the required citation style (${refStyleUpper}).
    5. CONTINUITY: Match the exact technical vocabulary, tone, notations, and established methodology from the student's baseline chapters.
    ` : ''}

    ## WRITING RULES (STRICT ACADEMIC STANDARDS)
    1. TARGET LENGTH: 2,500 - 3,500 words. Make the content comprehensive, detailed, and technically rigorous. STRICT LIMIT: DO NOT exceed 3,500 words. Avoid repetitive fluff, excessive elaboration, or padded rambling.
    2. TONE: Formal, Technical, Academic (Nigerian university and postgraduate thesis standard).
    3. FORMAT: Markdown (## for Chapter Title & Main Headings, ### for Subsections, #### for Sub-subsections).
    4. CURRENCY: ₦ (NGN) for any financial/cost analysis.
    5. RECENCY: Citations must be 2020-2026.
    6. NO CONVERSATIONAL FILLER: Start directly with the ## Chapter heading. Do NOT include conversational introductions (e.g., "Certainly, here is...", "In this chapter, we explore...").
    7. NO EM-DASHES: Do NOT use the long dash symbol (—) as a separator or watermark. Use standard hyphens (-) or colons (:) instead.
    8. THESIS STRUCTURE PRESERVATION: You MUST strictly adhere to the designated chapter title and mandatory sub-sections defined above. Do NOT alter, omit, merge, or rename the designated thesis sections.
    - USER INSTRUCTIONS: ${userPrompt || 'Deliver elite technical content.'}

    ${skipReferences ? '--- STRICT: NO REFERENCES OR CITATIONS. ---' : '--- MANDATORY: Include "## References" at the end. ---'}`;

    // --- 7. Call AI & Save (8192 tokens ensure full 2,500-3,500 words are completed without cutoff) ---
    const aiResponse = await callAI(systemPrompt, {
      provider,
      model,
      maxTokens: 8192,
      temperature: 0.5,
      claudeAttachments: isClaudeProvider && claudeAttachments.length > 0 ? claudeAttachments : null
    });

    let { data: chapter } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
    if (!chapter) {
      const { data: nc } = await supabaseAdmin.from('premium_chapters').insert({ project_id: projectId, chapter_number: chapterNumber, title: chapterTitle, content: aiResponse.content, status: 'draft' }).select().single();
      chapter = nc;
    } else {
      await supabaseAdmin.from('premium_chapters').update({ content: aiResponse.content, status: 'draft', updated_at: new Date().toISOString() }).eq('id', chapter.id);
    }

    await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: aiResponse.content, prompt_used: userPrompt, model_used: aiResponse.model });
    
    // Update Project Stats & Persistence
    const projectUpdateData = { 
      tokens_used: (project.tokens_used || 0) + (aiResponse.tokensUsed?.total || 0), 
      updated_at: new Date().toISOString() 
    };

    // PERSISTENCE: Store components and research context so they remain editable/pre-filled
    if (componentsUsed) projectUpdateData.components_used = componentsUsed;
    if (researchBooks) projectUpdateData.research_papers_context = researchBooks;

    await supabaseAdmin.from('premium_projects').update(projectUpdateData).eq('id', projectId);

    return NextResponse.json({ success: true, content: aiResponse.content });

  } catch (error) { 
    console.error('Gen Error:', error); 
    return NextResponse.json({ error: sanitizeAIError(error) }, { status: 500 }); 
  }
}
