import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const SYSTEM_INSTRUCTION = `Tu es MIA (Municipal Intelligence Assistant), l'assistante intelligente de la plateforme KOMOE.

REGLE ABSOLUE SUR LE FORMATAGE :
- INTERDICTION TOTALE d'utiliser du Markdown.
- Ne mets JAMAIS d'asterisques (**), de dieses (###), de tirets de liste (*) ou tout autre symbole de formatage.
- Utilise uniquement du TEXTE BRUT.
- Pour structurer tes reponses, utilise des sauts de ligne clairs et une ponctuation classique (1., 2., 3. pour les listes).
- Tes reponses seront lues a voix haute, donc reste concis et naturel.

CONSIGNES DE SECURITE ET ACCES :
1. RESPECT DES ROLES :
   - CITOYEN : Il ne peut voir que SES propres informations et les donnees publiques de sa commune.
   - DGDDL / MAIRE : Acces complet aux outils d'investigation.
2. IDENTIFIANTS TECHNIQUES : Ne mentionne JAMAIS d'identifiants techniques (ex: "ID 1064"). Utilise les noms reels.
3. TON : Professionnel, chaleureux et francais impeccable.`;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_commune_projects",
      description: "Recupere la liste des projets pour une commune specifique.",
      parameters: {
        type: "object",
        properties: {
          communeId: { type: "number", description: "L'ID de la commune" },
        },
        required: ["communeId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_commune_transactions",
      description: "Recupere les dernieres transactions (depenses/recettes) d'une commune.",
      parameters: {
        type: "object",
        properties: {
          communeId: { type: "number", description: "L'ID de la commune" },
          limit: { type: "number", description: "Nombre de transactions (defaut 10)" },
        },
        required: ["communeId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_commune_details",
      description: "Recupere les informations generales d'une commune.",
      parameters: {
        type: "object",
        properties: {
          communeId: { type: "number", description: "L'ID de la commune" },
        },
        required: ["communeId"],
      },
    },
  },
];

async function callBackend(path: string, accessToken: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const res = await fetch(`${BACKEND_URL}${path}`, { headers });
  if (!res.ok) {
    return { error: `Donnees non accessibles (status ${res.status})` };
  }
  return res.json();
}

async function executeTool(name: string, args: any, accessToken: string | null) {
  try {
    if (name === "get_commune_projects") {
      const data = await callBackend(`/api/communes/projets/?commune=${args.communeId}`, accessToken);
      return data;
    }
    if (name === "get_commune_transactions") {
      const limit = args.limit || 10;
      const data = await callBackend(`/api/transactions/?commune=${args.communeId}&limit=${limit}`, accessToken);
      return data;
    }
    if (name === "get_commune_details") {
      const data = await callBackend(`/api/communes/${args.communeId}/`, accessToken);
      return data;
    }
    return { error: `Outil inconnu: ${name}` };
  } catch (e: any) {
    return { error: e?.message || "Erreur lors de l'appel de l'outil" };
  }
}

async function callLLM(messages: any[], useGroqFallback = false): Promise<any> {
  if (useGroqFallback) {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error("GROQ_API_KEY manquante pour fallback");
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        tools: TOOLS,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(`Groq fallback error: ${res.status}`);
    return res.json();
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekKey) throw new Error("DEEPSEEK_API_KEY manquante");

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deepseekKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      messages,
      tools: TOOLS,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${errorText.slice(0, 200)}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context, accessToken } = body as {
      message: string;
      context: { userName?: string; role?: string; commune?: string | number; currentPath?: string };
      accessToken: string | null;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const contextHeader = [
      context?.userName ? `Utilisateur : ${context.userName}` : null,
      context?.role ? `Role : ${context.role}` : null,
      context?.commune ? `Commune ID : ${context.commune}` : null,
      context?.currentPath ? `Page actuelle : ${context.currentPath}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const userMessage = contextHeader ? `[${contextHeader}]\n${message}` : message;

    const messages: any[] = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: userMessage },
    ];

    let useGroqFallback = false;
    let data: any;
    try {
      data = await callLLM(messages, false);
    } catch (e: any) {
      console.warn("[MIA] DeepSeek failed, fallback Groq:", e?.message);
      useGroqFallback = true;
      data = await callLLM(messages, true);
    }

    let assistantMsg = data.choices?.[0]?.message;
    let safety = 0;

    while (assistantMsg?.tool_calls && assistantMsg.tool_calls.length > 0 && safety < 5) {
      safety++;
      messages.push(assistantMsg);

      for (const call of assistantMsg.tool_calls) {
        let args: any = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {}
        const toolResult = await executeTool(call.function.name, args, accessToken);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(toolResult),
        });
      }

      data = await callLLM(messages, useGroqFallback);
      assistantMsg = data.choices?.[0]?.message;
    }

    const finalText = (assistantMsg?.content || "").trim();
    if (!finalText) {
      return NextResponse.json({
        text: "Je n'ai pas pu generer de reponse. Pouvez-vous reformuler ?",
        provider: useGroqFallback ? "groq" : "deepseek",
      });
    }

    return NextResponse.json({
      text: finalText,
      provider: useGroqFallback ? "groq" : "deepseek",
    });
  } catch (err: any) {
    console.error("[MIA chat] Erreur:", err);
    const msg = err?.message || "Erreur inconnue";
    if (msg.toLowerCase().includes("quota") || msg.includes("429")) {
      return NextResponse.json(
        { error: "QUOTA", text: "Le quota IA est temporairement atteint. Reessayez dans quelques minutes." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "INTERNAL", text: "Je n'arrive pas a acceder a mon cerveau IA. Verifiez votre connexion." },
      { status: 500 }
    );
  }
}
