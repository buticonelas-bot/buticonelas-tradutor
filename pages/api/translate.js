const LANG_CODES = {
  'Inglês': 'en', 'Mandarim': 'zh', 'Hindi': 'hi', 'Espanhol': 'es',
  'Francês': 'fr', 'Árabe': 'ar', 'Bengali': 'bn', 'Português': 'pt',
  'Russo': 'ru', 'Urdu': 'ur', 'Indonésio': 'id', 'Alemão': 'de',
  'Japonês': 'ja', 'Suaíli': 'sw', 'Marata': 'mr', 'Telugu': 'te',
  'Turco': 'tr', 'Tâmil': 'ta', 'Cantonês': 'zh-HK', 'Vietnamita': 'vi'
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

    const translatedTitle = tIdx !== -1
      ? text.slice(tIdx + 7, dIdx !== -1 ? dIdx : undefined).trim()
      : '';
    const translatedDesc = dIdx !== -1
      ? text.slice(dIdx + 10).trim()
      : '';

    res.json({
      title: translatedTitle,
      description: translatedDesc,
      langCode: LANG_CODES[language] || 'en'
    });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
}
