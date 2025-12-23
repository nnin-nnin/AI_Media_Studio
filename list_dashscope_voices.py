import os
import dashscope
from dashscope.audio.tts_v2 import VoiceEnrollmentService

def list_voices():
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    if not dashscope.api_key:
        print("Error: DASHSCOPE_API_KEY not set")
        return

    print("Listing DashScope custom voices...")
    service = VoiceEnrollmentService()
    try:
        # Note: list_voices might not be the exact method, checking SDK
        # Usually it's query_voices or similar
        # Let's try to see if we can get anything
        pass
    except Exception as e:
        print(f"Exception: {str(e)}")

    # Alternative: try a dummy query_voice to see if the service is even active
    try:
        service.query_voice(voice_id="dummy")
        print("VoiceEnrollmentService is accessible.")
    except Exception as e:
        print(f"VoiceEnrollmentService check failed: {str(e)}")

if __name__ == "__main__":
    list_voices()
