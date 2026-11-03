import os
import sys
import time
import uuid

# ===================== SSL PATCH (MUST BE FIRST) =====================
import ssl
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context
    print("[VoiceClone] SSL Patch Applied: Unverified Context set as Default", file=sys.stderr)
# =====================================================================

# ===================== ENVIRONMENT DEBUG =====================
print(f"[VoiceClone] Python Executable: {sys.executable}", file=sys.stderr)
print(f"[VoiceClone] SSL Default Verify Paths: {ssl.get_default_verify_paths()}", file=sys.stderr)
print(f"[VoiceClone] DASHSCOPE_API_KEY Present: {'DASHSCOPE_API_KEY' in os.environ}", file=sys.stderr)
print(f"[VoiceClone] HTTP_PROXY: {os.environ.get('HTTP_PROXY', 'Not Set')}", file=sys.stderr)
print(f"[VoiceClone] HTTPS_PROXY: {os.environ.get('HTTPS_PROXY', 'Not Set')}", file=sys.stderr)
# =============================================================

import mimetypes
import json
import traceback

# 尝试导入腾讯云COS和DashScope SDK
try:
    from qcloud_cos import CosConfig, CosS3Client
    import dashscope
    from dashscope.audio.tts_v2 import VoiceEnrollmentService, SpeechSynthesizer
    DASHSCOPE_AVAILABLE = True
except ImportError as e:
    DASHSCOPE_AVAILABLE = False
    print(f"缺少必要的Python库: {e}", file=sys.stderr)
    sys.exit(1)

# ===================== 基础配置 =====================
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
if not dashscope.api_key:
    raise ValueError("DASHSCOPE_API_KEY environment variable not set.")

# 获取腾讯云COS配置
os.environ["TENCENT_SECRET_ID"] = os.getenv("TENCENT_SECRET_ID", "")
os.environ["TENCENT_SECRET_KEY"] = os.getenv("TENCENT_SECRET_KEY", "")
os.environ["TENCENT_COS_BUCKET"] = os.getenv("TENCENT_COS_BUCKET", "")
os.environ["TENCENT_COS_REGION"] = os.getenv("TENCENT_COS_REGION", "ap-beijing")

TARGET_MODEL = "cosyvoice-v2"
VOICE_PREFIX = "myvoice"  # 仅允许数字和小写字母，小于十个字符
POLL_INTERVAL = 10
MAX_ATTEMPTS = 30

# ===================== COS 上传工具函数 =====================
def _cos_client():
    secret_id = os.getenv("TENCENT_SECRET_ID")
    secret_key = os.getenv("TENCENT_SECRET_KEY")
    region = os.getenv("TENCENT_COS_REGION")  # 如 ap-beijing
    if not all([secret_id, secret_key, region]):
        raise ValueError("Missing COS envs: TENCENT_SECRET_ID / TENCENT_SECRET_KEY / TENCENT_COS_REGION")
    cfg = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key, Token=None, Scheme="https")
    return CosS3Client(cfg)

def upload_to_cos_get_url(local_path: str, expires: int = 3600 * 24) -> str:
    """
    上传本地文件到 COS，返回可被公网访问的 URL：
      - 若你的桶已设置为「公有读」，直接返回 https://{bucket}.cos.{region}.myqcloud.com/{key}
      - 若是私有读，返回带有效期的「预签名下载 URL」
    """
    bucket = os.getenv("TENCENT_COS_BUCKET")
    region = os.getenv("TENCENT_COS_REGION")
    key_prefix = os.getenv("TENCENT_COS_KEY_PREFIX", "uploads/").strip("/")
    if not bucket:
        raise ValueError("Missing COS env: TENCENT_COS_BUCKET")

    client = _cos_client()

    # 生成对象名（尽量保留扩展名，便于服务端识别音频类型）
    ext = os.path.splitext(local_path)[1] or ".wav"
    object_key = f"{key_prefix}/{uuid.uuid4().hex}{ext}"

    # ContentType（某些服务端会参考）
    ctype, _ = mimetypes.guess_type(local_path)
    extra_headers = {"ContentType": ctype} if ctype else {}

    # 执行上传
    client.upload_file(
        Bucket=bucket,
        LocalFilePath=local_path,
        Key=object_key,
        PartSize=5,
        MAXThread=5,
        EnableMD5=False,
        **extra_headers
    )

    # 如果桶是公有读，直接返回公网 URL
    public_url = f"https://{bucket}.cos.{region}.myqcloud.com/{object_key}"
    return public_url

# ===================== 业务逻辑封装 =====================
def ensure_url(audio_input: str) -> str:
    """
    若传入的是本地路径，则先上传 COS 得到可访问 URL；
    若本身就是 http(s) 链接，直接返回。
    """
    if audio_input.startswith("http://") or audio_input.startswith("https://"):
        return audio_input
    if not os.path.exists(audio_input):
        raise FileNotFoundError(f"Audio file not found: {audio_input}")
    return upload_to_cos_get_url(audio_input)

def create_voice_and_wait(audio_url: str) -> str:
    service = VoiceEnrollmentService()
    voice_id = service.create_voice(target_model=TARGET_MODEL, prefix=VOICE_PREFIX, url=audio_url)
    print(f"[Create] Request ID: {service.get_last_request_id()}  VoiceID: {voice_id}", file=sys.stderr)

    for attempt in range(1, MAX_ATTEMPTS + 1):
        info = service.query_voice(voice_id=voice_id)
        status = (info or {}).get("status")
        print(f"[Poll {attempt}/{MAX_ATTEMPTS}] status = {status}", file=sys.stderr)
        if status == "OK":
            print("[Poll] Voice is ready.", file=sys.stderr)
            return voice_id
        if status == "UNDEPLOYED":
            raise RuntimeError("Voice processing failed: UNDEPLOYED")
        time.sleep(POLL_INTERVAL)
    raise RuntimeError("Polling timed out: voice not ready")

def synthesize_to_file(voice_id: str, text: str, out_file: str = "my_custom_voice_output.mp3"):
    """
    Standard SDK implementation with retry logic and SSL workaround.
    """
    last_error = None
    
    for attempt in range(3):
        try:
            print(f"[Synthesize] Attempt {attempt + 1}/3 (SDK)...", file=sys.stderr)
            
            # Re-instantiate locally to ensure fresh connection/state
            synthesizer = SpeechSynthesizer(model=TARGET_MODEL, voice=voice_id)
            audio_bytes = synthesizer.call(text)
            
            print(f"[Synthesize] Request ID: {synthesizer.get_last_request_id()}", file=sys.stderr)
            with open(out_file, "wb") as f:
                f.write(audio_bytes)
            print(f"[Synthesize] Saved: {out_file}", file=sys.stderr)
            return out_file

        except Exception as e:
            last_error = e
            print(f"[Synthesize] Error on attempt {attempt + 1}: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            time.sleep(5) 

    raise RuntimeError(f"Synthesize failed after 3 attempts. Last error: {last_error}")

def main():
    if len(sys.argv) < 3:
        print("Usage: voice-clone.py <audio_input> <text> [output_file]", file=sys.stderr)
        sys.exit(1)
    
    audio_input = sys.argv[1]
    text = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else "my_custom_voice_output.mp3"
    
    # 解析模型参数
    global TARGET_MODEL
    for arg in sys.argv:
        if arg.startswith("--model="):
            TARGET_MODEL = arg.split("=")[1]
            print(f"[Config] Using custom model: {TARGET_MODEL}", file=sys.stderr)
    
    try:
        # 1) 本地→COS→URL 或直接使用URL
        audio_url = ensure_url(audio_input)
        print(f"[Upload/URL] Using audio URL: {audio_url}", file=sys.stderr)
        
        import traceback
        
        # 2) 创建音色并等待就绪
        voice_id = create_voice_and_wait(audio_url)
        
        # HACK: Give it a moment to propagate on DashScope's backend
        print(f"[CoolDown] Voice ready, waiting 5s for backend sync...", file=sys.stderr)
        time.sleep(5)
        
        # 3) 合成并保存
        output_path = synthesize_to_file(voice_id, text, output_file)
        
        # 返回结果
        result = {
            "status": "success",
            "output_file": output_path,
            "voice_id": voice_id
        }
        print(json.dumps(result))
        
    except Exception as e:
        result = {
            "status": "error",
            "message": str(e)
        }
        print(json.dumps(result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()