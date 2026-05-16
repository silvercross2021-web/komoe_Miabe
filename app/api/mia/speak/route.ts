import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_VOICE = "fr-FR-VivienneMultilingualNeural";
const FALLBACK_VOICE = "fr-FR-DeniseNeural";

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#/g, "")
    .replace(/`/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\(ID \d+\)/gi, "")
    .replace(/FCFA/gi, "francs CFA")
    .replace(/\s+/g, " ")
    .trim();
}

async function synthesize(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(text);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { tts.close(); } catch {}
      resolve(Buffer.concat(chunks));
    };
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", finish);
    audioStream.on("close", finish);
    audioStream.on("error", (err) => {
      if (done) return;
      done = true;
      try { tts.close(); } catch {}
      reject(err);
    });
    setTimeout(() => {
      if (!done) {
        done = true;
        try { tts.close(); } catch {}
        if (chunks.length > 0) resolve(Buffer.concat(chunks));
        else reject(new Error("TTS timeout (20s)"));
      }
    }, 20000);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = (body?.text as string) || "";
    const requestedVoice = (body?.voice as string) || DEFAULT_VOICE;

    const text = cleanForSpeech(rawText);
    if (!text) {
      return NextResponse.json({ error: "Texte vide" }, { status: 400 });
    }

    let audioBuffer: Buffer;
    try {
      audioBuffer = await synthesize(text, requestedVoice);
    } catch (e: any) {
      console.warn("[MIA speak] Echec voix principale, fallback Denise:", e?.message);
      audioBuffer = await synthesize(text, FALLBACK_VOICE);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return NextResponse.json({ error: "Audio vide" }, { status: 502 });
    }

    return new NextResponse(audioBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[MIA speak] Erreur:", err);
    return NextResponse.json({ error: "TTS_FAILED", detail: err?.message }, { status: 500 });
  }
}
