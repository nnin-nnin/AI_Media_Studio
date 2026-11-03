import os
import sys
import json
import asyncio
import argparse

# Edge-TTS neural voice mapping for studio characters
EDGE_VOICE_MAP = {
    "wukong": "zh-CN-YunxiNeural",
    "bajie": "zh-CN-YunfengNeural",
    "nezha": "zh-CN-XiaoyiNeural",
    "aobing": "zh-CN-YunjianNeural",
    "haimian": "zh-CN-liaoning-XiaobeiNeural",
    "xionger": "zh-CN-YunyangNeural"
}

def resolve_edge_voice(raw_voice):
    v = (raw_voice or "").lower()
    for key, voice_name in EDGE_VOICE_MAP.items():
        if key in v:
            return voice_name
    if "female" in v:
        return "zh-CN-XiaoxiaoNeural"
    return "zh-CN-YunxiNeural"

async def synthesize_edge(voice, text, output_path, speed=1.0):
    import edge_tts
    rate_str = "+0%"
    if speed != 1.0:
        pct = int(round((speed - 1.0) * 100))
        rate_str = f"+{pct}%" if pct >= 0 else f"{pct}%"

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    communicate = edge_tts.Communicate(text, voice, rate=rate_str)
    await communicate.save(output_path)
    return True

def main():
    parser = argparse.ArgumentParser(description="Edge-TTS Neural Voice Fallback Synthesizer")
    parser.add_argument("voice_id", help="Voice ID or character code")
    parser.add_argument("text", help="Text to synthesize")
    parser.add_argument("output_path", help="Output file path")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech speed (0.5-2.0)")
    parser.add_argument("--sample_rate", type=int, default=22050, help="Sample rate (reserved)")

    args = parser.parse_args()
    edge_voice = resolve_edge_voice(args.voice_id)

    try:
        asyncio.run(synthesize_edge(edge_voice, args.text, args.output_path, args.speed))
        print(json.dumps({
            "status": "success",
            "file": args.output_path,
            "provider": "edge_tts",
            "voice": edge_voice
        }))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"Edge-TTS synthesis error: {str(e)}"
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
