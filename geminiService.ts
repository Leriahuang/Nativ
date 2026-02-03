import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DictionaryEntry, LearningLanguage, PodcastStory } from "./types";
import { MarkdownStreamParser } from "./markdownParser";

// Ensure we have an API key or a fallback during initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Create markdown prompt for dictionary entry
 * @param word Word to look up
 * @param lang Learning language
 * @returns Formatted prompt string
 */
function createMarkdownPrompt(word: string, lang: LearningLanguage): string {
	return `You are a language expert creating dictionary entries for advanced learners (B2+).

Provide a detailed entry for the word "${word}" in ${lang}.
Focus on colloquialisms, slang, and high-frequency usage.

Use EXACTLY this markdown format:

## Word
${word}

## IPA
[IPA pronunciation notation]

## Part of Speech
[noun/verb/adjective/etc] [masculine/feminine if applicable]

## Meaning
[2-3 sentence detailed explanation]

## Synonyms
- **[synonym]** ([English translation])
- **[synonym]** ([English translation])
[Provide 3-5 synonyms]

## Expressions
1. **[original expression]** - [English translation]
2. **[original expression]** - [English translation]
[Provide 3-5 common expressions]

## Examples
### [YouTube/Podcast] | [casual/neutral/formal]
[Original sentence using "${word}"]
*[English translation]*

### [YouTube/Podcast] | [casual/neutral/formal]
[Original sentence using "${word}"]
*[English translation]*

[Provide 3-5 realistic examples]

IMPORTANT: Follow this format EXACTLY. Use clear section headers with ## for main sections and ### for example metadata.`;
}

export async function* searchWordStream(word: string, lang: LearningLanguage): AsyncGenerator<Partial<DictionaryEntry>> {
	const parser = new MarkdownStreamParser();
	let chunkCount = 0;

	console.log('[MARKDOWN STREAM] Starting stream for word:', word);

	const stream = await ai.models.generateContentStream({
		model: 'gemini-3-flash-preview',
		contents: createMarkdownPrompt(word, lang),
		config: {
			thinkingConfig: { thinkingBudget: 0 },
		}
	});

	for await (const chunk of stream) {
		chunkCount++;

		console.log(`Chunk ${chunkCount}:`, {
			length: chunk.text?.length || 0,
			preview: (chunk.text || '').substring(0, 100).replace(/\n/g, '\\n') + '...',
			timestamp: Date.now()
		});

		const partial = parser.addChunk(chunk.text || '');

		if (partial) {
			console.log('New data parsed:', Object.keys(partial));
			yield partial;
		}
	}

	const final = parser.getFinal();
	yield final;
}

export async function searchWord(word: string, lang: LearningLanguage): Promise<DictionaryEntry> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide a detailed dictionary entry for the word "${word}" in ${lang} for an advanced learner (B2+).
    Focus on colloquialisms, slang, and high-frequency usage.
    In the 'examples' list, wrap the usage of the target word (including conjugations) in square brackets, e.g., "Je suis [fatigué]".
    Output must be in JSON format.`,
		config: {
			thinkingConfig: { thinkingBudget: 0 },
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					word: { type: Type.STRING },
					ipa: { type: Type.STRING },
					meaning: { type: Type.STRING },
					partOfSpeech: { type: Type.STRING },
					gender: { type: Type.STRING },
					expressions: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							properties: {
								original: { type: Type.STRING },
								translation: { type: Type.STRING }
							},
							required: ["original", "translation"]
						}
					},
					synonyms: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							properties: {
								word: { type: Type.STRING },
								translation: { type: Type.STRING }
							},
							required: ["word", "translation"]
						}
					},
					examples: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							properties: {
								original: { type: Type.STRING },
								translation: { type: Type.STRING },
								source: { type: Type.STRING },
								formality: { type: Type.STRING }
							},
							required: ["original", "translation", "source", "formality"]
						}
					}
				},
				required: ["word", "ipa", "meaning", "partOfSpeech", "expressions", "synonyms", "examples"]
			}
		}
	});

	return JSON.parse(response.text || '{}');
}

export async function generatePodcast(words: string[], lang: LearningLanguage): Promise<PodcastStory> {
	const response = await ai.models.generateContent({
		model: 'gemini-3-flash-preview',
		contents: `Write a HILARIOUS and WITTY 1-minute comedy monologue in ${lang} that naturally incorporates these words: ${words.join(', ')}.
    The style should be sharp, conversational, and observational (like a Netflix comedy special).
    Provide the title, the monologue text, and the specific list of vocabulary words used.`,
		config: {
			thinkingConfig: { thinkingBudget: 0 },
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					title: { type: Type.STRING },
					text: { type: Type.STRING },
					wordsUsed: { type: Type.ARRAY, items: { type: Type.STRING } }
				},
				required: ["title", "text", "wordsUsed"]
			}
		}
	});
	return JSON.parse(response.text || '{}');
}

export async function speakText(text: string, lang: LearningLanguage): Promise<string> {
	const voice = lang === 'French' ? 'Kore' : 'Puck';
	const response = await ai.models.generateContent({
		model: "gemini-2.5-flash-preview-tts",
		contents: [{ parts: [{ text }] }],
		config: {
			responseModalities: [Modality.AUDIO],
			speechConfig: {
				voiceConfig: {
					prebuiltVoiceConfig: { voiceName: voice },
				},
			},
		},
	});

	const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
	if (!base64Audio) throw new Error("Audio generation failed");
	return base64Audio;
}

export async function decodeAudio(base64: string): Promise<AudioBuffer> {
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
	const dataInt16 = new Int16Array(bytes.buffer);
	const numChannels = 1;
	const frameCount = dataInt16.length / numChannels;
	const buffer = ctx.createBuffer(numChannels, frameCount, 24000);

	for (let channel = 0; channel < numChannels; channel++) {
		const channelData = buffer.getChannelData(channel);
		for (let i = 0; i < frameCount; i++) {
			channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
		}
	}
	return buffer;
}
