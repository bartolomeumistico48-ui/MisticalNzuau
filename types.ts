
export interface Chapter {
  title: string;
  content: string;
  quantumNote: string;
  frequency: string;
  objective: string;
}

export interface Ebook {
  title: string;
  subtitle: string;
  author: string;
  chapters: Chapter[];
  angelicSeals?: string[];
  realityWarnings: string[];
}

export enum PipelineStatus {
  IDLE = 'IDLE',
  SEQUENCING = 'SEQUENCING',
  SYNTHESIZING = 'SYNTHESIZING',
  COMPILING = 'COMPILING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface OracleMessage {
  role: 'user' | 'oracle';
  text: string;
  ritualPhase?: RitualPhase;
}

export enum RitualPhase {
  INITIATION = 'Iniciação',
  PURIFICATION = 'Purificação',
  ILLUMINATION = 'Iluminação',
  ASCENSION = 'Ascensão Final',
  HOLY_DOMAIN = 'Santo Domínio Espiritual'
}

export interface OracleSettings {
  voice: 'Charon' | 'Kore' | 'Puck';
  rate: number;
  autoPlay: boolean;
}

export interface RitualVideo {
  uri: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
}

export interface VideoGenerationState {
  status: 'idle' | 'preparing' | 'generating' | 'done' | 'error';
  progressMessage: string;
  video?: RitualVideo;
}

export type SpiritualLevel = 'Kizola' | 'Ngangu' | 'Ngolo' | 'Kimuntu';

export interface Lesson {
  id: string;
  title: string;
  content: string;
  practice: string;
  frequency: string;
  kikongoTerms: string[];
}

export interface StudentProgress {
  level: SpiritualLevel;
  experience: number;
  lessonsCompleted: string[];
  linkedSeed?: string;
}

export interface RitualQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface RitualAdvice {
  isOptimal: boolean;
  explanation: string;
  ritualName: string;
  elements: string[];
  instructions: string[];
  warning: string;
  imageUrl?: string;
}

export interface RitualAdviceResponse extends Omit<RitualAdvice, 'imageUrl'> {
  imagePrompt: string;
}
