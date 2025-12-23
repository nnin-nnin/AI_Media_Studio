import os
import sys
import json
import dashscope
from dashscope.audio.tts import SpeechSynthesizer

def test_character(voice_id, text, output_file):
    print(f"Testing TTS for voice_id: {voice_id} ...")
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    if not dashscope.api_key:
        print("Error: DASHSCOPE_API_KEY not set")
        return

    model = "sambert-zhichu-v1"
    
    try:
        result = SpeechSynthesizer.call(model=model,
                                         voice=voice_id,
                                         text=text)
        
        if result.get_audio_data() is not None:
            with open(output_file, "wb") as f:
                f.write(result.get_audio_data())
            print(f"Success! Saved to {output_file}")
        else:
            print(f"Failed: {result.get_response()}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    # Test Nezha (aitong)
    test_character("aitong", "我是哪吒，我的乾坤圈可厉害了！", "test_nezha.mp3")
    # Test Haimian (coco)
    test_character("coco", "我是海绵宝宝，我准备好了！", "test_haimian.mp3")
