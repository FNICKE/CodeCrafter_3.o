import { useEffect, useState } from 'react';
import { listResearchDocs, addResearchNote, uploadResearchDoc, deleteResearchDoc } from '../api';
import toast from 'react-hot-toast';
import { FileText, Link2, Upload, Trash2, BookOpen } from 'lucide-react';

const API_ORIGIN = 'http://localhost:5000';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .rl-root {
    --blue:        #3b9eff;
    --blue-glow:   rgba(59,158,255,.14);
    --blue-border: rgba(59,158,255,.22);
    --obsidian:    #080b0f;
    --surface:     #0e1318;
    --surface2:    #141b22;
    --surface3:    #1c2630;
    --border:      rgba(255,255,255,.06);
    --text:        #e8edf2;
    --muted:       #5a6878;
    --muted2:      #8a9ab0;
    --green:       #34d399;
    --red:         #f87171;
    font-family: 'Instrument Sans', sans-serif;
    background: var(--obsidian);
    color: var(--text);
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  /* Ticker */
  .rl-ticker-wrap { overflow: hidden; background: var(--surface); border-bottom: 1px solid var(--border); }
  .rl-ticker-inner { display: flex; width: max-content; animation: rlTick 42s linear infinite; }
  .rl-ticker-inner:hover { animation-play-state: paused; }
  @keyframes rlTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .rl-ticker-item { padding: 5px 1.75rem; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .04em; white-space: nowrap; }
  .rl-ticker-item.up { color: var(--blue); } .rl-ticker-item.dn { color: var(--red); }

  /* Hero */
  .rl-hero { position: relative; padding: 3rem 0 2.25rem; overflow: hidden; }
  .rl-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 55% 80% at 5% 60%, rgba(59,158,255,.08) 0%, transparent 70%); pointer-events: none; }
  .rl-hero-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 75% 100% at 5% 60%, black 20%, transparent 80%); opacity: .35; }
  .rl-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
  .rl-eyebrow::before { content: ''; width: 2rem; height: 1px; background: var(--blue); display: inline-block; }
  .rl-title { font-family: 'DM Serif Display', serif; font-size: clamp(2.4rem, 5vw, 4.2rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; }
  .rl-title em { font-style: italic; color: var(--blue); }
  .rl-subtitle { color: var(--muted2); font-size: .95rem; margin-top: .65rem; line-height: 1.6; }
  .rl-live { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); animation: rlPulse 2s ease-out infinite; flex-shrink: 0; }
  @keyframes rlPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,158,255,.6) } 50% { box-shadow: 0 0 0 6px rgba(59,158,255,0) } }

  /* Cards */
  .rl-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; margin-bottom: 1.5rem; transition: border-color .25s; padding: 1.5rem; }
  .rl-card:hover { border-color: var(--blue-border); }
  .rl-card-hdr { padding: 0 0 1.25rem 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: .625rem; margin-bottom: 1.25rem; }
  .rl-card-title { font-family: 'DM Serif Display', serif; font-size: 1.3rem; }

  /* Form */
  .rl-input { width: 100%; padding: .6rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: .75rem; color: var(--text); font-size: .875rem; outline: none; font-family: 'Instrument Sans', sans-serif; transition: border-color .2s, box-shadow .2s; }
  .rl-input:focus { border-color: var(--blue-border); box-shadow: 0 0 0 3px var(--blue-glow); }
  .rl-input::placeholder { color: var(--muted); }
  .rl-btn-primary { display: inline-flex; justify-content: center; align-items: center; gap: .4rem; padding: .625rem 1.25rem; background: var(--blue); color: #fff; border: none; border-radius: .75rem; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; font-family: 'Instrument Sans', sans-serif; }
  .rl-btn-primary:hover:not(:disabled) { background: var(--blue-dim, #1a7ee0); box-shadow: 0 4px 16px rgba(59,158,255,.3); }
  .rl-btn-primary:disabled { opacity: .45; cursor: not-allowed; }
  .rl-btn-secondary { display: inline-flex; justify-content: center; align-items: center; gap: .4rem; padding: .625rem 1.25rem; background: var(--surface2); color: var(--text); border: 1px solid var(--border); border-radius: .75rem; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; font-family: 'Instrument Sans', sans-serif; }
  .rl-btn-secondary:hover:not(:disabled) { background: var(--surface3); }
  .rl-btn-ghost { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: .5rem; border: 1px solid var(--border); background: var(--surface2); color: var(--muted2); cursor: pointer; transition: all .15s; }
  .rl-btn-ghost:hover:not(:disabled) { background: var(--surface3); color: var(--red); border-color: rgba(248,113,113,.35); }

  @keyframes rlFadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  .rl-fade { animation: rlFadeUp .4s ease both; }
`;

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

const TICKER_ITEMS = ['AAPL +1.2%','MSFT +0.8%','NVDA +3.4%','GOOGL -0.3%','AMZN +1.7%','META +2.1%','TSLA -1.4%'];

export default function ResearchLibrary() {
  useEffect(() => { injectStyles('rl-styles', CSS); }, []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = () =>
    listResearchDocs()
      .then((r) => setItems(r.data.data || []))
      .catch(() => toast.error('Could not load library'));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const addUrl = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return toast.error('Title and URL required');
    try {
      await addResearchNote({ title: title.trim(), source_type: 'url', source_url: url.trim() });
      setTitle('');
      setUrl('');
      toast.success('Link saved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return toast.error('Title required');
    try {
      await addResearchNote({
        title: noteTitle.trim(),
        source_type: 'note',
        excerpt: noteBody || null,
      });
      setNoteTitle('');
      setNoteBody('');
      toast.success('Note added');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name.replace(/\.pdf$/i, ''));
    setUploading(true);
    try {
      await uploadResearchDoc(fd);
      toast.success('PDF uploaded');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove this document?')) return;
    try {
      await deleteResearchDoc(id);
      toast.success('Removed');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const tickerItemsList = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="rl-root">
      {/* Ticker */}
      <div className="rl-ticker-wrap">
        <div className="rl-ticker-inner">
          {tickerItemsList.map((t, i) => (
            <span key={i} className={`rl-ticker-item ${t.includes('-') ? 'dn' : 'up'}`}>
              {t} <span style={{ color: 'var(--border)', marginLeft: '1rem' }}>|</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.25rem' }}>
        {/* Hero */}
        <div className="rl-hero">
          <div className="rl-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="rl-eyebrow"><span className="rl-live" /> Document Workspace</div>
            <h1 className="rl-title">Research<br /><em>Library</em></h1>
            <p className="rl-subtitle">Own your research reports and notes in one place — complements live market and news feeds.</p>
          </div>
        </div>

        <div className="rl-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <form className="rl-card" onSubmit={addUrl}>
            <div className="rl-card-hdr" style={{ paddingBottom: '12px', marginBottom: '16px' }}>
              <Link2 size={18} color="var(--blue)" />
              <span className="rl-card-title" style={{ fontSize: '1.1rem' }}>Save <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Report</em> URL</span>
            </div>
            <input className="rl-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="rl-input" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} style={{ marginBottom: 16 }} />
            <button type="submit" className="rl-btn-primary" style={{ width: '100%' }}>
              Save link
            </button>
          </form>

          <form className="rl-card" onSubmit={addNote}>
            <div className="rl-card-hdr" style={{ paddingBottom: '12px', marginBottom: '16px' }}>
              <FileText size={18} color="var(--blue)" />
              <span className="rl-card-title" style={{ fontSize: '1.1rem' }}>Quick <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Note</em></span>
            </div>
            <input className="rl-input" placeholder="Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} style={{ marginBottom: 10 }} />
            <textarea className="rl-input" rows={3} placeholder="Thesis, bullets, or citations" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} style={{ marginBottom: 16 }} />
            <button type="submit" className="rl-btn-primary" style={{ width: '100%' }}>
              Add note
            </button>
          </form>

          <div className="rl-card">
            <div className="rl-card-hdr" style={{ paddingBottom: '12px', marginBottom: '16px' }}>
              <Upload size={18} color="var(--blue)" />
              <span className="rl-card-title" style={{ fontSize: '1.1rem' }}>Upload <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>PDF</em></span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>Max ~12MB. Stored in your workspace.</p>
            <label className="rl-btn-secondary" style={{ width: '100%', textAlign: 'center', cursor: uploading ? 'wait' : 'pointer', height: 42 }}>
              {uploading ? 'Uploading…' : 'Choose PDF'}
              <input type="file" accept=".pdf" hidden onChange={onUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="rl-card rl-fade" style={{ animationDelay: '0.1s' }}>
          <div className="rl-card-hdr">
            <BookOpen size={18} color="var(--blue)" />
            <span className="rl-card-title">Your <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Documents</em></span>
          </div>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No items yet — add a URL, note, or PDF.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '16px',
                    borderRadius: '0.875rem',
                    border: '1px solid var(--border)',
                    background: 'var(--surface2)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {d.source_type} · {new Date(d.created_at).toLocaleString()}
                    </div>
                    {d.source_url && (
                      <a href={d.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--blue)', textDecoration: 'none' }}>
                        <Link2 size={14} /> Open link
                      </a>
                    )}
                    {d.file_path && (
                      <a href={`${API_ORIGIN}/${d.file_path}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--blue)', textDecoration: 'none' }}>
                        <FileText size={14} /> Open PDF
                      </a>
                    )}
                    {d.excerpt && (
                      <p style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 8, lineHeight: 1.5, background: 'var(--surface3)', padding: '12px', borderRadius: '8px' }}>{d.excerpt.slice(0, 280)}</p>
                    )}
                  </div>
                  <button type="button" className="rl-btn-ghost" onClick={() => remove(d.id)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

