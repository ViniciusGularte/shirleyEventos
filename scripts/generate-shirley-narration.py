from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
import wave
from array import array
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
VOXALTO_ROOT = Path("/home/vinicius/Documentos/voxalto-videos")
SOURCE_VOICE = Path("/home/vinicius/Downloads/WhatsApp Ptt 2026-10-04 at 18.41.06.ogg")
CAPTIONS_PATH = PROJECT_ROOT / "video" / "captions-shirley.json"
SCRIPT_PATH = PROJECT_ROOT / "video" / "shirley-script.json"
DURATIONS_PATH = PROJECT_ROOT / "video" / "narration-durations.json"
OUTPUT_PATH = PROJECT_ROOT / "docs" / "manual" / "screenshots" / "shirley-narration.mp3"
REPORT_PATH = PROJECT_ROOT / "docs" / "video" / "narration-report.json"
WORK_DIR = Path("/tmp/eventos-shirley-chatterbox")
SAMPLE_RATE = 48_000

sys.path.insert(0, str(VOXALTO_ROOT))

from core.models.voice import ChatterboxVoiceEngine, SynthesisRequest, automatic_device  # noqa: E402
from core.voice_reference import analyze_voice_reference  # noqa: E402


def run(*arguments: str) -> None:
    subprocess.run(arguments, check=True)


def duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def create_reference(output: Path) -> dict[str, float]:
    run(
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-ss",
        "28",
        "-i",
        str(SOURCE_VOICE),
        "-t",
        "8",
        "-af",
        "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000",
        "-ac",
        "1",
        "-ar",
        str(SAMPLE_RATE),
        "-c:a",
        "pcm_s16le",
        str(output),
    )
    quality = analyze_voice_reference(output)
    if quality.snr_db < 6 or quality.speaker_consistency < 0.78:
        raise RuntimeError(
            f"Referência reprovada: SNR={quality.snr_db:.2f}, "
            f"consistência={quality.speaker_consistency:.3f}"
        )
    return {
        "snr_db": round(quality.snr_db, 3),
        "speaker_consistency": round(quality.speaker_consistency, 3),
    }


def generate() -> None:
    script = json.loads(SCRIPT_PATH.read_text(encoding="utf-8"))
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    reference = WORK_DIR / "reference.wav"
    reference_quality = create_reference(reference)
    engine = ChatterboxVoiceEngine()
    device = automatic_device()
    chunks: list[dict[str, object]] = []

    for index, caption in enumerate(script):
        raw = WORK_DIR / f"raw-{index:02d}.wav"
        engine.synthesize(
            SynthesisRequest(
                text=caption["text"],
                voice_id="shirley-tutorial",
                reference=reference,
                seed=81723 + index * 101,
                exaggeration=0.42,
                cfg_weight=0.5,
                device=device,
            ),
            raw,
        )
        generated_duration = duration(raw)
        chunks.append(
            {
                "index": index,
                "text": caption["text"],
                "duration_seconds": round(generated_duration, 3),
                "file": str(raw),
            }
        )
        print(f"[{index + 1:02d}/{len(script)}] {generated_duration:.2f}s", flush=True)

    payload = {
        "engine": "Chatterbox Multilingual PT-BR",
        "device": device,
        "source": str(SOURCE_VOICE),
        "reference": reference_quality,
        "chunks": chunks,
    }
    DURATIONS_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Durações salvas em {DURATIONS_PATH}", flush=True)


def read_pcm(path: Path) -> array[int]:
    with wave.open(str(path), "rb") as source:
        if source.getnchannels() != 1 or source.getsampwidth() != 2:
            raise RuntimeError(f"Formato PCM inesperado em {path}")
        return array("h", source.readframes(source.getnframes()))


def assemble() -> None:
    captions = json.loads(CAPTIONS_PATH.read_text(encoding="utf-8"))
    payload = json.loads(DURATIONS_PATH.read_text(encoding="utf-8"))
    chunks = payload["chunks"]
    if len(captions) != len(chunks):
        raise RuntimeError("A quantidade de captions mudou depois da geração da voz")

    total_seconds = math.ceil(max(item["endMs"] for item in captions) / 1000)
    output_samples = array("h", [0]) * (total_seconds * SAMPLE_RATE)
    report_chunks: list[dict[str, object]] = []

    for index, (caption, chunk) in enumerate(zip(captions, chunks, strict=True)):
        if caption["text"] != chunk["text"]:
            raise RuntimeError(f"O texto da caption {index} mudou depois da geração da voz")
        raw = Path(chunk["file"])
        if not raw.exists():
            raise FileNotFoundError(f"Chunk ausente: {raw}. Rode o modo generate novamente.")
        converted = WORK_DIR / f"pcm-{index:02d}.wav"
        run(
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(raw),
            "-af",
            f"aresample={SAMPLE_RATE}",
            "-ac",
            "1",
            "-ar",
            str(SAMPLE_RATE),
            "-c:a",
            "pcm_s16le",
            str(converted),
        )
        generated_duration = duration(converted)
        slot_seconds = (caption["endMs"] - caption["startMs"]) / 1000
        if generated_duration > slot_seconds + 0.02:
            raise RuntimeError(
                f"A voz do trecho {index} tem {generated_duration:.2f}s, "
                f"mas a janela possui {slot_seconds:.2f}s"
            )
        samples = read_pcm(converted)
        start_sample = round(caption["startMs"] / 1000 * SAMPLE_RATE)
        max_samples = max(0, len(output_samples) - start_sample)
        for offset, value in enumerate(samples[:max_samples]):
            mixed = output_samples[start_sample + offset] + value
            output_samples[start_sample + offset] = max(-32768, min(32767, mixed))
        report_chunks.append(
            {
                "index": index,
                "start_ms": caption["startMs"],
                "slot_seconds": round(slot_seconds, 3),
                "voice_seconds": round(generated_duration, 3),
                "text": caption["text"],
            }
        )

    assembled = WORK_DIR / "assembled.wav"
    with wave.open(str(assembled), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(SAMPLE_RATE)
        target.writeframes(output_samples.tobytes())

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    run(
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-i",
        str(assembled),
        "-af",
        "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        str(OUTPUT_PATH),
    )
    report = {
        **{key: value for key, value in payload.items() if key != "chunks"},
        "output": str(OUTPUT_PATH),
        "duration_seconds": round(duration(OUTPUT_PATH), 3),
        "chunks": report_chunks,
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Narração gerada em {OUTPUT_PATH}", flush=True)
    print(f"Relatório salvo em {REPORT_PATH}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("generate", "assemble"))
    args = parser.parse_args()
    if args.mode == "generate":
        generate()
    else:
        assemble()


if __name__ == "__main__":
    main()
