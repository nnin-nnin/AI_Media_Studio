import os
import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer

dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

VOICE_ID = "cosyvoice-v3-plus-myvoice-1a34e653693d459f99599e1f9ea61826"
TEXT = "大家好，我是测试语音。"

def test_config(model, voice):
    print(f"\n--- Testing Model: {model}, Voice: {voice} ---")
    try:
        syn = SpeechSynthesizer(model=model, voice=voice)
        audio = syn.call(TEXT)
        if audio:
            print(f"SUCCESS! Received {len(audio)} bytes.")
            return True
        else:
            print(f"FAILED: No audio data. Response: {syn.last_response}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

# Test combinations
configs = [
    ("cosyvoice-v3-plus", VOICE_ID),
    ("cosyvoice-v3-plus", VOICE_ID.replace("cosyvoice-v3-plus-", "")),
    ("cosyvoice-v3", VOICE_ID),
    ("cosyvoice-v3", VOICE_ID.replace("cosyvoice-v3-plus-", "")),
]

for m, v in configs:
    if test_config(m, v):
        print(f"\n>>> FOUND WORKING CONFIG: model='{m}', voice='{v}'")
        break
