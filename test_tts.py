import os
import dashscope
from dashscope.audio.tts import SpeechSynthesizer

dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

def test_tts():
    model = "sambert-zhichu-v1"
    voice = "coco" 
    text = "你好，这是测试。"
    
    print(f"Testing Sambert TTS with model={model}, voice={voice}")
    
    result = SpeechSynthesizer.call(model=model,
                                     voice=voice,
                                     text=text)
    
    if result.get_audio_data() is not None:
        with open("test_output.mp3", "wb") as f:
            f.write(result.get_audio_data())
        print("Success! saved to test_output.mp3")
    else:
        print(f"Failed: {result.get_response()}")

if __name__ == "__main__":
    test_tts()
