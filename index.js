import { useState, useEffect } from 'react';
import Head from 'next/head';

const LANGUAGES = [
  "Inglês","Mandarim","Hindi","Espanhol","Francês",
  "Árabe","Bengali","Português","Russo","Urdu",
  "Indonésio","Alemão","Japonês","Suaíli","Marata",
  "Telugu","Turco","Tâmil","Cantonês","Vietnamita"
];

export default function Home() {
  const [authenticated, setAuthenticated] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedLang, setSelectedLang] = useState('Alemão');
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => { fetchVideos(); }, []);

  async function fetchVideos() {
    try {
      const res = await fetch('/api/videos');
      if (res.status === 401) { setAuthenticated(false); setLoading(false); return; }
      const data = await res.json();
      setVideos(data.videos || []);
      setAuthenticated(true);
    } catch { setAuthenticated(false); }
    setLoading(false);
  }

  async function translate() {
    if (!selectedVideo) return;
    setTranslating(true); setTranslation(null); setStatus('');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedVideo.snippet.title,
          description: selectedVideo.snippet.description,
          language: selectedLang
        })
      });
      setTranslation(await res.json());
    } catch { setStatus('error'); }
    setTranslating(false);
  }

  async function applyTranslation() {
    if (!translation || !selectedVideo) return;
    setApplying(true); setStatus('');
    try {
      const res = await fetch('/api/update-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo.id.videoId,
          langCode: translation.langCode,
          title: translation.title,
          description: translation.description
        })
      });
      const data = await res.json();
      setStatus(data.success ? 'applied' : 'error');
    } catch { setStatus('error'); }
    setApplying(false);
  }

  const s = {
    page: { background: '#121116', color: '#f2f0f7', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh', margin: 0, padding: '32px 20px 60px' },
    wrap: { maxWidth: '1020px', margin: '0 auto' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
    eyebrow: { fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#22d3ee', marginBottom: '6px' },
    h1: { fontSize: '30px', fontWeight: '700', margin: '0 0 8px', letterSpacing: '-0.01em' },
    subtitle: { color: '#a29db3', fontSize: '14.5px', margin: '0 0 28px', lineHeight: '1.6', maxWidth: '520px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    primaryBtn: { background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
    applyBtn: { background: '#059669', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    backBtn: { background: 'transparent', color: '#a29db3', border: '1px solid #34303e', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' },
    videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px' },
    videoCard: { background: '#1c1a22', border: '1px solid #34303e', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.1s' },
    thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' },
    videoInfo: { padding: '12px' },
    videoTitle: { fontSize: '13.5px', fontWeight: '500', marginBottom: '4px', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
    videoDate: { fontSize: '12px', color: '#a29db3' },
    selectedBox: { display: 'flex', gap: '14px', alignItems: 'center', background: '#1c1a22', border: '1px solid #34303e', borderRadius: '12px', padding: '14px', marginBottom: '20px' },
    selectedThumb: { width: '110px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 },
    langRow: { display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '22px' },
    langChip: { background: '#1c1a22', border: '1px solid #34303e', color: '#a29db3', borderRadius: '999px', padding: '7px 15px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
    langChipActive: { background: 'rgba(139,92,246,0.15)', border: '1px solid #8b5cf6', color: '#f2f0f7' },
    panels: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' },
    panel: { background: '#1c1a22', border: '1px solid #34303e', borderRadius: '14px', padding: '18px' },
    panelLabel: { fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.1em', color: '#a29db3', marginBottom: '14px', textTransform: 'uppercase' },
    fieldLabel: { fontSize: '12px', color: '#a29db3', marginBottom: '5px', fontWeight: '500' },
    textBox: { background: '#26232e', border: '1px solid #34303e', borderRadius: '8px', padding: '10px 12px', fontSize: '13.5px', marginBottom: '14px', minHeight: '42px', color: '#f2f0f7', lineHeight: '1.5' },
    descBox: { background: '#26232e', border: '1px solid #34303e', borderRadius: '8px', padding: '10px 12px', fontSize: '13.5px', minHeight: '150px', color: '#f2f0f7', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowY: 'auto' },
    actions: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
    statusOk: { fontFamily: 'monospace', fontSize: '13px', color: '#22d3ee' },
    statusErr: { fontFamily: 'monospace', fontSize: '13px', color: '#f87171' },
    connectBox: { textAlign: 'center', maxWidth: '480px' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#121116', color: '#a29db3', fontFamily: 'system-ui,sans-serif' }
  };

  if (loading) return <div style={s.loading}>A carregar...</div>;

  if (!authenticated) return (
    <div style={{ ...s.page, ...s.center }}>
      <Head><title>Buticonelas Tradutor</title></Head>
      <div style={s.connectBox}>
        <div style={s.eyebrow}>BUTICONELAS SHOW</div>
        <h1 style={s.h1}>Tradutor de Vídeos</h1>
        <p style={s.subtitle}>Liga a tua conta do YouTube para traduzir automaticamente os títulos e descrições dos teus vídeos para 20 línguas.</p>
        <a href="/api/auth" style={s.primaryBtn}>Ligar conta do YouTube</a>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <Head><title>Buticonelas Tradutor</title></Head>
      <div style={s.wrap}>
        <div style={s.header}>
          <div>
            <div style={s.eyebrow}>BUTICONELAS SHOW</div>
            <h1 style={s.h1}>Tradutor de Vídeos</h1>
          </div>
          {selectedVideo && (
            <button onClick={() => { setSelectedVideo(null); setTranslation(null); setStatus(''); }} style={s.backBtn}>
              ← Todos os vídeos
            </button>
          )}
        </div>

        {!selectedVideo ? (
          <div>
            <p style={s.subtitle}>Seleciona o vídeo que queres traduzir:</p>
            <div style={s.videoGrid}>
              {videos.map(v => (
                <div
                  key={v.id.videoId}
                  style={s.videoCard}
                  onClick={() => { setSelectedVideo(v); setTranslation(null); setStatus(''); }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#34303e'; e.currentTarget.style.transform = 'none'; }}
                >
                  <img src={v.snippet.thumbnails?.medium?.url} style={s.thumbnail} alt="" />
                  <div style={s.videoInfo}>
                    <div style={s.videoTitle}>{v.snippet.title}</div>
                    <div style={s.videoDate}>{new Date(v.snippet.publishedAt).toLocaleDateString('pt-PT')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={s.selectedBox}>
              <img src={selectedVideo.snippet.thumbnails?.medium?.url} style={s.selectedThumb} alt="" />
              <div>
                <div style={{ ...s.videoTitle, fontSize: '14.5px', marginBottom: '4px' }}>{selectedVideo.snippet.title}</div>
                <div style={s.videoDate}>Vídeo selecionado</div>
              </div>
            </div>

            <div style={s.langRow}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => { setSelectedLang(lang); setTranslation(null); setStatus(''); }}
                  style={lang === selectedLang ? { ...s.langChip, ...s.langChipActive } : s.langChip}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div style={s.panels}>
              <div style={s.panel}>
                <div style={s.panelLabel}>Original</div>
                <div style={s.fieldLabel}>Título</div>
                <div style={s.textBox}>{selectedVideo.snippet.title}</div>
                <div style={s.fieldLabel}>Descrição</div>
                <div style={s.descBox}>{selectedVideo.snippet.description || '(sem descrição)'}</div>
              </div>

              <div style={s.panel}>
                <div style={s.panelLabel}>Tradução — {selectedLang}</div>
                <div style={s.fieldLabel}>Título</div>
                <div style={{ ...s.textBox, color: translation ? '#f2f0f7' : '#a29db3', fontStyle: translation ? 'normal' : 'italic' }}>
                  {translating ? 'A traduzir...' : (translation?.title || 'A tradução aparece aqui.')}
                </div>
                <div style={s.fieldLabel}>Descrição</div>
                <div style={{ ...s.descBox, color: translation ? '#f2f0f7' : '#a29db3', fontStyle: translation ? 'normal' : 'italic' }}>
                  {translating ? 'A traduzir...' : (translation?.description || 'A tradução aparece aqui.')}
                </div>
              </div>
            </div>

            <div style={s.actions}>
              <button onClick={translate} disabled={translating} style={{ ...s.primaryBtn, opacity: translating ? 0.6 : 1 }}>
                {translating ? 'A traduzir...' : `Traduzir para ${selectedLang}`}
              </button>
              {translation && status !== 'applied' && (
                <button onClick={applyTranslation} disabled={applying} style={{ ...s.applyBtn, opacity: applying ? 0.6 : 1 }}>
                  {applying ? 'A aplicar...' : '✓ Aplicar no YouTube'}
                </button>
              )}
              {status === 'applied' && <span style={s.statusOk}>✓ Tradução aplicada com sucesso no YouTube!</span>}
              {status === 'error' && <span style={s.statusErr}>Erro. Tenta novamente.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
