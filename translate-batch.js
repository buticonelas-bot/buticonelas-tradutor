const LANG_CODES = {
  'Abcázio':'ab','Afar':'aa','Africâner':'af','Aimará':'ay','Akan':'ak',
  'Albanês':'sq','Alemão':'de','Alemão (Alemanha)':'de-DE','Alemão (Áustria)':'de-AT',
  'Alemão (Suíça)':'de-CH','Alto sorábio':'hsb','Amárico':'am','Árabe':'ar',
  'Armênio':'hy','Assamês':'as','Azerbaijano':'az','Baixo sorábio':'dsb',
  'Bambara':'bm','Basco':'eu','Bashkir':'ba','Bengali':'bn','Bengali (Índia)':'bn-IN',
  'Bhojpuri':'bho','Bielorrusso':'be','Birmanês':'my','Bósnio':'bs','Bretão':'br',
  'Búlgaro':'bg','Canarim':'kn','Cantonês':'yue','Cantonês (Hong Kong)':'zh-HK',
  'Catalão':'ca','Cazaque':'kk','Chinês':'zh','Chinês (China)':'zh-CN',
  'Chinês (simplificado)':'zh-Hans','Chinês (Singapura)':'zh-SG','Chinês (Taiwan)':'zh-TW',
  'Chinês (tradicional)':'zh-Hant','Cingalês':'si','Coreano':'ko','Corso':'co',
  'Croata':'hr','Curdo':'ku','Dinamarquês':'da','Eslovaco':'sk','Esloveno':'sl',
  'Espanhol':'es','Espanhol (América Latina)':'es-419','Espanhol (Espanha)':'es-ES',
  'Espanhol (Estados Unidos)':'es-US','Espanhol (México)':'es-MX','Esperanto':'eo',
  'Estoniano':'et','Ewe':'ee','Feroês':'fo','Fijiano':'fj','Filipino':'fil',
  'Finlandês':'fi','Francês':'fr','Francês (Bélgica)':'fr-BE','Francês (Canadá)':'fr-CA',
  'Francês (França)':'fr-FR','Francês (Suíça)':'fr-CH','Frísio ocidental':'fy',
  'Fula':'ff','Gaélico escocês':'gd','Galego':'gl','Galês':'cy','Georgiano':'ka',
  'Grego':'el','Guarani':'gn','Guzerate':'gu','Haitiano':'ht','Hauçá':'ha',
  'Havaiano':'haw','Hebraico':'he','Hindi':'hi','Hindi (latim)':'hi-Latn',
  'Holandês':'nl','Holandês (Bélgica)':'nl-BE','Holandês (Países Baixos)':'nl-NL',
  'Húngaro':'hu','Igbo':'ig','Iídiche':'yi','Indonésio':'id',
  'Inglês (Austrália)':'en-AU','Inglês (Canadá)':'en-CA','Inglês (Estados Unidos)':'en-US',
  'Inglês (Índia)':'en-IN','Inglês (Irlanda)':'en-IE','Inglês (Reino Unido)':'en-GB',
  'Iorubá':'yo','Irlandês':'ga','Islandês':'is','Italiano':'it','Japonês':'ja',
  'Javanês':'jv','Khmer':'km','Laosiano':'lo','Latim':'la','Letão':'lv',
  'Lingala':'ln','Lituano':'lt','Luxemburguês':'lb','Macedônio':'mk','Malaiala':'ml',
  'Malaio':'ms','Malaio (Singapura)':'ms-SG','Malgaxe':'mg','Maltês':'mt',
  'Maori':'mi','Marati':'mr','Mongol':'mn','Nepalês':'ne','Norueguês':'no',
  'Occitânico':'oc','Oriá':'or','Oromo':'om','Panjabi':'pa','Pashto':'ps',
  'Persa':'fa','Persa (Afeganistão)':'fa-AF','Persa (Irã)':'fa-IR',
  'Polonês':'pl','Português':'pt','Português (Brasil)':'pt-BR','Português (Portugal)':'pt-PT',
  'Quíchua':'qu','Quiniaruanda':'rw','Quirguiz':'ky','Romanche':'rm','Romeno':'ro',
  'Russo':'ru','Samoano':'sm','Sânscrito':'sa','Sérvio':'sr',
  'Sérvio (cirílico)':'sr-Cyrl','Sérvio (latim)':'sr-Latn','Sindi':'sd',
  'Somali':'so','Soto do sul':'st','Suaíli':'sw','Sueco':'sv','Sundanês':'su',
  'Tadjique':'tg','Tagalo':'tl','Tailandês':'th','Tâmil':'ta','Tcheco':'cs',
  'Télugo':'te','Tibetano':'bo','Turco':'tr','Turcomeno':'tk','Ucraniano':'uk',
  'Urdu':'ur','Uzbeque':'uz','Vietnamita':'vi','Xhosa':'xh','Zulu':'zu'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { title, description, languages } = req.body;

  const prompt = `Traduz o título e descrição para EXATAMENTE estas ${languages.length} línguas. Responde APENAS com JSON válido, sem texto extra, sem markdown:
{"Alemão":{"title":"...","description":"..."},...}

Título: ${title || '(sem título)'}
Descrição: ${(description || '').slice(0, 800)}
Línguas a traduzir: ${languages.join(', ')}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    let text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    const result = {};
    for (const [name, trans] of Object.entries(parsed)) {
      result[name] = { ...trans, langCode: LANG_CODES[name] || null };
    }
    res.json({ translations: result });
  } catch (err) {
    console.error('Batch translate error:', err);
    res.status(500).json({ error: err.message });
  }
}
