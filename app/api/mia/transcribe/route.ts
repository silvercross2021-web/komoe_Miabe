import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export async function POST(req: NextRequest) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: "GROQ_API_KEY non configuree" }, { status: 503 });
    }

    const contentType = req.headers.get("content-type") || "audio/webm";
    const audioBuffer = await req.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return NextResponse.json({ error: "Fichier audio manquant" }, { status: 400 });
    }

    if (audioBuffer.byteLength < 1024) {
      return NextResponse.json({ text: "", warning: "Audio trop court" });
    }

    const extension = contentType.includes("mp4") ? "mp4"
      : contentType.includes("ogg") ? "ogg"
      : contentType.includes("wav") ? "wav"
      : "webm";

    const audioBlob = new Blob([audioBuffer], { type: contentType });
    const groqForm = new FormData();
    groqForm.append("file", audioBlob, `audio.${extension}`);
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("language", "fr");
    groqForm.append("response_format", "json");
    groqForm.append("temperature", "0");

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: groqForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[MIA transcribe] Groq error", res.status, errText.slice(0, 300));
      if (res.status === 429) {
        return NextResponse.json(
          { error: "QUOTA", text: "Limite STT atteinte. Reessayez dans une minute." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "STT_FAILED", detail: errText.slice(0, 200) }, { status: 502 });
    }

    const data = await res.json();
    const text = (data.text || "").trim();

    if (!text) {
      return NextResponse.json({ text: "", warning: "Audio non detecte" });
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[MIA transcribe] Erreur:", err);
    return NextResponse.json({ error: "INTERNAL", detail: err?.message }, { status: 500 });
  }
}
