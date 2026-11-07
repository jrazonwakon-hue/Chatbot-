"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ArrowUp, BookOpen, HeartPulse, Info, Menu, MessageCircle, RotateCcw, ShieldCheck, Sparkles, Stethoscope, Trash2, X } from "lucide-react";

type Message = { id: string; role: "assistant" | "user"; content: string; time: string; sources?: { title: string; url: string }[] };
type Preferences = { concise: boolean; displayName: string };

const starterPrompts = [
  { icon: HeartPulse, label: "Hématologie", prompt: "À quoi sert une numération formule sanguine (NFS) ?" },
  { icon: ShieldCheck, label: "Biochimie", prompt: "Comment interpréter la créatinine et le DFG ?" },
  { icon: BookOpen, label: "Microbiologie", prompt: "Quelle est la différence entre une culture et un antibiogramme ?" },
  { icon: Stethoscope, label: "Immunologie", prompt: "Quelle différence entre antigène et anticorps en sérologie ?" },
];

const initial: Message = { id: "welcome", role: "assistant", time: "Maintenant", content: "Bonjour ! 👋 Je suis SANTÉ+, votre assistant documentaire en analyses biomédicales. Posez vos questions sur les examens de laboratoire, les prélèvements, les méthodes et les résultats biologiques (sans données personnelles)." };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([initial]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>({ concise: false, displayName: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("santeplus-preferences");
      const history = localStorage.getItem("santeplus-history");
      if (saved) setPrefs(JSON.parse(saved));
      if (history) {
        const parsed = JSON.parse(history) as Message[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch { /* Ignore malformed local preferences. */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("santeplus-preferences", JSON.stringify(prefs));
    localStorage.setItem("santeplus-history", JSON.stringify(messages.slice(-40)));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, prefs, mounted]);

  const greeting = prefs.displayName.trim() ? `Bonjour ${prefs.displayName.trim()} !` : "Bonjour !";
  async function send(text = input) {
    const value = text.trim();
    if (!value || loading) return;
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: value, time: now };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const result = await fetch("/api/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: value }) });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.error || "La recherche n'a pas pu aboutir.");
      const answer = typeof payload.answer === "string" ? payload.answer : "Aucune réponse exploitable n'a été reçue.";
      const response: Message = { id: crypto.randomUUID(), role: "assistant", content: prefs.concise ? answer.split(/(?<=[.!?])\\s+/).slice(0, 2).join(" ") : answer, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), sources: Array.isArray(payload.sources) ? payload.sources : [] };
      setMessages(prev => [...prev, response]);
    } catch (error) {
      const response: Message = { id: crypto.randomUUID(), role: "assistant", content: error instanceof Error ? error.message : "Une erreur est survenue pendant la recherche. Réessayez.", time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
      setMessages(prev => [...prev, response]);
    } finally { setLoading(false); }
  }
  function reset() {
    setMessages([{ ...initial, content: `${greeting} Je suis SANTÉ+, votre assistant en analyses biomédicales. Quelle analyse souhaitez-vous comprendre ?` }]);
    localStorage.removeItem("santeplus-history");
    setMenuOpen(false);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="SANTÉ+ accueil">
          <span className="brand-mark"><Activity size={23} strokeWidth={2.5}/></span>
          <span><strong>SANTÉ<span>+</span></strong><small>ANALYSES BIOMÉDICALES</small></span>
        </a>
        <button className="new-chat" onClick={reset}><span>＋</span> Nouvelle conversation</button>
        <div className="side-label">VOTRE ESPACE</div>
        <button className="side-link active" onClick={reset}><MessageCircle size={17}/> Base de connaissances</button>
        <button className="side-link" onClick={() => setShowAbout(true)}><Info size={17}/> À propos de SANTÉ+</button>
        <div className="sidebar-bottom">
          <div className="privacy-card"><ShieldCheck size={19}/><div><strong>Votre confidentialité</strong><p>Votre historique et la base de réponses sont utilisés localement par cette application. Aucune clé OpenAI ni recherche externe ne sont nécessaires.</p></div></div>
          <div className="profile"><div className="avatar">S+</div><div><strong>{prefs.displayName || "Visiteur"}</strong><small>Session locale</small></div><button aria-label="Ouvrir les préférences" onClick={() => setMenuOpen(!menuOpen)}><Menu size={18}/></button></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Activity size={19}/></span><strong>SANTÉ<span>+</span></strong></div>
          <div className="top-context"><span className="status-dot"/> Assistant en analyses biomédicales <span className="top-divider">/</span> <span className="muted">Français</span></div>
          <div className="top-actions">
            <span className="safe-label"><ShieldCheck size={15}/> Base locale</span>
            <button className="icon-button" title="Nouvelle conversation" onClick={reset}><RotateCcw size={17}/></button>
            <button className="icon-button" title="À propos" onClick={() => setShowAbout(true)}><Info size={17}/></button>
          </div>
        </header>

        <div className="chat-area">
          <div className="chat-inner">
            <div className="intro">
              <div className="eyebrow"><Sparkles size={14}/> VOTRE ASSISTANT DE CONNAISSANCES EN SANTÉ</div>
              <h1>Votre santé mérite<br/><span>des réponses claires.</span></h1>
              <p>140 réponses pédagogiques intégrées, sans abonnement API ni connexion à un service externe.</p>
            </div>

            {messages.length === 1 && (
              <div className="suggestions">
                <div className="section-caption">POUR COMMENCER</div>
                <div className="suggestion-grid">
                  {starterPrompts.map(({icon: Icon, label, prompt}) => <button className="suggestion" key={label} onClick={() => send(prompt)}><span className="suggestion-icon"><Icon size={19}/></span><span><strong>{label}</strong><small>{prompt}</small></span><span className="suggestion-arrow">↗</span></button>)}
                </div>
              </div>
            )}

            <div className="messages">
              {messages.map((m) => <article className={`message-row ${m.role}`} key={m.id}>
                {m.role === "assistant" ? <div className="message-avatar"><Activity size={17}/></div> : <div className="user-avatar">V</div>}
                <div className="message-content"><div className="message-meta"><strong>{m.role === "assistant" ? "SANTÉ+" : "Vous"}</strong><time>{m.time}</time></div><div className="bubble">{m.content}</div>{m.sources?.length ? <div className="message-sources"><strong>Sources consultées</strong>{m.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</div> : null}</div>
              </article>)}
              {loading && <article className="message-row assistant"><div className="message-avatar"><Activity size={17}/></div><div className="message-content"><div className="message-meta"><strong>SANTÉ+</strong><time>Recherche en cours</time></div><div className="bubble">Recherche dans la base de connaissances de SANTÉ+…</div></div></article>}
              <div ref={bottomRef}/>
            </div>

            <div className="composer-wrap">
              <form className="composer" onSubmit={e => { e.preventDefault(); send(); }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Posez votre question sur une analyse biomédicale..." rows={1} aria-label="Votre question"/>
                <button className="send-button" type="submit" disabled={!input.trim() || loading} aria-label="Envoyer"><ArrowUp size={19}/></button>
              </form>
              <div className="composer-foot"><span><ShieldCheck size={13}/> Évitez de partager des informations personnelles ou médicales identifiantes.</span><span>Réponses issues de la base de connaissances intégrée</span></div>
            </div>
          </div>
        </div>
        <footer className="footer"><span>© 2026 SANTÉ+ · Base de connaissances santé</span><button onClick={() => setShowAbout(true)}>Limites et sécurité</button></footer>
      </section>

      {menuOpen && <div className="modal-backdrop" onClick={() => setMenuOpen(false)}><section className="settings-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">PERSONNALISATION</span><h2>Vos préférences</h2></div><button className="icon-button" onClick={() => setMenuOpen(false)}><X size={18}/></button></div><label className="field-label">Comment souhaitez-vous être appelé ?<input value={prefs.displayName} onChange={e => setPrefs(p => ({...p, displayName:e.target.value.slice(0,40)}))} placeholder="Votre prénom (facultatif)"/></label><label className="toggle-row"><span><strong>Réponses plus courtes</strong><small>Privilégier les explications concises.</small></span><input type="checkbox" checked={prefs.concise} onChange={e => setPrefs(p => ({...p, concise:e.target.checked}))}/></label><button className="danger-button" onClick={reset}><Trash2 size={16}/> Effacer la conversation</button><p className="modal-note">Les préférences et l&apos;historique de démonstration sont enregistrés uniquement dans le stockage local de ce navigateur.</p></section></div>}

      {showAbout && <div className="modal-backdrop" onClick={() => setShowAbout(false)}><section className="settings-modal about-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">À PROPOS</span><h2>Un assistant, pas un médecin.</h2></div><button className="icon-button" onClick={() => setShowAbout(false)}><X size={18}/></button></div><div className="about-icon"><HeartPulse size={25}/></div><p>SANTÉ+ fournit des informations pédagogiques issues d’une base de connaissances intégrée sur les analyses biomédicales, les maladies, les symptômes, la prévention, la nutrition, l’hygiène et les médicaments. Il ne remplace pas un professionnel de santé, ne pose pas de diagnostic et ne prescrit aucun traitement.</p><div className="notice"><ShieldCheck size={18}/><span>En cas de symptômes graves ou d&apos;urgence, contactez immédiatement les services d&apos;urgence de votre pays.</span></div><h3>À garder en tête</h3><ul><li>Les réponses peuvent être incomplètes ou erronées.</li><li>Les informations générales ne tiennent pas compte de votre dossier médical.</li><li>Ne partagez pas de données personnelles sensibles.</li><li>Demandez conseil à un professionnel qualifié pour toute décision médicale.</li></ul><p className="modal-note">Base locale de 140 questions-réponses · Sans recherche Internet ni OpenAI · Aucun diagnostic médical.</p></section></div>}
    </main>
  );
}