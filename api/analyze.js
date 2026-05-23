const { handler } = require('../netlify/functions/analyze');

module.exports = async (req, res) => {
  const event = {
    httpMethod: req.method,
    queryStringParameters: req.query || {},
    body: req.body ? JSON.stringify(req.body) : null,
    headers: req.headers
  };
  try {
    const response = await handler(event);
    Object.entries(response.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
    res.status(response.statusCode).end(response.body);
  } catch (err) {
    console.error('analyze handler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
