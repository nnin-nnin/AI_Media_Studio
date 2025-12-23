import os
import json
import dashscope
from dashscope.audio.tts_v2 import VoiceEnrollmentService

dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

def list_voices():
    print("--- Listing Enrolled Voices ---")
    try:
        service = VoiceEnrollmentService()
        # DashScope SDK might have different methods for listing
        # Usually it's query_voices or list_voices
        # Let's try to see what's available
        voices = service.list_voices()
        print(json.dumps(voices, indent=2))
    except Exception as e:
        print(f"ERROR: {e}")
        # Try another method name if list_voices doesn't exist
        try:
            print("Trying query_voices...")
            # Some versions use query_voices with a prefix or just all
            # But list_voices is standard for v2
        except:
            pass

list_voices()
