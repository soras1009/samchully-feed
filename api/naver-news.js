// api/naver-news.js
// 네이버 뉴스 검색 API 프록시
// Vercel 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'query 파라미터가 필요해요', items: [] });
  }

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'API 키가 설정되지 않았어요', items: [] });
  }

  try {
    // "삼천리 + 핵심 키워드" 로 검색 (노이즈 줄이기)
    const searchQuery = encodeURIComponent(`삼천리 ${query}`);
    const url = `https://openapi.naver.com/v1/search/news.json?query=${searchQuery}&display=5&sort=date`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id':     clientId,
        'X-Naver-Client-Secret': clientSecret,
      }
    });

    const data = await response.json();

    if (!data.items) {
      return res.status(200).json({ items: [] });
    }

    // HTML 태그 제거 후 반환
    const items = data.items.map(item => ({
      title:       item.title.replace(/<[^>]+>/g, ''),
      url:         item.originallink || item.link,
      source:      item.description ? extractSource(item.link) : '',
      pubDate:     item.pubDate,
    }));

    res.status(200).json({ items });

  } catch(e) {
    console.error('네이버 검색 오류:', e);
    res.status(500).json({ error: e.message, items: [] });
  }
}

function extractSource(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const sourceMap = {
      'news.naver.com': '',
      'chosun.com': '조선일보',
      'joongang.co.kr': '중앙일보',
      'donga.com': '동아일보',
      'hani.co.kr': '한겨레',
      'mk.co.kr': '매일경제',
      'hankyung.com': '한국경제',
      'sedaily.com': '서울경제',
      'etnews.com': '전자신문',
      'edaily.co.kr': '이데일리',
      'newsis.com': '뉴시스',
      'yonhapnews.co.kr': '연합뉴스',
      'yna.co.kr': '연합뉴스',
    };
    return sourceMap[domain] || domain;
  } catch {
    return '';
  }
}
