import { NextResponse } from "next/server";
import knowledgeBase from "@/data/knowledge-base.json";

export const runtime = "nodejs";

type Entry = { category: string; question: string; answer: string };
const entries = knowledgeBase as Entry[];

function normalize(value: string) {
  return value.toLocaleLowerCase("fr")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ").trim();
}

const stopWords = new Set(["quel","quelle","quels","quelles","est","sont","que","quoi","comment","pourquoi","dans","avec","pour","des","les","une","un","du","de","la","le","et","ou","on","peut","faire","fait","cela","ce","cette","son","sa","ses","qui","quoi","sur","par","aux","au","d"]);
function tokens(value: string) {
  return normalize(value).split(" ").filter(word => word.length > 2 && !stopWords.has(word));
}

function findBest(question: string) {
  const normalized = normalize(question);
  const queryTokens = new Set(tokens(question));
  let best: Entry | null = null;
  let bestScore = 0;
  for (const entry of entries) {
    const candidate = normalize(entry.question);
    if (candidate === normalized) return { entry, score: 1 };
    const candidateTokens = new Set(tokens(entry.question));
    let overlap = 0;
    for (const token of queryTokens) if (candidateTokens.has(token)) overlap++;
    const precision = overlap / Math.max(queryTokens.size, 1);
    const recall = overlap / Math.max(candidateTokens.size, 1);
    const dice = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    const phraseBonus = candidate.includes(normalized) || normalized.includes(candidate) ? 0.35 : 0;
    const score = Math.min(1, dice + phraseBonus);
    if (score > bestScore) { best = entry; bestScore = score; }
  }
  return { entry: best, score: bestScore };
}

export async function POST(request: Request) {
  let body: { question?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }); }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 700) {
    return NextResponse.json({ error: "La question doit contenir entre 1 et 700 caractères." }, { status: 400 });
  }

  const match = findBest(question);
  if (!match.entry || match.score < 0.22) {
    return NextResponse.json({
      answer: "Je ne trouve pas encore de réponse suffisamment proche dans ma base de connaissances locale. Cette version fonctionne sans recherche Internet ni service OpenAI. Essayez de reformuler votre question ou choisissez un sujet parmi les 7 domaines disponibles : analyses biomédicales, maladies, symptômes, prévention, nutrition, hygiène et médicaments.",
      sources: [],
      matched: false,
    });
  }

  return NextResponse.json({
    answer: match.entry.answer,
    category: match.entry.category,
    matchedQuestion: match.entry.question,
    sources: [],
    matched: true,
  });
}
