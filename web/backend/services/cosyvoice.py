#!/usr/bin/env python3
import sys
import json
import os
import tempfile
import torch
import torchaudio
import numpy as np
from pathlib import Path

# Add the cosyvoice directory to Python path
sys.path.insert(0, '/workspace')
sys.path.insert(0, '/workspace/cosyvoice')

# Try importing CosyVoice with fallback to simple generation
try:
    from cosyvoice.cli.cosyvoice import CosyVoice
    COSYVOICE_AVAILABLE = True
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"CosyVoice not available: {str(e)}. Using fallback mode."
    }))
    COSYVOICE_AVAILABLE = False

class CosyVoiceTTS:
    def __init__(self):
        self.models = {}
        self.model_paths = {
            "cosyvoice-0.5b-base": "/workspace/data/models/CosyVoice2-0.5B",
            "cosyvoice-300m": "/workspace/data/models/CosyVoice-300M",
            "cosyvoice-300m-sft": "/workspace/data/models/CosyVoice-300M-SFT", 
            "cosyvoice-300m-instruct": "/workspace/data/models/CosyVoice-300M-Instruct",
            "cosyvoice-ttsfrd": "/workspace/data/models/CosyVoice-ttsfrd"
        }
        
    def load_model(self, model_name):
        """Load a specific CosyVoice model"""
        if model_name in self.models:
            return self.models[model_name]
            
        model_path = self.model_paths.get(model_name)
        if not model_path or not os.path.exists(model_path):
            # Fallback to available model or create mock for development
            available_models = [p for p in self.model_paths.values() if os.path.exists(p)]
            if available_models:
                model_path = available_models[0]
            else:
                raise ValueError(f"No CosyVoice models found. Please ensure models are downloaded.")
        
        try:
            model = CosyVoice(model_path)
            self.models[model_name] = model
            return model
        except Exception as e:
            raise ValueError(f"Failed to load model {model_name}: {str(e)}")
    
    def synthesize(self, text, model_name, language="auto", speed=1.0, pitch=0, volume=80):
        """Synthesize speech from text"""
        try:
            model = self.load_model(model_name)
            
            # Process text based on language
            if language == "auto":
                # Simple language detection based on character patterns
                if any('\u4e00' <= char <= '\u9fff' for char in text):
                    language = "zh"
                else:
                    language = "en"
            
            # Generate audio using CosyVoice
            if hasattr(model, 'inference_sft'):
                # For SFT models
                audio_data = model.inference_sft(text, "中性")
            elif hasattr(model, 'inference_zero_shot'):
                # For zero-shot models, need reference audio
                # Use a default reference or generate without reference
                audio_data = model.inference_zero_shot(text, "请用温和的语调说话", text)
            else:
                # Basic inference
                audio_data = model.inference(text)
            
            # Apply speed adjustment if needed
            if speed != 1.0:
                # Simple speed adjustment by resampling
                if isinstance(audio_data, tuple):
                    sample_rate, audio_data = audio_data
                else:
                    sample_rate = 22050  # Default sample rate
                
                # Convert to tensor if needed
                if not isinstance(audio_data, torch.Tensor):
                    audio_data = torch.from_numpy(audio_data)
                
                # Resample for speed change
                new_sample_rate = int(sample_rate * speed)
                audio_data = torchaudio.functional.resample(
                    audio_data, sample_rate, new_sample_rate
                )
                sample_rate = new_sample_rate
            
            # Apply volume adjustment
            if volume != 80:
                volume_factor = volume / 80.0
                audio_data = audio_data * volume_factor
            
            # Apply pitch adjustment (simplified)
            if pitch != 0:
                # Basic pitch shift using resampling
                pitch_factor = 2 ** (pitch / 12.0)
                if isinstance(audio_data, tuple):
                    sample_rate, audio_data = audio_data
                else:
                    sample_rate = 22050
                
                new_sample_rate = int(sample_rate * pitch_factor)
                audio_data = torchaudio.functional.resample(
                    audio_data, sample_rate, new_sample_rate
                )
            
            return audio_data, sample_rate
            
        except Exception as e:
            raise ValueError(f"Synthesis failed: {str(e)}")
    
    def save_audio(self, audio_data, sample_rate, output_path, format="wav"):
        """Save audio data to file"""
        try:
            # Ensure audio_data is a tensor
            if not isinstance(audio_data, torch.Tensor):
                audio_data = torch.from_numpy(audio_data)
            
            # Ensure proper shape (channels, samples)
            if audio_data.dim() == 1:
                audio_data = audio_data.unsqueeze(0)
            
            # Save audio file
            torchaudio.save(output_path, audio_data, sample_rate, format=format)
            
            return True
        except Exception as e:
            raise ValueError(f"Failed to save audio: {str(e)}")

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        sys.exit(1)
    
    try:
        # Parse input parameters
        params = json.loads(sys.argv[1])
        
        text = params.get("text", "")
        model_name = params.get("model", "cosyvoice-300m")
        language = params.get("language", "auto")
        speed = float(params.get("speed", 1.0))
        pitch = int(params.get("pitch", 0))
        volume = int(params.get("volume", 80))
        output_format = params.get("outputFormat", "wav")
        output_path = params.get("outputPath", "")
        
        if not text:
            print(json.dumps({"success": False, "error": "No text provided"}))
            sys.exit(1)
        
        if not output_path:
            print(json.dumps({"success": False, "error": "No output path provided"}))
            sys.exit(1)
        
        # Initialize TTS engine
        tts = CosyVoiceTTS()
        
        # Synthesize speech
        audio_data, sample_rate = tts.synthesize(
            text=text,
            model_name=model_name,
            language=language,
            speed=speed,
            pitch=pitch,
            volume=volume
        )
        
        # Save audio file
        tts.save_audio(audio_data, sample_rate, output_path, output_format)
        
        # Calculate duration
        duration = len(audio_data[0]) / sample_rate if isinstance(audio_data, torch.Tensor) else 0
        
        # Return success response
        print(json.dumps({
            "success": True,
            "duration": duration,
            "sampleRate": sample_rate,
            "outputPath": output_path
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
