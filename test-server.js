import { spawn } from 'child_process';
import http from 'http';

const PORT = 8081;
const TIMEOUT = 10000; // 10 seconds

console.log('=== Vastbase Support 服务功能测试 ===\n');

// 启动服务器
console.log('1. 启动服务器...');
const serverProcess = spawn('node', ['server.js'], {
    stdio: 'pipe',
    env: { ...process.env, PORT: PORT.toString() }
});

let serverOutput = '';
let serverError = '';

serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log(`服务器输出: ${output.trim()}`);
});

serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    serverError += error;
    console.error(`服务器错误: ${error.trim()}`);
});

// 等待服务器启动
setTimeout(() => {
    console.log('\n2. 测试健康检查端点...');
    
    const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log(`状态码: ${res.statusCode}`);
            
            if (res.statusCode === 200) {
                try {
                    const health = JSON.parse(data);
                    console.log('健康检查响应:');
                    console.log(JSON.stringify(health, null, 2));
                    console.log('\n✓ 健康检查通过！');
                } catch (e) {
                    console.error('解析JSON失败:', e.message);
                }
            } else {
                console.error(`健康检查失败，状态码: ${res.statusCode}`);
            }
            
            // 停止服务器
            console.log('\n3. 停止服务器...');
            serverProcess.kill('SIGTERM');
            
            setTimeout(() => {
                if (serverProcess.killed) {
                    console.log('✓ 服务器已成功停止');
                } else {
                    console.log('✗ 服务器停止失败，强制终止');
                    serverProcess.kill('SIGKILL');
                }
                
                console.log('\n=== 测试完成 ===');
                process.exit(0);
            }, 2000);
        });
    });
    
    req.on('error', (err) => {
        console.error(`请求失败: ${err.message}`);
        serverProcess.kill('SIGKILL');
        process.exit(1);
    });
    
    req.on('timeout', () => {
        console.error('请求超时');
        req.destroy();
        serverProcess.kill('SIGKILL');
        process.exit(1);
    });
    
    req.end();
}, 3000); // 等待3秒让服务器启动

// 超时处理
setTimeout(() => {
    console.error('\n✗ 测试超时');
    serverProcess.kill('SIGKILL');
    process.exit(1);
}, TIMEOUT);