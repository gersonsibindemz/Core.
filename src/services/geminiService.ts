import { GoogleGenAI } from "@google/genai";
import { TranslationResponse } from '../types';
import { LRUCache } from './cache';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CACHE_MAX_SIZE = 100;
const translationCache = new LRUCache<string, TranslationResponse>(CACHE_MAX_SIZE);

export async function translateWithResearch(
  inputText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResponse> {
  const cacheKey = `${sourceLang}:${targetLang}:${inputText.trim().toLowerCase()}`;
  const cachedResult = translationCache.get(cacheKey);
  if (cachedResult) {
    // Return the cached result, which has now been marked as recently used.
    return cachedResult;
  }
  
  const prompt = `You are an expert linguist and translator specializing in Mozambican Bantu languages, assisted by a powerful research AI. Your task is to provide the most accurate, culturally-aware, and contextually-rich translation possible, complete with a pronunciation guide.

To achieve this, you will follow a two-step process:

**Step 1: Background Research (Internal Monologue)**
First, you must use your research capabilities (Google Search) to find relevant linguistic resources (dictionaries, grammars, corpora, articles) that can help you understand the nuances of the languages and the context of the text to be translated. Focus on the specific languages involved: ${sourceLang} and ${targetLang}.

**Step 2: High-Fidelity Translation & Phonetics**
Using the knowledge gathered from your research, translate the user's text. The translation must be natural, fluent, and preserve cultural nuances. **Crucially, you must also provide a phonetic pronunciation guide for the translated text using the International Phonetic Alphabet (IPA). For Bantu languages, pay special attention to tones (if applicable), click consonants, and vowel length, representing them accurately in the IPA string.**

**User's Request:**

- **Source Language:** ${sourceLang}
- **Target Language:** ${targetLang}
- **Text to Translate:** "${inputText}"

**Output Format:**

You MUST return your response as a single, valid JSON object and nothing else. Do not include any text, explanations, or markdown formatting (like \`\`\`json) before or after the JSON object.

The JSON object must have the following structure:
{
  "translation": "The translated text goes here.",
  "pronunciation": "The IPA phonetic guide for the translation (e.g., /fəˈnɛtɪk/). This should be null if a guide is not possible or irrelevant.",
  "sources": [
    {
      "title": "Title of the web source",
      "uri": "URL of the web source"
    }
  ]
}

If a translation is not possible or the text is nonsensical, the "translation" field should contain "Translation not available", and the "pronunciation" field should be null. The "sources" field can be an empty array ([]) if no relevant sources were found.

Now, perform the research and translation for the user's request.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = response.text.trim();
    // It's good practice to handle potential markdown fences
    const cleanJsonText = jsonText.replace(/^```json\s*|\s*```\s*$/g, '');
    
    let result: TranslationResponse;
    try {
        result = JSON.parse(cleanJsonText);
    } catch (parseError) {
        console.error("Failed to parse JSON response from Gemini:", cleanJsonText);
        throw new Error("Received an invalid response format from the translation service.");
    }
    
    // Cache the successful result in the LRU cache.
    translationCache.set(cacheKey, result);

    return result;
    
  } catch (error) {
    console.error("Error fetching translation with Gemini API:", error);
    throw new Error("Failed to fetch translation from Gemini API.");
  }
}
