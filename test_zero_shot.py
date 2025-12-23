import os
import sys
import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer

def test():
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    if not dashscope.api_key:
        print("Error: DASHSCOPE_API_KEY not set")
        return

    # Use aobing.mp3 as reference
    ref_audio = "file://" + os.path.abspath("data/mp3/aobing.mp3")
    if not os.path.exists(os.path.abspath("data/mp3/aobing.mp3")):
        print(f"Error: {ref_audio} not found")
        return

    # In zero-shot mode, we use the reference audio URL/path as 'voice'
    # According to docs, it can be a local path or URL
    model = "cosyvoice-v1"
    text = "我是敖丙，很高兴见到你。"
    output_file = "test_aobing_output.mp3"

    print(f"Testing zero-shot with model={model}, voice={ref_audio}...")

    try:
        synthesizer = SpeechSynthesizer(model=model, voice=ref_audio)
        audio = synthesizer.call(text)
        
        if audio:
            with open(output_file, "wb") as f:
                f.write(audio)
            print(f"Success! Saved to {output_file}")
        else:
            print(f"Failed: {synthesizer.get_last_response()}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    test()
