import { BookOpen, Library, Search, Settings2, Sparkles } from "lucide-react";
import { DictionaryDemo } from "@/components/DictionaryDemo";

const Index = () => (
  <main className="app-shell">
    <aside className="app-rail" aria-label="Primary navigation">
      <div className="brand-mark" aria-label="SuperBook"><BookOpen size={21} strokeWidth={1.8} /></div>
      <nav className="rail-nav">
        <button className="rail-button active" aria-label="Reader" title="Reader"><Library size={19} /></button>
        <button className="rail-button" aria-label="Search" title="Search"><Search size={19} /></button>
        <button className="rail-button" aria-label="Discover" title="Discover"><Sparkles size={19} /></button>
      </nav>
      <button className="rail-button rail-settings" aria-label="Settings" title="Settings"><Settings2 size={19} /></button>
    </aside>
    <section className="workspace">
      <header className="topbar">
        <div><p className="eyebrow">SuperBook Reader</p><h1>The art of finding the right word</h1></div>
        <div className="reading-status"><span />Reading mode</div>
      </header>
      <DictionaryDemo />
    </section>
  </main>
);

export default Index;
