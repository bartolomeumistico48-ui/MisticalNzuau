
import { GoogleGenAI } from "@google/genai";

export async function generateRitualVideo(
  prompt: string, 
  resolution: '720p' | '1080p' = '720p'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: resolution,
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    // Wait for 10 seconds before polling again as per guidelines
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Falha ao capturar a visão do ritual.");
  }

  // The link requires the API key to be appended
  return `${downloadLink}&key=${process.env.API_KEY}`;
}

export const ritualPrompts = [
  "Cinematic 4k footage of a sacred Bantu ritual in the Congo rainforest, black shamans in traditional white attire using glowing quantum holographic symbols for prayer, hyper-realistic, sunset lighting, high fidelity, esoteric atmosphere.",
  "Ethereal ritual scene of a black priestess chanting by a crystalline waterfall, holographic fractal geometry patterns floating in the air, deep blue and amber lighting, cinematic lighting, 8k resolution, veo 3 style.",
  "Close up of wise black elders hands manipulating a quantum artifact made of gold and obsidian, ancient Bantu symbols glowing in cyan, incense smoke forming sacred geometry, slow motion, dramatic lighting.",
  "A group of black dancers performing a ritual dance under a blood moon, silhouettes against glowing quantum energy gates, dust and sparks in the air, epic cinematic wide shot, ancestral power vibe."
];
