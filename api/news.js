export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  try {
    const response = await fetch('https://www.samchully.co.kr/api/news-center.do', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.samchully.co.kr/',
        'Accept': 'application/json, text/plain, */*',
      }
    });
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.status(200).json(data);
    } catch(e) {
      res.status(200).send(text.slice(0, 500));
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
