import { z } from "zod";

// TTS Request Schema - 基於原始 CosyVoice FastAPI
export const ttsRequestSchema = z.object({
  text: z.string().min(1).max(500),
  mode: z.enum([
    "sft",              // 基本 SFT 推理
    "zero_shot",        // 零樣本複製推理
    "cross_lingual",    // 跨語言推理
    "instruct",         // 指令推理
    "instruct2"         // 指令推理2
  ]).default("sft"),
  
  // SFT 模式參數
  spkId: z.string().optional().default("中性"),
  
  // 零樣本推理參數
  promptText: z.string().optional(),
  promptAudioData: z.string().optional(), // base64 encoded audio
  
  // 指令推理參數
  instructText: z.string().optional(),
  
  // 模型路徑
  modelPath: z.string().default("/workspace/data/models/pretrained_models/CosyVoice2-0.5B"),
  
  outputFormat: z.enum(["wav", "mp3"]).default("wav"),
  
  // 速度調節（僅支援非流式推理）
  speed: z.number().min(0.5).max(2.0).default(1.0),
  
  // 流式推理模式
  stream: z.boolean().default(false),
  
  // 隨機推理種子
  seed: z.number().default(0)
});

export type TTSRequest = z.infer<typeof ttsRequestSchema>;

// Audio File Schema
export const audioFileSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  modelPath: z.string(),
  parameters: z.object({
    speed: z.number(),
    stream: z.boolean(),
    seed: z.number()
  }),
  filename: z.string(),
  format: z.string(),
  duration: z.number().optional(),
  createdAt: z.string(),
  fileSize: z.number().optional(),
  filePath: z.string()
});

export type AudioFile = z.infer<typeof audioFileSchema>;

// TTS Response Schema
export const ttsResponseSchema = z.object({
  success: z.boolean(),
  audioFile: audioFileSchema.optional(),
  error: z.string().optional(),
  processingTime: z.number().optional()
});

export type TTSResponse = z.infer<typeof ttsResponseSchema>;
