import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_DOMAINS = [
  "pubmed.ncbi.nlm.nih.gov",
  "medlineplus.gov",
  "who.int",
  "cdc.gov",
  "nih.gov",
  "has-sante.fr",
  "ansm.sante.fr",
  "msdmanuals.com",
  "ncbi.nlm.nih.gov",
];

type Source = { title: string; url: string };

// Best-effort per-instance protection against accidental rapid repeat requests.
const requestWindows = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return NextResponse.json({ error: "Origine de requête non autorisée." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Origine de requête invalide." }, { status: 403 });
    }
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (requestWindows.get(forwardedFor) || []).filter(timestamp => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: "Trop de demandes rapprochées. Patientez une minute avant de réessayer." }, { status: 429 });
  }
  recent.push(now);
  requestWindows.set(forwardedFor, recent);
  if (requestWindows.size > 5000) requestWindows.clear();

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8192) {
    return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "La recherche documentaire n'est pas encore configurée. La clé API du service doit être ajoutée par l'administrateur." },
      { status: 503 },
    );
  }

  let body: { question?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 700) {
    return NextResponse.json({ error: "La question doit contenir entre 1 et 700 caractères." }, { status: 400 });
  }

  const instructions = [
    "Tu es SANTÉ+, un assistant pédagogique spécialisé en analyses biomédicales et biologie médicale.",
    "Effectue obligatoirement une recherche Web avant de répondre. Appuie-toi prioritairement sur les sources scientifiques et institutionnelles autorisées.",
    "Réponds en français clair, structuré et compréhensible par des étudiants en analyses biomédicales et le grand public.",
    "Reste strictement dans le domaine des analyses biomédicales, de la biologie médicale, des prélèvements, des méthodes de laboratoire et de l'interprétation pédagogique des examens. Si la question est hors sujet, explique poliment le périmètre de SANTÉ+ et invite à poser une question de biologie médicale.",
    "Pour une analyse, explique si pertinent : définition, principe, type de prélèvement, préparation/pré-analytique, méthode, intérêt, limites et précautions d'interprétation.",
    "Distingue les faits établis, les recommandations et les incertitudes. Ne fabrique jamais de valeurs de référence, de seuils, de recommandations ou de citations.",
    "N'établis aucun diagnostic individuel, ne prescris aucun traitement et n'interprète pas un résultat personnel comme une décision médicale. Oriente vers un biologiste médical ou un professionnel de santé lorsque nécessaire.",
    "Si les sources fiables sont insuffisantes ou contradictoires, dis-le clairement.",
    "Termine par une courte mention pédagogique : les résultats dépendent du laboratoire, de la méthode et du contexte clinique.",
  ].join("\n");

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-astra",
        instructions,
        input: question,
        tools: [{
          type: "web_search",
          search_context_size: "medium",
          filters: { allowed_domains: ALLOWED_DOMAINS },
        }],
        tool_choice: "required",
        include: ["web_search_call.action.sources"],
        max_output_tokens: 1100,
        store: false,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("OpenAI research request failed:", upstream.status, detail.slice(0, 1000));
      return NextResponse.json(
        { error: "La recherche documentaire est momentanément indisponible. Réessayez dans quelques instants." },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    const answer = typeof data.output_text === "string" ? data.output_text.trim() : "";
    const sourceMap = new Map<string, Source>();

    for (const item of data.output ?? []) {
      if (item.type === "web_search_call") {
        for (const source of item.action?.sources ?? []) {
          if (typeof source.url === "string" && /^https:\/\//.test(source.url)) {
            sourceMap.set(source.url, {
              title: typeof source.title === "string" ? source.title : new URL(source.url).hostname,
              url: source.url,
            });
          }
        }
      }
      if (item.type === "message") {
        for (const content of item.content ?? []) {
          for (const annotation of content.annotations ?? []) {
            const citation = annotation.url_citation;
            if (annotation.type === "url_citation" && typeof citation?.url === "string" && /^https:\/\//.test(citation.url)) {
              sourceMap.set(citation.url, {
                title: typeof citation.title === "string" ? citation.title : new URL(citation.url).hostname,
                url: citation.url,
              });
            }
          }
        }
      }
    }

    if (!answer) {
      return NextResponse.json({ error: "Aucune réponse exploitable n'a été produite. Reformulez votre question." }, { status: 502 });
    }

    return NextResponse.json({ answer, sources: Array.from(sourceMap.values()).slice(0, 6) });
  } catch (error) {
    console.error("Biomedical research route error:", error);
    return NextResponse.json(
      { error: "Impossible de joindre le service de recherche. Vérifiez la configuration et réessayez." },
      { status: 502 },
    );
  }
}
