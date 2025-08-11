const { createProxyMiddleware } = require('http-proxy-middleware');

// This error handler will help us see if the proxy itself is failing.
const onError = function (err, req, res) {
    console.error('Proxy Error:', err);
    if (res && res.writeHead) {
        res.writeHead(500, {
            'Content-Type': 'text/plain',
        });
        res.end('Something went wrong with the proxy. Please check your terminal.');
    }
};

module.exports = function(app) {
    // The MORE SPECIFIC '/api/ws' rule for WebSockets comes FIRST.
    app.use(
        '/api/ws',
        createProxyMiddleware({
            target: 'http://backend:8000', // Your FastAPI backend
            ws: true, // Enable WebSocket proxying
            changeOrigin: true,
            logLevel: 'debug', // Add detailed logging
            onError: onError, // Add the error handler
        })
    );

    // The more general '/api' rule for all other requests comes SECOND.
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://backend:8000',
            changeOrigin: true,
            logLevel: 'debug',
            onError: onError,
        })
    );
};