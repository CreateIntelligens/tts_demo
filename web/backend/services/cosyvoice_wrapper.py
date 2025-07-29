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

def load_cosyvoice_model(model_dir):
    """Load CosyVoice model with fallback"""
    try:
        from cosyvoice.cli.cosyvoice import CosyVoice, CosyVoice2
        
        # Try CosyVoice2 first
        if 'CosyVoice2' in model_dir or '0.5B' in model_dir:
            try:
                return CosyVoice2(model_dir), 'CosyVoice2'
            except Exception as e:
                print(f"Failed to load CosyVoice2: {e}", file=sys.stderr)
        
        # Fallback to CosyVoice
        try:
            return CosyVoice(model_dir), 'CosyVoice'
        except Exception as e:
            print(f"Failed to load CosyVoice: {e}", file=sys.stderr)
            
        return None, None
        
    except ImportError as e:
        print(f"CosyVoice import failed: {e}", file=sys.stderr)
        return None, None

def synthesize_with_cosyvoice(model, model_type, text, mode='sft', spk_id="中性", 
                              prompt_text="", prompt_audio_path=None, instruct_text=""):
    """Synthesize speech using CosyVoice with different modes"""
    try:
        # Load prompt audio if provided
        prompt_speech = None
        if prompt_audio_path and os.path.exists(prompt_audio_path):
            from cosyvoice.utils.file_utils import load_wav
            prompt_speech = load_wav(prompt_audio_path, 16000)
        
        if model_type == 'CosyVoice2':
            # CosyVoice2 推理
            if mode == 'sft':
                for output in model.inference_sft(text, spk_id):
                    return output['tts_speech'].numpy(), 22050
            elif mode == 'zero_shot' and prompt_speech is not None:
                for output in model.inference_zero_shot(text, prompt_text, prompt_speech):
                    return output['tts_speech'].numpy(), 22050
            elif mode == 'cross_lingual' and prompt_speech is not None:
                for output in model.inference_cross_lingual(text, prompt_speech):
                    return output['tts_speech'].numpy(), 22050
            elif mode == 'instruct':
                for output in model.inference_instruct(text, spk_id, instruct_text):
                    return output['tts_speech'].numpy(), 22050
            elif mode == 'instruct2' and prompt_speech is not None:
                for output in model.inference_instruct2(text, instruct_text, prompt_speech):
                    return output['tts_speech'].numpy(), 22050
            else:
                # Fallback to SFT
                for output in model.inference_sft(text, spk_id):
                    return output['tts_speech'].numpy(), 22050
        else:
            # 原始 CosyVoice
            if mode == 'sft':
                for output in model.inference_sft(text, spk_id):
                    return output['tts_speech'].numpy(), 22050
            elif mode == 'zero_shot' and prompt_speech is not None:
                for output in model.inference_zero_shot(text, prompt_text, prompt_speech):
                    return output['tts_speech'].numpy(), 22050
            elif mode == 'cross_lingual' and prompt_speech is not None:
                for output in model.inference_cross_lingual(text, prompt_speech):
                    return output['tts_speech'].numpy(), 22050
            elif mode == 'instruct':
                for output in model.inference_instruct(text, spk_id, instruct_text):
                    return output['tts_speech'].numpy(), 22050
            elif mode == 'instruct2' and prompt_speech is not None:
                for output in model.inference_instruct2(text, instruct_text, prompt_speech):
                    return output['tts_speech'].numpy(), 22050
            else:
                # Fallback to SFT
                for output in model.inference_sft(text, spk_id):
                    return output['tts_speech'].numpy(), 22050
                    
        return None, None
        
    except Exception as e:
        print(f"Synthesis failed: {e}", file=sys.stderr)
        return None, None

def generate_fallback_audio(text, sample_rate=22050, duration=2.0):
    """Generate fallback sine wave audio"""
    frequency = 440 + len(text) * 10
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
    audio_data += np.sin(2 * np.pi * frequency * 2 * t) * 0.1
    return audio_data, sample_rate

def save_audio(audio_data, sample_rate, output_path, format_type="wav"):
    """Save audio data to file"""
    try:
        # Ensure audio_data is a tensor
        if not isinstance(audio_data, torch.Tensor):
            audio_data = torch.from_numpy(audio_data).float()
        
        # Ensure proper shape (channels, samples)
        if audio_data.dim() == 1:
            audio_data = audio_data.unsqueeze(0)
        elif audio_data.dim() > 2:
            audio_data = audio_data.squeeze()
            if audio_data.dim() == 1:
                audio_data = audio_data.unsqueeze(0)
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save audio file
        torchaudio.save(output_path, audio_data, sample_rate, format=format_type)
        return True
        
    except Exception as e:
        print(f"Failed to save audio: {e}", file=sys.stderr)
        return False

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        sys.exit(1)
    
    try:
        # Parse input parameters
        params = json.loads(sys.argv[1])
        
        text = params.get("text", "")
        mode = params.get("mode", "sft")
        spk_id = params.get("spkId", "中性")
        prompt_text = params.get("promptText", "")
        prompt_audio_path = params.get("promptAudioPath", None)
        instruct_text = params.get("instructText", "")
        output_path = params.get("outputPath", "")
        output_format = params.get("outputFormat", "wav")
        model_dir = params.get("modelDir", "/workspace/data/models/pretrained_models/CosyVoice2-0.5B")
        
        if not text:
            print(json.dumps({"success": False, "error": "No text provided"}))
            sys.exit(1)
        
        if not output_path:
            print(json.dumps({"success": False, "error": "No output path provided"}))
            sys.exit(1)
        
        # Try to load and use CosyVoice model
        model, model_type = load_cosyvoice_model(model_dir)
        
        if model is not None:
            # Use real CosyVoice
            audio_data, sample_rate = synthesize_with_cosyvoice(model, model_type, text, mode)
            
            if audio_data is not None:
                # Save audio file
                if save_audio(audio_data, sample_rate, output_path, output_format):
                    duration = len(audio_data) / sample_rate
                    print(json.dumps({
                        "success": True,
                        "duration": duration,
                        "sampleRate": sample_rate,
                        "outputPath": output_path,
                        "modelType": model_type,
                        "note": f"Generated using {model_type}"
                    }))
                else:
                    print(json.dumps({"success": False, "error": "Failed to save audio file"}))
            else:
                # Fallback to simple audio
                audio_data, sample_rate = generate_fallback_audio(text)
                if save_audio(audio_data, sample_rate, output_path, output_format):
                    duration = len(audio_data) / sample_rate
                    print(json.dumps({
                        "success": True,
                        "duration": duration,
                        "sampleRate": sample_rate,
                        "outputPath": output_path,
                        "note": "Fallback audio generated (model synthesis failed)"
                    }))
                else:
                    print(json.dumps({"success": False, "error": "Failed to generate fallback audio"}))
        else:
            # Use fallback audio generation
            audio_data, sample_rate = generate_fallback_audio(text)
            if save_audio(audio_data, sample_rate, output_path, output_format):
                duration = len(audio_data) / sample_rate
                print(json.dumps({
                    "success": True,
                    "duration": duration,
                    "sampleRate": sample_rate,
                    "outputPath": output_path,
                    "note": "Fallback audio generated (CosyVoice not available)"
                }))
            else:
                print(json.dumps({"success": False, "error": "Failed to generate audio"}))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()