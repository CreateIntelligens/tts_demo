import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TTSRequest, TTSResponse } from "@shared/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class TTSService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join("/workspace", "data", "audio");
    this.ensureOutputDir();
  }

  private async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create output directory:", error);
    }
  }

  async synthesizeVoice(request: TTSRequest, audioFile?: Express.Multer.File): Promise<TTSResponse> {
    const startTime = Date.now();
    
    try {
      const filename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${request.outputFormat}`;
      const outputPath = path.join(this.outputDir, filename);
      
      // Save audio file temporarily if provided
      let promptAudioPath: string | null = null;
      if (audioFile && (request.mode === 'zero_shot' || request.mode === 'cross_lingual' || request.mode === 'instruct2')) {
        promptAudioPath = path.join(this.outputDir, `prompt_${Date.now()}.wav`);
        await fs.writeFile(promptAudioPath, audioFile.buffer);
      }

      // Use the real CosyVoice Python script
      const pythonScript = path.join(__dirname, "cosyvoice_wrapper.py");
      const params = JSON.stringify({
        text: request.text,
        mode: request.mode,
        spkId: request.spkId || "中性",
        promptText: request.promptText || "",
        promptAudioPath: promptAudioPath,
        instructText: request.instructText || "",
        outputPath,
        outputFormat: request.outputFormat,
        speed: request.speed,
        stream: request.stream,
        seed: request.seed,
        modelDir: request.modelPath
      });

      const result = await this.runPythonScript(pythonScript, params);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || "Voice synthesis failed",
          processingTime: Date.now() - startTime
        };
      }

      // Get file stats
      const stats = await fs.stat(outputPath);
      
      return {
        success: true,
        audioFile: {
          id: path.basename(filename, path.extname(filename)),
          title: this.generateTitle(request.text),
          text: request.text,
          modelPath: request.modelPath,
          parameters: {
            speed: request.speed,
            stream: request.stream,
            seed: request.seed
          },
          filename,
          format: request.outputFormat,
          duration: result.duration || 0,
          createdAt: new Date().toISOString(),
          fileSize: stats.size,
          filePath: outputPath
        },
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error("TTS synthesis error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        processingTime: Date.now() - startTime
      };
    }
  }

  private getInferenceMode(request: TTSRequest): string {
    // 根據請求參數決定推理模式
    if (request.modelPreset.includes('instruct')) {
      return 'sft'; // 使用 SFT 模式用於指導合成
    }
    return 'sft'; // 默認使用 SFT 模式
  }

  private generateTitle(text: string): string {
    const maxLength = 30;
    const title = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    return title;
  }

  private runPythonScript(scriptPath: string, params: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python3", [scriptPath, params]);
      
      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python script exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python script output: ${stdout}`));
        }
      });

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });
    });
  }

  async getAudioFile(filename: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.outputDir, filename);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error("Failed to read audio file:", error);
      return null;
    }
  }

  async deleteAudioFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.outputDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error("Failed to delete audio file:", error);
      return false;
    }
  }
}

export const ttsService = new TTSService();
