#!/usr/bin/env python3
"""
Batch-render the 15 spine-day hook talking-head clips with SadTalker 512 + GFPGAN.

Runs on a FREE Google Colab T4 (Runtime > Change runtime type > T4 GPU).
Zero cost, no card. Output: /content/talkingheads/talking-head-<day>.mp4
(plus the hook .mp3 audio used to drive each render, for exact-sync reuse
in the daily pipeline) and a zip at /content/talkingheads.zip for download.

Usage in a Colab cell:
    !git clone --depth 1 https://github.com/dankoff-hub/receipts /content/receipts
    %run /content/receipts/scripts/colab-talkinghead.py
"""
import json
import os
import re
import shutil
import site
import subprocess
import sys
import zipfile
from pathlib import Path

REPO = Path("/content/receipts")
ST = Path("/content/sadtalker")
OUT = Path("/content/talkingheads")
HOST = REPO / "assets" / "host.png"
VOICE = "en-US-BrianMultilingualNeural"
TTS_RATE = "+10%"
TTS_PITCH = "-5Hz"


def sh(cmd: str) -> str:
    print("+", cmd, flush=True)
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.stdout:
        print(r.stdout[-3000:], flush=True)
    if r.returncode != 0:
        print(r.stderr[-3000:], flush=True)
        raise SystemExit(f"FAILED ({r.returncode}): {cmd}")


def load_hooks() -> dict:
    md = (REPO / "content" / "daily-run-scripts.md").read_text()
    days = re.findall(r"## (\d+)\. .+?\n- Hook: (.+?)\n", md)
    return {int(d): h.strip() for d, h in days}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    # 1. SadTalker + deps (torch with CUDA is preinstalled on Colab).
    #    SadTalker's requirements.txt pins numpy 1.23/scipy 1.10 — no wheels on
    #    Colab's Python 3.13 image. Install a numpy-2-compatible set instead;
    #    SadTalker's inference path itself is numpy-2 safe (see patch below).
    if not ST.exists():
        sh(f"git clone --depth 1 https://github.com/OpenTalker/SadTalker {ST}")
    os.chdir(ST)
    sh("pip install -q edge-tts")
    sh(
        "pip install -q face_alignment==1.3.5 imageio imageio-ffmpeg 'librosa>=0.11' "
        "resampy==0.4.2 pydub 'scipy>=1.14' 'kornia>=0.7.7' tqdm yacs pyyaml joblib "
        "'scikit-image>=0.25' facexlib==0.3.0 av safetensors addict future lmdb requests yapf"
    )
    # basicsr 1.4.2's sdist cannot build on Python 3.13 (exec-into-locals
    # version lookup + removed torchvision.transforms.functional_tensor).
    # Patch the sdist and install from source; gfpgan dep-free.
    sh(
        "cd /tmp && rm -rf bs-src && mkdir bs-src && cd bs-src && "
        "python -c \"import json,urllib.request; d=json.load(urllib.request."
        "urlopen('https://pypi.org/pypi/basicsr/1.4.2/json')); "
        "print([u['url'] for u in d['urls'] if u['packagetype']=='sdist'][0])\" "
        "> url.txt && curl -sL $(cat url.txt) -o bs.tar.gz && tar xf bs.tar.gz && "
        "cd basicsr-1.4.2 && "
        "sed -i \"s/return locals()\\\\['__version__'\\\\]/return '1.4.2'/\" setup.py && "
        "grep -q \"return '1.4.2'\" setup.py && "
        "grep -rl functional_tensor basicsr/ | xargs -r sed -i "
        "'s/torchvision.transforms.functional_tensor/torchvision.transforms.functional/' && "
        "pip install -q --no-deps --no-build-isolation ."
    )
    sh("pip install -q --no-deps gfpgan")
    # numpy>=1.24: one-element arrays must be normalized before np.array(...)
    # (same fix the maintained HF Spaces carry).
    pp = ST / "src" / "face3d" / "util" / "preprocess.py"
    src = pp.read_text()
    legacy = "trans_params = np.array([w0, h0, s, t[0], t[1]])"
    fixed = (
        "trans_params = np.array([w0, h0, float(np.asarray(s).reshape(-1)[0]), "
        "float(np.asarray(t[0]).reshape(-1)[0]), float(np.asarray(t[1]).reshape(-1)[0])])"
    )
    if legacy in src:
        src = src.replace(legacy, fixed)
    # numpy 2 removed np.VisibleDeprecationWarning
    if "np.VisibleDeprecationWarning" in src:
        src = src.replace("np.VisibleDeprecationWarning", "DeprecationWarning")
    if src != pp.read_text():
        pp.write_text(src)
        print("patched preprocess.py for numpy>=1.24 / numpy 2")
    # download_models.sh isn't idempotent (mkdir fails on rerun) — tolerate and verify
    subprocess.run("bash scripts/download_models.sh", shell=True, capture_output=True)
    need = ST / "checkpoints" / "SadTalker_V0.0.2_512.safetensors"
    if not need.exists() or need.stat().st_size < 1_000_000:
        raise SystemExit("SadTalker 512 checkpoint missing after download_models.sh")

    # 2. Compat shims (2026 Colab images)
    # basicsr 1.4.2 imports torchvision.transforms.functional_tensor (removed)
    sp = Path(site.getsitepackages()[0])
    ft = sp / "torchvision" / "transforms" / "functional_tensor.py"
    if not ft.exists():
        ft.write_text("from torchvision.transforms.functional import *\n")
        print("wrote functional_tensor shim:", ft)
    # torch>=2.6 defaults weights_only=True; SadTalker's legacy checkpoints need False.
    (ST / "_run.py").write_text(
        "import runpy, sys, torch\n"
        "_orig = torch.load\n"
        "def _load(*a, **k):\n"
        "    k.setdefault('weights_only', False)\n"
        "    return _orig(*a, **k)\n"
        "torch.load = _load\n"
        "sys.argv = ['inference.py'] + sys.argv[1:]\n"
        "runpy.run_path('inference.py', run_name='__main__')\n"
    )

    # 3. Hook audio via edge-tts (same voice params as scripts/render-v2.py)
    hooks = load_hooks()
    for day, hook in sorted(hooks.items()):
        mp3 = OUT / f"hook-{day:02d}.mp3"
        if not mp3.exists():
            sh(
                f'edge-tts --voice {VOICE} --rate={TTS_RATE} --pitch={TTS_PITCH} '
                f'--text {json.dumps(hook)} --write-media {mp3}'
            )
        print(f"day {day}: {mp3.name} {(mp3.stat().st_size/1024):.0f} KB")

    # 4. Render each hook: 512 model + GFPGAN enhancer (the config the CPU
    #    pipeline could not run: full head motion + blinks + restored face)
    for day, hook in sorted(hooks.items()):
        final = OUT / f"talking-head-{day:02d}.mp4"
        if final.exists() and final.stat().st_size > 100_000:
            print(f"day {day}: already rendered, skip")
            continue
        mp3 = OUT / f"hook-{day:02d}.mp3"
        tmp = Path("/content/st-out")
        if tmp.exists():
            shutil.rmtree(tmp)
        tmp.mkdir()
        sh(
            f"python _run.py --driven_audio {mp3} --source_image {HOST} "
            f"--result_dir {tmp} --preprocess crop --size 512 --enhancer gfpgan"
        )
        made = sorted(tmp.glob("*.mp4"))
        if not made:
            raise SystemExit(f"day {day}: no output video")
        shutil.copy(made[-1], final)
        print(f"day {day}: rendered {final.name} {(final.stat().st_size/1024/1024):.1f} MB")

    # 5. Zip for download
    zpath = Path("/content/talkingheads.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_STORED) as z:
        for p in sorted(OUT.iterdir()):
            z.write(p, p.name)
    print("DONE", zpath, f"{zpath.stat().st_size/1024/1024:.1f} MB")
    print("Next: download talkingheads.zip from the Colab Files sidebar.")


if __name__ == "__main__":
    main()
