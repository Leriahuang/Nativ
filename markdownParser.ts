import { DictionaryEntry } from './types';

export class MarkdownStreamParser {
  private buffer: string = '';
  private lastParsed: Partial<DictionaryEntry> = {};

  public addChunk(chunk: string): Partial<DictionaryEntry> | null {
    this.buffer += chunk;
    const parsed = this.parseBuffer();

    if (this.hasNewData(parsed)) {
      this.lastParsed = parsed;
      return parsed;
    }
    return null;
  }

  private parseBuffer(): Partial<DictionaryEntry> {
    const entry: Partial<DictionaryEntry> = {};

    const wordMatch = this.buffer.match(/## Word\s*\n(.+?)(?=\n##|\n*$)/s);
    if (wordMatch) {
      entry.word = wordMatch[1].trim();
    }

    const ipaMatch = this.buffer.match(/## IPA\s*\n(.+?)(?=\n##|\n*$)/s);
    if (ipaMatch) {
      entry.ipa = ipaMatch[1].trim();
    }

    const posMatch = this.buffer.match(/## Part of Speech\s*\n(.+?)(?=\n##|\n*$)/s);
    if (posMatch) {
      const posText = posMatch[1].trim();
      const parts = posText.split(/\s+/);
      entry.partOfSpeech = parts[0];

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].toLowerCase();
        if (part.includes('masculine') || part.includes('feminine')) {
          entry.gender = part.includes('masculine') ? 'masculine' : 'feminine';
          break;
        }
      }
    }

    const meaningMatch = this.buffer.match(/## Meaning\s*\n(.+?)(?=\n##|\n*$)/s);
    if (meaningMatch) {
      entry.meaning = meaningMatch[1].trim();
    }

    const synonymsMatch = this.buffer.match(/## Synonyms\s*\n((?:- .+\n?)+)/s);
    if (synonymsMatch) {
      entry.synonyms = this.parseSynonyms(synonymsMatch[1]);
    }

    const expressionsMatch = this.buffer.match(/## Expressions\s*\n((?:\d+\. .+\n?)+)/s);
    if (expressionsMatch) {
      entry.expressions = this.parseExpressions(expressionsMatch[1]);
    }

    const examplesSection = this.buffer.match(/## Examples\s*\n(.+?)(?=\n##|\n*$)/s);
    if (examplesSection) {
      entry.examples = this.parseExamples(examplesSection[1]);
    }

    return entry;
  }

  private parseSynonyms(text: string): Array<{ word: string; translation: string }> {
    const synonyms: Array<{ word: string; translation: string }> = [];
    const lines = text.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const match = line.match(/^-\s*\*\*(.+?)\*\*\s*\((.+?)\)/);
      if (match) {
        synonyms.push({
          word: match[1].trim(),
          translation: match[2].trim()
        });
      }
    }

    return synonyms;
  }

  private parseExpressions(text: string): Array<{ original: string; translation: string }> {
    const expressions: Array<{ original: string; translation: string }> = [];
    const lines = text.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const match = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*-\s*(.+)$/);
      if (match) {
        expressions.push({
          original: match[1].trim(),
          translation: match[2].trim()
        });
      }
    }

    return expressions;
  }

  private parseExamples(text: string): Array<{
    original: string;
    translation: string;
    source: 'YouTube' | 'Podcast' | 'Informal';
    formality: 'casual' | 'neutral' | 'formal';
  }> {
    const examples: Array<any> = [];

    const blocks = text.split(/###\s+/).filter(b => b.trim());

    for (const block of blocks) {
      const headerMatch = block.match(/^(.+?)\s*\|\s*(.+?)\n/);
      if (!headerMatch) continue;

      const sourceRaw = headerMatch[1].trim();
      const formalityRaw = headerMatch[2].trim();

      let source: 'YouTube' | 'Podcast' | 'Informal' = 'Informal';
      if (sourceRaw.toLowerCase().includes('youtube')) {
        source = 'YouTube';
      } else if (sourceRaw.toLowerCase().includes('podcast')) {
        source = 'Podcast';
      }

      let formality: 'casual' | 'neutral' | 'formal' = 'neutral';
      if (formalityRaw.toLowerCase().includes('casual')) {
        formality = 'casual';
      } else if (formalityRaw.toLowerCase().includes('formal')) {
        formality = 'formal';
      }

      const contentAfterHeader = block.substring(headerMatch[0].length);
      const lines = contentAfterHeader.split('\n').filter(l => l.trim());

      if (lines.length >= 2) {
        const original = lines[0].trim();
        const translation = lines[1].replace(/^\*|\*$/g, '').trim();

        examples.push({
          original,
          translation,
          source,
          formality
        });
      }
    }

    return examples;
  }

  private hasNewData(parsed: Partial<DictionaryEntry>): boolean {
    return JSON.stringify(parsed) !== JSON.stringify(this.lastParsed);
  }

  public getFinal(): Partial<DictionaryEntry> {
    return this.parseBuffer();
  }
}
