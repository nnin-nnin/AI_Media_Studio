import os
import sys
import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer

def test_v3():
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    if not dashscope.api_key:
        print("Error: DASHSCOPE_API_KEY not set")
        return

    # Use Aobing's new V3 valid voice_id
    voice_id = "cosyvoice-v3-plus-myvoice-1a34e653693d459f99599e1f9ea61826" 
    model = "cosyvoice-v3-plus"
    text = "我是敖丙，正在测试V3模型。"
    output_file = "test_v3_result.mp3"

    print(f"Testing synthesis with model='{model}' and voice='{voice_id}'...")
    
    try:
        synthesizer = SpeechSynthesizer(model=model, voice=voice_id)
        audio_data = synthesizer.call(text)
        
        if audio_data is not None:
            with open(output_file, "wb") as f:
                f.write(audio_data)
            print(f"Success! Saved to {output_file}")
        else:
            print(f"Failed. Last Response: {synthesizer.get_last_response()}")
            
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    test_v3()
