#!/bin/bash
# 快速启动脚本 - 日志输出到当前目录
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# 检查 .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "[警告] 已从 .env.example 创建 .env，请先编辑配置后重新运行"
        echo "  vi .env"
        exit 1
    else
        echo "[错误] 未找到 .env 文件"
        exit 1
    fi
fi

# 检查 Node.js
if ! command -v node &>/dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js >= 18"
    exit 1
fi

# 检查 dist 目录，不存在则构建
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "[构建] dist 目录不存在，开始构建前端..."
    if command -v pnpm &>/dev/null; then
        pnpm install && pnpm build 2>&1 | tee "$LOG_DIR/build.log"
    else
        npm install && npm run build 2>&1 | tee "$LOG_DIR/build.log"
    fi
    echo "[构建] 完成"
fi

# 停止已有进程
PID_FILE="$SCRIPT_DIR/server.pid"
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[停止] 停止已有进程 PID=$OLD_PID"
        kill "$OLD_PID"
        sleep 1
    fi
    rm -f "$PID_FILE"
fi

# 启动后端服务，日志写到 logs/server.log
echo "[启动] 后端服务..."
nohup node server.js >> "$LOG_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"

# 等待确认启动
sleep 2
if kill -0 "$SERVER_PID" 2>/dev/null; then
    # 读取端口
    PORT=$(grep -E '^PUBLIC_PORT=' .env | cut -d'=' -f2 | tr -d ' ')
    PORT=${PORT:-3000}
    echo ""
    echo "========================================="
    echo " 启动成功"
    echo "========================================="
    echo " PID:      $SERVER_PID"
    echo " 访问地址: http://localhost:$PORT/"
    echo " 日志目录: $LOG_DIR/"
    echo ""
    echo " 实时查看日志:"
    echo "   tail -f $LOG_DIR/server.log"
    echo ""
    echo " 停止服务:"
    echo "   bash stop.sh"
    echo "   或: kill \$(cat server.pid)"
    echo "========================================="
else
    echo "[错误] 服务启动失败，查看日志: tail -20 $LOG_DIR/server.log"
    cat "$LOG_DIR/server.log" | tail -20
    exit 1
fi
