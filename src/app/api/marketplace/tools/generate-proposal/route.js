import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { proposalId, topic, instructions, isModification } = await request.json();

    if (!proposalId || !topic) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Fetch current proposal state
    const { data: proposal, error: fetchError } = await supabaseAdmin
      .from('topic_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError || !proposal) throw new Error('Proposal session not found');
    if (proposal.status !== 'paid' && proposal.status !== 'generated') throw new Error('Invalid proposal status');
    
    // Check modification limit
    if (isModification && proposal.modification_count >= 1) {
      throw new Error('Modification limit reached (1 allowed)');
    }

    // 2. Construct System Prompt
    const systemPrompt = `You are an elite academic architect and research consultant. 
    Your task is to draft a high-quality, professionally structured technical project proposal for an engineering/academic project.
    
    TOPIC: "${topic.title}"
    FIELD: ${topic.category || 'Engineering'}
    OBJECTIVE: ${topic.problem_gap}
    USER INSTRUCTIONS: ${instructions || 'No specific instructions provided.'}
    
    ${isModification ? `IMPORTANT: This is a REVISION. The user wants to change aspects of the previous draft. Previous draft was:
    ${proposal.proposal_content.substring(0, 1000)}...` : ''}

    REQUIRED STRUCTURE (Markdown format):
    1. # PROJECT PROPOSAL: [Title]
    2. ## INTRODUCTION (Background and context)
    3. ## PROBLEM STATEMENT (The specific gap or challenge)
    4. ## AIMS & OBJECTIVES (What the project seeks to achieve)
    5. ## PROPOSED METHODOLOGY (High-level technical approach, tools, and steps)
    6. ## EXPECTED OUTCOMES (Deliverables and significance)
    7. ## PRELIMINARY REFERENCES (Brief list of relevant research areas)

    Writing Style:
    - Highly technical and academically rigorous.
    - Persuasive and well-justified.
    - Professional tone suitable for faculty approval.
    - Word count: ~800-1200 words.
    
    Return ONLY the Markdown content.`;

    // 3. Call AI (Claude)
    const aiResponse = await callAI(systemPrompt, {
      provider: 'claude',
      maxTokens: 4000,
      temperature: 0.7
    });

    const content = aiResponse.content;

    // 4. Update Database
    const updateData = {
      proposal_content: content,
      custom_instructions: instructions,
      status: 'generated',
      updated_at: new Date().toISOString()
    };

    if (isModification) {
      updateData.modification_count = proposal.modification_count + 1;
    }

    const { error: updateError } = await supabaseAdmin
      .from('topic_proposals')
      .update(updateData)
      .eq('id', proposalId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      content: content 
    });

  } catch (error) {
    console.error('Proposal Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
