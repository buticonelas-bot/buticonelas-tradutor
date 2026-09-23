const LANG_CODES = {
  'Abcázio':'ab','Afar':'aa','Africâner':'af','Aimará':'ay','Akan':'ak',
  'Albanês':'sq','Alemão':'de','Alemão (Alemanha)':'de-DE','Alemão (Áustria)':'de-AT',
  'Alemão (Suíça)':'de-CH','Alto sorábio':'hsb','Amárico':'am','Árabe':'ar',
  'Armênio':'hy','Assamês':'as','Azerbaijano':'az','Baixo sorábio':'dsb',
  'Bambara':'bm','Basco':'eu','Bashkir':'ba','Bengali':'bn','Bengali (Índia)':'bn-IN',
  'Bhojpuri':'bho','Bielorrusso':'be','Birmanês':'my','Bislamá':'bi','Bodo':'brx',
  'Bósnio':'bs','Bretão':'br','Búlgaro':'bg','Canarim':'kn','Cantonês':'yue',
  'Cantonês (Hong Kong)':'zh-HK','Catalão':'ca','Caxemira':'ks','Cazaque':'kk',
  'Cheroqui':'chr','Chinês':'zh','Chinês (China)':'zh-CN','Chinês (Hong Kong)':'zh-HK',
  'Chinês (simplificado)':'zh-Hans','Chinês (Singapura)':'zh-SG','Chinês (Taiwan)':'zh-TW',
  'Chinês (tradicional)':'zh-Hant','Cingalês':'si','Concani':'kok','Coreano':'ko',
  'Corso':'co','Croata':'hr','Curdo':'ku','Dinamarquês':'da','Dogri':'dgo',
  'Dzonga':'dz','Eslovaco':'sk','Esloveno':'sl','Espanhol':'es',
  'Espanhol (América Latina)':'es-419','Espanhol (Espanha)':'es-ES',
  'Espanhol (Estados Unidos)':'es-US','Espanhol (México)':'es-MX','Esperanto':'eo',
  'Estoniano':'et','Ewe':'ee','Feroês':'fo','Fijiano':'fj','Filipino':'fil',
  'Finlandês':'fi','Francês':'fr','Francês (Bélgica)':'fr-BE','Francês (Canadá)':'fr-CA',
  'Francês (França)':'fr-FR','Francês (Suíça)':'fr-CH','Frísio ocidental':'fy',
  'Fula':'ff','Gaélico escocês':'gd','Galego':'gl','Galês':'cy','Georgiano':'ka',
  'Grego':'el','Groenlandês':'kl','Guarani':'gn','Gusii':'guz','Guzerate':'gu',
  'Haitiano':'ht','Hauçá':'ha','Havaiano':'haw','Hebraico':'he','Hindi':'hi',
  'Hindi (latim)':'hi-Latn','Holandês':'nl','Holandês (Bélgica)':'nl-BE',
  'Holandês (Países Baixos)':'nl-NL','Húngaro':'hu','Igbo':'ig','Iídiche':'yi',
  'Indonésio':'id','Inglês (Austrália)':'en-AU','Inglês (Canadá)':'en-CA',
  'Inglês (Estados Unidos)':'en-US','Inglês (Índia)':'en-IN','Inglês (Irlanda)':'en-IE',
  'Inglês (Reino Unido)':'en-GB','Inuktitut':'iu','Iorubá':'yo','Irlandês':'ga',
  'Islandês':'is','Italiano':'it','Japonês':'ja','Javanês':'jv','Kalenjin':'kln',
  'Kamba':'kam','Khmer':'km','Laosiano':'lo','Latim':'la','Letão':'lv','Lingala':'ln',
  'Lituano':'lt','Luba-catanga':'lu','Luganda':'lg','Luo':'luo','Luxemburguês':'lb',
  'Luyia':'luy','Macedônio':'mk','Maithili':'mai','Malaiala':'ml','Malaio':'ms',
  'Malaio (Singapura)':'ms-SG','Malgaxe':'mg','Maltês':'mt','Maori':'mi','Marati':'mr',
  'Massai':'mas','Meru':'mer','Mongol':'mn','Nauruano':'na','Navajo':'nv',
  'Ndebele do norte':'nd','Ndebele do sul':'nr','Nepalês':'ne','Norueguês':'no',
  'Occitânico':'oc','Oriá':'or','Oromo':'om','Panjabi':'pa','Papiamento':'pap',
  'Pashto':'ps','Persa':'fa','Persa (Afeganistão)':'fa-AF','Persa (Irã)':'fa-IR',
  'Pidgin nigeriano':'pcm','Polonês':'pl','Português':'pt','Português (Brasil)':'pt-BR',
  'Português (Portugal)':'pt-PT','Quíchua':'qu','Quiniaruanda':'rw','Quirguiz':'ky',
  'Romanche':'rm','Romeno':'ro','Romeno (Moldávia)':'ro-MD','Rundi':'rn','Russo':'ru',
  'Samoano':'sm','Sango':'sg','Sânscrito':'sa','Sardo':'sc','Sérvio':'sr',
  'Sérvio (cirílico)':'sr-Cyrl','Sérvio (latim)':'sr-Latn','Siciliano':'scn',
  'Sindi':'sd','Somali':'so','Soto do sul':'st','Soto setentrional':'nso',
  'Suaíli':'sw','Suázi':'ss','Sueco':'sv','Sundanês':'su','Tadjique':'tg',
  'Tagalo':'tl','Tailandês':'th','Tâmil':'ta','Tártaro':'tt','Tcheco':'cs',
  'Télugo':'te','Tibetano':'bo','Tigrínia':'ti','Tok pisin':'tpi','Tonganês':'to',
  'Tsonga':'ts','Tswana':'tn','Turco':'tr','Turcomeno':'tk','Twi':'tw',
  'Ucraniano':'uk','Uigur':'ug','Uolofe':'wo','Urdu':'ur','Uzbeque':'uz',
  'Venda':'ve','Vietnamita':'vi','Xhosa':'xh','Xona':'sn','Zulu':'zu'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { title, description, language } = req.body;

  const prompt = `Traduz o seguinte título e descrição de um vídeo do YouTube para ${language}. Mantém o tom e o estilo originais. Responde APENAS neste formato exato, sem texto adicional:
TITULO: <título traduzido numa linha>
DESCRICAO: <descrição traduzida>

Título original: ${title || '(sem título)'}
Descrição original: ${description || '(sem descrição)'}`;

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    const tIdx = text.indexOf('TITULO:');
    const dIdx = text.indexOf('DESCRICAO:');

    res.json({
      title: tIdx !== -1 ? text.slice(tIdx + 7, dIdx !== -1 ? dIdx : undefined).trim() : '',
      description: dIdx !== -1 ? text.slice(dIdx + 10).trim() : '',
      langCode: LANG_CODES[language] || 'en'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Translation failed' });
  }
}
