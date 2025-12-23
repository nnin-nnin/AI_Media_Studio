import os
import sys
import json
import subprocess
import tempfile
import dashscope
from dashscope.audio.asr import Recognition

def main():
    if len(sys.argv) < 2:
        print("Usage: asr_helper.py <audio_file>", file=sys.stderr)
        sys.exit(1)
    
    audio_file = sys.argv[1]
    
    # Init API Key from environment
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

    if not dashscope.api_key:
        print(json.dumps({"status": "error", "message": "Missing DASHSCOPE_API_KEY"}))
        sys.exit(1)

    if not os.path.exists(audio_file):
        print(json.dumps({"status": "error", "message": f"File not found: {audio_file}"}))
        sys.exit(1)

    # Pre-process audio with ffmpeg to ensure it is mono, 16khz, wav
    # This fixes "actual=2" channels error and model mismatch issues
    processed_file = None
    try:
        temp_fd, processed_file = tempfile.mkstemp(suffix='.wav')
        os.close(temp_fd)
        
        # Convert to Mono, 16kHz WAV
        cmd = [
            'ffmpeg', '-y', '-i', audio_file,
            '-ac', '1', '-ar', '16000',
            processed_file
        ]
        
        # Run ffmpeg silenty
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        
        recognition = Recognition(model='fun-asr-realtime',
                                  format='wav', 
                                  sample_rate=16000,
                                  callback=None)
        
        result = recognition.call(processed_file)
        
        if result.status_code == 200:
            sentence_list = result.get_sentence()
            if sentence_list:
                transcript = "".join([s['text'] for s in sentence_list])
            else:
                transcript = ""
            
            print(json.dumps({
                "status": "success",
                "text": transcript
            }))
        else:
            print(json.dumps({
                "status": "error",
                "message": f"DashScope ASR Error: {result.message}",
                "code": result.code
            }))
            sys.exit(1)

    except subprocess.CalledProcessError as e:
        print(json.dumps({
            "status": "error",
            "message": f"FFmpeg error: {e.stderr.decode() if e.stderr else str(e)}"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
        sys.exit(1)
    finally:
        if processed_file and os.path.exists(processed_file):
            try:
                os.remove(processed_file)
            except:
                pass

if __name__ == "__main__":
    main()
