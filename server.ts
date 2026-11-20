import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '5mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API endpoint for generating quiz questions from study notes
  app.post('/api/generate-quiz', async (req, res) => {
    try {
      const { notes, questionCount } = req.body;

      if (!notes || typeof notes !== 'string' || !notes.trim()) {
        return res.status(400).json({
          error: 'Please enter your study notes to generate a quiz.',
        });
      }

      const count = Math.min(Math.max(parseInt(String(questionCount), 10) || 3, 1), 5);

      const prompt = `You are an expert university professor and exam creator.
Analyze the following university study notes and craft a rigorous, clear, and high-value practice quiz with exactly ${count} multiple-choice question(s).

Requirements:
1. Generate exactly ${count} question(s).
2. Each question MUST provide exactly four plausible options (letters A, B, C, D).
3. Exactly one option is correct. The other three options must be realistic university-level distractors related to the topic.
4. Each question must have:
   - "id": 1 to ${count}
   - "question": clear, well-phrased question stem testing comprehension or application
   - "options": an array of 4 distinct answer option strings (do not include letter prefixes inside the string, e.g. ["Mitochondria", "Ribosome", "Endoplasmic reticulum", "Nucleus"])
   - "correctOptionIndex": integer 0, 1, 2, or 3 corresponding to the correct option in the options array
   - "correctLetter": "A", "B", "C", or "D" corresponding to the correct option
   - "explanation": a clear, comprehensive explanation that reinforces student learning and explains why this answer is correct based on the provided notes
5. Provide a short "title" summarizing the academic topic of the notes.

Study Notes:
"""
${notes.trim()}
"""`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'A concise subject/topic title for the quiz derived from the notes',
              },
              questions: {
                type: Type.ARRAY,
                description: `List of exactly ${count} multiple-choice questions`,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Array of exactly 4 answer options',
                    },
                    correctOptionIndex: {
                      type: Type.INTEGER,
                      description: 'Zero-based index (0, 1, 2, or 3) of the correct answer',
                    },
                    correctLetter: {
                      type: Type.STRING,
                      description: "The letter of the correct answer ('A', 'B', 'C', or 'D')",
                    },
                    explanation: {
                      type: Type.STRING,
                      description: 'Detailed educational explanation of the correct answer and relevant concept',
                    },
                  },
                  required: ['id', 'question', 'options', 'correctOptionIndex', 'correctLetter', 'explanation'],
                },
              },
            },
            required: ['title', 'questions'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini model returned an empty response. Please try again.');
      }

      const quizData = JSON.parse(responseText.trim());
      return res.json(quizData);
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate quiz. Please check your notes and try again.',
      });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quiz server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
