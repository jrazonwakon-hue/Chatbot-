"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowUp, BookOpen, HeartPulse, Info, Menu, MessageCircle, RotateCcw, ShieldCheck, Sparkles, Stethoscope, Trash2, X } from "lucide-react";

type Message = { id: string; role: "assistant" | "user"; content: string; time: string };
type Preferences = { concise: boolean; displayName: string };

const starterPrompts = [
  { icon: HeartPulse, label: "Comprendre une maladie", prompt: "Qu'est-ce que le paludisme ?" },
  { icon: ShieldCheck, label: "Prévention", prompt: "Comment prévenir le choléra ?" },
  { icon: BookOpen, label: "Nutrition", prompt: "Quels aliments composent une alimentation équilibrée ?" },
  { icon: Stethoscope, label: "Quand consulter ?", prompt: "Quand faut-il consulter un professionnel de santé ?" },
];

function answerFor(input: string, prefs: Preferences) {
  const q = input.toLocaleLowerCase("fr");
  const urgent = /(douleur.*poitrine|difficulté.*respir|respire.*pas|perte de connaissance|convulsion|hémorragie|saignement abondant|suicide|intoxication|visage.*paralys|faiblesse.*brutale)/i.test(q);
  if (urgent) return "Ce que vous décrivez peut nécessiter une aide médicale immédiate. Contactez sans attendre les services d'urgence de votre pays ou rendez-vous au service d'urgence le plus proche. Si possible, demandez à une personne de confiance de rester avec vous. Je ne peux pas évaluer une urgence à distance.";
  if (/(bonjour|salut|bonsoir|coucou|hello)/i.test(q)) return "Bonjour et bienvenue sur SANTÉ+ ! Je peux vous aider à comprendre des sujets de santé, de prévention, d'hygiène et de nutrition. Que souhaitez-vous savoir ?";
  if (/(paludisme|malaria)/i.test(q)) return "Le paludisme est une maladie causée par des parasites du genre Plasmodium, transmis à l'être humain par la piqûre de moustiques Anopheles infectés. Les manifestations possibles comprennent la fièvre, les frissons, les maux de tête et une grande fatigue. Une fièvre après un séjour dans une zone où le paludisme circule doit conduire à consulter rapidement : un test est nécessaire pour confirmer la maladie. Les formes graves constituent une urgence.";
  if (/(grippe|influenza|symptôme.*rhume|rhume)/i.test(q)) return "La grippe est une infection respiratoire virale. Elle peut provoquer une fièvre d'apparition rapide, une toux, des courbatures, des maux de tête et une fatigue marquée. Le rhume est généralement plus progressif et souvent moins intense. Consultez un professionnel si les symptômes sont importants, persistent ou s'aggravent, et demandez une aide urgente en cas de difficulté respiratoire.";
  if (/(choléra)/i.test(q)) return "Le choléra est une infection intestinale qui peut provoquer une diarrhée aqueuse très abondante et une déshydratation rapide. La prévention repose notamment sur l'accès à de l'eau potable, le lavage des mains au savon, l'assainissement et la consommation d'aliments bien préparés. En cas de diarrhée aqueuse importante, il faut rechercher rapidement des soins et commencer une solution de réhydratation orale si elle est disponible, selon les conseils sanitaires locaux.";
  if (/((prévenir|prévention|éviter).*(maladie|infection|moustique)|moustique|dengue)/i.test(q)) return "Les mesures de prévention dépendent de la maladie. En général : lavez-vous régulièrement les mains, utilisez une eau sûre, nettoyez et couvrez les récipients d'eau, protégez-vous des piqûres de moustiques avec des moustiquaires et des répulsifs adaptés, et suivez les recommandations vaccinales locales. Dites-moi quelle maladie vous souhaitez prévenir pour des informations plus ciblées.";
  if (/(aliment|nutrition|manger|équilibrée|équilibré|régime)/i.test(q)) return "Une alimentation équilibrée varie selon l'âge, l'activité, la culture et l'état de santé. En règle générale, privilégiez une diversité de légumes et fruits, des légumineuses, des céréales complètes ou peu raffinées, des sources de protéines variées et de l'eau potable. Limitez les boissons très sucrées et les aliments très salés. En cas de maladie ou de besoin particulier, demandez conseil à un professionnel qualifié.";
  if (/(laver.*main|hygiène|savon)/i.test(q)) return "Pour bien vous laver les mains : mouillez-les avec de l'eau propre, appliquez du savon, frottez paumes, dos des mains, entre les doigts, pouces, ongles et poignets pendant environ 20 secondes, rincez puis séchez avec un linge propre ou à l'air. Faites-le notamment avant de préparer ou manger un repas et après les toilettes.";
  if (/(paracétamol|médicament|dose|dosage|antibiotique|ordonnance)/i.test(q)) return "Je peux donner des informations générales, mais je ne peux pas déterminer une dose personnelle ni prescrire un médicament. Le paracétamol est un médicament utilisé notamment contre la douleur et la fièvre. Un surdosage peut être dangereux pour le foie. Respectez la notice et demandez conseil à un pharmacien ou un médecin, en particulier pour un enfant, une grossesse, une maladie du foie ou la prise d'autres médicaments.";
  if (/(consulter|médecin|hôpital|urgence|professionnel)/i.test(q)) return "Demandez un avis médical si un symptôme est nouveau, persistant, s'aggrave ou vous inquiète, ou si vous avez un facteur de risque particulier. En cas de difficulté à respirer, douleur thoracique intense, perte de connaissance, convulsions ou saignement abondant, contactez immédiatement les services d'urgence locaux. Cette liste n'est pas exhaustive.";
  if (/(diagnostic|qu'est-ce que j'ai|quelle maladie|je souffre)/i.test(q)) return "Je ne peux pas établir de diagnostic : plusieurs causes peuvent expliquer un même symptôme et une évaluation clinique peut être nécessaire. Je peux vous expliquer des informations générales, mais le plus sûr est de consulter un professionnel de santé pour une évaluation adaptée.";
  if (/(merci|thanks)/i.test(q)) return "Avec plaisir ! Prenez soin de vous. Vous pouvez me poser une autre question sur la santé ou la prévention.";
  return "Je ne suis pas certain de comprendre votre question. Pouvez-vous la reformuler ou préciser le sujet (maladie, symptômes, prévention, nutrition, hygiène ou médicaments) ? Pour toute situation personnelle préoccupante, demandez conseil à un professionnel de santé.";
}

const initial: Message = { id: "welcome", role: "assistant", time: "Maintenant", content: "Bonjour ! 👋 Je suis SANTÉ+, votre assistant d'information santé. Je peux vous aider à mieux comprendre la prévention, les maladies courantes, l'hygiène et la nutrition. Que souhaitez-vous savoir aujourd'hui ?" };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([initial]);
  const [input, setInput] = useState("");
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

  const greeting = useMemo(() => prefs.displayName.trim() ? `Bonjour ${prefs.displayName.trim()} !` : "Bonjour !");
  function send(text = input) {
    const value = text.trim();
    if (!value) return;
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: value, time: now };
    const response: Message = { id: crypto.randomUUID(), role: "assistant", content: (() => { const answer = answerFor(value, prefs); return prefs.concise ? answer.split(/(?<=[.!?])\\s+/).slice(0, 2).join(" ") : answer; })(), time: now };
    setMessages(prev => [...prev, userMessage, response]);
    setInput("");
  }
  function reset() {
    setMessages([{ ...initial, content: `${greeting} Je suis SANTÉ+, votre assistant d'information santé. Comment puis-je vous aider ?` }]);
    localStorage.removeItem("santeplus-history");
    setMenuOpen(false);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="SANTÉ+ accueil">
          <span className="brand-mark"><Activity size={23} strokeWidth={2.5}/></span>
          <span><strong>SANTÉ<span>+</span></strong><small>INFORMATION SANTÉ</small></span>
        </a>
        <button className="new-chat" onClick={reset}><span>＋</span> Nouvelle conversation</button>
        <div className="side-label">VOTRE ESPACE</div>
        <button className="side-link active" onClick={reset}><MessageCircle size={17}/> Assistant santé</button>
        <button className="side-link" onClick={() => setShowAbout(true)}><Info size={17}/> À propos de SANTÉ+</button>
        <div className="sidebar-bottom">
          <div className="privacy-card"><ShieldCheck size={19}/><div><strong>Votre confidentialité</strong><p>Vos échanges restent dans ce navigateur sur cette version de démonstration.</p></div></div>
          <div className="profile"><div className="avatar">S+</div><div><strong>{prefs.displayName || "Visiteur"}</strong><small>Session locale</small></div><button aria-label="Ouvrir les préférences" onClick={() => setMenuOpen(!menuOpen)}><Menu size={18}/></button></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Activity size={19}/></span><strong>SANTÉ<span>+</span></strong></div>
          <div className="top-context"><span className="status-dot"/> Assistant d'information santé <span className="top-divider">/</span> <span className="muted">Français</span></div>
          <div className="top-actions">
            <span className="safe-label"><ShieldCheck size={15}/> Espace informatif</span>
            <button className="icon-button" title="Nouvelle conversation" onClick={reset}><RotateCcw size={17}/></button>
            <button className="icon-button" title="À propos" onClick={() => setShowAbout(true)}><Info size={17}/></button>
          </div>
        </header>

        <div className="chat-area">
          <div className="chat-inner">
            <div className="intro">
              <div className="eyebrow"><Sparkles size={14}/> VOTRE COMPAGNON D'INFORMATION SANTÉ</div>
              <h1>Votre santé mérite<br/><span>des réponses claires.</span></h1>
              <p>Posez vos questions et découvrez des informations simples pour mieux comprendre la santé au quotidien.</p>
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
              {messages.map((m, i) => <article className={`message-row ${m.role}`} key={m.id}>
                {m.role === "assistant" ? <div className="message-avatar"><Activity size={17}/></div> : <div className="user-avatar">V</div>}
                <div className="message-content"><div className="message-meta"><strong>{m.role === "assistant" ? "SANTÉ+" : "Vous"}</strong><time>{m.time}</time></div><div className="bubble">{m.content}</div></div>
              </article>)}
              <div ref={bottomRef}/>
            </div>

            <div className="composer-wrap">
              <form className="composer" onSubmit={e => { e.preventDefault(); send(); }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Posez votre question sur la santé..." rows={1} aria-label="Votre question"/>
                <button className="send-button" type="submit" disabled={!input.trim()} aria-label="Envoyer"><ArrowUp size={19}/></button>
              </form>
              <div className="composer-foot"><span><ShieldCheck size={13}/> Évitez de partager des informations personnelles ou médicales identifiantes.</span><span>Entrée pour envoyer · Maj + Entrée pour une ligne</span></div>
            </div>
          </div>
        </div>
        <footer className="footer"><span>© 2026 SANTÉ+ · Assistant d'information santé</span><button onClick={() => setShowAbout(true)}>Limites et sécurité</button></footer>
      </section>

      {menuOpen && <div className="modal-backdrop" onClick={() => setMenuOpen(false)}><section className="settings-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">PERSONNALISATION</span><h2>Vos préférences</h2></div><button className="icon-button" onClick={() => setMenuOpen(false)}><X size={18}/></button></div><label className="field-label">Comment souhaitez-vous être appelé ?<input value={prefs.displayName} onChange={e => setPrefs(p => ({...p, displayName:e.target.value.slice(0,40)}))} placeholder="Votre prénom (facultatif)"/></label><label className="toggle-row"><span><strong>Réponses plus courtes</strong><small>Privilégier les explications concises.</small></span><input type="checkbox" checked={prefs.concise} onChange={e => setPrefs(p => ({...p, concise:e.target.checked}))}/></label><button className="danger-button" onClick={reset}><Trash2 size={16}/> Effacer la conversation</button><p className="modal-note">Les préférences et l'historique de démonstration sont enregistrés uniquement dans le stockage local de ce navigateur.</p></section></div>}

      {showAbout && <div className="modal-backdrop" onClick={() => setShowAbout(false)}><section className="settings-modal about-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">À PROPOS</span><h2>Un assistant, pas un médecin.</h2></div><button className="icon-button" onClick={() => setShowAbout(false)}><X size={18}/></button></div><div className="about-icon"><HeartPulse size={25}/></div><p>SANTÉ+ fournit des informations générales de santé et de prévention à visée éducative. Il ne remplace pas un professionnel de santé, ne pose pas de diagnostic et ne prescrit aucun traitement.</p><div className="notice"><ShieldCheck size={18}/><span>En cas de symptômes graves ou d'urgence, contactez immédiatement les services d'urgence de votre pays.</span></div><h3>À garder en tête</h3><ul><li>Les réponses peuvent être incomplètes ou erronées.</li><li>Les informations générales ne tiennent pas compte de votre dossier médical.</li><li>Ne partagez pas de données personnelles sensibles.</li><li>Demandez conseil à un professionnel qualifié pour toute décision médicale.</li></ul><p className="modal-note">Version de démonstration pédagogique · Moteur de réponses par intentions · Aucun diagnostic médical.</p></section></div>}
    </main>
  );
}