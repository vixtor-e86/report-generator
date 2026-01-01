// /src/lib/referenceExtractor.js
// Extract and parse references from generated content

/**
 * Extract in-text citations from content
 * Returns array of citation keys found in the text
 */
export function extractInTextCitations(content, referenceStyle) {
  const citations = new Set();
  
  if (referenceStyle === 'apa' || referenceStyle === 'harvard') {
    // Match (Author, Year) or (Author Year)
    const pattern = /\(([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?)[,\s]+(\d{4})\)/g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      const author = match[1].replace(/\s+and\s+|&/, '').split(/\s+/)[0]; // First author only
      const year = match[2];
      citations.add(`${author}${year}`);
    }
  } else if (referenceStyle === 'ieee') {
    // Match [1], [2], [3], etc.
    const pattern = /\[(\d+)\]/g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      citations.add(match[1]); // Just the number
    }
  }
  
  return Array.from(citations);
}

/**
 * Extract full references from ## REFERENCES section
 * Returns array of reference objects
 */
export function extractFullReferences(content, referenceStyle, chapterNumber) {
  const references = [];
  
  // Find REFERENCES section
  const referencesMatch = content.match(/##\s*REFERENCES\s*\n([\s\S]+?)(?:\n##|$)/i);
  
  if (!referencesMatch) {
    console.log('No REFERENCES section found in content');
    return references;
  }
  
  const referencesText = referencesMatch[1];
  const lines = referencesText.split('\n').filter(line => line.trim());
  
  if (referenceStyle === 'ieee') {
    // IEEE format: [1] Author, "Title," Journal, details
    lines.forEach((line) => {
      const match = line.match(/^\[(\d+)\]\s+(.+)$/);
      if (match) {
        const number = match[1];
        const fullText = match[2].trim();
        
        // Try to extract author and year
        const authorMatch = fullText.match(/^([A-Z][a-z]+(?:,?\s+[A-Z]\.?\s*)+)/);
        const yearMatch = fullText.match(/(\d{4})/);
        
        references.push({
          reference_key: number,
          reference_text: `[${number}] ${fullText}`,
          author: authorMatch ? authorMatch[1].split(',')[0].trim() : null,
          year: yearMatch ? yearMatch[1] : null,
          first_used_in_chapter: chapterNumber,
          style: 'ieee'
        });
      }
    });
  } else {
    // APA/Harvard format: Author, A. B. (Year). Title...
    lines.forEach((line) => {
      line = line.trim();
      if (!line || line.length < 20) return; // Skip empty or too short
      
      // Extract author (first word before comma or parenthesis)
      const authorMatch = line.match(/^([A-Z][a-z]+(?:-[A-Z][a-z]+)?)/);
      
      // Extract year - look for (YYYY) or just YYYY
      const yearMatch = line.match(/\((\d{4})\)|,\s+(\d{4})/);
      
      if (authorMatch && yearMatch) {
        const author = authorMatch[1];
        const year = yearMatch[1] || yearMatch[2];
        const key = `${author}${year}`;
        
        references.push({
          reference_key: key,
          reference_text: line,
          author: author,
          year: year,
          first_used_in_chapter: chapterNumber,
          style: referenceStyle
        });
      }
    });
  }
  
  console.log(`Extracted ${references.length} references from chapter ${chapterNumber}`);
  return references;
}

/**
 * Store references in database, avoiding duplicates
 */
export async function storeReferences(supabase, projectId, references, chapterNumber) {
  if (!references || references.length === 0) {
    console.log('No references to store');
    return { stored: 0, skipped: 0 };
  }
  
  let stored = 0;
  let skipped = 0;
  
  for (const ref of references) {
    try {
      // Check if reference already exists
      const { data: existing } = await supabase
        .from('project_references')
        .select('id, used_in_chapters')
        .eq('project_id', projectId)
        .eq('reference_key', ref.reference_key)
        .single();
      
      if (existing) {
        // Update to add this chapter to used_in_chapters array
        const usedChapters = existing.used_in_chapters || [];
        if (!usedChapters.includes(chapterNumber)) {
          usedChapters.push(chapterNumber);
          
          await supabase
            .from('project_references')
            .update({
              used_in_chapters: usedChapters,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        }
        
        skipped++;
        console.log(`Reference ${ref.reference_key} already exists, updated usage`);
      } else {
        // Insert new reference
        const { error } = await supabase
          .from('project_references')
          .insert({
            project_id: projectId,
            reference_key: ref.reference_key,
            reference_text: ref.reference_text,
            author: ref.author,
            year: ref.year,
            first_used_in_chapter: ref.first_used_in_chapter,
            used_in_chapters: [chapterNumber],
            order_number: null // Will be set when compiling final list
          });
        
        if (error) {
          console.error(`Error storing reference ${ref.reference_key}:`, error);
        } else {
          stored++;
          console.log(`Stored new reference: ${ref.reference_key}`);
        }
      }
    } catch (error) {
      console.error(`Error processing reference ${ref.reference_key}:`, error);
    }
  }
  
  return { stored, skipped };
}

/**
 * Compile all references for final chapter
 * Sorts and numbers them appropriately
 */
export async function compileAllReferences(supabase, projectId, referenceStyle) {
  const { data: allRefs, error } = await supabase
    .from('project_references')
    .select('*')
    .eq('project_id', projectId);
  
  if (error || !allRefs || allRefs.length === 0) {
    console.log('No references found for project');
    return [];
  }
  
  // Sort references
  let sortedRefs;
  
  if (referenceStyle === 'ieee') {
    // IEEE: Sort by first usage order
    sortedRefs = allRefs.sort((a, b) => {
      const aFirst = Math.min(...(a.used_in_chapters || [a.first_used_in_chapter]));
      const bFirst = Math.min(...(b.used_in_chapters || [b.first_used_in_chapter]));
      return aFirst - bFirst;
    });
    
    // Renumber them sequentially
    sortedRefs = sortedRefs.map((ref, index) => ({
      ...ref,
      reference_key: (index + 1).toString(),
      order_number: index + 1
    }));
  } else {
    // APA/Harvard: Sort alphabetically by author
    sortedRefs = allRefs.sort((a, b) => {
      const authorA = a.author || '';
      const authorB = b.author || '';
      return authorA.localeCompare(authorB);
    });
    
    sortedRefs = sortedRefs.map((ref, index) => ({
      ...ref,
      order_number: index + 1
    }));
  }
  
  // Update order_numbers in database
  for (const ref of sortedRefs) {
    await supabase
      .from('project_references')
      .update({ order_number: ref.order_number })
      .eq('id', ref.id);
  }
  
  console.log(`Compiled ${sortedRefs.length} references for final chapter`);
  return sortedRefs;
}