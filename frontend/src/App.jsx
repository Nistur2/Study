import { useState, useRef, useCallback, useEffect } from "react";

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg:"#090B14", surface:"#111320", card:"#191C2D", border:"#252840",
  primary:"#7C6FFF", quiz:"#FF6B8A", notes:"#00E5C4",
  flash:"#FFB547", summary:"#7DD3FC", blank:"#C084FC",
  text:"#E4E4FF", muted:"#7478A0", mutedL:"#A0A4C4",
  correct:"#22C55E", wrong:"#EF4444",
};

// ─── Global CSS ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body,#root{background:${C.bg};font-family:'Inter',system-ui,sans-serif;color:${C.text};min-height:100vh}
.drop{border:2px dashed ${C.border};border-radius:16px;cursor:pointer;transition:all .3s}
.drop:hover,.drop.drag{border-color:${C.primary};background:rgba(124,111,255,.05)}
.mcard{border:1.5px solid ${C.border};border-radius:12px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden}
.mcard::after{content:'';position:absolute;inset:0;opacity:0;transition:opacity .3s;pointer-events:none}
.mcard:hover,.mcard.sel{transform:translateY(-2px)}
.mq::after{background:radial-gradient(ellipse at 50% 120%,rgba(255,107,138,.22) 0%,transparent 65%)}
.mn::after{background:radial-gradient(ellipse at 50% 120%,rgba(0,229,196,.22) 0%,transparent 65%)}
.mf::after{background:radial-gradient(ellipse at 50% 120%,rgba(255,181,71,.22) 0%,transparent 65%)}
.ms::after{background:radial-gradient(ellipse at 50% 120%,rgba(125,211,252,.22) 0%,transparent 65%)}
.mb::after{background:radial-gradient(ellipse at 50% 120%,rgba(192,132,252,.22) 0%,transparent 65%)}
.mcard:hover::after,.mcard.sel::after{opacity:1}
.mq:hover,.mq.sel{border-color:${C.quiz}!important;box-shadow:0 0 22px rgba(255,107,138,.2)}
.mn:hover,.mn.sel{border-color:${C.notes}!important;box-shadow:0 0 22px rgba(0,229,196,.2)}
.mf:hover,.mf.sel{border-color:${C.flash}!important;box-shadow:0 0 22px rgba(255,181,71,.2)}
.ms:hover,.ms.sel{border-color:${C.summary}!important;box-shadow:0 0 22px rgba(125,211,252,.2)}
.mb:hover,.mb.sel{border-color:${C.blank}!important;box-shadow:0 0 22px rgba(192,132,252,.2)}
.gbtn{background:linear-gradient(135deg,${C.primary},#5A4FE0);color:#fff;border:none;border-radius:12px;padding:13px 24px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;cursor:pointer;transition:all .2s;box-shadow:0 4px 22px rgba(124,111,255,.4);width:100%;display:flex;align-items:center;justify-content:center;gap:10px}
.gbtn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 7px 28px rgba(124,111,255,.5)}
.gbtn:disabled{opacity:.35;cursor:not-allowed;transform:none}
.opt{width:100%;text-align:left;padding:9px 13px;border-radius:10px;border:1px solid ${C.border};background:${C.surface};color:${C.text};cursor:pointer;font-size:14px;transition:all .18s;margin-bottom:6px;font-family:'Inter',sans-serif}
.opt:hover:not(:disabled){border-color:${C.primary};background:rgba(124,111,255,.08)}
.opt.ok{border-color:${C.correct}!important;background:rgba(34,197,94,.14)!important;color:${C.correct}!important}
.opt.ng{border-color:${C.wrong}!important;background:rgba(239,68,68,.14)!important;color:${C.wrong}!important}
.opt.hl{border-color:${C.correct}!important;background:rgba(34,197,94,.06)!important}
.fc-wrap{perspective:1000px;cursor:pointer;height:210px}
.fc{width:100%;height:100%;transform-style:preserve-3d;transition:transform .5s ease;position:relative}
.fc.fl{transform:rotateY(180deg)}
.fc-f,.fc-b{position:absolute;inset:0;-webkit-backface-visibility:hidden;backface-visibility:hidden;border-radius:14px;display:flex;align-items:center;justify-content:center;padding:28px;text-align:center}
.fc-f{background:${C.card};border:1px solid ${C.border}}
.fc-b{background:rgba(255,181,71,.07);border:1px solid ${C.flash};transform:rotateY(180deg)}
.bin{background:${C.surface};border:1px solid ${C.border};border-radius:8px;color:${C.text};padding:5px 10px;font-family:'Inter',sans-serif;font-size:14px;outline:none;transition:border-color .2s;display:inline-block;margin:0 4px;vertical-align:middle}
.bin:focus{border-color:${C.primary}}
.bin.bok{border-color:${C.correct}!important;background:rgba(34,197,94,.1)!important}
.bin.bng{border-color:${C.wrong}!important;background:rgba(239,68,68,.1)!important}
.iBtn{background:none;border:1px solid ${C.border};border-radius:9px;color:${C.mutedL};cursor:pointer;padding:6px 12px;font-size:12px;font-family:'Inter',sans-serif;transition:all .2s;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.iBtn:hover:not(:disabled){border-color:${C.primary};color:${C.primary};background:rgba(124,111,255,.06)}
.iBtn:disabled{opacity:.4;cursor:not-allowed}
.selEl{background:${C.card};border:1px solid ${C.border};border-radius:9px;color:${C.text};padding:6px 11px;font-family:'Inter',sans-serif;font-size:13px;cursor:pointer;outline:none}
.selEl:focus{border-color:${C.primary}}
.timerBar{height:3px;background:${C.border};border-radius:2px;overflow:hidden;margin-bottom:14px}
.timerFill{height:100%;border-radius:2px;transition:width 1s linear}
.hrow{background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:13px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:border-color .2s;margin-bottom:8px}
.hrow:hover{border-color:${C.primary}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.spin{animation:spin .7s linear infinite}
.fadein{animation:fadeUp .38s ease}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:${C.surface}}
::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
`;

// ─── Constants ───────────────────────────────────────────────────────────────
const LANGS = ["English","Spanish","French","German","Japanese","Chinese","Filipino","Arabic","Portuguese","Italian"];

const MODES = [
  { id:"quiz",    label:"Quiz",        icon:"❓", desc:"Multiple-choice test",      cls:"mq", ac:C.quiz    },
  { id:"notes",   label:"Notes",       icon:"📖", desc:"Structured study notes",    cls:"mn", ac:C.notes   },
  { id:"flash",   label:"Flashcards",  icon:"🃏", desc:"Flip cards to drill terms", cls:"mf", ac:C.flash   },
  { id:"summary", label:"TL;DR",       icon:"⚡", desc:"5-bullet summary",          cls:"ms", ac:C.summary },
  { id:"blank",   label:"Fill Blanks", icon:"✏️", desc:"Complete the sentences",    cls:"mb", ac:C.blank   },
];

const LOAD_MSGS = {
  quiz:    ["Reading your file…","Crafting questions…","Building the quiz…","Almost done…"],
  notes:   ["Reading your file…","Finding key ideas…","Organising notes…","Almost done…"],
  flash:   ["Reading your file…","Identifying terms…","Making cards…","Almost done…"],
  summary: ["Reading your file…","Extracting key points…","Writing summary…","Almost done…"],
  blank:   ["Reading your file…","Picking key phrases…","Building blanks…","Almost done…"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtSize = b => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
const fmtDate = d => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
const fileEmoji = n => { const e=(n||"").split(".").pop().toLowerCase(); return e==="pdf"?"📄":["png","jpg","jpeg","webp","gif"].includes(e)?"🖼️":"📝"; };

const buildSys = (mode, diff, lang) => {
  const L = lang !== "English" ? `Respond in ${lang}. ` : "";
  const D = { easy:"Simple recall questions only.", medium:"Mix recall and application.", hard:"Deep analysis and synthesis questions." }[diff] || "";
  return {
    quiz:    `${L}Generate a quiz. ${D} Return ONLY valid JSON, no markdown, no backticks:\n{"title":"string","questions":[{"id":1,"question":"string","options":["A. text","B. text","C. text","D. text"],"answer":"A","explanation":"string"}]}\nGenerate exactly 5 questions.`,
    notes:   `${L}Generate study notes. Return ONLY valid JSON, no markdown, no backticks:\n{"title":"string","summary":"2-3 sentence overview","sections":[{"heading":"string","content":"string","keyPoints":["string"]}],"keyTerms":[{"term":"string","definition":"string"}]}\n3 sections, 4 key terms, concise content.`,
    flash:   `${L}Generate flashcards. Return ONLY valid JSON, no markdown, no backticks:\n{"title":"string","cards":[{"id":1,"front":"term or concept","back":"definition or explanation"}]}\nGenerate exactly 10 flashcards.`,
    summary: `${L}Generate a TL;DR summary. Return ONLY valid JSON, no markdown, no backticks:\n{"title":"string","bullets":[{"emoji":"string","text":"string"}],"keyTakeaway":"string"}\nExactly 5 bullets, each one impactful sentence.`,
    blank:   `${L}Generate fill-in-the-blank exercises. ${D} Return ONLY valid JSON, no markdown, no backticks:\n{"title":"string","sentences":[{"id":1,"before":"text before blank","answer":"missing word","after":"text after blank"}]}\nGenerate exactly 6 sentences.`,
  }[mode] || "";
};

const toMarkdown = d => {
  let md = `# ${d.title}\n\n${d.summary||""}\n\n`;
  (d.sections||[]).forEach(s => { md+=`## ${s.heading}\n\n${s.content}\n\n`; (s.keyPoints||[]).forEach(p=>{md+=`- ${p}\n`;}); md+="\n"; });
  if (d.keyTerms?.length) { md+="## Key Terms\n\n"; d.keyTerms.forEach(k=>{md+=`**${k.term}**: ${k.definition}\n\n`;}); }
  return md;
};

const toHTML = res => {
  const t = res.data.title || "StudyAI Export";
  let b = "";
  if (res.type==="notes") {
    b=`<h1>${t}</h1><p><em>${res.data.summary||""}</em></p>`;
    (res.data.sections||[]).forEach(s=>{b+=`<h2>${s.heading}</h2><p>${s.content}</p><ul>`;(s.keyPoints||[]).forEach(p=>{b+=`<li>${p}</li>`;});b+=`</ul>`;});
    if (res.data.keyTerms?.length){b+="<h2>Key Terms</h2><dl>";res.data.keyTerms.forEach(k=>{b+=`<dt><strong>${k.term}</strong></dt><dd>${k.definition}</dd>`;});b+="</dl>";}
  } else if (res.type==="quiz") {
    b=`<h1>${t}</h1>`;
    (res.data.questions||[]).forEach((q,i)=>{b+=`<p><strong>Q${i+1}. ${q.question}</strong></p><ul>`;(q.options||[]).forEach(o=>{b+=`<li>${o}</li>`;});b+=`</ul><p><em>Answer: ${q.answer} — ${q.explanation}</em></p><hr/>`;});
  } else if (res.type==="summary") {
    b=`<h1>${t}</h1><ul>`;(res.data.bullets||[]).forEach(x=>{b+=`<li>${x.emoji} ${x.text}</li>`;});b+=`</ul><blockquote><strong>Key Takeaway:</strong> ${res.data.keyTakeaway||""}</blockquote>`;
  } else if (res.type==="flash") {
    b=`<h1>${t}</h1><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%"><tr><th>Front</th><th>Back</th></tr>`;
    (res.data.cards||[]).forEach(c=>{b+=`<tr><td>${c.front}</td><td>${c.back}</td></tr>`;});b+="</table>";
  } else if (res.type==="blank") {
    b=`<h1>${t}</h1>`;(res.data.sentences||[]).forEach((s,i)=>{b+=`<p>${i+1}. ${s.before} <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u> ${s.after} <em>(${s.answer})</em></p>`;});
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${t}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px}h1{font-size:24px}h2{font-size:18px;margin-top:20px}dt{font-weight:bold;margin-top:6px}table td,table th{padding:8px}</style></head><body>${b}</body></html>`;
};

// ─── localStorage helpers (replaces window.storage from Claude artifacts) ───
const LS_KEY = "sai_history";
const lsGet  = ()    => { try { return JSON.parse(localStorage.getItem(LS_KEY)||"[]"); } catch { return []; } };
const lsSet  = data  => { try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {} };
const lsDel  = ()    => { try { localStorage.removeItem(LS_KEY); } catch {} };

// ─── Shared UI components (outside main to avoid re-creation on render) ──────
const ActionRow = ({ children }) => (
  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16,alignItems:"center"}}>{children}</div>
);
const ResultCard = ({ style={}, children }) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",marginBottom:10,...style}}>{children}</div>
);

// ─── Main component ──────────────────────────────────────────────────────────
export default function StudyAI() {

  const [files,        setFiles]        = useState([]);
  const [drag,         setDrag]         = useState(false);
  const [mode,         setMode]         = useState(null);
  const [difficulty,   setDifficulty]   = useState("medium");
  const [language,     setLanguage]     = useState("English");
  const [timerOn,      setTimerOn]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [loadMsg,      setLoadMsg]      = useState("");
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);
  const [sel,          setSel]          = useState({});
  const [rev,          setRev]          = useState({});
  const [timeLeft,     setTimeLeft]     = useState(0);
  const [retryIds,     setRetryIds]     = useState(null);
  const [cardIdx,      setCardIdx]      = useState(0);
  const [flipped,      setFlipped]      = useState(false);
  const [blanks,       setBlanks]       = useState({});
  const [submitted,    setSubmitted]    = useState(false);
  const [history,      setHistory]      = useState([]);
  const [showHistory,  setShowHistory]  = useState(false);
  const [shareCode,    setShareCode]    = useState(null);
  const [copied,       setCopied]       = useState("");
  const [showImport,   setShowImport]   = useState(false);
  const [importVal,    setImportVal]    = useState("");

  const fileInputRef = useRef(null);
  const timerRef     = useRef(null);
  const selRef       = useRef({});

  useEffect(() => { selRef.current = sel; }, [sel]);

  // Load history from localStorage on mount
  useEffect(() => { setHistory(lsGet()); }, []);

  // Quiz timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!timerOn || !result || result.type !== "quiz") { setTimeLeft(0); return; }
    setTimeLeft(90);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [result, timerOn]);

  // Auto-reveal when timer expires
  useEffect(() => {
    if (timeLeft !== 0 || !timerOn || !result || result.type !== "quiz") return;
    const reveal = {};
    result.data.questions.forEach(q => { if (!selRef.current[q.id]) reveal[q.id] = true; });
    if (Object.keys(reveal).length) setRev(r => ({...r, ...reveal}));
  }, [timeLeft, timerOn, result]);

  // ── File helpers ──
  const readFile = f => new Promise((res, rej) => {
    const ext = f.name.split(".").pop().toLowerCase();
    const rd  = new FileReader();
    if (f.type === "application/pdf" || ext === "pdf") {
      rd.onload = e => res({ name:f.name, size:f.size, data:e.target.result.split(",")[1], mime:"application/pdf" });
      rd.onerror = rej; rd.readAsDataURL(f);
    } else if (f.type.startsWith("image/")) {
      rd.onload = e => res({ name:f.name, size:f.size, data:e.target.result.split(",")[1], mime:f.type });
      rd.onerror = rej; rd.readAsDataURL(f);
    } else {
      rd.onload = e => res({ name:f.name, size:f.size, data:e.target.result, mime:"text" });
      rd.onerror = rej; rd.readAsText(f);
    }
  });

  const addFiles = async list => {
    const arr = Array.from(list).slice(0, 3 - files.length);
    if (!arr.length) return;
    try {
      const processed = await Promise.all(arr.map(readFile));
      setFiles(p => [...p, ...processed].slice(0, 3));
      setResult(null); setError(null);
    } catch { setError("Could not read one of the files."); }
  };

  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files);
  }, [files]);

  const removeFile = i => { setFiles(p => p.filter((_,j)=>j!==i)); setResult(null); setError(null); };

  const resetAll = () => {
    setFiles([]); setMode(null); setResult(null); setError(null);
    setSel({}); setRev({}); setTimeLeft(0); setRetryIds(null);
    setCardIdx(0); setFlipped(false); setBlanks({}); setSubmitted(false);
    setShareCode(null); if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── Generate ──
  const generate = async () => {
    if (!files.length || !mode || loading) return;
    setLoading(true); setResult(null); setError(null);
    setSel({}); setRev({}); setTimeLeft(0); setRetryIds(null);
    setCardIdx(0); setFlipped(false); setBlanks({}); setSubmitted(false); setShareCode(null);

    let idx = 0;
    setLoadMsg(LOAD_MSGS[mode][0]);
    const iv = setInterval(() => { idx=(idx+1)%LOAD_MSGS[mode].length; setLoadMsg(LOAD_MSGS[mode][idx]); }, 2000);

    try {
      const blocks = [];
      for (const f of files) {
        if (f.mime === "text") {
          blocks.push({ type:"text", text:`\n--- File: ${f.name} ---\n${f.data.slice(0, 3500)}` });
        } else if (f.mime === "application/pdf") {
          blocks.push({ type:"document", source:{ type:"base64", media_type:"application/pdf", data:f.data } });
          blocks.push({ type:"text", text:`(above: ${f.name})` });
        } else {
          blocks.push({ type:"image", source:{ type:"base64", media_type:f.mime, data:f.data } });
          blocks.push({ type:"text", text:`(above: ${f.name})` });
        }
      }

      // ↓ Calls our Express proxy — API key stays on the server
      const resp = await fetch("/api/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-haiku-4-5-20251001", max_tokens:1000,
          system: buildSys(mode, difficulty, language),
          messages:[{ role:"user", content:blocks }]
        })
      });

      const d = await resp.json();
      if (d.error) throw new Error(d.error.message);
      const raw = d.content.map(b=>b.text||"").join("").replace(/```(?:json)?/g,"").replace(/```/g,"").trim();
      const parsed = JSON.parse(raw);
      const res = { type:mode, data:parsed };
      setResult(res);

      // Save to localStorage
      const entry = { id:Date.now(), date:Date.now(), fileNames:files.map(f=>f.name).join(", "), mode, title:parsed.title||"Untitled", result:res };
      const next = [entry, ...history].slice(0, 15);
      setHistory(next);
      lsSet(next);
    } catch (e) {
      setError("Could not generate content. Please try again."); console.error(e);
    } finally { clearInterval(iv); setLoading(false); }
  };

  // ── Quiz ──
  const pickAnswer = (qid, letter) => {
    if (sel[qid]) return;
    setSel(p => ({...p,[qid]:letter}));
    setRev(p => ({...p,[qid]:true}));
  };
  const toggleRev = id => { if (sel[id]) return; setRev(p => ({...p,[id]:!p[id]})); };

  const quizQuestions = result?.type==="quiz"
    ? (retryIds ? result.data.questions.filter(q=>retryIds.includes(q.id)) : result.data.questions)
    : [];

  const quizScore = (() => {
    if (!quizQuestions.length) return null;
    const answered = quizQuestions.filter(q => sel[q.id]);
    if (!answered.length) return null;
    return { c:answered.filter(q=>sel[q.id]===q.answer).length, t:answered.length };
  })();

  const canRetry = result?.type==="quiz" && result.data.questions.some(q=>sel[q.id]&&sel[q.id]!==q.answer);

  const startRetry = () => {
    const ids = result.data.questions.filter(q=>sel[q.id]&&sel[q.id]!==q.answer).map(q=>q.id);
    setRetryIds(ids);
    setSel(p => { const n={...p}; ids.forEach(id=>delete n[id]); return n; });
    setRev(p => { const n={...p}; ids.forEach(id=>delete n[id]); return n; });
    if (timerOn) setTimeLeft(90);
  };

  // ── Export ──
  const copyText = async (text, key) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(()=>setCopied(""), 2000); } catch {}
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([toHTML(result)], {type:"text/html"}));
    a.download = `${result.data.title||"StudyAI"}.html`; a.click();
  };

  const shareResult = () => {
    if (!result) return;
    const code = btoa(encodeURIComponent(JSON.stringify(result)));
    setShareCode(code);
    copyText(code, "share");
  };

  const loadFromCode = code => {
    try {
      const res = JSON.parse(decodeURIComponent(atob(code.trim())));
      setResult(res); setMode(res.type);
      setSel({}); setRev({}); setCardIdx(0); setFlipped(false);
      setBlanks({}); setSubmitted(false); setRetryIds(null); setShareCode(null);
      setShowImport(false); setImportVal("");
    } catch { setError("Invalid share code."); }
  };

  // ── History ──
  const loadFromHistory = entry => {
    setResult(entry.result); setMode(entry.mode);
    setSel({}); setRev({}); setCardIdx(0); setFlipped(false);
    setBlanks({}); setSubmitted(false); setRetryIds(null); setShareCode(null);
    setShowHistory(false);
  };
  const clearHistory = () => { setHistory([]); lsDel(); };

  // ── Ambient ──
  const ambientBg = { quiz:`radial-gradient(ellipse 60% 40% at 10% 5%,rgba(124,111,255,.09) 0%,transparent 55%),radial-gradient(ellipse 50% 35% at 90% 95%,rgba(255,107,138,.1) 0%,transparent 55%)`, notes:`radial-gradient(ellipse 60% 40% at 10% 5%,rgba(124,111,255,.09) 0%,transparent 55%),radial-gradient(ellipse 50% 35% at 90% 95%,rgba(0,229,196,.08) 0%,transparent 55%)`, flash:`radial-gradient(ellipse 60% 40% at 10% 5%,rgba(124,111,255,.09) 0%,transparent 55%),radial-gradient(ellipse 50% 35% at 90% 95%,rgba(255,181,71,.08) 0%,transparent 55%)`, summary:`radial-gradient(ellipse 60% 40% at 10% 5%,rgba(124,111,255,.09) 0%,transparent 55%),radial-gradient(ellipse 50% 35% at 90% 95%,rgba(125,211,252,.07) 0%,transparent 55%)`, blank:`radial-gradient(ellipse 60% 40% at 10% 5%,rgba(124,111,255,.09) 0%,transparent 55%),radial-gradient(ellipse 50% 35% at 90% 95%,rgba(192,132,252,.08) 0%,transparent 55%)` }[mode] || `radial-gradient(ellipse 60% 40% at 10% 5%,rgba(124,111,255,.08) 0%,transparent 55%)`;

  const canGenerate = files.length > 0 && files.every(f=>f.data) && mode && !loading;



  // ── History view ──────────────────────────────────────────────────────────
  if (showHistory) return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
      <style>{CSS}</style>
      <div style={{maxWidth:660,margin:"0 auto",padding:"36px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:26}}>
          <button className="iBtn" onClick={()=>setShowHistory(false)}>← Back</button>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20}}>Session History</h2>
          {history.length>0 && <button onClick={clearHistory} className="iBtn" style={{marginLeft:"auto"}}>🗑 Clear all</button>}
        </div>
        {history.length===0
          ? <div style={{textAlign:"center",padding:"60px 0",color:C.muted}}><div style={{fontSize:40,marginBottom:12}}>📭</div><p style={{fontSize:14}}>No sessions yet</p></div>
          : history.map(e=>(
            <div key={e.id} className="hrow" onClick={()=>loadFromHistory(e)}>
              <span style={{fontSize:22}}>{MODES.find(m=>m.id===e.mode)?.icon||"📄"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
                <div style={{color:C.muted,fontSize:12,marginTop:2}}>{e.fileNames} · {fmtDate(e.date)}</div>
              </div>
              <span style={{color:C.primary,fontSize:12,flexShrink:0}}>Load →</span>
            </div>
          ))
        }
      </div>
    </div>
  );

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",transition:"background .7s",background:ambientBg,zIndex:0}}/>

      <div style={{maxWidth:660,margin:"0 auto",padding:"32px 18px",position:"relative",zIndex:1}}>

        {/* Header */}
        <div style={{position:"relative",textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
            <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${C.primary},#5A4FE0)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,boxShadow:"0 4px 20px rgba(124,111,255,.45)"}}>✦</div>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,letterSpacing:"-.5px"}}>StudyAI</span>
          </div>
          <p style={{color:C.muted,fontSize:13}}>Upload files · Quiz, Notes, Flashcards, Summary, Fill-Blanks</p>
          <div style={{position:"absolute",right:0,top:0,display:"flex",gap:7}}>
            <button className="iBtn" title="Import share code" onClick={()=>setShowImport(p=>!p)}>📥</button>
            <button className="iBtn" title="History" onClick={()=>setShowHistory(true)} style={{position:"relative"}}>
              🕐{history.length>0&&<span style={{position:"absolute",top:-5,right:-5,background:C.primary,color:"white",borderRadius:"50%",width:14,height:14,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{history.length}</span>}
            </button>
          </div>
        </div>

        {/* Import panel */}
        {showImport&&(
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 16px",marginBottom:16}}>
            <p style={{fontSize:12,color:C.muted,marginBottom:8}}>Paste a share code to load a result:</p>
            <div style={{display:"flex",gap:8}}>
              <input value={importVal} onChange={e=>setImportVal(e.target.value)} placeholder="Paste code here…"
                style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 11px",fontSize:13,outline:"none",fontFamily:"'Inter',sans-serif"}}/>
              <button className="iBtn" onClick={()=>loadFromCode(importVal)}>Load</button>
              <button onClick={()=>setShowImport(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:17,padding:"0 4px"}}>✕</button>
            </div>
          </div>
        )}

        {/* Drop zone */}
        {files.length===0&&(
          <div className={`drop${drag?" drag":""}`}
            style={{padding:"58px 36px",textAlign:"center",background:C.surface}}
            onClick={()=>fileInputRef.current.click()}
            onDrop={onDrop}
            onDragOver={e=>{e.preventDefault();setDrag(true);}}
            onDragLeave={()=>setDrag(false)}>
            <div style={{fontSize:50,marginBottom:14,transition:"transform .2s",transform:drag?"scale(1.1)":"scale(1)"}}>{drag?"✨":"📂"}</div>
            <p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:20,marginBottom:7}}>{drag?"Drop it here!":"Drop your file here"}</p>
            <p style={{color:C.muted,fontSize:13,marginBottom:18}}>or click to browse · up to 3 files</p>
            <div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}>
              {["PDF","TXT","Markdown","Images"].map(f=><span key={f} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 10px",fontSize:11,color:C.mutedL}}>{f}</span>)}
            </div>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.csv,.png,.jpg,.jpeg,.webp"
              style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
          </div>
        )}

        {/* Files list */}
        {files.length>0&&(
          <div style={{marginBottom:14}}>
            {files.map((f,i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"11px 15px",display:"flex",alignItems:"center",gap:11,marginBottom:7}}>
                <span style={{fontSize:22}}>{fileEmoji(f.name)}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                  <div style={{color:C.muted,fontSize:11}}>{fmtSize(f.size)}</div>
                </div>
                <button onClick={()=>removeFile(i)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:"2px 4px"}}>✕</button>
              </div>
            ))}
            {files.length<3&&(
              <>
                <button onClick={()=>fileInputRef.current.click()} className="iBtn" style={{width:"100%",justifyContent:"center"}}>+ Add file ({files.length}/3)</button>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.csv,.png,.jpg,.jpeg,.webp" style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
              </>
            )}
          </div>
        )}

        {/* Settings bar */}
        {files.length>0&&(
          <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,color:C.muted}}>🌐</span>
              <select className="selEl" value={language} onChange={e=>setLanguage(e.target.value)}>
                {LANGS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            {(mode==="quiz"||mode==="blank")&&(
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,color:C.muted}}>Difficulty</span>
                <div style={{display:"flex",gap:4}}>
                  {["easy","medium","hard"].map(d=>(
                    <button key={d} onClick={()=>setDifficulty(d)} style={{background:difficulty===d?"rgba(124,111,255,.2)":"none",border:`1px solid ${difficulty===d?C.primary:C.border}`,borderRadius:7,color:difficulty===d?C.primary:C.muted,cursor:"pointer",padding:"4px 9px",fontSize:11,fontFamily:"'Inter',sans-serif",transition:"all .18s",textTransform:"capitalize"}}>{d}</button>
                  ))}
                </div>
              </div>
            )}
            {mode==="quiz"&&(
              <div style={{display:"flex",alignItems:"center",gap:7,marginLeft:"auto"}}>
                <span style={{fontSize:12,color:C.muted}}>90s timer</span>
                <div onClick={()=>setTimerOn(p=>!p)} style={{width:36,height:20,borderRadius:10,cursor:"pointer",transition:"background .25s",background:timerOn?C.primary:C.border,position:"relative",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,width:16,height:16,borderRadius:"50%",background:"white",transition:"left .25s",left:timerOn?18:2}}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode cards */}
        {files.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:7,marginBottom:14}}>
            {MODES.map(({id,label,icon,desc,cls,ac})=>(
              <div key={id} className={`mcard ${cls}${mode===id?" sel":""}`}
                style={{padding:"13px 7px",background:C.surface,textAlign:"center"}}
                onClick={()=>setMode(id)}>
                <div style={{fontSize:24,marginBottom:6,position:"relative",zIndex:1}}>{icon}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:11,marginBottom:3,color:mode===id?ac:C.text,transition:"color .2s",position:"relative",zIndex:1,lineHeight:1.2}}>{label}</div>
                <div style={{color:C.muted,fontSize:9.5,lineHeight:1.4,position:"relative",zIndex:1}}>{desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Generate button */}
        {files.length>0&&(
          <button className="gbtn" onClick={generate} disabled={!canGenerate} style={{marginBottom:20}}>
            {loading?<><span className="spin" style={{fontSize:16}}>⟳</span>{loadMsg}</>:`Generate ${MODES.find(m=>m.id===mode)?.label||"…"}`}
          </button>
        )}

        {/* Error */}
        {error&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:12,padding:"11px 16px",marginBottom:14,color:"#FCA5A5",fontSize:14}}>⚠️ {error}</div>}

        {/* Share code panel */}
        {shareCode&&(
          <div style={{background:C.card,border:`1px solid ${C.primary}`,borderRadius:13,padding:"14px 16px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:600,color:C.primary}}>🔗 Share Code {copied==="share"?"· Copied!":""}</span>
              <button onClick={()=>setShareCode(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            <div style={{fontFamily:"monospace",fontSize:10,background:C.surface,borderRadius:8,padding:"9px 11px",wordBreak:"break-all",color:C.mutedL,lineHeight:1.5,marginBottom:8}}>{shareCode.slice(0,150)}…</div>
            <button className="iBtn" onClick={()=>copyText(shareCode,"share2")}>{copied==="share2"?"✓ Copied!":"📋 Copy full code"}</button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {result?.type==="quiz"&&(
          <div className="fadein">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:10}}>
              <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,flex:1}}>{result.data.title}</h2>
              {quizScore&&<span style={{background:"rgba(124,111,255,.15)",border:"1px solid rgba(124,111,255,.3)",borderRadius:9,padding:"5px 12px",fontSize:13,color:C.primary,flexShrink:0}}>{quizScore.c}/{quizScore.t}</span>}
            </div>
            {retryIds&&<div style={{fontSize:12,color:C.flash,marginBottom:10,fontWeight:600}}>🔁 Retry mode — {retryIds.length} missed question{retryIds.length!==1?"s":""}</div>}
            {timerOn&&result&&<div className="timerBar"><div className="timerFill" style={{width:`${(timeLeft/90)*100}%`,background:timeLeft>60?C.notes:timeLeft>30?C.flash:C.quiz}}/></div>}
            {timerOn&&timeLeft===0&&<div style={{fontSize:12,color:C.quiz,textAlign:"center",marginBottom:10}}>⏱ Time's up!</div>}
            {quizQuestions.map((q,i)=>{
              const chosen=sel[q.id],revealed=rev[q.id];
              return(
                <ResultCard key={q.id}>
                  <p style={{fontWeight:600,fontSize:14,lineHeight:1.6,marginBottom:12}}>
                    <span style={{color:C.primary,marginRight:7}}>Q{i+1}.</span>{q.question}
                  </p>
                  <div>
                    {q.options.map(opt=>{
                      const letter=opt[0],isChosen=chosen===letter,isCorrect=q.answer===letter;
                      let cls="opt";
                      if(revealed){if(isChosen&&isCorrect)cls+=" ok";else if(isChosen&&!isCorrect)cls+=" ng";else if(isCorrect)cls+=" hl";}
                      return<button key={letter} className={cls} onClick={()=>pickAnswer(q.id,letter)} disabled={!!chosen}>{opt}{revealed&&isCorrect?" ✓":""}{revealed&&isChosen&&!isCorrect?" ✗":""}</button>;
                    })}
                  </div>
                  {revealed&&<div style={{background:"rgba(124,111,255,.08)",border:"1px solid rgba(124,111,255,.2)",borderRadius:10,padding:"9px 13px",fontSize:13,color:C.mutedL,lineHeight:1.65,marginTop:6}}><span style={{color:C.primary,fontWeight:600}}>Explanation: </span>{q.explanation}</div>}
                  {!chosen&&<button onClick={()=>toggleRev(q.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,marginTop:8,padding:0,textDecoration:"underline",fontFamily:"'Inter',sans-serif"}}>{revealed?"Hide answer":"Reveal answer"}</button>}
                </ResultCard>
              );
            })}
            <ActionRow>
              {canRetry&&!retryIds&&<button className="iBtn" onClick={startRetry}>🔁 Retry missed</button>}
              {retryIds&&<button className="iBtn" onClick={()=>{setRetryIds(null);setSel({});setRev({});}}>← All questions</button>}
              <button className="iBtn" onClick={download}>⬇ Download</button>
              <button className="iBtn" onClick={shareResult}>🔗 Share</button>
              <button className="iBtn" onClick={resetAll} style={{marginLeft:"auto"}}>↩ New file</button>
            </ActionRow>
          </div>
        )}

        {/* ── NOTES ── */}
        {result?.type==="notes"&&(
          <div className="fadein">
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,marginBottom:10}}>{result.data.title}</h2>
            <div style={{background:"rgba(0,229,196,.07)",border:"1px solid rgba(0,229,196,.2)",borderRadius:12,padding:"13px 16px",fontSize:14,color:C.mutedL,lineHeight:1.75,marginBottom:14}}>{result.data.summary}</div>
            {(result.data.sections||[]).map((s,i)=>(
              <ResultCard key={i} style={{borderLeft:`3px solid ${C.notes}`}}>
                <h3 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:C.notes,marginBottom:8}}>{s.heading}</h3>
                <p style={{fontSize:14,color:C.mutedL,lineHeight:1.75,marginBottom:s.keyPoints?.length?10:0}}>{s.content}</p>
                {s.keyPoints?.length>0&&<ul style={{paddingLeft:0,listStyle:"none"}}>{s.keyPoints.map((pt,j)=><li key={j} style={{fontSize:13,color:C.mutedL,lineHeight:1.6,marginBottom:4,paddingLeft:14,position:"relative"}}><span style={{position:"absolute",left:0,color:C.notes}}>›</span>{pt}</li>)}</ul>}
              </ResultCard>
            ))}
            {result.data.keyTerms?.length>0&&(
              <ResultCard>
                <h3 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,marginBottom:12}}>🔑 Key Terms</h3>
                <div style={{display:"grid",gap:10}}>
                  {result.data.keyTerms.map((kt,i)=>(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                      <span style={{flexShrink:0,background:"rgba(0,229,196,.1)",border:"1px solid rgba(0,229,196,.3)",borderRadius:7,padding:"3px 9px",fontSize:12,color:C.notes,whiteSpace:"nowrap"}}>{kt.term}</span>
                      <span style={{fontSize:13,color:C.mutedL,lineHeight:1.65,paddingTop:2}}>{kt.definition}</span>
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}
            <ActionRow>
              <button className="iBtn" onClick={()=>copyText(toMarkdown(result.data),"md")}>{copied==="md"?"✓ Copied!":"📋 Copy Markdown"}</button>
              <button className="iBtn" onClick={download}>⬇ Download</button>
              <button className="iBtn" onClick={shareResult}>🔗 Share</button>
              <button className="iBtn" onClick={resetAll} style={{marginLeft:"auto"}}>↩ New file</button>
            </ActionRow>
          </div>
        )}

        {/* ── FLASHCARDS ── */}
        {result?.type==="flash"&&(
          <div className="fadein">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20}}>{result.data.title}</h2>
              <span style={{color:C.muted,fontSize:13}}>{cardIdx+1} / {result.data.cards.length}</span>
            </div>
            <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:14}}>
              {result.data.cards.map((_,i)=><div key={i} onClick={()=>{setCardIdx(i);setFlipped(false);}} style={{width:i===cardIdx?20:6,height:6,borderRadius:3,cursor:"pointer",background:i===cardIdx?C.flash:C.border,transition:"all .2s"}}/>)}
            </div>
            <div className="fc-wrap" onClick={()=>setFlipped(p=>!p)} style={{marginBottom:14}}>
              <div className={`fc${flipped?" fl":""}`}>
                <div className="fc-f">
                  <div><div style={{fontSize:10,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Term — tap to flip</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:22,color:C.text,lineHeight:1.3}}>{result.data.cards[cardIdx]?.front}</div></div>
                </div>
                <div className="fc-b">
                  <div><div style={{fontSize:10,color:C.flash,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Definition</div>
                  <div style={{fontSize:15,color:C.text,lineHeight:1.65}}>{result.data.cards[cardIdx]?.back}</div></div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:6}}>
              <button className="iBtn" onClick={()=>{setCardIdx(i=>Math.max(i-1,0));setFlipped(false);}} disabled={cardIdx===0}>← Prev</button>
              <button className="iBtn" onClick={()=>setFlipped(p=>!p)}>{flipped?"Show term":"Flip card"}</button>
              <button className="iBtn" onClick={()=>{setCardIdx(i=>Math.min(i+1,result.data.cards.length-1));setFlipped(false);}} disabled={cardIdx===result.data.cards.length-1}>Next →</button>
            </div>
            <ActionRow>
              <button className="iBtn" onClick={()=>{setCardIdx(0);setFlipped(false);}}>↺ Restart</button>
              <button className="iBtn" onClick={download}>⬇ Download</button>
              <button className="iBtn" onClick={shareResult}>🔗 Share</button>
              <button className="iBtn" onClick={resetAll} style={{marginLeft:"auto"}}>↩ New file</button>
            </ActionRow>
          </div>
        )}

        {/* ── SUMMARY ── */}
        {result?.type==="summary"&&(
          <div className="fadein">
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,marginBottom:14}}>{result.data.title}</h2>
            <ResultCard>{(result.data.bullets||[]).map((b,i)=>(
              <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:i<(result.data.bullets.length-1)?14:0}}>
                <span style={{fontSize:22,flexShrink:0,marginTop:1}}>{b.emoji}</span>
                <p style={{fontSize:15,color:C.text,lineHeight:1.65}}>{b.text}</p>
              </div>
            ))}</ResultCard>
            {result.data.keyTakeaway&&(
              <div style={{background:"rgba(125,211,252,.07)",border:"1px solid rgba(125,211,252,.25)",borderRadius:12,padding:"13px 16px",marginBottom:4}}>
                <span style={{fontWeight:700,fontSize:13,color:C.summary}}>Key Takeaway: </span>
                <span style={{fontSize:14,color:C.mutedL,lineHeight:1.7}}>{result.data.keyTakeaway}</span>
              </div>
            )}
            <ActionRow>
              <button className="iBtn" onClick={()=>copyText((result.data.bullets||[]).map(b=>`${b.emoji} ${b.text}`).join("\n")+"\n\nKey Takeaway: "+result.data.keyTakeaway,"sum")}>{copied==="sum"?"✓ Copied!":"📋 Copy"}</button>
              <button className="iBtn" onClick={download}>⬇ Download</button>
              <button className="iBtn" onClick={shareResult}>🔗 Share</button>
              <button className="iBtn" onClick={resetAll} style={{marginLeft:"auto"}}>↩ New file</button>
            </ActionRow>
          </div>
        )}

        {/* ── FILL BLANKS ── */}
        {result?.type==="blank"&&(
          <div className="fadein">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20}}>{result.data.title}</h2>
              {submitted&&(()=>{const c=result.data.sentences.filter(s=>blanks[s.id]?.trim().toLowerCase()===s.answer.toLowerCase()).length;return<span style={{background:"rgba(124,111,255,.15)",border:"1px solid rgba(124,111,255,.3)",borderRadius:9,padding:"5px 12px",fontSize:13,color:C.primary}}>{c}/{result.data.sentences.length}</span>;})()}
            </div>
            <ResultCard>
              {(result.data.sentences||[]).map((s,i)=>{
                const val=blanks[s.id]||"";
                const isOk=submitted&&val.trim().toLowerCase()===s.answer.toLowerCase();
                const isNg=submitted&&val.trim()&&!isOk;
                return(
                  <div key={s.id} style={{marginBottom:i<result.data.sentences.length-1?16:0,fontSize:15,lineHeight:2.2,color:C.text}}>
                    <span style={{color:C.muted,fontSize:11,marginRight:7}}>#{i+1}</span>
                    {s.before}
                    <input className={`bin${isOk?" bok":isNg?" bng":""}`} value={val}
                      onChange={e=>setBlanks(p=>({...p,[s.id]:e.target.value}))}
                      disabled={submitted} placeholder="___"
                      style={{width:Math.max(70,s.answer.length*11+20)+"px"}}/>
                    {s.after}
                    {isNg&&<span style={{fontSize:12,color:C.correct,marginLeft:8}}>→ {s.answer}</span>}
                    {isOk&&<span style={{fontSize:13,color:C.correct,marginLeft:6}}>✓</span>}
                  </div>
                );
              })}
            </ResultCard>
            <ActionRow>
              {!submitted
                ?<button className="gbtn" onClick={()=>setSubmitted(true)} style={{maxWidth:160,padding:"10px 20px",fontSize:14}}>Check answers</button>
                :<button className="iBtn" onClick={()=>{setBlanks({});setSubmitted(false);}}>🔁 Try again</button>
              }
              <button className="iBtn" onClick={download}>⬇ Download</button>
              <button className="iBtn" onClick={shareResult}>🔗 Share</button>
              <button className="iBtn" onClick={resetAll} style={{marginLeft:"auto"}}>↩ New file</button>
            </ActionRow>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",marginTop:44,paddingTop:18,borderTop:`1px solid ${C.border}`,color:C.muted,fontSize:12}}>
          Powered by Viatrix
        </div>

      </div>
    </div>
  );
}
