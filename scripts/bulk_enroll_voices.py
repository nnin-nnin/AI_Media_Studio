import os
import sys
import time
import json
import dashscope
from dashscope.audio.tts_v2 import VoiceEnrollmentService

# Configuration
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
if not dashscope.api_key:
    print("Error: DASHSCOPE_API_KEY is not set.")
    sys.exit(1)

TARGET_MODEL = "cosyvoice-v3-plus"
VOICE_PREFIX = "myvoice"
MP3_DIR = "data/mp3"
OUTPUT_JSON = "scripts/new_voices.json"

# Mapping: Filename (without .mp3) to Display Name (partial match)
# We use this to identify which character to update
MAPPING = {
    "aobing": "敖丙",
    "haimian": "海绵宝宝",
    "nezha": "哪吒",
    "xionger": "熊二",
    "wukong": "孙悟空",
    "bajie": "猪八戒"
}

def enroll_voice(file_path):
    print(f"\n[Process] Enrolling: {file_path}")
    service = VoiceEnrollmentService()
    try:
        # 1. Create Voice
        # Note: We can only use local path if there's an upload mechanism.
        # voice-clone.py uses COS. 
        # For simplicity, if we are internal, we might need a URL.
        # Wait, the user has TENCENT_COS configured. I should reuse the COS upload logic.
        pass
    except Exception as e:
        print(f"Error enrolling {file_path}: {e}")
        return None

# Actually, I'll copy the COS upload logic from voice-clone.py
# But I'll simplify it into one script for the user.

import uuid
import mimetypes
from qcloud_cos import CosConfig, CosS3Client

def upload_to_cos(local_path):
    secret_id = os.getenv("TENCENT_SECRET_ID")
    secret_key = os.getenv("TENCENT_SECRET_KEY")
    region = os.getenv("TENCENT_COS_REGION", "ap-beijing")
    bucket = os.getenv("TENCENT_COS_BUCKET")
    
    if not all([secret_id, secret_key, region, bucket]):
        raise ValueError("Missing TENCENT_COS environment variables")

    cfg = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key)
    client = CosS3Client(cfg)
    
    ext = os.path.splitext(local_path)[1]
    object_key = f"samples/{uuid.uuid4().hex}{ext}"
    
    client.upload_file(
        Bucket=bucket,
        LocalFilePath=local_path,
        Key=object_key
    )
    
    return f"https://{bucket}.cos.{region}.myqcloud.com/{object_key}"

def main():
    if not os.path.exists(MP3_DIR):
        print(f"Error: {MP3_DIR} not found.")
        sys.exit(1)

    results = []
    service = VoiceEnrollmentService()

    for filename in os.listdir(MP3_DIR):
        if not filename.endswith(".mp3"):
            continue
        
        name_key = filename.replace(".mp3", "")
        if name_key not in MAPPING:
            continue
        
        local_path = os.path.join(MP3_DIR, filename)
        display_name = MAPPING[name_key]
        
        try:
            print(f"-- Processing {display_name} ({filename}) --")
            # 1. Upload
            url = upload_to_cos(local_path)
            print(f"Uploaded to COS: {url}")
            
            # 2. Enroll
            voice_id = service.create_voice(target_model=TARGET_MODEL, prefix=VOICE_PREFIX, url=url)
            print(f"Created Voice ID: {voice_id}. Waiting for OK...")
            
            # 3. Poll
            ready = False
            for i in range(20):
                info = service.query_voice(voice_id=voice_id)
                status = (info or {}).get("status")
                if status == "OK":
                    ready = True
                    break
                time.sleep(5)
            
            if ready:
                print(f"Voice {display_name} is READY.")
                results.append({
                    "char_name_part": display_name,
                    "voice_id": voice_id
                })
            else:
                print(f"Voice {display_name} TIMED OUT.")
        
        except Exception as e:
            print(f"Failed {display_name}: {e}")

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\nDone. Results saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
