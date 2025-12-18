import { useState } from 'react';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export function useHandwritingRecognition() {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognize = async (imageBase64: string) => {
    setIsRecognizing(true);
    setError(null);

    try {
      // @ts-ignore
      const config = globalThis.ywConfig?.ai_config?.handwriting_recognition;
      if (!config) {
        throw new Error('AI configuration not found. Please check yw_manifest.json');
      }

      const openai = createOpenAI({
        baseURL: 'https://api.youware.com/public/v1/ai',
        apiKey: 'sk-YOUWARE',
      });

      const { text } = await generateText({
        model: openai(config.model),
        messages: [
          {
            role: 'system',
            content: config.system_prompt,
          },
          {
            role: 'user',
            content: [
              { type: 'image', image: imageBase64 },
              { type: 'text', text: "Transcribe this handwriting." }
            ],
          },
        ],
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

      setRecognizedText(text);
      return text;
    } catch (err: any) {
      console.error('Recognition failed:', err);
      setError(err.message || 'Failed to recognize handwriting');
      return null;
    } finally {
      setIsRecognizing(false);
    }
  };

  return { recognize, isRecognizing, recognizedText, error, setRecognizedText };
}
