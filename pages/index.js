import { useState, useEffect } from 'react';
import Head from 'next/head';

const ALL_LANGUAGES = [
  'Abcázio','Afar','Africâner','Aimará','Akan','Albanês','Alemão','Alemão (Alemanha)',
  'Alemão (Áustria)','Alemão (Suíça)','Alto sorábio','Amárico','Árabe','Armênio',
  'Assamês','Azerbaijano','Baixo sorábio','Bambara','Basco','Bashkir','Bengali',
  'Bengali (Índia)','Bhojpuri','Bielorrusso','Birmanês','Bislamá','Bodo','Bósnio',
  'Bretão','Búlgaro','Canarim','Cantonês','Cantonês (Hong Kong)','Catalão','Caxemira',
  'Cazaque','Cheroqui','Chinês','Chinês (China)','Chinês (Hong Kong)','Chinês (simplificado)',
  'Chinês (Singapura)','Chinês (Taiwan)','Chinês (tradicional)','Cingalês','Concani',
  'Coreano','Corso','Croata','Curdo','Dinamarquês','Dogri','Dzonga','Eslovaco','Esloveno',
  'Espanhol','Espanhol (América Latina)','Espanhol (Espanha)','Espanhol (Estados Unidos)',
  'Espanhol (México)','Esperanto','Estoniano','Ewe','Feroês','Fijiano','Filipino',
  'Finlandês','Francês','Francês (Bélgica)','Francês (Canadá)','Francês (França)',
  'Francês (Suíça)','Frísio ocidental','Fula','Gaélico escocês','Galego','Galês',
  'Georgiano','Grego','Groenlandês','Guarani','Gusii','Guzerate','Haitiano','Hauçá',
  'Havaiano','Hebraico','Hindi','Hindi (latim)','Holandês','Holandês (Bélgica)',
  'Holandês (Países Baixos)','Húngaro','Igbo','Iídiche','Indonésio','Inglês (Austrália)',
  'Inglês (Canadá)','Inglês (Estados Unidos)','Inglês (Índia)','Inglês (Irlanda)',
  'Inglês (Reino Unido)','Inuktitut','Iorubá','Irlandês','Islandês','Italiano','Japonês',
  'Javanês','Kalenjin','Kamba','Khmer','Laosiano','Latim','Letão','Lingala','Lituano',
  'Luba-catanga','Luganda','Luo','Luxemburguês','Luyia','Macedônio','Maithili','Malaiala',
  'Malaio','Malaio (Singapura)','Malgaxe','Maltês','Maori','Marati','Massai','Meru',
  'Mongol','Nauruano','Navajo','Ndebele do norte','Ndebele do sul','Nepalês','Norueguês',
  'Occitânico','Oriá','Oromo','Panjabi','Papiamento','Pashto','Persa','Persa (Afeganistão)',
  'Persa (Irã)','Pidgin nigeriano','Polonês','Português','Português (Brasil)',
  'Português (Portugal)','Quíchua','Quiniaruanda','Quirguiz','Romanche','Romeno',
  'Romeno (Moldávia)','Rundi','Russo','Samoano','Sango','Sânscrito','Sardo','Sérvio',
  'Sérvio (cirílico)','Sérvio (latim)','Siciliano','Sindi','Somali','Soto do sul',
  'Soto setentrional','Suaíli','Suázi','Sueco','Sundanês','Tadjique','Tagalo','Tailandês',
  'Tâmil','Tártaro','Tcheco','Télugo','Tibetano','Tigrínia','Tok pisin','Tonganês',
  'Tsonga','Tswana','Turco','Turcomeno','Twi','Ucraniano','Uigur','Uolofe','Urdu',
  'Uzbeque','Venda','Vietnamita','Xhosa','Xona','Zulu'
];

// Channel colors for badges
const CHANNEL_COLORS = ['#8b5cf6','#22d3ee','#f59e0b','#10b981','#f43f5e'];

export default function Home() {
  const [authenticated, setAuthenticated] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedLang, setSelectedLang] = useState('Alemão');
  const [langSearch, setLangSearch] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState('');
  const [channelFilter, setChannelFilter] = useState('Todos');

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

  // Unique channels
  const channels = ['Todos', ...new Set(videos.map(v => v.snippet.channelTitle))];
  const channelColorMap = {};
  channels.filter(c => c !== 'Todos').forEach((c, i) => {
    channelColorMap[c] = CHANNEL_COLORS[i % CHANNEL_COLORS.length];
  });

  const filteredVideos = channelFilter === 'Todos'
    ? videos
    : videos.filter(v => v.snippet.channelTitle === channelFilter);

  const filteredLangs = ALL_LANGUAGES.filter(l =>
    l.toLowerCase().includes(langSearch.toLowerCase())
  );

  const s = {
    page: { background: '#121116', color: '#f2f0f7', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh', margin: 0, padding: '32px 20px 60px' },
    wrap: { maxWidth: '1060px', margin: '0 auto' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
    eyebrow: { fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#22d3ee', marginBottom: '6px' },
    h1: { fontSize: '30px', fontWeight: '700', margin: '0 0 8px', letterSpacing: '-0.01em' },
    subtitle: { color: '#a29db3', fontSize: '14px', margin: '0 0 24px', lineHeight: '1.6' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
    primaryBtn: { background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
    applyBtn: { background: '#059669', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    backBtn: { background: 'transparent', color: '#a29db3', border: '1px solid #34303e', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' },
    channelRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' },
    channelChip: { padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: '1px solid #34303e', background: '#1c1a22', color: '#a29db3' },
    videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' },
    videoCard: { background: '#1c1a22', border: '1px solid #34303e', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.1s' },
    thumbnail: { width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' },
    videoInfo: { padding: '11px 12px' },
    videoTitle: { fontSize: '13px', fontWeight: '500', marginBottom: '6px', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
    channelBadge: { display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', marginBottom: '3px' },
    videoDate: { fontSize: '11px', color: '#a29db3' },
    selectedBox: { display: 'flex', gap: '14px', alignItems: 'center', background: '#1c1a22', border: '1px solid #34303e', borderRadius: '12px', padding: '14px', marginBottom: '18px' },
    selectedThumb: { width: '100px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 },
    // Language selector
    langSelector: { marginBottom: '20px', position: 'relative', maxWidth: '360px' },
    langLabel: { fontSize: '12px', color: '#a29db3', marginBottom: '6px', fontWeight: '500' },
    langInput: { width: '100%', background: '#1c1a22', border: '1px solid #8b5cf6', borderRadius: '8px', color: '#f2f0f7', fontFamily: 'system-ui,sans-serif', fontSize: '14px', padding: '9px 12px', boxSizing: 'border-box' },
    langDropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#1c1a22', border: '1px solid #34303e', borderRadius: '8px', maxHeight: '220px', overflowY: 'auto', zIndex: 100, marginTop: '4px' },
    langOption: { padding: '9px 12px', fontSize: '13.5px', cursor: 'pointer' },
    panels: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' },
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
        <p style={s.subtitle}>Liga a tua conta do YouTube para traduzir automaticamente os títulos e descrições dos teus vídeos.</p>
        <a href="/api/auth" style={s.primaryBtn}>Ligar conta do YouTube</a>
      </div>
    </div>
  );

  return (
    <div style={s.page} onClick={() => langOpen && setLangOpen(false)}>
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
            {/* Channel filter */}
            <div style={s.channelRow}>
              {channels.map(ch => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  style={{
                    ...s.channelChip,
                    background: channelFilter === ch ? (ch === 'Todos' ? '#8b5cf6' : channelColorMap[ch]) : '#1c1a22',
                    color: channelFilter === ch ? 'white' : '#a29db3',
                    border: `1px solid ${channelFilter === ch ? 'transparent' : '#34303e'}`
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div style={s.videoGrid}>
              {filteredVideos.map(v => {
                const chColor = channelColorMap[v.snippet.channelTitle] || '#8b5cf6';
                return (
                  <div
                    key={v.id.videoId}
                    style={s.videoCard}
                    onClick={() => { setSelectedVideo(v); setTranslation(null); setStatus(''); }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = chColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#34303e'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <img src={v.snippet.thumbnails?.medium?.url} style={s.thumbnail} alt="" />
                    <div style={s.videoInfo}>
                      <div style={{ ...s.channelBadge, background: chColor + '22', color: chColor }}>
                        {v.snippet.channelTitle}
                      </div>
                      <div style={s.videoTitle}>{v.snippet.title}</div>
                      <div style={s.videoDate}>{new Date(v.snippet.publishedAt).toLocaleDateString('pt-PT')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div style={s.selectedBox}>
              <img src={selectedVideo.snippet.thumbnails?.medium?.url} style={s.selectedThumb} alt="" />
              <div>
                <div style={{ ...s.channelBadge, background: (channelColorMap[selectedVideo.snippet.channelTitle] || '#8b5cf6') + '22', color: channelColorMap[selectedVideo.snippet.channelTitle] || '#8b5cf6', marginBottom: '6px' }}>
                  {selectedVideo.snippet.channelTitle}
                </div>
                <div style={{ ...s.videoTitle, fontSize: '14.5px' }}>{selectedVideo.snippet.title}</div>
              </div>
            </div>

            {/* Language selector */}
            <div style={s.langSelector} onClick={e => e.stopPropagation()}>
              <div style={s.langLabel}>Idioma de destino</div>
              <input
                style={s.langInput}
                value={langOpen ? langSearch : selectedLang}
                placeholder="Pesquisar idioma..."
                onFocus={() => { setLangOpen(true); setLangSearch(''); }}
                onChange={e => setLangSearch(e.target.value)}
              />
              {langOpen && (
                <div style={s.langDropdown}>
                  {filteredLangs.map(lang => (
                    <div
                      key={lang}
                      style={{
                        ...s.langOption,
                        background: lang === selectedLang ? 'rgba(139,92,246,0.2)' : 'transparent',
                        color: lang === selectedLang ? '#f2f0f7' : '#a29db3'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = lang === selectedLang ? 'rgba(139,92,246,0.2)' : 'transparent'}
                      onClick={() => { setSelectedLang(lang); setLangOpen(false); setLangSearch(''); setTranslation(null); setStatus(''); }}
                    >
                      {lang}
                    </div>
                  ))}
                </div>
              )}
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
              {status === 'applied' && <span style={s.statusOk}>✓ Aplicado com sucesso no YouTube!</span>}
              {status === 'error' && <span style={s.statusErr}>Erro. Tenta novamente.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
