import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { projetsApi, transactionsApi, communesApi } from "./api";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `
Tu es MIA (Municipal Intelligence Assistant), l'assistante intelligente de la plateforme KOMOE.

RÈGLE ABSOLUE SUR LE FORMATAGE :
- INTERDICTION TOTALE d'utiliser du Markdown.
- Ne mets JAMAIS d'astérisques (**), de dièses (###), de tirets de liste (*) ou tout autre symbole de formatage.
- Utilise uniquement du TEXTE BRUT.
- Pour structurer tes réponses, utilise des sauts de ligne clairs et une ponctuation classique (1., 2., 3. pour les listes).

CONSIGNES DE SÉCURITÉ ET ACCÈS :
1. RESPECT DES RÔLES : 
   - CITOYEN : Il ne peut voir que SES propres informations et les données publiques de sa commune. INTERDICTION de donner des infos privées sur d'autres utilisateurs.
   - DGDDL / MAIRE : Accès complet aux outils d'investigation.
2. IDENTIFIANTS TECHNIQUES : Ne mentionne JAMAIS d'identifiants techniques (ex: "ID 1064"). Utilise les noms réels.
3. TON : Professionnel, chaleureux et français impeccable.
`;

export async function chatWithMia(message: string, context: { 
  userName?: string; 
  role?: string; 
  commune?: string | number;
  currentPath?: string;
}) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      tools: [
        {
          functionDeclarations: [
            {
              name: "get_commune_projects",
              description: "Récupère la liste des projets pour une commune spécifique.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  communeId: { type: SchemaType.NUMBER, description: "L'ID de la commune" }
                },
                required: ["communeId"]
              }
            },
            {
              name: "get_commune_transactions",
              description: "Récupère les dernières transactions (dépenses/recettes) d'une commune.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  communeId: { type: SchemaType.NUMBER, description: "L'ID de la commune" },
                  limit: { type: SchemaType.NUMBER, description: "Nombre de transactions" }
                },
                required: ["communeId"]
              }
            },
            {
              name: "get_commune_details",
              description: "Récupère les informations générales d'une commune.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  communeId: { type: SchemaType.NUMBER, description: "L'ID de la commune" }
                },
                required: ["communeId"]
              }
            }
          ]
        }
      ],
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const chat = model.startChat();

    const contextHeader = [
      context.userName ? `Utilisateur : ${context.userName}` : null,
      context.role ? `Rôle : ${context.role}` : null,
      context.commune ? `Commune ID : ${context.commune}` : null,
      context.currentPath ? `Page actuelle : ${context.currentPath}` : null,
    ].filter(Boolean).join(" | ");

    const fullMessage = contextHeader ? `[${contextHeader}]\n${message}` : message;

    // Timeout de 15 secondes
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 15000)
    );

    let result: any = await Promise.race([
      chat.sendMessage(fullMessage),
      timeoutPromise
    ]);

    let response = result.response;
    let functionCalls = response.functionCalls();

    while (functionCalls && functionCalls.length > 0) {
      console.log("[MIA DEBUG] L'IA demande des outils:", functionCalls);
      
      const toolResults = await Promise.all(functionCalls.map(async (call: any) => {
        const { name, args } = call;
        console.log(`[MIA DEBUG] Appel de l'outil : ${name}`, args);
        
        let data;
        try {
          if (name === "get_commune_projects") {
            data = await projetsApi.list({ commune: (args as any).communeId });
          } else if (name === "get_commune_transactions") {
            data = await transactionsApi.list({ commune: (args as any).communeId, limit: (args as any).limit || 10 });
          } else if (name === "get_commune_details") {
            data = (await communesApi.detail((args as any).communeId)) || {};
          }
          console.log(`[MIA DEBUG] Données récupérées pour ${name}:`, data);
          return { functionResponse: { name, response: data } };
        } catch (e) {
          console.error(`[MIA DEBUG] Erreur lors de l'appel de l'outil ${name}:`, e);
          return { functionResponse: { name, response: { error: "Données non accessibles pour le moment." } } };
        }
      }));

      result = await Promise.race([
        chat.sendMessage(toolResults as any),
        timeoutPromise
      ]);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    const finalResponse = response.text();
    console.log("[MIA DEBUG] Réponse finale envoyée au bot:", finalResponse);
    return finalResponse;
  } catch (error: any) {
    console.warn("[MIA DEBUG] Erreur Gemini (gérée):", (error as any)?.message || error);
    if (error.message === "Timeout") {
      return "ERREUR_TIMEOUT: Je mets un peu trop de temps à réfléchir. Pouvez-vous reformuler ou vérifier votre connexion ?";
    }
    const msg = error?.message || "";
    if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit")) {
      const retryMatch = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
      const retrySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;
      const retryInfo = retrySec ? ` Réessayez dans environ ${retrySec} secondes.` : " Réessayez dans quelques minutes.";
      return `ERREUR_QUOTA: Le quota journalier de l'API Gemini est atteint (20 requêtes/jour sur l'offre gratuite). Mia ne peut plus répondre aujourd'hui.${retryInfo} Pour débloquer, mettez à jour votre abonnement sur ai.google.dev.`;
    }
    return "ERREUR_RESEAU: Je n'arrive pas à accéder à mon cerveau IA. Vérifiez votre connexion internet ou réessayez dans un instant.";
  }
}
