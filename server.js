const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8081;
const DIFY_API_BASE = 'http://101.35.56.39';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname.startsWith('/api/dify/')) {
        handleDifyProxy(req, res, pathname, parsedUrl);
        return;
    }

    if (pathname === '/api/mvs/submit' && req.method === 'POST') {
        handleMvsSubmit(req, res);
        return;
    }

    serveStaticFile(req, res, pathname);
});

function serveStaticFile(req, res, pathname) {
    let filePath = pathname;
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    try {
        filePath = decodeURIComponent(filePath);
    } catch (e) {
        console.error('[Static] URL decode error:', e.message);
    }
    
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>500 Internal Server Error</h1>');
            }
            return;
        }
        
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
}

function handleDifyProxy(req, res, pathname, parsedUrl) {
    const difyPath = pathname.replace('/api/dify', '');
    const targetUrl = DIFY_API_BASE + difyPath + (parsedUrl.search || '');
    
    console.log(`[Proxy] ${req.method} ${targetUrl}`);
    
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    });
    
    req.on('end', () => {
        const bodyBuffer = Buffer.concat(body);
        
        const headers = {};
        for (let i = 0; i < req.rawHeaders.length; i += 2) {
            const key = req.rawHeaders[i];
            const value = req.rawHeaders[i + 1];
            if (key.toLowerCase() !== 'host' && 
                key.toLowerCase() !== 'origin' &&
                key.toLowerCase() !== 'referer') {
                headers[key] = value;
            }
        }
        
        const targetUrl = new URL(DIFY_API_BASE);
        const isHttps = targetUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const options = {
            hostname: targetUrl.hostname,
            port: targetUrl.port || (isHttps ? 443 : 80),
            path: difyPath + (parsedUrl.search || ''),
            method: req.method,
            headers: headers
        };
        
        const proxyReq = httpModule.request(options, (proxyRes) => {
            console.log(`[Proxy Response] Status: ${proxyRes.statusCode}`);
            res.writeHead(proxyRes.statusCode, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            
            proxyRes.on('data', (chunk) => {
                res.write(chunk);
            });
            
            proxyRes.on('end', () => {
                console.log(`[Proxy] 请求完成`);
                res.end();
            });
        });
        
        proxyReq.setTimeout(300000, () => {
            console.error('[Proxy Timeout] Dify API 响应超时 (300秒)');
            proxyReq.destroy();
            if (!res.headersSent) {
                res.writeHead(504, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Gateway Timeout', 
                    message: 'Dify API 响应超时，请稍后重试或减少对话内容长度',
                    code: 504
                }));
            }
        });
        
        proxyReq.on('error', (error) => {
            console.error('[Proxy Error]', error.message);
            if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Proxy Error', message: error.message }));
            }
        });
        
        if (bodyBuffer.length > 0) {
            proxyReq.write(bodyBuffer);
        }
        
        proxyReq.end();
    });
}

const MVS_DIFY_API_KEY = 'app-99L4qvG2FF9611Pl6OkYSkbo';

function handleMvsSubmit(req, res) {
    console.log('[MVS Submit] 收到MVS服务提交请求');

    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    });

    req.on('end', () => {
        try {
            const bodyBuffer = Buffer.concat(body);
            const requestData = JSON.parse(bodyBuffer.toString());

            console.log('[MVS Submit] 请求数据:', JSON.stringify(requestData, null, 2));

            if (!requestData || Object.keys(requestData).length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Bad Request',
                    message: '请求数据不能为空'
                }));
                return;
            }

            const sessionId = 'mvs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const queryText = JSON.stringify(requestData, null, 2);
            const userId = 'mvs-user';

            const difyRequestBody = JSON.stringify({
                inputs: {},
                query: queryText,
                response_mode: 'streaming',
                user: userId
            });

            const targetUrl = new URL(DIFY_API_BASE);
            const isHttps = targetUrl.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const options = {
                hostname: targetUrl.hostname,
                port: targetUrl.port || (isHttps ? 443 : 80),
                path: '/v1/chat-messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MVS_DIFY_API_KEY}`,
                    'Content-Length': Buffer.byteLength(difyRequestBody)
                }
            };

            const proxyReq = httpModule.request(options, (proxyRes) => {
                let buffer = '';
                let responded = false;

                proxyRes.on('data', (chunk) => {
                    if (responded) return;
                    buffer += chunk.toString();

                    const lines = buffer.split('\n');
                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const jsonStr = line.slice(6).trim();
                        if (!jsonStr) continue;
                        try {
                            const event = JSON.parse(jsonStr);
                            if (event.conversation_id) {
                                responded = true;
                                const redirectUrl = `http://localhost:${PORT}/support-chat.html?conversation_id=${event.conversation_id}`;

                                res.writeHead(200, {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                });
                                res.end(JSON.stringify({
                                    success: true,
                                    message: 'MVS工单数据已提交至Dify',
                                    sessionId: sessionId,
                                    conversationId: event.conversation_id,
                                    redirectUrl: redirectUrl
                                }));

                                console.log(`[MVS Submit] 快速返回，sessionId: ${sessionId}, conversationId: ${event.conversation_id}`);
                                break;
                            }
                        } catch (e) {}
                    }
                });

                proxyRes.on('end', () => {
                    if (!responded) {
                        console.error('[MVS Submit] Dify未返回conversation_id');
                        res.writeHead(502, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            error: 'Dify Error',
                            message: 'Dify未返回有效的conversation_id'
                        }));
                    }
                });
            });

            proxyReq.setTimeout(30000, () => {
                console.error('[MVS Submit] 等待conversation_id超时');
                proxyReq.destroy();
                if (!res.headersSent) {
                    res.writeHead(504, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Gateway Timeout',
                        message: '等待Dify conversation_id超时',
                        code: 504
                    }));
                }
            });

            proxyReq.on('error', (error) => {
                console.error('[MVS Submit] Dify请求错误:', error.message);
                if (!res.headersSent) {
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Dify Proxy Error',
                        message: error.message
                    }));
                }
            });

            proxyReq.write(difyRequestBody);
            proxyReq.end();

        } catch (error) {
            console.error('[MVS Submit] 处理错误:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            }));
        }
    });

    req.on('error', (error) => {
        console.error('[MVS Submit] 请求错误:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Request Error',
            message: error.message
        }));
    });
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Dify API Proxy: /api/dify/* -> ${DIFY_API_BASE}/*`);
    console.log(`MVS Submit API: POST /api/mvs/submit`);
});

server.setTimeout(310000);
