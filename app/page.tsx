"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ArrowUp, BookOpen, HeartPulse, Info, Menu, MessageCircle, RotateCcw, ShieldCheck, Sparkles, Stethoscope, Trash2, X } from "lucide-react";

type Message = { id: string; role: "assistant" | "user"; content: string; time: string; sources?: { title: string; url: string }[] };
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
  if (urgent) return "Ce que vous décrivez peut nécessiter une aide médicale immédiate. Contactez sans attendre les services d&apos;urgence de votre pays ou rendez-vous au service d&apos;urgence le plus proche. Si possible, demandez à une personne de confiance de rester avec vous. Je ne peux pas évaluer une urgence à distance.";
  if (/(bonjour|salut|bonsoir|coucou|hello)/i.test(q)) return "Bonjour et bienvenue sur SANTÉ+ ! Je peux vous aider à comprendre des sujets de santé, de prévention, d'hygiène et de nutrition. Que souhaitez-vous savoir ?";
  if (/(numération formule sanguine|nfs|hémogramme|hemogramme|globules blancs|leucocytes|globules rouges|hématies|hematies|hémoglobine|hemoglobine|hématocrite|hematocrite|plaquettes)/i.test(q)) return "La NFS (ou hémogramme) étudie les cellules du sang : globules rouges, globules blancs et plaquettes. Elle aide notamment à orienter l'évaluation d'une anémie, d'une infection ou d'un trouble des plaquettes. L'hémoglobine transporte l'oxygène, les leucocytes participent à la défense immunitaire et les plaquettes à l'hémostase. L'interprétation dépend de l'âge, du sexe, de la grossesse, du contexte clinique et des valeurs de référence du laboratoire. Si vous partagez un résultat, indiquez la valeur, l'unité et l'intervalle de référence, sans nom ni donnée identifiante.";
  if (/(vitesse de sédimentation|vs|crp|protéine c.?réactive|protéine c réactive)/i.test(q)) return "La CRP et la vitesse de sédimentation (VS) sont des marqueurs biologiques non spécifiques de l'inflammation. La CRP peut augmenter rapidement lors d'une inflammation ou d'une infection ; la VS évolue souvent plus lentement et dépend aussi d'autres facteurs, comme l'âge ou l'anémie. Aucune de ces analyses ne permet à elle seule d'identifier la cause. Leur interprétation se fait avec les symptômes et les autres examens.";
  if (/(ferritine|fer sérique|fer serique|transferrine|coefficient de saturation|carence en fer)/i.test(q)) return "Le bilan martial explore le métabolisme du fer. La ferritine reflète généralement les réserves en fer, mais peut aussi augmenter en cas d'inflammation ; le fer sérique varie au cours de la journée et s'interprète avec la transferrine ou le coefficient de saturation. Ces paramètres aident à explorer une carence en fer ou une surcharge, mais ne doivent pas être interprétés isolément.";
  if (/(glycémie|glycemie|glucose|sucre dans le sang|hémoglobine glyquée|hemoglobine glyquee|hba1c|diabète|diabete)/i.test(q)) return "La glycémie mesure le glucose dans le sang à un moment donné ; le contexte du prélèvement (à jeun ou non) est important. L'HbA1c estime la moyenne de la glycémie sur environ deux à trois mois. Ces examens contribuent au dépistage et au suivi du diabète, selon des seuils et protocoles qui peuvent varier. Un résultat isolé doit être interprété par un professionnel, notamment en cas de grossesse, d'anémie ou de maladie affectant les globules rouges.";
  if (/(créatinine|creatinine|urée|uree|débit de filtration|dfg|clairance|fonction rénale|fonction renale)/i.test(q)) return "La créatinine sanguine et l'estimation du débit de filtration glomérulaire (DFG) servent à évaluer la fonction rénale. L'urée peut apporter une information complémentaire, mais varie aussi avec l'hydratation, l'alimentation et d'autres facteurs. L'interprétation du DFG dépend notamment de l'âge et du contexte ; une valeur isolée ne suffit pas à poser un diagnostic.";
  if (/(transaminase|alanine aminotransférase|alat|alt|asat|ast|gamma.?gt|ggt|phosphatase alcaline|bilirubine|bilan hépatique|bilan hepatique)/i.test(q)) return "Le bilan hépatique regroupe plusieurs paramètres. Les ALAT et ASAT sont des enzymes pouvant augmenter lors d'une atteinte cellulaire du foie ou d'autres tissus ; les GGT et phosphatases alcalines peuvent orienter vers des problèmes biliaires, et la bilirubine renseigne notamment sur son métabolisme et son élimination. Le profil global, les médicaments, l'alcool, les symptômes et les antécédents comptent pour l'interprétation.";
  if (/(cholestérol|cholesterol|hdl|ldl|triglycéride|triglyceride|bilan lipidique)/i.test(q)) return "Le bilan lipidique mesure généralement le cholestérol total, le HDL, le LDL et les triglycérides. Le LDL est souvent appelé « mauvais cholestérol » car un taux élevé peut contribuer au risque cardiovasculaire ; le HDL est souvent appelé « bon cholestérol », mais le risque ne se résume pas à un seul chiffre. Les objectifs dépendent du risque cardiovasculaire global et du contexte médical.";
  if (/(ionogramme|sodium|potassium|chlorure|chlore|bicarbonate|calcium|magnésium|magnesium|phosphore)/i.test(q)) return "L'ionogramme sanguin mesure des électrolytes comme le sodium et le potassium, parfois le chlorure et les bicarbonates. Ces éléments participent à l'équilibre hydrique, au fonctionnement des nerfs, des muscles et du cœur. Des variations peuvent avoir plusieurs causes, notamment rénales, hormonales, digestives ou médicamenteuses. Des anomalies importantes, surtout du potassium, nécessitent une évaluation médicale rapide.";
  if (/(analyse d'urine|analyse urine|ecbu|uroculture|bandelette urinaire|leucocytes urinaires|nitrites|hématurie|hematurie|protéinurie|proteinurie)/i.test(q)) return "L'examen cytobactériologique des urines (ECBU) recherche notamment des globules blancs, des globules rouges et des bactéries ; une culture peut identifier un germe et aider à choisir un antibiotique si nécessaire. La qualité du prélèvement (toilette, milieu de jet, récipient stérile et acheminement rapide selon les consignes du laboratoire) est essentielle. Une bandelette urinaire est un test d'orientation et ne remplace pas toujours l'ECBU.";
  if (/(coproculture|examen parasitologique des selles|selles|parasite intestinal|oeuf de parasite|œuf de parasite)/i.test(q)) return "Les examens de selles peuvent rechercher des bactéries (coproculture), des parasites ou du sang occulte, selon la prescription. Les consignes de collecte et de conservation varient selon l'analyse : utilisez le récipient fourni par le laboratoire et évitez toute contamination par l'urine ou l'eau des toilettes. Un résultat négatif n'exclut pas toujours une infection, selon le parasite recherché et le nombre de prélèvements.";
  if (/(hémostase|hemostase|coagulation|tp\b|inr|tca|temps de céphaline|temps de cephaline|fibrinogène|fibrinogene)/i.test(q)) return "Le bilan d'hémostase explore la coagulation. Le TP et l'INR évaluent une partie de cette cascade, notamment pour surveiller certains traitements anticoagulants ; le TCA explore une autre voie et le fibrinogène est une protéine nécessaire à la formation du caillot. Les résultats dépendent du traitement, du contexte et des normes du laboratoire. N'arrêtez ou ne modifiez jamais un anticoagulant sur la base d'un résultat interprété seul.";
  if (/(groupe sanguin|groupage|abo|rhésus|rhesus|compatibilité sanguine|compatibilite sanguine|cross.?match|test de coombs)/i.test(q)) return "Le groupage sanguin détermine principalement les systèmes ABO et Rhésus (D). La recherche d'anticorps irréguliers et les épreuves de compatibilité sont des examens distincts, importants avant certaines transfusions ou pendant la grossesse. Ces résultats doivent être vérifiés et validés selon les procédures strictes du laboratoire et de l'équipe soignante.";
  if (/(sérologie|serologie|vih|hépatite b|hepatite b|hépatite c|hepatite c|toxoplasmose|rubéole|rubeole|anticorps|antigène|antigene)/i.test(q)) return "La sérologie recherche dans le sang des anticorps et/ou des antigènes liés à un agent infectieux ou à une réponse immunitaire. Selon le test, un résultat positif peut évoquer une infection actuelle, ancienne, une vaccination ou parfois un résultat faussement positif ; un résultat négatif peut être trop précoce. Il faut connaître le nom exact du test, les dates d'exposition éventuelles et les recommandations de confirmation.";
  if (/(culture|antibiogramme|prélèvement bactériologique|prelevement bacteriologique|bactérie|bacterie|germe|microbiologie)/i.test(q)) return "En microbiologie, une culture cherche à faire pousser un micro-organisme à partir d'un prélèvement. Si une bactérie est isolée, l'antibiogramme étudie sa sensibilité à différents antibiotiques. Le résultat dépend du site prélevé, de la qualité du prélèvement, des traitements déjà pris et du délai d'incubation. La présence d'une bactérie ne signifie pas toujours qu'elle est responsable d'une infection : il faut distinguer infection et colonisation.";
  if (/(tsh|thyroïde|thyroide|t3|t4|ft4|hormone|prolactine|cortisol|testostérone|testosterone|œstradiol|oestradiol|fsh|lh|amh)/i.test(q)) return "Les dosages hormonaux évaluent différentes glandes et fonctions : par exemple la TSH et la T4 libre pour la thyroïde, ou la prolactine, le cortisol et les hormones sexuelles pour d'autres situations. L'heure du prélèvement, le cycle menstruel, la grossesse, les médicaments et les méthodes du laboratoire peuvent modifier les résultats. Le choix et l'interprétation des dosages dépendent de la question clinique.";
  if (/(marqueur tumoral|psa|ca.?125|cea|afp|antigène prostatique|antigene prostatique)/i.test(q)) return "Les marqueurs tumoraux (comme le PSA, le CA-125, le CEA ou l'AFP) sont des analyses qui peuvent être utiles dans certaines situations de suivi ou d'orientation, mais ils ne dépistent ni ne diagnostiquent à eux seuls un cancer. Ils peuvent augmenter pour des raisons non cancéreuses et certains cancers ne les augmentent pas. Leur indication doit être discutée avec un professionnel de santé.";
  if (/(à jeun|a jeun|jeûne|jeune|avant une prise de sang|préparer.*prélèvement|preparer.*prelevement)/i.test(q)) return "La nécessité d'être à jeun dépend de l'analyse demandée et des consignes du laboratoire. Certains examens ne nécessitent pas de jeûne, tandis que d'autres peuvent l'exiger selon le protocole. Ne modifiez pas vos médicaments et ne prolongez pas le jeûne sans avis. Le plus sûr est de vérifier l'ordonnance et de demander au laboratoire les consignes précises (durée, eau autorisée, heure et conditions de prélèvement).";
  if (/(valeur normale|norme biologique|intervalle de référence|intervalle de reference|valeurs de référence|valeurs de reference|résultat.*analyse|resultat.*analyse|interpréter.*résultat|interpreter.*resultat)/i.test(q)) return "Les intervalles de référence dépendent de la méthode du laboratoire, de l'âge, du sexe et parfois de la grossesse. Une valeur légèrement hors intervalle ne signifie pas automatiquement une maladie, et une valeur dans l'intervalle ne garantit pas à elle seule l'absence de problème. Pour discuter un résultat, partagez le nom de l'analyse, la valeur, l'unité et l'intervalle de référence affiché, en masquant votre nom, date de naissance et toute donnée personnelle.";
  if (/(contrôle qualité|controle qualité|controle qualite|qualité au laboratoire|qualite au laboratoire|étalonnage|etalonnage|calibration|contrôle interne|controle interne|contrôle externe|controle externe)/i.test(q)) return "Le contrôle qualité en laboratoire biomédical vérifie que les résultats analytiques restent fiables. Le contrôle interne suit la stabilité quotidienne des méthodes avec des matériaux de contrôle ; l'évaluation externe compare les performances du laboratoire à celles d'autres structures. L'étalonnage relie la mesure à des références. Les procédures, la traçabilité, la maintenance et la gestion des non-conformités sont essentielles.";
  if (/(sérum|serum|plasma)/i.test(q) && /(différence|difference|entre|compar|définition|definition|qu'est-ce)/i.test(q)) return "Le sérum et le plasma sont deux parties liquides du sang, mais ils ne sont pas identiques.\\n\\n• Le plasma est la partie liquide du sang prélevé avec un anticoagulant : il contient notamment de l'eau, des protéines et des facteurs de coagulation, dont le fibrinogène.\\n• Le sérum est le liquide obtenu après que le sang a coagulé : il ne contient donc plus le fibrinogène et certains facteurs de coagulation ont été consommés pendant la formation du caillot.\\n\\nEn pratique, le plasma est utilisé notamment pour certains examens de coagulation et le sérum pour de nombreuses analyses biologiques (par exemple certains dosages hormonaux ou la recherche d'anticorps). À retenir : plasma = avant coagulation ; sérum = après coagulation. Ce sont deux échantillons de laboratoire, pas deux traitements. Voulez-vous aussi un petit tableau comparatif ?";
  if (/(paludisme|malaria)/i.test(q)) return "Le paludisme est une maladie causée par des parasites du genre Plasmodium, transmis à l'être humain par la piqûre de moustiques Anopheles infectés. Les manifestations possibles comprennent la fièvre, les frissons, les maux de tête et une grande fatigue. Une fièvre après un séjour dans une zone où le paludisme circule doit conduire à consulter rapidement : un test est nécessaire pour confirmer la maladie. Les formes graves constituent une urgence.";
  if (/(grippe|influenza|symptôme.*rhume|rhume)/i.test(q)) return "La grippe est une infection respiratoire virale. Elle peut provoquer une fièvre d'apparition rapide, une toux, des courbatures, des maux de tête et une fatigue marquée. Le rhume est généralement plus progressif et souvent moins intense. Consultez un professionnel si les symptômes sont importants, persistent ou s'aggravent, et demandez une aide urgente en cas de difficulté respiratoire.";
  if (/(choléra)/i.test(q)) return "Le choléra est une infection intestinale qui peut provoquer une diarrhée aqueuse très abondante et une déshydratation rapide. La prévention repose notamment sur l'accès à de l'eau potable, le lavage des mains au savon, l'assainissement et la consommation d'aliments bien préparés. En cas de diarrhée aqueuse importante, il faut rechercher rapidement des soins et commencer une solution de réhydratation orale si elle est disponible, selon les conseils sanitaires locaux.";
  if (/((prévenir|prévention|éviter).*(maladie|infection|moustique)|moustique|dengue)/i.test(q)) return "Les mesures de prévention dépendent de la maladie. En général : lavez-vous régulièrement les mains, utilisez une eau sûre, nettoyez et couvrez les récipients d'eau, protégez-vous des piqûres de moustiques avec des moustiquaires et des répulsifs adaptés, et suivez les recommandations vaccinales locales. Dites-moi quelle maladie vous souhaitez prévenir pour des informations plus ciblées.";
  if (/(aliment|nutrition|manger|équilibrée|équilibré|régime)/i.test(q)) return "Une alimentation équilibrée varie selon l'âge, l'activité, la culture et l'état de santé. En règle générale, privilégiez une diversité de légumes et fruits, des légumineuses, des céréales complètes ou peu raffinées, des sources de protéines variées et de l'eau potable. Limitez les boissons très sucrées et les aliments très salés. En cas de maladie ou de besoin particulier, demandez conseil à un professionnel qualifié.";
  if (/(laver.*main|hygiène|savon)/i.test(q)) return "Pour bien vous laver les mains : mouillez-les avec de l'eau propre, appliquez du savon, frottez paumes, dos des mains, entre les doigts, pouces, ongles et poignets pendant environ 20 secondes, rincez puis séchez avec un linge propre ou à l'air. Faites-le notamment avant de préparer ou manger un repas et après les toilettes.";
  if (/(paracétamol|médicament|dose|dosage|antibiotique|ordonnance)/i.test(q)) return "Je peux donner des informations générales, mais je ne peux pas déterminer une dose personnelle ni prescrire un médicament. Le paracétamol est un médicament utilisé notamment contre la douleur et la fièvre. Un surdosage peut être dangereux pour le foie. Respectez la notice et demandez conseil à un pharmacien ou un médecin, en particulier pour un enfant, une grossesse, une maladie du foie ou la prise d'autres médicaments.";
  if (/(consulter|médecin|hôpital|urgence|professionnel)/i.test(q)) return "Demandez un avis médical si un symptôme est nouveau, persistant, s'aggrave ou vous inquiète, ou si vous avez un facteur de risque particulier. En cas de difficulté à respirer, douleur thoracique intense, perte de connaissance, convulsions ou saignement abondant, contactez immédiatement les services d&apos;urgence locaux. Cette liste n'est pas exhaustive.";
  if (/(diagnostic|qu'est-ce que j'ai|quelle maladie|je souffre)/i.test(q)) return "Je ne peux pas établir de diagnostic : plusieurs causes peuvent expliquer un même symptôme et une évaluation clinique peut être nécessaire. Je peux vous expliquer des informations générales, mais le plus sûr est de consulter un professionnel de santé pour une évaluation adaptée.";
  if (/(merci|thanks)/i.test(q)) return "Avec plaisir ! Prenez soin de vous. Vous pouvez me poser une autre question sur la santé ou la prévention.";
  return "Je ne suis pas certain de comprendre votre question. Pouvez-vous la reformuler ou préciser le sujet (maladie, symptômes, prévention, nutrition, hygiène ou médicaments) ? Pour toute situation personnelle préoccupante, demandez conseil à un professionnel de santé.";
}

const initial: Message = { id: "welcome", role: "assistant", time: "Maintenant", content: "Bonjour ! 👋 Je suis SANTÉ+, votre assistant d'information santé. Je peux vous aider à mieux comprendre la prévention, les maladies courantes, l'hygiène et la nutrition. Que souhaitez-vous savoir aujourd'hui ?" };

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
      const result = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: value }) });
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
          <div className="top-context"><span className="status-dot"/> Assistant d&apos;information santé <span className="top-divider">/</span> <span className="muted">Français</span></div>
          <div className="top-actions">
            <span className="safe-label"><ShieldCheck size={15}/> Espace informatif</span>
            <button className="icon-button" title="Nouvelle conversation" onClick={reset}><RotateCcw size={17}/></button>
            <button className="icon-button" title="À propos" onClick={() => setShowAbout(true)}><Info size={17}/></button>
          </div>
        </header>

        <div className="chat-area">
          <div className="chat-inner">
            <div className="intro">
              <div className="eyebrow"><Sparkles size={14}/> VOTRE COMPAGNON D&apos;INFORMATION SANTÉ</div>
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
              {messages.map((m) => <article className={`message-row ${m.role}`} key={m.id}>
                {m.role === "assistant" ? <div className="message-avatar"><Activity size={17}/></div> : <div className="user-avatar">V</div>}
                <div className="message-content"><div className="message-meta"><strong>{m.role === "assistant" ? "SANTÉ+" : "Vous"}</strong><time>{m.time}</time></div><div className="bubble">{m.content}</div>{m.sources?.length ? <div className="message-sources"><strong>Sources consultées</strong>{m.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</div> : null}</div>
              </article>)}
              {loading && <article className="message-row assistant"><div className="message-avatar"><Activity size={17}/></div><div className="message-content"><div className="message-meta"><strong>SANTÉ+</strong><time>Recherche en cours</time></div><div className="bubble">Recherche de sources biomédicales fiables et préparation de la réponse…</div></div></article>}
              <div ref={bottomRef}/>
            </div>

            <div className="composer-wrap">
              <form className="composer" onSubmit={e => { e.preventDefault(); send(); }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Posez votre question sur une analyse biomédicale..." rows={1} aria-label="Votre question"/>
                <button className="send-button" type="submit" disabled={!input.trim() || loading} aria-label="Envoyer"><ArrowUp size={19}/></button>
              </form>
              <div className="composer-foot"><span><ShieldCheck size={13}/> Évitez de partager des informations personnelles ou médicales identifiantes.</span><span>Recherche documentaire · Sources affichées sous la réponse</span></div>
            </div>
          </div>
        </div>
        <footer className="footer"><span>© 2026 SANTÉ+ · Assistant d&apos;information santé</span><button onClick={() => setShowAbout(true)}>Limites et sécurité</button></footer>
      </section>

      {menuOpen && <div className="modal-backdrop" onClick={() => setMenuOpen(false)}><section className="settings-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">PERSONNALISATION</span><h2>Vos préférences</h2></div><button className="icon-button" onClick={() => setMenuOpen(false)}><X size={18}/></button></div><label className="field-label">Comment souhaitez-vous être appelé ?<input value={prefs.displayName} onChange={e => setPrefs(p => ({...p, displayName:e.target.value.slice(0,40)}))} placeholder="Votre prénom (facultatif)"/></label><label className="toggle-row"><span><strong>Réponses plus courtes</strong><small>Privilégier les explications concises.</small></span><input type="checkbox" checked={prefs.concise} onChange={e => setPrefs(p => ({...p, concise:e.target.checked}))}/></label><button className="danger-button" onClick={reset}><Trash2 size={16}/> Effacer la conversation</button><p className="modal-note">Les préférences et l&apos;historique de démonstration sont enregistrés uniquement dans le stockage local de ce navigateur.</p></section></div>}

      {showAbout && <div className="modal-backdrop" onClick={() => setShowAbout(false)}><section className="settings-modal about-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">À PROPOS</span><h2>Un assistant, pas un médecin.</h2></div><button className="icon-button" onClick={() => setShowAbout(false)}><X size={18}/></button></div><div className="about-icon"><HeartPulse size={25}/></div><p>SANTÉ+ fournit des informations générales de santé et de prévention à visée éducative. Il ne remplace pas un professionnel de santé, ne pose pas de diagnostic et ne prescrit aucun traitement.</p><div className="notice"><ShieldCheck size={18}/><span>En cas de symptômes graves ou d&apos;urgence, contactez immédiatement les services d&apos;urgence de votre pays.</span></div><h3>À garder en tête</h3><ul><li>Les réponses peuvent être incomplètes ou erronées.</li><li>Les informations générales ne tiennent pas compte de votre dossier médical.</li><li>Ne partagez pas de données personnelles sensibles.</li><li>Demandez conseil à un professionnel qualifié pour toute décision médicale.</li></ul><p className="modal-note">Version de démonstration pédagogique · Moteur de réponses par intentions · Aucun diagnostic médical.</p></section></div>}
    </main>
  );
}