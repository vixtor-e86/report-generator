// src/lib/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getChapterPrompt } from './prompts.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateChapter({
  chapterNumber,
  projectTitle,
  department,
  components,
  description,
  tier,
  previousChapters = [],
  imagesCaptions = []
}) {
  // Select model from environment variable or use default based on tier
  // You can now easily change the model in .env.local!
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
  
  console.log(`Using model: ${modelName} for tier: ${tier}`);
  
  const model = genAI.getGenerativeModel({ model: modelName });

  // Build context from previous chapters
  let context = '';
  if (previousChapters.length > 0) {
    context = '\n\n=== PREVIOUSLY GENERATED CHAPTERS ===\n\n';
    previousChapters.forEach(ch => {
      context += `## Chapter ${ch.chapter_number}: ${ch.title}\n\n${ch.content}\n\n`;
    });
    context += '=== END OF PREVIOUS CHAPTERS ===\n\n';
  }

  // Build images context
  let imagesContext = '';
  if (imagesCaptions.length > 0) {
    imagesContext = '\n\n=== PROJECT IMAGES (for reference in content) ===\n';
    imagesCaptions.forEach((caption, i) => {
      imagesContext += `Figure ${i + 1}: ${caption}\n`;
    });
    imagesContext += '=== END OF IMAGES ===\n\n';
  }

  // Get chapter-specific prompt
  const chapterPrompt = getChapterPrompt(chapterNumber, {
    projectTitle,
    department,
    components: components.join(', '),
    description,
    imagesContext,
    context
  });

  try {
    const result = await model.generateContent(chapterPrompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      content: text,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}