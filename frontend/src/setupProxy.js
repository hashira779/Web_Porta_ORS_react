const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    // This proxy for regular API calls is correct.
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://backend:8000',
            changeOrigin: true,
        })
    );

    // 👇 UPDATE THIS PART for WebSockets
    app.use(
        '/api/ws/active-sessions',
        createProxyMiddleware({
            target: 'http://backend:8000', // Or 'http://localhost:8000'
            ws: true, // This enables WebSocket proxying
            changeOrigin: true,
        })
    );
};