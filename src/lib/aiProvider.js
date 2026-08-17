// /src/lib/aiProvider.js
// Unified AI Provider - Switch between Gemini, Claude, and DeepSeek seamlessly with auto-failover

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Main function to call AI models with automatic fallback
 * @param {string|array} prompt - The prompt string or array of parts (for multimodal)
 * @param {object} options - Configuration options
 * @returns {Promise<object>} - Response with content, tokens, and model info
 */
export async function callAI(prompt, options = {}) {
  const {
    provider = process.env.AI_PROVIDER || 'deepseek',
    model = null, // Optional model override
    maxTokens = 8192,
    temperature = 0.7,
    stopSequences = null,
    fileParts = null, // Support for Gemini multimodal
    fallback = true // Automatically try alternate provider if primary fails
  } = options;

  const tryCall = async (p, m) => {
    if (p === 'gemini') {
      return await callGemini(prompt, maxTokens, temperature, fileParts, m);
    } else if (p === 'claude') {
      return await callClaude(prompt, maxTokens, temperature, stopSequences, m);
    } else if (p === 'deepseek') {
      return await callDeepSeek(prompt, maxTokens, temperature, m);
    } else {
      throw new Error(`Invalid AI provider: ${p}. Use 'gemini', 'claude', or 'deepseek'`);
    }
  };

  try {
    const result = await tryCall(provider, model);
    if (!result || !result.content || typeof result.content !== 'string' || result.content.trim().length < 20) {
      throw new Error(`Provider ${provider} returned empty or invalid response`);
    }
    return result;
  } catch (primaryError) {
    console.warn(`Primary AI provider (${provider}) failed:`, primaryError.message);

    // If fallback is enabled, try backup providers
    if (fallback) {
      const candidates = ['deepseek', 'gemini'].filter(p => p !== provider);
      for (const backupProvider of candidates) {
        try {
          console.log(`Attempting fallback to ${backupProvider}...`);
          const backupResult = await tryCall(backupProvider, null);
          if (backupResult && backupResult.content && backupResult.content.trim().length >= 20) {
            console.log(`✅ Fallback to ${backupProvider} succeeded!`);
            return backupResult;
          }
        } catch (backupError) {
          console.warn(`Fallback to ${backupProvider} failed:`, backupError.message);
        }
      }
    }

    let errMsg = primaryError.message;
    const lower = errMsg.toLowerCase();
    if (lower.includes('credit balance') || 
        lower.includes('insufficient_credits') || 
        lower.includes('billing') || 
        lower.includes('insufficient credits') || 
        lower.includes('credit_balance_too_low')) {
      throw new Error('AI service credits are low or under maintenance. Please try again later.');
    }
    throw primaryError;
  }
}

/**
 * Call DeepSeek API
 */
async function callDeepSeek(prompt, maxTokens, temperature, modelOverride = null) {
  try {
    const textPrompt = Array.isArray(prompt) 
      ? prompt.filter(p => typeof p === 'string').join('\n')
      : prompt;

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not found in environment variables');
    }

    // Default to 'deepseek-chat' (DeepSeek-V3 / Flash) which produces fast, high-quality, full chapters without spending token budget on hidden reasoning
    let modelName = modelOverride || process.env.DEEPSEEK_MODEL || (process.env.AI_MODEL?.includes('deepseek') ? process.env.AI_MODEL : null) || 'deepseek-chat';

    // Normalize model name if set to deepseek-v4-pro to prevent token exhaustion during reasoning
    if (modelName === 'deepseek-v4-pro') {
      modelName = 'deepseek-chat';
    }

    const safeMaxTokens = Math.min(maxTokens || 8192, 8192);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: textPrompt }],
        max_tokens: safeMaxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('DeepSeek returned no choices in response');
    }

    let text = data.choices[0]?.message?.content || '';

    // If content is empty but reasoning was generated, check if it hit length limit
    if ((!text || text.trim().length === 0) && data.choices[0]?.message?.reasoning_content) {
      console.warn('DeepSeek returned reasoning without final content');
      throw new Error('DeepSeek model exhausted tokens during reasoning. Please retry.');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('DeepSeek returned empty content');
    }

    return {
      content: text,
      tokensUsed: {
        input: data.usage?.prompt_tokens || estimateTokens(textPrompt),
        output: data.usage?.completion_tokens || estimateTokens(text),
        total: data.usage?.total_tokens || (estimateTokens(textPrompt) + estimateTokens(text))
      },
      model: data.model || modelName,
      provider: 'deepseek'
    };

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw new Error(`DeepSeek generation failed: ${error.message}`);
  }
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt, maxTokens, temperature, fileParts = null, modelOverride = null) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Default to 'gemini-2.5-flash' or 'gemini-flash-latest'
    let modelName = modelOverride || process.env.GEMINI_MODEL || (process.env.AI_MODEL?.includes('gemini') ? process.env.AI_MODEL : null) || 'gemini-2.5-flash';
    
    // Map deprecated model names to current working models
    if (modelName === 'gemini-1.5-flash' || modelName === 'gemini-1.5-flash-latest' || modelName === 'gemini-2.0-flash' || modelName === 'gemini-1.5-pro') {
      modelName = 'gemini-2.5-flash';
    }

    const safeMaxTokens = Math.min(maxTokens || 8192, 8192);

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: safeMaxTokens,
        temperature: temperature,
      }
    });

    let contentParts = [];
    if (Array.isArray(prompt)) {
      contentParts = prompt;
    } else {
      contentParts.push(prompt);
    }

    if (fileParts && Array.isArray(fileParts)) {
      contentParts = [...contentParts, ...fileParts];
    }

    const result = await model.generateContent(contentParts);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Gemini returned empty text response');
    }

    const tokensInput = estimateTokens(JSON.stringify(contentParts));
    const tokensOutput = estimateTokens(text);

    return {
      content: text,
      tokensUsed: {
        input: tokensInput,
        output: tokensOutput,
        total: tokensInput + tokensOutput
      },
      model: modelName,
      provider: 'gemini'
    };

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini generation failed: ${error.message}`);
  }
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(prompt, maxTokens, temperature, stopSequences, modelOverride = null) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }

    let modelName = modelOverride || process.env.CLAUDE_MODEL || (process.env.AI_MODEL?.includes('claude') ? process.env.AI_MODEL : null) || 'claude-3-5-sonnet-20241022';

    if (modelName === 'claude-sonnet-4-6') {
      modelName = 'claude-3-5-sonnet-20241022';
    }

    const safeMaxTokens = Math.min(maxTokens || 8192, 8192);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: safeMaxTokens,
        temperature: temperature,
        messages: [{ role: 'user', content: prompt }],
        ...(stopSequences && { stop_sequences: stopSequences })
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Claude API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    const text = data.content
      ?.filter(block => block.type === 'text')
      ?.map(block => block.text)
      ?.join('\n') || '';

    if (!text || text.trim().length === 0) {
      throw new Error('Claude returned empty content');
    }

    return {
      content: text,
      tokensUsed: {
        input: data.usage?.input_tokens || estimateTokens(prompt),
        output: data.usage?.output_tokens || estimateTokens(text),
        total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      },
      model: data.model || modelName,
      provider: 'claude'
    };

  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude generation failed: ${error.message}`);
  }
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Get cost estimate in Naira
 */
export function calculateCost(inputTokens, outputTokens, provider = 'deepseek') {
  const USD_TO_NGN = 1650;

  if (provider === 'deepseek') {
    const inputCost = (inputTokens / 1_000_000) * 0.14;
    const outputCost = (outputTokens / 1_000_000) * 0.28;
    return (inputCost + outputCost) * USD_TO_NGN;
  }

  if (provider === 'gemini') {
    const inputCost = (inputTokens / 1_000_000) * 0.125;
    const outputCost = (outputTokens / 1_000_000) * 0.50;
    return (inputCost + outputCost) * USD_TO_NGN;
  } 
  
  if (provider === 'claude') {
    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;
    return (inputCost + outputCost) * USD_TO_NGN;
  }

  return 0;
}

/**
 * Check if we have enough tokens left in project limit
 */
export function checkTokenLimit(tokensUsed, tokensLimit, estimatedNewTokens = 0) {
  const remaining = Math.max(0, tokensLimit - tokensUsed);
  const percentage = (tokensUsed / tokensLimit) * 100;
  const allowed = (tokensUsed + estimatedNewTokens) <= tokensLimit;

  return {
    allowed,
    remaining,
    percentage: Math.round(percentage),
    willExceed: !allowed,
    tokensNeeded: estimatedNewTokens,
    tokensAfter: tokensUsed + estimatedNewTokens
  };
}

/**
 * Get user-friendly warning level based on token usage
 */
export function getTokenWarningLevel(percentage) {
  if (percentage >= 100) {
    return { level: 'critical', color: 'red', message: 'Token limit reached! You can still edit manually or top up token.' };
  } else if (percentage >= 90) {
    return { level: 'danger', color: 'red', message: 'Only 10% tokens remaining. Use them wisely!' };
  } else if (percentage >= 80) {
    return { level: 'warning', color: 'yellow', message: '80% tokens used. Consider saving some for final adjustments.' };
  } else if (percentage >= 70) {
    return { level: 'caution', color: 'yellow', message: '70% tokens used. You\'re doing great!' };
  } else {
    return { level: 'safe', color: 'green', message: 'Plenty of tokens available.' };
  }
}
