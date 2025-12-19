import { useState } from 'react';

const GEMINI_API_KEY = 'AIzaSyC_GyqT91Da-obCIc5Jhe3eUyBwsCBHerc';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = "You are a handwriting recognition engine. You will be provided with an image of a whiteboard containing handwritten text, digits, symbols, or math functions. Your task is to transcribe the handwriting exactly as it appears. Return ONLY the transcribed text. Do not add any conversational filler. If the image is empty or unclear, return an empty string.";

export function useHandwritingRecognition() {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognize = async (imageBase64: string) => {
    setIsRecognizing(true);
    setError(null);

    try {
      // Extract base64 data from data URL
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: SYSTEM_PROMPT + "\n\nTranscribe this handwriting:"
                },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

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
