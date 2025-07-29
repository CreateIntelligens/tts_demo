import { AudioFile } from "@shared/schema";

export interface IStorage {
  // Audio files
  createAudioFile(audioFile: Omit<AudioFile, "id">): Promise<AudioFile>;
  getAudioFile(id: string): Promise<AudioFile | null>;
  getAllAudioFiles(): Promise<AudioFile[]>;
  deleteAudioFile(id: string): Promise<boolean>;
  updateAudioFile(id: string, updates: Partial<AudioFile>): Promise<AudioFile | null>;
}

export class MemStorage implements IStorage {
  private audioFiles: Map<string, AudioFile> = new Map();

  async createAudioFile(audioFile: Omit<AudioFile, "id">): Promise<AudioFile> {
    const id = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAudioFile: AudioFile = {
      ...audioFile,
      id
    };
    this.audioFiles.set(id, newAudioFile);
    return newAudioFile;
  }

  async getAudioFile(id: string): Promise<AudioFile | null> {
    return this.audioFiles.get(id) || null;
  }

  async getAllAudioFiles(): Promise<AudioFile[]> {
    return Array.from(this.audioFiles.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async deleteAudioFile(id: string): Promise<boolean> {
    return this.audioFiles.delete(id);
  }

  async updateAudioFile(id: string, updates: Partial<AudioFile>): Promise<AudioFile | null> {
    const existing = this.audioFiles.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates };
    this.audioFiles.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
