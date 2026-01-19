
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Checks if a paid API key is selected. If not, opens the selection dialog.
 */
async function ensurePaidKey() {
  const aistudio = (window as any).aistudio;
  if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
    }
  }
}

/**
 * Executes an API call with retry logic for 500 errors and key selection prompt for 403/404 errors.
 */
async function audioFetchWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = String(error).toUpperCase();
    const isPermissionError = errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED");
    const isNotFoundError = errorStr.includes("NOT_FOUND") || errorStr.includes("NOT FOUND") || errorStr.includes("404");
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
      return audioFetchWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

function sanitizeText(text: string): string {
  return text.replace(/[^\w\s\.,!?;:áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/gi, ' ').slice(0, 1000).trim();
}

export async function synthesizePrayer(text: string, voiceName: 'Charon' | 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' = 'Charon'): Promise<AudioBuffer> {
  await ensurePaidKey();
  
  return await audioFetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanText = sanitizeText(text);
    if (!cleanText) throw new Error("O texto para transmutação está vazio.");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Diga com entonação mística, profunda e solene: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("A convergência falhou: Nenhuma resposta gerada.");

    let base64Audio: string | undefined;
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        base64Audio = part.inlineData.data;
        break;
      }
    }

    if (!base64Audio) {
      throw new Error(`A frequência de áudio não pôde ser estabilizada. Razão: ${candidate.finishReason || 'Desconhecida'}`);
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioData = decodeBase64(base64Audio);
    
    return await decodeAudioData(audioData, audioContext, 24000, 1);
  });
}

export async function synthesizeChant(text: string, voiceName: 'Charon' | 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' = 'Charon'): Promise<AudioBuffer> {
  await ensurePaidKey();
  
  return await audioFetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanText = sanitizeText(text);
    if (!cleanText) throw new Error("O texto para o canto está vazio.");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Cante de forma rítmica e ritualística, como um mantra sagrado: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("O vácuo não retornou ressonância.");

    let base64Audio: string | undefined;
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        base64Audio = part.inlineData.data;
        break;
      }
    }

    if (!base64Audio) {
      throw new Error(`Falha na ressonância melódica. Razão: ${candidate.finishReason || 'Bloqueio de Frequência'}`);
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioData = decodeBase64(base64Audio);
    
    return await decodeAudioData(audioData, audioContext, 24000, 1);
  });
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let i, sample, offset = 0, pos = 0;

  function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); 
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt "
  setUint32(16);         
  setUint16(1);          
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); 
  setUint16(numOfChan * 2); 
  setUint16(16);          

  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); 

  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArray], { type: "audio/wav" });
}
