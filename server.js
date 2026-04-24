import { config } from 'dotenv';
config();

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── PostgreSQL ────────────────────────────────────────────────
const PG_SCHEMA = process.env.PG_SCHEMA || 'public';
const FEEDBACKS_TABLE = `${PG_SCHEMA}.chat_feedbacks`;

let pgPool = null;

function getPgPool() {
  if (!pgPool) {
    pgPool = new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DATABASE || 'postgres',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
    });
    pgPool.on('error', (err) => console.error('[PG] Pool error:', err.message));
    pgPool.on('connect', () => console.log('[PG] Connected'));
  }
  return pgPool;
}


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

    if (pathname === '/api/feedbacks' && req.method === 'POST') {
        handleFeedbackSave(req, res);
        return;
    }

    if (pathname === '/api/feedbacks/stats' && req.method === 'GET') {
        handleFeedbackStats(req, res);
        return;
    }

    if (pathname === '/api/feedbacks' && req.method === 'GET') {
        handleFeedbackList(req, res, parsedUrl);
        return;
    }

    if (pathname.match(/^\/api\/feedbacks\/conversation\/[^/]+$/) && req.method === 'GET') {
        const convId = pathname.split('/').pop();
        handleFeedbackByConversation(req, res, convId);
        return;
    }

    if (pathname.match(/^\/api\/admin\/conversation-messages\/[^/]+$/) && req.method === 'GET') {
        const convId = pathname.split('/').pop();
        handleAdminConversationMessages(req, res, convId, parsedUrl);
        return;
    }


    if (pathname === '/api/health' && req.method === 'GET') {
        handleHealthCheck(req, res);
        return;
    }

    if (pathname === '/api/download-proxy' && req.method === 'GET') {
        handleDownloadProxy(req, res, parsedUrl);
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
        
        const cacheControl = ext === '.html' ? 'no-cache' : (ext === '.js' || ext === '.css') ? 'no-cache' : 'public, max-age=31536000';
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

function handleDownloadProxy(req, res, parsedUrl) {
    const fileUrl = parsedUrl.query.url;
    if (!fileUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少 url 参数' }));
        return;
    }

    let targetUrl;
    try {
        targetUrl = new URL(fileUrl);
    } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的 URL' }));
        return;
    }

    const isHttps = targetUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (isHttps ? 443 : 80),
        path: targetUrl.pathname + (targetUrl.search || ''),
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' },
    };

    const proxyReq = httpModule.request(options, (proxyRes) => {
        // Follow redirects (301/302)
        if ((proxyRes.statusCode === 301 || proxyRes.statusCode === 302) && proxyRes.headers.location) {
            proxyRes.resume();
            const redirectParsed = url.parse(req.url, true);
            redirectParsed.query.url = proxyRes.headers.location;
            req.url = url.format(redirectParsed);
            handleDownloadProxy(req, res, url.parse(req.url, true));
            return;
        }

        const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
        const contentDisposition = proxyRes.headers['content-disposition'] || '';
        res.writeHead(proxyRes.statusCode, {
            'Content-Type': contentType,
            'Content-Disposition': contentDisposition,
            'Access-Control-Allow-Origin': '*',
        });
        proxyRes.pipe(res);
    });

    proxyReq.setTimeout(30000, () => {
        proxyReq.destroy();
        if (!res.headersSent) {
            res.writeHead(504, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '下载超时' }));
        }
    });

    proxyReq.on('error', (err) => {
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    });

    proxyReq.end();
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

// ── Feedback API ──────────────────────────────────────────────

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
}

function checkAdminToken(req) {
    const token = process.env.FEEDBACK_ADMIN_TOKEN;
    if (!token) return true; // 未配置则不鉴权
    const auth = req.headers['authorization'] || '';
    return auth === `Bearer ${token}`;
}

async function handleFeedbackSave(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', async () => {
        try {
            const data = JSON.parse(Buffer.concat(body).toString('utf8'));
            const { conversation_id, message_id, user_id, rating, content } = data;
            const pool = getPgPool();
            await pool.query(
                `INSERT INTO ${FEEDBACKS_TABLE} (conversation_id, message_id, user_id, rating, content)
                 VALUES ($1, $2, $3, $4, $5)`,
                [conversation_id || null, message_id || null, user_id || null, rating || null, content || null]
            );
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        } catch (err) {
            console.error('[Feedback] Save error:', err.message);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: err.message }));
        }
    });
}

async function handleFeedbackStats(req, res) {
    setCorsHeaders(res);
    if (!checkAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
        return;
    }
    try {
        const pool = getPgPool();

        const { rows: totalRows } = await pool.query(
            `SELECT COUNT(*) AS total FROM ${FEEDBACKS_TABLE}`
        );
        const totalFeedbacks = parseInt(totalRows[0].total);

        const { rows: ratingRows } = await pool.query(
            `SELECT rating, COUNT(*) AS count FROM ${FEEDBACKS_TABLE} GROUP BY rating`
        );
        const likeCount = parseInt(ratingRows.find(r => r.rating === 'like')?.count || 0);
        const dislikeCount = parseInt(ratingRows.find(r => r.rating === 'dislike')?.count || 0);
        const nullRatingCount = parseInt(ratingRows.find(r => r.rating === null)?.count || 0);

        const { rows: convRows } = await pool.query(
            `SELECT COUNT(DISTINCT conversation_id) AS total FROM ${FEEDBACKS_TABLE}`
        );
        const totalConversations = parseInt(convRows[0].total);

        const { rows: contentRows } = await pool.query(
            `SELECT COUNT(*) AS count FROM ${FEEDBACKS_TABLE} WHERE content IS NOT NULL AND content != ''`
        );
        const withContentCount = parseInt(contentRows[0].count);

        const { rows: recentRows } = await pool.query(
            `SELECT COUNT(*) AS count FROM ${FEEDBACKS_TABLE} WHERE created_at >= NOW() - INTERVAL '7 days'`
        );
        const recentWeekCount = parseInt(recentRows[0].count);

        const { rows: todayRows } = await pool.query(
            `SELECT COUNT(*) AS count FROM ${FEEDBACKS_TABLE} WHERE created_at >= CURRENT_DATE`
        );
        const todayCount = parseInt(todayRows[0].count);

        const { rows: userRows } = await pool.query(
            `SELECT COUNT(DISTINCT user_id) AS total FROM ${FEEDBACKS_TABLE}`
        );
        const totalUsers = parseInt(userRows[0].total);

        const { rows: dailyRows } = await pool.query(
            `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM ${FEEDBACKS_TABLE} WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date ASC`
        );

        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            data: {
                totalFeedbacks,
                totalConversations,
                likeCount,
                dislikeCount,
                nullRatingCount,
                withContentCount,
                recentWeekCount,
                todayCount,
                totalUsers,
                dailyTrend: dailyRows,
            },
        }));
    } catch (err) {
        console.error('[Feedback] Stats error:', err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: err.message }));
    }
}

async function handleFeedbackList(req, res, parsedUrl) {
    setCorsHeaders(res);
    if (!checkAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
        return;
    }
    try {
        const page = parseInt(parsedUrl.query.page) || 1;
        const limit = parseInt(parsedUrl.query.limit) || 20;
        const offset = (page - 1) * limit;
        const ratingFilter = parsedUrl.query.rating || ''; // 'like' | 'dislike' | ''
        const pool = getPgPool();

        // Build WHERE clause for rating filter
        const whereClause = ratingFilter
            ? `WHERE conversation_id IN (SELECT DISTINCT conversation_id FROM ${FEEDBACKS_TABLE} WHERE rating = '${ratingFilter === 'like' ? 'like' : 'dislike'}')`
            : '';

        const { rows } = await pool.query(`
            SELECT
                conversation_id,
                COUNT(*) AS feedback_count,
                MAX(created_at) AS last_feedback_at,
                (array_agg(user_id ORDER BY created_at DESC))[1] AS user_id,
                COUNT(*) FILTER (WHERE rating = 'like') AS like_count,
                COUNT(*) FILTER (WHERE rating = 'dislike') AS dislike_count
            FROM ${FEEDBACKS_TABLE}
            ${whereClause}
            GROUP BY conversation_id
            ORDER BY last_feedback_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const { rows: countRows } = await pool.query(
            `SELECT COUNT(DISTINCT conversation_id) AS total FROM ${FEEDBACKS_TABLE} ${whereClause}`
        );

        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            data: rows,
            total: parseInt(countRows[0].total),
            page,
            limit,
        }));
    } catch (err) {
        console.error('[Feedback] List error:', err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: err.message }));
    }
}

async function handleFeedbackByConversation(req, res, conversationId) {
    setCorsHeaders(res);
    if (!checkAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
        return;
    }
    try {
        const pool = getPgPool();
        const { rows } = await pool.query(
            `SELECT * FROM ${FEEDBACKS_TABLE} WHERE conversation_id = $1 ORDER BY created_at DESC`,
            [conversationId]
        );
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: rows }));
    } catch (err) {
        console.error('[Feedback] ByConv error:', err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: err.message }));
    }
}

// 管理员查询某会话的完整 Dify 消息（前端传入 user_id，直接代理请求 Dify）
async function handleAdminConversationMessages(req, res, conversationId, parsedUrl) {
    setCorsHeaders(res);
    if (!checkAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
        return;
    }
    try {
        const userId = parsedUrl.query.user_id;
        if (!userId) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: '缺少 user_id 参数' }));
            return;
        }

        const difyUrl = `${DIFY_API_BASE}/v1/messages?conversation_id=${conversationId}&user=${encodeURIComponent(userId)}&limit=100`;
        const targetUrl = new URL(difyUrl);
        const isHttps = targetUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const options = {
            hostname: targetUrl.hostname,
            port: targetUrl.port || (isHttps ? 443 : 80),
            path: targetUrl.pathname + targetUrl.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MVS_DIFY_API_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        const proxyReq = httpModule.request(options, (proxyRes) => {
            let body = '';
            proxyRes.on('data', chunk => body += chunk);
            proxyRes.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, data: data.data || [] }));
                } catch {
                    console.error('[Admin] Dify response parse failed, status:', proxyRes.statusCode, 'body:', body.slice(0, 200));
                    res.writeHead(502);
                    res.end(JSON.stringify({ success: false, message: 'Dify 响应解析失败' }));
                }
            });
        });

        proxyReq.on('error', (err) => {
            res.writeHead(502);
            res.end(JSON.stringify({ success: false, message: err.message }));
        });

        proxyReq.setTimeout(15000, () => {
            proxyReq.destroy();
            if (!res.headersSent) {
                res.writeHead(504);
                res.end(JSON.stringify({ success: false, message: '请求超时' }));
            }
        });

        proxyReq.end();
    } catch (err) {
        console.error('[Admin] ConvMessages error:', err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: err.message }));
    }
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://${LOCAL_IP}:${PORT}/`);
    console.log(`  Local:   http://127.0.0.1:${PORT}/`);
    console.log(`  Network: http://${LOCAL_IP}:${PORT}/`);
    console.log(`Dify API Proxy: /api/dify/* -> ${DIFY_API_BASE}/*`);
});

server.setTimeout(310000);
