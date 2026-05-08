// og-scraper.js - Netlify Function
// Returns curated Pexels fashion photos for the Seen On celebrity cards

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let urls = [];
  try {
    const body = JSON.parse(event.body || '{}');
    urls = Array.isArray(body.urls) ? body.urls : [];
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!urls.length) {
    return { statusCode: 200, headers, body: JSON.stringify({ results: {} }) };
  }

  // Curated royalty-free fashion photos from Pexels
  const PHOTOS = {
    haileybieber:   'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=800',
    sofiarichie:    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?w=800',
    chiaraferragni: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?w=800',
    kyliejenner:    'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?w=800',
    dualipa:        'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?w=800',
    bellahadid:     'https://images.pexels.com/photos/2220316/pexels-photo-2220316.jpeg?w=800',
    kendalljenner:  'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?w=800',
    gigihadid:      'https://images.pexels.com/photos/1381679/pexels-photo-1381679.jpeg?w=800',
  };

  const DEFAULT = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?w=800';

  const results = {};
  for (const url of urls.slice(0, 20)) {
    const m = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
    const handle = m ? m[1].toLowerCase() : null;
    results[url] = { image: (handle && PHOTOS[handle]) || DEFAULT, source: 'curated' };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ results }),
  };
};
