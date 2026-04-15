import { config } from 'dotenv';
config();

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import url from 'url';
import os from 'os';

// PUBLIC_PORT 是用户访问端口，PORT 作为别名兼容旧配置
const PUBLIC_PORT = parseInt(process.env.PUBLIC_PORT) || parseInt(process.env.PORT) || 3000;
const PORT = PUBLIC_PORT;

const LOCAL_IP = process.env.LOCAL_IP || '43.139.131.125';
const DIFY_API_BASE = process.env.DIFY_API_BASE || 'http://101.35.56.39';
const MVS_DIFY_API_KEY = process.env.DIFY_API_KEY || '';

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

    if (pathname === '/api/health' && req.method === 'GET') {
        handleHealthCheck(req, res);
        return;
    }

    if (pathname === '/api/mvs/submit' && (req.method === 'POST' || req.method === 'OPTIONS')) {
        handleMvsSubmit(req, res);
        return;
    }

    const statusMatch = pathname.match(/^\/api\/mvs\/status\/([^/]+)$/);
    if (statusMatch && req.method === 'GET') {
        handleMvsStatus(req, res, statusMatch[1]);
        return;
    }

    const ticketMatch = pathname.match(/^\/api\/mvs\/ticket\/([^/]+)$/);
    if (ticketMatch && req.method === 'GET') {
        handleMvsTicket(req, res, ticketMatch[1]);
        return;
    }
    if (ticketMatch && req.method === 'PATCH') {
        handleMvsTicketUpdate(req, res, ticketMatch[1]);
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
    
    filePath = path.join(__dirname, 'dist', filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                const indexPath = path.join(__dirname, 'dist', 'index.html');
                fs.readFile(indexPath, (indexErr, indexData) => {
                    if (indexErr) {
                        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>404 Not Found</h1>');
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(indexData);
                });
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>500 Internal Server Error</h1>');
            }
            return;
        }
        
        const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=31536000';
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': cacheControl
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
                key.toLowerCase() !== 'referer' &&
                key.toLowerCase() !== 'authorization') {
                headers[key] = value;
            }
        }
        
        if (MVS_DIFY_API_KEY) {
            headers['Authorization'] = `Bearer ${MVS_DIFY_API_KEY}`;
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


// 存储异步提交任务的状态
const mvsTaskMap = new Map();

function handleMvsStatus(req, res, sessionId) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const task = mvsTaskMap.get(sessionId);
    if (!task) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: '任务不存在或已过期' }));
        return;
    }

    res.writeHead(200);
    res.end(JSON.stringify(task));
}

function handleMvsTicket(req, res, sessionId) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const task = mvsTaskMap.get(sessionId);
    if (!task) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: '工单不存在或已过期' }));
        return;
    }

    const alreadyStreamed = task.streamed === true;
    // 标记为已触发，后续访问不再自动发起流式请求
    if (!alreadyStreamed) {
        task.streamed = true;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
        success: true,
        query: task.query,
        ticketData: task.ticketData || null,
        sessionId,
        alreadyStreamed,
        conversationId: task.conversationId || null,
    }));
}

function handleMvsTicketUpdate(req, res, sessionId) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const task = mvsTaskMap.get(sessionId);
    if (!task) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: '工单不存在或已过期' }));
        return;
    }

    const body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
        try {
            const data = JSON.parse(Buffer.concat(body).toString('utf8'));
            if (data.conversationId) {
                task.conversationId = data.conversationId;
            }
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        } catch {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: '无效的 JSON' }));
        }
    });
}

function handleMvsSubmit(req, res) {
    console.log('[MVS] 收到工单提交请求');

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
        let ticketData = {};
        try {
            const raw = Buffer.concat(body).toString('utf8').trim();
            console.log('[MVS] raw body:', JSON.stringify(raw));
            if (raw) {
                ticketData = JSON.parse(raw);
            }
        } catch (e) {
            console.error('[MVS] JSON parse error:', e.message);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: `无效的 JSON 格式: ${e.message}` }));
            return;
        }

        const sessionId = `mvs-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        const redirectUrl = `http://${LOCAL_IP}:${PUBLIC_PORT}/chat?session_id=${sessionId}`;

        // 只存储工单内容，不再调用 Dify，等用户打开页面后由前端发起流式请求
        const query = formatTicketForDify(ticketData);
        mvsTaskMap.set(sessionId, { status: 'pending', sessionId, query, ticketData });

        // 1小时后清理
        setTimeout(() => mvsTaskMap.delete(sessionId), 3600000);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: '工单已接收',
            sessionId,
            redirectUrl,
        }));
    });

    req.on('error', err => {
        console.error('[MVS] 请求读取错误:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '服务器内部错误' }));
    });
}

function formatTicketForDify(data) {
    if (!data || typeof data !== 'object') return String(data);

    const lines = ['【MVS工单信息】'];
    const formatValue = (val, indent = '') => {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'object' && !Array.isArray(val)) {
            const entries = Object.entries(val).filter(([, v]) => v !== null && v !== undefined && v !== '');
            if (entries.length === 0) return null;
            return entries.map(([k, v]) => {
                const formatted = formatValue(v, indent + '  ');
                return formatted ? `${indent}  ${k}: ${formatted}` : null;
            }).filter(Boolean).join('\n');
        }
        if (Array.isArray(val)) {
            const items = val.filter(v => v !== null && v !== undefined && v !== '');
            if (items.length === 0) return null;
            return items.map((item, i) => {
                const formatted = formatValue(item, indent + '  ');
                return formatted ? `${indent}  [${i + 1}] ${formatted}` : null;
            }).filter(Boolean).join('\n');
        }
        return String(val);
    };

    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined || value === '') continue;
        const formatted = formatValue(value);
        if (formatted) {
            if (typeof value === 'object') {
                lines.push(`\n${key}:\n${formatted}`);
            } else {
                lines.push(`${key}: ${formatted}`);
            }
        }
    }

    return lines.join('\n');
}

function handleHealthCheck(req, res) {
    console.log('[Health] 收到健康检查请求');
    
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'VastAIDemo',
        version: '2.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            dify: '/api/dify/*',
            health: '/api/health'
        }
    };
    
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
    });
    
    res.end(JSON.stringify(healthStatus, null, 2));
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://${LOCAL_IP}:${PORT}/`);
    console.log(`  Local:   http://127.0.0.1:${PORT}/`);
    console.log(`  Network: http://${LOCAL_IP}:${PORT}/`);
    console.log(`Dify API Proxy: /api/dify/* -> ${DIFY_API_BASE}/*`);
});

server.setTimeout(310000);
