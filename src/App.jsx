import { useEffect, useMemo, useState } from "react";
import { Clipboard, ExternalLink, Search, RefreshCcw, Check } from "lucide-react";

export default function App(){
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("pv533_tab") || "");
  const [category, setCategory] = useState(() => localStorage.getItem("pv533_cat") || "");
  const [q, setQ] = useState("");
  const [count, setCount] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState(null);

  useEffect(()=>localStorage.setItem("pv533_tab", activeTab),[activeTab]);
  useEffect(()=>localStorage.setItem("pv533_cat", category),[category]);

  async function loadJson(){
    try{
      const res = await fetch("/prompts.json", { cache:"no-store" });
      const json = await res.json();
      setData(json);
      setCount(json.length);
      if(!activeTab && json.length){ setActiveTab(json[0].fane); }
    }catch(e){ console.error(e); alert("Kunne ikke læse prompts.json"); }
  }
  useEffect(()=>{ loadJson(); },[]);

  const tabs = useMemo(()=> Array.from(new Set(data.map(x=>x.fane))), [data]);

  const catCounts = useMemo(()=>{
    const map = new Map();
    for(const x of data){
      if(activeTab && x.fane !== activeTab) continue;
      const key = x.kategori || "(uden kategori)";
      map.set(key, (map.get(key)||0) + 1);
    }
    return Array.from(map.entries()).sort((a,b)=> a[0].localeCompare(b[0]));
  }, [data, activeTab]);

  const visiblePrompts = useMemo(()=>{
    return data
      .filter(x => (!activeTab || x.fane===activeTab) && (!category || x.kategori===category))
      .map(x=>x.prompt)
      .filter(p => p && (!q || p.toLowerCase().includes(q.toLowerCase())));
  },[data, activeTab, category, q]);

  function copyPrompt(p, idx){
    navigator.clipboard?.writeText(p).then(()=>{
      setCopiedIdx(idx);
      setTimeout(()=> setCopiedIdx(null), 1200);
    }).catch(()=>{});
  }
  function openChatGPT(){ window.open("https://chat.openai.com/", "_blank"); }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto p-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">Prompt Vault v5.3.3</h1>
            <p className="text-xs text-slate-500">{count.toLocaleString()} prompts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={openChatGPT} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white"><ExternalLink className="w-4 h-4"/>Åbn ChatGPT</button>
            <button onClick={loadJson} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100"><RefreshCcw className="w-4 h-4"/>Genindlæs</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-3 pb-2 flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={()=>{setActiveTab(t); setCategory("");}} className={"px-3 py-1.5 rounded-full border " + (activeTab===t ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300")}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-3 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <aside className="sm:col-span-4 lg:col-span-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Søg i prompts…" className="w-full pl-9 rounded-xl border border-slate-300 px-3 py-2"/>
            </div>
            <div className="max-h-[65vh] overflow-auto pr-1">
              <button onClick={()=>setCategory("")} className={"w-full text-left px-3 py-2 rounded-lg mb-1 " + (category==="" ? "bg-slate-900 text-white" : "hover:bg-white border border-slate-200")}>
                Alle kategorier
              </button>
              {catCounts.map(([cat, n]) => (
                <button key={cat} onClick={()=>setCategory(cat)} className={"w-full text-left px-3 py-2 rounded-lg mb-1 border " + (category===cat ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:bg-slate-100")}>
                  <span className="truncate inline-block max-w-[80%] align-middle">{cat}</span>
                  <span className="float-right text-xs opacity-70">{n}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="sm:col-span-8 lg:col-span-9">
          {!!category && <h2 className="text-lg font-semibold mb-2">{category}</h2>}
          <ul className="space-y-3">
            {visiblePrompts.map((p, idx) => (
              <li key={idx} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                <pre className="whitespace-pre-wrap text-[15px] leading-relaxed">{p}</pre>
                <div className="mt-2">
                  <button onClick={()=>copyPrompt(p, idx)} className={"inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border " + (copiedIdx===idx? "bg-green-600 border-green-600 text-white" : "border-slate-300 bg-white")}>
                    {copiedIdx===idx ? <Check className="w-4 h-4"/> : <Clipboard className="w-4 h-4"/>}
                    {copiedIdx===idx ? "Kopieret!" : "Kopiér"}
                  </button>
                </div>
              </li>
            ))}
            {visiblePrompts.length===0 && <li className="text-slate-500">Ingen prompts matcher.</li>}
          </ul>
        </main>
      </div>
    </div>
  );
}
