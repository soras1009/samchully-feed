export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await fetch('https://www.samchully.co.kr/api/social-center.do', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.samchully.co.kr/pr/social-center.do',
        'Origin': 'https://www.samchully.co.kr',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      }
    });
    const text = await response.text();
    // 응답이 HTML이면 오류 반환
    if (text.trim().startsWith('<')) {
      return res.status(200).json([]);
    }
    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch(e) {
    res.status(200).json([]);
  }
}
