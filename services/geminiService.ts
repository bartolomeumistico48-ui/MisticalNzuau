
import { GoogleGenAI, Type } from "@google/genai";
import { Ebook, OracleMessage, RitualPhase, Lesson, SpiritualLevel, RitualQuestion, RitualAdvice, RitualAdviceResponse } from "../types";

const SYNTHESIS_MODEL = 'gemini-3-pro-preview';
const ORACLE_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

async function ensurePaidKey() {
  const aistudio = (window as any).aistudio;
  if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
    }
  }
}

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    const isPermissionError = errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED");
    const isNotFoundError = errorStr.includes("Requested entity was not found");
    const isInternalError = errorStr.includes("500") || errorStr.includes("INTERNAL");

    if (isPermissionError || isNotFoundError) {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.openSelectKey === 'function') {
        await aistudio.openSelectKey();
        return await fn();
      }
    }

    if (isInternalError && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000 * (4 - retries)));
      return fetchWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

export const generateRitualQuestionnaire = async (task: string): Promise<RitualQuestion[]> => {
  await ensurePaidKey();
  return await fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: ORACLE_MODEL,
      contents: `O usuário deseja realizar a seguinte tarefa: "${task}". 
      Atue como um mestre em astrologia eletiva e hermetismo. 
      Gere 4 perguntas curtas para diagnosticar se o momento energético é propício para esta tarefa específica. 
      As perguntas devem focar em estado mental, ambiente e intuição.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "question", "options"]
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  });
};

export const generateRitualAdvice = async (task: string, answers: { question: string, answer: string }[]): Promise<RitualAdvice> => {
  await ensurePaidKey();
  
  const adviceData: RitualAdviceResponse = await fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: ORACLE_MODEL,
      contents: `Tarefa: "${task}". 
      Respostas do diagnóstico: ${JSON.stringify(answers)}.
      Baseado nisso, determine se é o melhor momento e forneça um ritual de realinhamento ou empoderamento.
      IMPORTANTÍSSIMO: Os elementos do ritual devem ser itens comuns de COZINHA (sal, canela, mel, louro, água, café, etc.).
      Instruções devem ser breves e místicas.
      Também gere um "imagePrompt" descrevendo uma ilustração sagrada em tons de esmeralda e ouro que represente este ritual para o modelo Nano Banana.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isOptimal: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING },
            ritualName: { type: Type.STRING },
            elements: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            warning: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["isOptimal", "explanation", "ritualName", "elements", "instructions", "warning", "imagePrompt"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  });

  // Generate the ritual image
  let imageUrl = undefined;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imageResponse = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: `A sacred mystical illustration in emerald green and radiant gold colors. Theme: ${adviceData.imagePrompt}. High definition, esoteric aesthetic, glowing particles, professional digital art.` }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of imageResponse.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (err) {
    console.error("Image generation failed, proceeding without image:", err);
  }

  return {
    ...adviceData,
    imageUrl
  };
};

export const generateAncestralLesson = async (level: SpiritualLevel, previousTopics: string[], seedContext?: string): Promise<Lesson> => {
  await ensurePaidKey();
  return await fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const seedInstruction = seedContext ? `\nO contexto específico para esta lição deve ser baseado nesta semente de conhecimento: "${seedContext}".` : "";
    
    const response = await ai.models.generateContent({
      model: ORACLE_MODEL,
      contents: `Atue como um Mwalimu (Mestre Ancestral Bakongo). 
      Gere uma lição espiritual para o nível "${level}". ${seedInstruction}
      Tópicos já abordados: ${previousTopics.join(', ')}.
      A lição deve integrar conceitos de física quântica com a cosmologia Bantu.
      Inclua uma prática meditativa específica.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            practice: { type: Type.STRING },
            frequency: { type: Type.STRING },
            kikongoTerms: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "title", "content", "practice", "frequency", "kikongoTerms"]
        }
      }
    });
    return JSON.parse(response.text.trim()) as Lesson;
  });
};

export const evaluateResponse = async (level: SpiritualLevel, lesson: string, responseText: string): Promise<{ score: number, feedback: string }> => {
  return await fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const result = await ai.models.generateContent({
      model: ORACLE_MODEL,
      contents: `Avalie a profundidade espiritual e quântica da resposta do aluno.
      Nível: ${level}
      Lição: ${lesson}
      Resposta: ${responseText}
      Dê uma pontuação de 0 a 20 e um feedback místico.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          },
          required: ["score", "feedback"]
        }
      }
    });
    return JSON.parse(result.text.trim());
  });
};

export const synthesizeEbook = async (topic: string, author?: string, customSubtitle?: string): Promise<Ebook> => {
  await ensurePaidKey();
  
  return await fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: SYNTHESIS_MODEL,
      contents: `Atue como um historiador especializado em textos apócrifos, físico quântico e profundo conhecedor de cosmogonias mundiais, com foco absoluto na cultura Bakongo e na língua KIKONGO. 
      O tópico principal é: ${topic}.
      Gere um e-book estruturado focado em 'Tecnologia Esotérica, Cosmogonias Ancestrais e Mecânica Quântica'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            author: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  quantumNote: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  objective: { type: Type.STRING }
                },
                required: ["title", "content", "quantumNote", "frequency", "objective"]
              }
            },
            angelicSeals: { type: Type.ARRAY, items: { type: Type.STRING } },
            realityWarnings: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "subtitle", "author", "chapters", "realityWarnings"]
        }
      }
    });

    return JSON.parse(response.text.trim()) as Ebook;
  });
};

export const consultOracle = async (prompt: string, history: OracleMessage[], phase: RitualPhase): Promise<string> => {
  return await fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `VOCÊ É O ORÁCULO DE PNEUMA. FASE ATUAL: ${phase}.`;

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: ORACLE_MODEL,
      contents: contents,
      config: {
        systemInstruction,
        temperature: 1.0,
        topP: 0.95
      }
    });

    return response.text || "O vácuo é a única resposta permitida.";
  });
};

export const explainSeal = async (seal: string, bookContext: string): Promise<string> => {
  return await fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: ORACLE_MODEL,
      contents: `Explique o selo quântico: "${seal}".`,
      config: { temperature: 0.8 }
    });
    return response.text || "Selo inacessível.";
  });
};
