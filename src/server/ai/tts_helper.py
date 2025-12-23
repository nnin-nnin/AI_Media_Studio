import os
import sys
import json
import dashscope
from dashscope.audio.tts import SpeechSynthesizer as SambertSynthesizer
from dashscope.audio.tts_v2 import SpeechSynthesizer

TARGET_MODEL = "cosyvoice-v3-plus"

import argparse

def main():
    parser = argparse.ArgumentParser(description="TTS Helper for CosyVoice and Sambert")
    parser.add_argument("voice_id", help="Voice ID")
    parser.add_argument("text", help="Text to synthesize")
    parser.add_argument("output_path", help="Output file path")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech speed (0.5-2.0)")
    parser.add_argument("--sample_rate", type=int, default=22050, help="Output sample rate")
    
    args = parser.parse_args()
    
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    if not dashscope.api_key:
        msg = "Missing DASHSCOPE_API_KEY"
        print(json.dumps({"status": "error", "message": msg}))
        print(msg, file=sys.stderr)
        sys.exit(1)

    try:
        # Check if it's a CosyVoice ID (starts with cosyvoice-)
        if args.voice_id.startswith("cosyvoice-"):
            # Pass the voice_id exactly as requested. 
            # Note: For custom voices, the full ID (including model prefix) is expected.
            synthesizer = SpeechSynthesizer(model=TARGET_MODEL, voice=args.voice_id, speech_rate=args.speed)
            audio_data = synthesizer.call(args.text)
            
            if audio_data is not None:
                with open(args.output_path, "wb") as f:
                    f.write(audio_data)
                print(json.dumps({"status": "success", "file": args.output_path}))
            else:
                resp = None
                if hasattr(synthesizer, 'last_response'):
                     resp = synthesizer.last_response
                elif hasattr(synthesizer, 'get_last_response'):
                     resp = synthesizer.get_last_response()
                
                msg = str(resp) if resp else "Empty audio data"
                print(json.dumps({"status": "error", "message": msg, "code": "Unknown"}))
                print(f"CosyVoice Error: {msg}", file=sys.stderr)
                sys.exit(1)
        else:
            # Fallback for Sambert v1 voices
            model = "sambert-zhichu-v1"
            result = SambertSynthesizer.call(model=model,
                                             voice=args.voice_id,
                                             text=args.text,
                                             sample_rate=args.sample_rate,
                                             speech_rate=args.speed)
            
            if result.get_audio_data() is not None:
                with open(args.output_path, "wb") as f:
                    f.write(result.get_audio_data())
                print(json.dumps({"status": "success", "file": args.output_path}))
            else:
                resp = result.get_response()
                msg = resp.get("message") if resp else "Empty audio data"
                code = resp.get("code") if resp else "Unknown"
                print(json.dumps({"status": "error", "message": msg, "code": code}))
                print(f"Sambert Error: {msg} (Code: {code})", file=sys.stderr)
                sys.exit(1)
                
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
