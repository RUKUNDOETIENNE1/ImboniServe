/**
 * Modular AI Prompt Template System
 * 
 * Provides consistent, reusable AI prompt generation across the platform.
 * Ensures JSON output consistency and reduces code duplication.
 */

export interface PromptConfig {
  role: string;
  task: string;
  data: Record<string, any>;
  outputFormat: any;
  instructions: string[];
  toneRules: string[];
  formatRules: string[];
  examples?: Array<{ bad: string; good: string; context?: string }>;
  suggestedValue?: number | string;
}

/**
 * Builds a standardized AI prompt from configuration
 * @param config - Prompt configuration object
 * @returns Formatted prompt string ready for AI
 */
export function buildAIPrompt(config: PromptConfig): string {
  const dataLines = Object.entries(config.data)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const examplesSection = config.examples
    ? `\nEXAMPLES:\n${config.examples
        .map(e => {
          const context = e.context ? `[${e.context}]\n` : '';
          return `${context}BAD: "${e.bad}"\nGOOD: "${e.good}"`;
        })
        .join('\n\n')}`
    : '';

  const suggestedSection = config.suggestedValue
    ? `\nSUGGESTED VALUE: ${config.suggestedValue}`
    : '';

  return `You are a ${config.role}.

${config.task}

DATA:
${dataLines}${suggestedSection}

TASK:
Return ONLY valid JSON in this format:

${JSON.stringify(config.outputFormat, null, 2)}

INSTRUCTIONS:
${config.instructions.map(i => `- ${i}`).join('\n')}

TONE RULES:
${config.toneRules.map(r => `- ${r}`).join('\n')}

FORMAT RULES:
${config.formatRules.map(r => `- ${r}`).join('\n')}${examplesSection}`;
}

/**
 * Parses and validates AI response JSON
 * @param rawResponse - Raw string response from AI
 * @returns Parsed and validated JSON object
 * @throws Error if JSON is invalid
 */
export function parseAIResponse<T>(rawResponse: string): T {
  // Clean markdown formatting
  let cleaned = rawResponse.trim();
  
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  // Extract pure JSON (find first { to last })
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  return JSON.parse(cleaned);
}

/**
 * Validates that required fields exist in AI response
 * @param data - Parsed AI response
 * @param requiredFields - Array of required field names
 * @returns True if all fields exist, throws error otherwise
 */
export function validateAIResponse(
  data: any,
  requiredFields: string[]
): boolean {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  return true;
}

/**
 * Enforces maximum word count per string in an object
 * @param data - Object containing strings to truncate
 * @param maxWords - Maximum words allowed per string
 * @returns Object with truncated strings
 */
export function enforceWordLimit<T extends Record<string, any>>(
  data: T,
  maxWords: number = 15
): T {
  const truncate = (text: string): string => {
    if (typeof text !== 'string') return text;
    const words = text.split(' ');
    return words.length > maxWords 
      ? words.slice(0, maxWords).join(' ') + '...' 
      : text;
  };

  const result = { ...data };

  Object.keys(result).forEach(key => {
    const value = result[key];
    
    if (typeof value === 'string') {
      result[key] = truncate(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' ? truncate(item) : item
      );
    }
  });

  return result;
}

/**
 * Common prompt configurations for reuse
 */
export const COMMON_CONFIGS = {
  toneRules: {
    expert: [
      'Be direct and confident',
      'Avoid soft language like "you may consider" or "it might help"',
      'Write like an expert giving honest advice',
      'Keep it professional but slightly bold',
      'No fluff or filler words',
    ],
    friendly: [
      'Be warm and encouraging',
      'Use simple, clear language',
      'Avoid jargon unless necessary',
      'Focus on helping the user succeed',
    ],
  },
  formatRules: {
    concise: [
      'Each bullet must be maximum 15 words',
      'Each bullet must be specific and actionable',
      'No repeated ideas across sections',
      'Use exact numbers from the data',
      'Return ONLY the JSON object, no markdown formatting, no extra text',
    ],
    detailed: [
      'Provide clear explanations',
      'Include specific examples',
      'Use bullet points for clarity',
      'Return ONLY the JSON object',
    ],
  },
};
