import { useState, useEffect } from 'react';
import Head from 'next/head';

const ALL_LANGUAGES = [
  'Abcázio','Afar','Africâner','Aimará','Akan','Albanês','Alemão','Alemão (Alemanha)',
  'Alemão (Áustria)','Alemão (Suíça)','Alto sorábio','Amárico','Árabe','Armênio',
  'Assamês','Azerbaijano','Baixo sorábio','Bambara','Basco','Bashkir','Bengali',
  'Bengali (Índia)','Bhojpuri','Bielorrusso','Birmanês','Bósnio','Bretão','Búlgaro',
  'Canarim','Cantonês','Cantonês (Hong Kong)','Catalão','Cazaque','Chinês',
  'Chinês (China)','Chinês (simplificado)','Chinês (Singapura)','Chinês (Taiwan)',
  'Chinês (tradicional)','Cingalês','Coreano','Corso','Croata','Curdo','Dinamarquês',
  'Eslovaco','Esloveno','Espanhol','Espanhol (América Latina)','Espanhol (Espanha)',
  'Espanhol (Estados Unidos)','Espanhol (México)','Esperanto','Estoniano','Ewe',
  'Feroês','Fijiano','Filipino','Finlandês','Francês','Francês (Bélgica)',
  'Francês (Canadá)','Francês (França)','Francês (Suíça)','Frísio ocidental','Fula',
  'Gaélico escocês','Galego','Galês','Georgiano','Grego','Guarani','Guzerate',
  'Haitiano','Hauçá','Havaiano','Hebraico','Hindi','Hindi (latim)','Holandês',
  'Holandês (Bélgica)','Holandês (Países Baixos)','Húngaro','Igbo','Iídiche',
  'Indonésio','Inglês (Austrália)','Inglês (Canadá)','Inglês (Estados Unidos)',
  'Inglês (Índia)','Inglês (Irlanda)','Inglês (Reino Unido)','Iorubá','Irlandês',
  'Islandês','Italiano','Japonês','Javanês','Khmer','Laosiano','Latim','Letão',
  'Lingala','Lituano','Luxemburguês','Macedônio','Malaiala','Malaio',
  'Malaio (Singapura)','Malgaxe','Maltês','Maori','Marati','Mongol','Nepalês',
  'Norueguês','Occitânico','Oriá','Oromo','Panjabi','Pashto','Persa',
  'Persa (Afeganistão)','Persa (Irã)','Polonês','Português','Português (Brasil)',
  'Português (Portugal)','Quíchua','Quiniaruanda','Quirguiz','Romanche','Romeno',
  'Russo','Samoano','Sânscrito','Sérvio','Sérvio (cirílico)','Sérvio (latim)',
  'Sindi','Somali','Soto do sul','Suaíli','Sueco','Sundanês','Tadjique','Tagalo',
  'Tailandês','Tâmil','Tcheco','Télugo','Tibetano','Turco','Turcomeno','Ucraniano',
  'Urdu','Uzbeque','Vietnamita','Xhosa','Zulu'
];

const CHANNEL_COLORS = ['#8b5cf6','#22d3ee','#f59e0b','#10b981','#f43f5e'];
const BATCH_SIZE = 20;

export default function Home() {
  const [authenticated, setAuthenticated] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [channelFilter, setChannelFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [selectedLang, setSelectedLang] = useState('Alemão');
  const [langSearch, setLangSearch] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState('');
  const [allTranslations, setAllTranslations] = useState(null);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchRunning, setBatchRunning] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);
  const [allStatus, setAllStatus] = useState('');

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

  async function translateOne() {
    if (!selectedVideo) return;
    setTranslating(true); setTranslation(null); setStatus('');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selectedVideo.snippet.title, description: selectedVideo.snippet.description, language: selectedLang })
      });
      setTranslation(await res.json());
    } catch { setStatus('error'); }
    setTranslating(false);
  }

  async function applyOne() {
    if (!translation || !selectedVideo) return;
    setApplying(true); setStatus('');
    try {
      const res = await fetch('/api/update-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedVideo.id.videoId, langCode: translation.langCode, title: translation.title, description: translation.description })
      });
      setStatus((await res.json()).success ? 'applied' : 'error');
    } catch { setStatus('error'); }
    setApplying(false);
  }

  async function translateAll() {
    if (!selectedVideo) return;
    setBatchRunning(true); setAllTranslations(null); setAllStatus('');
    const batches = [];
    for (let i = 0; i < ALL_LANGUAGES.length; i += BATCH_SIZE) batches.push(ALL_LANGUAGES.slice(i, i + BATCH_SIZE));
    setBatchTotal(batches.length); setBatchProgress(0);
    const allResults = {};
    const GROUP = 3;
    for (let g = 0; g < batches.length; g += GROUP) {
      const group = batches.slice(g, g + GROUP);
      const results = await Promise.all(group.map(batch =>
        fetch('/api/translate-batch', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: selectedVideo.snippet.title, description: selectedVideo.snippet.description, languages: batch })
        }).then(r => r.json()).then(d => d.translations || {}).catch(() => ({}))
      ));
      results.forEach(r => Object.assign(allResults, r));
      setBatchProgress(prev => Math.min(prev + group.length, batches.length));
    }
    setAllTranslations(allResults);
    setBatchRunning(false);
  }

  async function applyAll() {
    if (!allTranslations || !selectedVideo) return;
    setApplyingAll(true); setAllStatus('');
    const localizations = {};
    for (const [, trans] of Object.entries(allTranslations)) {
      if (trans.langCode && trans.title) localizations[trans.langCode] = { title: trans.title, description: trans.description || '' };
    }
    try {
      const res = await fetch('/api/apply-all', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedVideo.id.videoId, localizations })
      });
      const data = await res.json();
      setAllStatus(data.success ? `ok:${data.count}` : `err:${data.error || 'Erro desconhecido'}`);
    } catch (e) { setAllStatus(`err:${e.message}`); }
    setApplyingAll(false);
  }

  const channels = ['Todos', ...new Set(videos.map(v => v.snippet.channelTitle).filter(Boolean))];
  const colorMap = {};
  channels.filter(c => c !== 'Todos').forEach((c, i) => { colorMap[c] = CHANNEL_COLORS[i % 5]; });

  const TYPE_LABELS = { video: 'Vídeo', live: 'Live', short: 'Short' };
  const TYPE_ICONS = { video: '🎬', live: '🔴', short: '⚡' };

  const filteredVideos = videos
    .filter(v => channelFilter === 'Todos' || v.snippet.channelTitle === channelFilter)
    .filter(v => typeFilter === 'Todos' || v.type === typeFilter);

  const typeCounts = { Todos: videos.filter(v => channelFilter === 'Todos' || v.snippet.channelTitle === channelFilter).length };
  ['video','live','short'].forEach(t => {
    typeCounts[t] = videos.filter(v => v.type === t && (channelFilter === 'Todos' || v.snippet.channelTitle === channelFilter)).length;
  });

  const filteredLangs = ALL_LANGUAGES.filter(l => l.toLowerCase().includes(langSearch.toLowerCase()));

  const s = {
    page: { background: '#121116', color: '#f2f0f7', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh', margin: 0, padding: '32px 20px 60px' },
    wrap: { maxWidth: '1060px', margin: '0 auto' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
    eyebrow: { fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#22d3ee', marginBottom: '6px' },
    h1: { fontSize: '30px', fontWeight: '700', margin: '0 0 8px', letterSpacing: '-0.01em' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    primaryBtn: { background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
    applyBtn: { background: '#059669', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    allBtn: { background: 'linear-gradient(135deg,#f59e0b,#f43f5e)', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    backBtn: { background: 'transparent', color: '#a29db3', border: '1px solid #34303e', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' },
    logoutBtn: { background: 'transparent', color: '#f87171', border: '1px solid #f8717144', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
    chipRow: { display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '10px' },
    chip: { padding: '6px 13px', borderRadius: '999px', fontSize: '12.5px', fontWeight: '500', cursor: 'pointer', border: '1px solid #34303e', background: '#1c1a22', color: '#a29db3' },
    videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' },
    videoCard: { background: '#1c1a22', border: '1px solid #34303e', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'border-color .15s, transform .1s' },
    thumb: { width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' },
    cardBody: { padding: '11px 12px' },
    badgeRow: { display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'center' },
    badge: { display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '999px' },
    typeBadge: { display: 'inline-block', fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', background: '#26232e', color: '#a29db3' },
    cardTitle: { fontSize: '13px', fontWeight: '500', marginBottom: '4px', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
    cardDate: { fontSize: '11px', color: '#a29db3' },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: '#a29db3' },
    selBox: { display: 'flex', gap: '14px', alignItems: 'center', background: '#1c1a22', border: '1px solid #34303e', borderRadius: '12px', padding: '14px', marginBottom: '18px' },
    selThumb: { width: '100px', borderRadius: '8px', flexShrink: 0, objectFit: 'cover' },
    langWrap: { position: 'relative', maxWidth: '340px', marginBottom: '16px' },
    langLabel: { fontSize: '12px', color: '#a29db3', marginBottom: '5px', fontWeight: '500' },
    langInput: { width: '100%', background: '#1c1a22', border: '1px solid #8b5cf6', borderRadius: '8px', color: '#f2f0f7', fontSize: '14px', padding: '9px 12px', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif' },
    langDrop: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#1c1a22', border: '1px solid #34303e', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', zIndex: 100, marginTop: '4px' },
    langOpt: { padding: '8px 12px', fontSize: '13.5px', cursor: 'pointer' },
    panels: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' },
    panel: { background: '#1c1a22', border: '1px solid #34303e', borderRadius: '14px', padding: '18px' },
    panelLbl: { fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.1em', color: '#a29db3', marginBottom: '12px', textTransform: 'uppercase' },
    fldLbl: { fontSize: '12px', color: '#a29db3', marginBottom: '5px', fontWeight: '500' },
    tbox: { background: '#26232e', border: '1px solid #34303e', borderRadius: '8px', padding: '10px 12px', fontSize: '13.5px', marginBottom: '12px', minHeight: '42px', color: '#f2f0f7', lineHeight: '1.5' },
    dbox: { background: '#26232e', border: '1px solid #34303e', borderRadius: '8px', padding: '10px 12px', fontSize: '13.5px', minHeight: '130px', color: '#f2f0f7', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowY: 'auto' },
    divider: { border: 'none', borderTop: '1px solid #34303e', margin: '20px 0' },
    allBox: { background: '#1c1a22', border: '1px solid #f59e0b44', borderRadius: '14px', padding: '20px', marginBottom: '16px' },
    allTitle: { fontSize: '15px', fontWeight: '700', marginBottom: '4px', background: 'linear-gradient(135deg,#f59e0b,#f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    allDesc: { fontSize: '13px', color: '#a29db3', marginBottom: '16px' },
    progress: { background: '#26232e', borderRadius: '999px', height: '8px', overflow: 'hidden', marginBottom: '10px' },
    progressBar: { height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#f59e0b,#f43f5e)', transition: 'width .3s ease' },
    infoBox: { background: '#26232e', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#a29db3', lineHeight: '1.6' },
    actions: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
    statusOk: { fontFamily: 'monospace', fontSize: '13px', color: '#22d3ee' },
    statusErr: { fontFamily: 'monospace', fontSize: '12px', color: '#f87171', maxWidth: '400px' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#121116', color: '#a29db3' }
  };

  if (loading) return <div style={s.loading}>A carregar...</div>;

  if (!authenticated) return (
    <div style={{ ...s.page, ...s.center }}>
      <Head><title>Buticonelas Tradutor</title></Head>
      <div style={{ textAlign: 'center', maxWidth: '520px' }}>
        <div style={s.eyebrow}>BUTICONELAS SHOW</div>
        <h1 style={s.h1}>Tradutor de Vídeos</h1>
        <p style={{ color: '#a29db3', fontSize: '14px', margin: '0 0 8px', lineHeight: '1.6' }}>
          Liga a tua conta do YouTube para traduzires automaticamente os teus vídeos para qualquer língua.
        </p>
        <p style={{ color: '#f59e0b', fontSize: '13px', margin: '0 0 24px', padding: '10px 14px', background: '#f59e0b11', borderRadius: '8px', textAlign: 'left' }}>
          ⚠️ <strong>Importante:</strong> Antes de ligar, vai ao YouTube Studio e certifica-te que estás no canal correto (ex: Buticonelas Show). O tradutor vai aceder aos vídeos desse canal.
        </p>
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
          <div style={s.headerRight}>
            {selectedVideo && <button onClick={() => { setSelectedVideo(null); setTranslation(null); setAllTranslations(null); setStatus(''); setAllStatus(''); }} style={s.backBtn}>← Todos os vídeos</button>}
            <a href="/api/logout" style={s.logoutBtn} title="Trocar de canal">🔄 Trocar canal</a>
          </div>
        </div>

        {!selectedVideo ? (
          <div>
            {/* Channel filter */}
            <div style={s.chipRow}>
              {channels.map(ch => (
                <button key={ch} onClick={() => { setChannelFilter(ch); setTypeFilter('Todos'); }}
                  style={{ ...s.chip, background: channelFilter === ch ? (ch === 'Todos' ? '#8b5cf6' : colorMap[ch] || '#8b5cf6') : '#1c1a22', color: channelFilter === ch ? 'white' : '#a29db3', border: `1px solid ${channelFilter === ch ? 'transparent' : '#34303e'}` }}>
                  {ch}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div style={{ ...s.chipRow, marginBottom: '20px' }}>
              {[['Todos', '📋'], ['video', '🎬'], ['live', '🔴'], ['short', '⚡']].map(([t, icon]) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  style={{ ...s.chip, background: typeFilter === t ? '#26232e' : '#1c1a22', color: typeFilter === t ? '#f2f0f7' : '#a29db3', border: `1px solid ${typeFilter === t ? '#8b5cf6' : '#34303e'}` }}>
                  {icon} {t === 'Todos' ? 'Todos' : TYPE_LABELS[t]} {typeCounts[t] !== undefined ? `(${typeCounts[t === 'Todos' ? 'Todos' : t]})` : ''}
                </button>
              ))}
            </div>

            {filteredVideos.length === 0 ? (
              <div style={s.emptyState}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                <div style={{ fontSize: '15px', marginBottom: '8px' }}>Nenhum vídeo encontrado nesta categoria.</div>
                <div style={{ fontSize: '13px' }}>Se não vês os teus vídeos, clica em <strong>"🔄 Trocar canal"</strong> para re-autorizar com o canal correto.</div>
              </div>
            ) : (
              <div style={s.videoGrid}>
                {filteredVideos.map(v => {
                  const cc = colorMap[v.snippet.channelTitle] || '#8b5cf6';
                  return (
                    <div key={v.id.videoId} style={s.videoCard}
                      onClick={() => { setSelectedVideo(v); setTranslation(null); setAllTranslations(null); setStatus(''); setAllStatus(''); }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = cc; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#34303e'; e.currentTarget.style.transform = 'none'; }}>
                      <img src={v.snippet.thumbnails?.medium?.url} style={s.thumb} alt="" />
                      <div style={s.cardBody}>
                        <div style={s.badgeRow}>
                          <div style={{ ...s.badge, background: cc + '22', color: cc }}>{v.snippet.channelTitle}</div>
                          {v.type && v.type !== 'video' && <div style={s.typeBadge}>{TYPE_ICONS[v.type]} {TYPE_LABELS[v.type]}</div>}
                        </div>
                        <div style={s.cardTitle}>{v.snippet.title}</div>
                        <div style={s.cardDate}>{new Date(v.snippet.publishedAt).toLocaleDateString('pt-PT')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={s.selBox}>
              <img src={selectedVideo.snippet.thumbnails?.medium?.url} style={s.selThumb} alt="" />
              <div>
                <div style={{ ...s.badge, background: (colorMap[selectedVideo.snippet.channelTitle] || '#8b5cf6') + '22', color: colorMap[selectedVideo.snippet.channelTitle] || '#8b5cf6', marginBottom: '6px' }}>
                  {selectedVideo.snippet.channelTitle}
                </div>
                <div style={{ ...s.cardTitle, fontSize: '14.5px' }}>{selectedVideo.snippet.title}</div>
              </div>
            </div>

            {/* Translate ALL */}
            <div style={s.allBox}>
              <div style={s.allTitle}>⚡ Traduzir para TODAS as línguas ({ALL_LANGUAGES.length})</div>
              <div style={s.allDesc}>Um clique traduz e aplica o título e descrição em todas as línguas de uma vez no YouTube Studio.</div>
              {batchRunning && (
                <div>
                  <div style={s.progress}><div style={{ ...s.progressBar, width: `${(batchProgress / batchTotal) * 100}%` }} /></div>
                  <div style={{ fontSize: '13px', color: '#a29db3', marginBottom: '12px' }}>A traduzir lote {batchProgress}/{batchTotal}... ({Math.round((batchProgress / batchTotal) * ALL_LANGUAGES.length)} línguas prontas)</div>
                </div>
              )}
              <div style={s.actions}>
                {!allTranslations && !batchRunning && (
                  <button onClick={translateAll} style={s.allBtn}>⚡ Traduzir TODAS ({ALL_LANGUAGES.length} línguas)</button>
                )}
                {allTranslations && !allStatus && (
                  <>
                    <span style={s.statusOk}>✓ {Object.keys(allTranslations).length} línguas traduzidas!</span>
                    <button onClick={applyAll} disabled={applyingAll} style={{ ...s.applyBtn, opacity: applyingAll ? 0.6 : 1 }}>
                      {applyingAll ? 'A aplicar...' : '✓ Aplicar TODAS no YouTube'}
                    </button>
                    <button onClick={translateAll} style={s.backBtn}>Repetir</button>
                  </>
                )}
                {allStatus.startsWith('ok:') && <span style={s.statusOk}>✓ {allStatus.split(':')[1]} traduções aplicadas!</span>}
                {allStatus.startsWith('err:') && <span style={s.statusErr}>❌ {allStatus.slice(4)}</span>}
              </div>
            </div>

            <hr style={s.divider} />

            {/* Single language */}
            <div style={{ fontSize: '13px', color: '#a29db3', marginBottom: '12px', fontWeight: '500' }}>Ou traduz para uma língua específica:</div>
            <div style={s.langWrap} onClick={e => e.stopPropagation()}>
              <div style={s.langLabel}>Idioma de destino</div>
              <input style={s.langInput} value={langOpen ? langSearch : selectedLang} placeholder="Pesquisar idioma..."
                onFocus={() => { setLangOpen(true); setLangSearch(''); }}
                onChange={e => setLangSearch(e.target.value)} />
              {langOpen && (
                <div style={s.langDrop}>
                  {filteredLangs.map(lang => (
                    <div key={lang} style={{ ...s.langOpt, background: lang === selectedLang ? 'rgba(139,92,246,0.2)' : 'transparent', color: lang === selectedLang ? '#f2f0f7' : '#a29db3' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = lang === selectedLang ? 'rgba(139,92,246,0.2)' : 'transparent'}
                      onClick={() => { setSelectedLang(lang); setLangOpen(false); setLangSearch(''); setTranslation(null); setStatus(''); }}>
                      {lang}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.panels}>
              <div style={s.panel}>
                <div style={s.panelLbl}>Original</div>
                <div style={s.fldLbl}>Título</div>
                <div style={s.tbox}>{selectedVideo.snippet.title}</div>
                <div style={s.fldLbl}>Descrição</div>
                <div style={s.dbox}>{selectedVideo.snippet.description || '(sem descrição)'}</div>
              </div>
              <div style={s.panel}>
                <div style={s.panelLbl}>Tradução — {selectedLang}</div>
                <div style={s.fldLbl}>Título</div>
                <div style={{ ...s.tbox, color: translation ? '#f2f0f7' : '#a29db3', fontStyle: translation ? 'normal' : 'italic' }}>
                  {translating ? 'A traduzir...' : (translation?.title || 'A tradução aparece aqui.')}
                </div>
                <div style={s.fldLbl}>Descrição</div>
                <div style={{ ...s.dbox, color: translation ? '#f2f0f7' : '#a29db3', fontStyle: translation ? 'normal' : 'italic' }}>
                  {translating ? 'A traduzir...' : (translation?.description || 'A tradução aparece aqui.')}
                </div>
              </div>
            </div>

            <div style={s.actions}>
              <button onClick={translateOne} disabled={translating} style={{ ...s.primaryBtn, opacity: translating ? 0.6 : 1 }}>
                {translating ? 'A traduzir...' : `Traduzir para ${selectedLang}`}
              </button>
              {translation && status !== 'applied' && (
                <button onClick={applyOne} disabled={applying} style={{ ...s.applyBtn, opacity: applying ? 0.6 : 1 }}>
                  {applying ? 'A aplicar...' : '✓ Aplicar no YouTube'}
                </button>
              )}
              {status === 'applied' && <span style={s.statusOk}>✓ Aplicado!</span>}
              {status === 'error' && <span style={s.statusErr}>❌ Erro. Tenta novamente.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
