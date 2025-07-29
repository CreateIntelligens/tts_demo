#!/usr/bin/env python3
import sys
import json
import os
import numpy as np
import torch
import torchaudio
from pathlib import Path

def generate_simple_audio(text, output_path, format="wav", duration=2.0, sample_rate=22050):
    """Generate a simple sine wave audio file for testing"""
    try:
        # Create a simple sine wave based on text length
        frequency = 440 + len(text) * 10  # Base frequency modified by text length
        t = np.linspace(0, duration, int(sample_rate * duration))
        
        # Generate sine wave with some variation
        audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
        
        # Add some harmonics for richer sound
        audio_data += np.sin(2 * np.pi * frequency * 2 * t) * 0.1
        audio_data += np.sin(2 * np.pi * frequency * 3 * t) * 0.05
        
        # Convert to tensor
        audio_tensor = torch.from_numpy(audio_data).float().unsqueeze(0)
        
        # Save audio file
        torchaudio.save(output_path, audio_tensor, sample_rate, format=format)
        
        return True, duration
    except Exception as e:
        return False, str(e)

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        sys.exit(1)
    
    try:
        # Parse input parameters
        params = json.loads(sys.argv[1])
        
        text = params.get("text", "")
        output_path = params.get("outputPath", "")
        output_format = params.get("outputFormat", "wav")
        
        if not text:
            print(json.dumps({"success": False, "error": "No text provided"}))
            sys.exit(1)
        
        if not output_path:
            print(json.dumps({"success": False, "error": "No output path provided"}))
            sys.exit(1)
        
        # Generate simple audio
        success, result = generate_simple_audio(text, output_path, output_format)
        
        if success:
            duration = result
            print(json.dumps({
                "success": True,
                "duration": duration,
                "sampleRate": 22050,
                "outputPath": output_path,
                "note": "Simple test audio generated (sine wave)"
            }))
        else:
            print(json.dumps({
                "success": False,
                "error": f"Failed to generate audio: {result}"
            }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()