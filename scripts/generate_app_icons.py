#!/usr/bin/env python3
import os
import sys
import subprocess
from PIL import Image

def generate_icons(source_png_path, project_root):
    build_dir = os.path.join(project_root, "build")
    os.makedirs(build_dir, exist_ok=True)
    
    # 1. Load source image
    im = Image.open(source_png_path).convert("RGBA")
    if im.size != (1024, 1024):
        im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    # Save standard build/icon.png
    master_png = os.path.join(build_dir, "icon.png")
    im.save(master_png, "PNG")
    print(f"[Icon] Saved master PNG: {master_png}")
    
    # 2. Generate Windows icon.ico (multi-resolution)
    ico_path = os.path.join(build_dir, "icon.ico")
    im.save(
        ico_path,
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    )
    print(f"[Icon] Saved Windows ICO: {ico_path}")
    
    # Also save to src/renderer/favicon.ico and favicon.png
    renderer_dir = os.path.join(project_root, "src", "renderer")
    im.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(renderer_dir, "favicon.ico"), format="ICO")
    im.resize((128, 128), Image.Resampling.LANCZOS).save(os.path.join(renderer_dir, "favicon.png"), format="PNG")
    print(f"[Icon] Updated web renderer favicons")
    
    # 3. Generate macOS icon.icns via iconutil
    iconset_dir = os.path.join(build_dir, "icon.iconset")
    os.makedirs(iconset_dir, exist_ok=True)
    
    specs = [
        ("icon_16x16.png", 16),
        ("icon_16x16@2x.png", 32),
        ("icon_32x32.png", 32),
        ("icon_32x32@2x.png", 64),
        ("icon_128x128.png", 128),
        ("icon_128x128@2x.png", 256),
        ("icon_256x256.png", 256),
        ("icon_256x256@2x.png", 512),
        ("icon_512x512.png", 512),
        ("icon_512x512@2x.png", 1024),
    ]
    
    for filename, size in specs:
        resized = im.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(iconset_dir, filename), "PNG")
        
    icns_path = os.path.join(build_dir, "icon.icns")
    res = subprocess.run(["iconutil", "-c", "icns", iconset_dir, "-o", icns_path], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[Icon] Successfully generated macOS ICNS: {icns_path}")
        # Clean up iconset temp directory
        subprocess.run(["rm", "-rf", iconset_dir])
    else:
        print(f"[Icon Warning] iconutil failed: {res.stderr}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 generate_app_icons.py <path_to_1024x1024_png>")
        sys.exit(1)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    generate_icons(sys.argv[1], project_root)
