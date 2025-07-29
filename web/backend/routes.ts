import { Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import { storage } from "./storage";
import { ttsService } from "./services/tts-service";
import { ttsRequestSchema } from "../shared/schema";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export function registerRoutes(app: any) {
  // Health check endpoint
  app.get("/health", (req: Request, res: Response) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "CosyVoice TTS"
    });
  });

  // Synthesize voice with optional audio upload
  app.post("/api/tts/synthesize", upload.single('promptAudio'), async (req: Request, res: Response) => {
    try {
      let requestData = req.body;
      
      // Convert string values to appropriate types for multipart form data
      if (requestData.speed) requestData.speed = parseFloat(requestData.speed);
      if (requestData.seed) requestData.seed = parseInt(requestData.seed);
      if (requestData.stream !== undefined) requestData.stream = requestData.stream === 'true';
      
      // Handle file upload for zero_shot and cross_lingual modes
      if (req.file) {
        requestData.promptAudioData = req.file.buffer.toString('base64');
      }
      
      const request = ttsRequestSchema.parse(requestData);
      
      const result = await ttsService.synthesizeVoice(request, req.file);
      
      if (result.success && result.audioFile) {
        // Store audio file metadata in storage
        const audioFile = await storage.createAudioFile(result.audioFile);
        res.json({
          success: true,
          audioFile,
          processingTime: result.processingTime
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || "Voice synthesis failed"
        });
      }
    } catch (error) {
      console.error("TTS synthesis error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid request parameters",
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Internal server error"
        });
      }
    }
  });

  // Get audio file list
  app.get("/api/audio", async (req: Request, res: Response) => {
    try {
      const audioFiles = await storage.getAllAudioFiles();
      res.json(audioFiles);
    } catch (error) {
      console.error("Failed to get audio files:", error);
      res.status(500).json({ error: "Failed to retrieve audio files" });
    }
  });

  // Get specific audio file metadata
  app.get("/api/audio/:id", async (req: Request, res: Response) => {
    try {
      const audioFile = await storage.getAudioFile(req.params.id);
      if (!audioFile) {
        res.status(404).json({ error: "Audio file not found" });
        return;
      }
      res.json(audioFile);
    } catch (error) {
      console.error("Failed to get audio file:", error);
      res.status(500).json({ error: "Failed to retrieve audio file" });
    }
  });

  // Download audio file
  app.get("/api/audio/:id/download", async (req: Request, res: Response) => {
    try {
      const audioFile = await storage.getAudioFile(req.params.id);
      if (!audioFile) {
        res.status(404).json({ error: "Audio file not found" });
        return;
      }

      const fileBuffer = await ttsService.getAudioFile(audioFile.filename);
      if (!fileBuffer) {
        res.status(404).json({ error: "Audio file data not found" });
        return;
      }

      res.set({
        "Content-Type": audioFile.format === "mp3" ? "audio/mpeg" : "audio/wav",
        "Content-Length": fileBuffer.length,
        "Content-Disposition": `attachment; filename="${audioFile.filename}"`
      });

      res.send(fileBuffer);
    } catch (error) {
      console.error("Failed to download audio file:", error);
      res.status(500).json({ error: "Failed to download audio file" });
    }
  });

  // Stream audio file for playback
  app.get("/api/audio/:id/stream", async (req: Request, res: Response) => {
    try {
      const audioFile = await storage.getAudioFile(req.params.id);
      if (!audioFile) {
        res.status(404).json({ error: "Audio file not found" });
        return;
      }

      const fileBuffer = await ttsService.getAudioFile(audioFile.filename);
      if (!fileBuffer) {
        res.status(404).json({ error: "Audio file data not found" });
        return;
      }

      res.set({
        "Content-Type": audioFile.format === "mp3" ? "audio/mpeg" : "audio/wav",
        "Content-Length": fileBuffer.length,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache"
      });

      res.send(fileBuffer);
    } catch (error) {
      console.error("Failed to stream audio file:", error);
      res.status(500).json({ error: "Failed to stream audio file" });
    }
  });

  // Delete audio file
  app.delete("/api/audio/:id", async (req: Request, res: Response) => {
    try {
      const audioFile = await storage.getAudioFile(req.params.id);
      if (!audioFile) {
        res.status(404).json({ error: "Audio file not found" });
        return;
      }

      // Delete physical file
      await ttsService.deleteAudioFile(audioFile.filename);
      
      // Delete from storage
      const deleted = await storage.deleteAudioFile(req.params.id);
      
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete audio file" });
      }
    } catch (error) {
      console.error("Failed to delete audio file:", error);
      res.status(500).json({ error: "Failed to delete audio file" });
    }
  });

  // Clear all audio files
  app.delete("/api/audio", async (req: Request, res: Response) => {
    try {
      const audioFiles = await storage.getAllAudioFiles();
      
      // Delete all physical files
      for (const audioFile of audioFiles) {
        await ttsService.deleteAudioFile(audioFile.filename);
        await storage.deleteAudioFile(audioFile.id);
      }
      
      res.json({ success: true, deletedCount: audioFiles.length });
    } catch (error) {
      console.error("Failed to clear audio files:", error);
      res.status(500).json({ error: "Failed to clear audio files" });
    }
  });
}
