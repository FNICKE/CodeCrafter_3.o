import { useEffect, useState } from 'react';
import { listResearchDocs, addResearchNote, uploadResearchDoc, deleteResearchDoc } from '../api';
import toast from 'react-hot-toast';
import { FileText, Link2, Upload, Trash2, BookOpen } from 'lucide-react';

const API_ORIGIN = 'http://localhost:5000';

export default function ResearchLibrary() {
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

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={24} /> Research library
        </h1>
        <p className="page-subtitle">
          Own your research reports and notes in one place — complements live market and news feeds.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        <form className="card" onSubmit={addUrl}>
          <h3 style={{ fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link2 size={18} /> Save external report URL
          </h3>
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 10 }} />
          <input className="input" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} style={{ marginBottom: 12 }} />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save link
          </button>
        </form>

        <form className="card" onSubmit={addNote}>
          <h3 style={{ fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} /> Quick note
          </h3>
          <input className="input" placeholder="Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} style={{ marginBottom: 10 }} />
          <textarea className="input" rows={3} placeholder="Thesis, bullets, or citations" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} style={{ marginBottom: 12 }} />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Add note
          </button>
        </form>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={18} /> Upload PDF
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Max ~12MB. Stored in your workspace.</p>
          <label className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', cursor: uploading ? 'wait' : 'pointer' }}>
            {uploading ? 'Uploading…' : 'Choose PDF'}
            <input type="file" accept=".pdf" hidden onChange={onUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>Your documents</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No items yet — add a URL, note, or PDF.</p>
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
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{d.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {d.source_type} · {new Date(d.created_at).toLocaleString()}
                  </div>
                  {d.source_url && (
                    <a href={d.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
                      Open link
                    </a>
                  )}
                  {d.file_path && (
                    <a href={`${API_ORIGIN}/${d.file_path}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
                      Open PDF
                    </a>
                  )}
                  {d.excerpt && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{d.excerpt.slice(0, 280)}</p>
                  )}
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => remove(d.id)} aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
