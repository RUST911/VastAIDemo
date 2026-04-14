#!/bin/bash
set -e

SERVICE_NAME="VastAIDemo"
SERVICE_USER="nobody"
SERVICE_GROUP="nogroup"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 支持 --in-place 参数，直接在当前目录运行，无需复制到 /opt
IN_PLACE=false
for arg in "$@"; do
    if [ "$arg" = "--in-place" ]; then
        IN_PLACE=true
    fi
done

if [ "$IN_PLACE" = true ]; then
    INSTALL_DIR="${SCRIPT_DIR}"
    echo "[模式] 原地部署：使用当前目录 ${INSTALL_DIR}"
else
    INSTALL_DIR="/opt/VastAIDemo"
fi

LOG_DIR="/var/log/${SERVICE_NAME}"

echo "========================================="
echo " Vastbase Support 部署脚本 v2.0"
echo "========================================="

# 检查权限
if [ "$EUID" -ne 0 ]; then
    echo "[错误] 请使用 root 权限运行此脚本: sudo $0"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js (>= 18)"
    echo "  推荐安装方法: curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "[错误] Node.js 版本过低 (当前: v$(node --version), 需要: >= 18)"
    exit 1
fi

echo "[✓] 系统检查通过 (Node.js v$(node --version))"

echo ""
echo "[1/7] 停止已有服务..."
systemctl stop ${SERVICE_NAME} 2>/dev/null || true
systemctl disable ${SERVICE_NAME} 2>/dev/null || true

echo "[2/7] 创建安装目录和日志目录..."
mkdir -p ${INSTALL_DIR}
mkdir -p ${LOG_DIR}
chown -R ${SERVICE_USER}:${SERVICE_GROUP} ${INSTALL_DIR} ${LOG_DIR}
chmod 755 ${INSTALL_DIR}
chmod 750 ${LOG_DIR}

echo "[3/7] 复制项目文件到 ${INSTALL_DIR}..."
if [ "$IN_PLACE" = false ]; then
    # 排除不需要的文件
    rsync -av --delete \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='*.tmp' \
        --exclude='*.log' \
        --exclude='*.bak' \
        ${SCRIPT_DIR}/ ${INSTALL_DIR}/

    # 复制环境配置文件
    if [ -f "${SCRIPT_DIR}/.env" ]; then
        cp "${SCRIPT_DIR}/.env" "${INSTALL_DIR}/.env"
        chmod 640 "${INSTALL_DIR}/.env"
        chown ${SERVICE_USER}:${SERVICE_GROUP} "${INSTALL_DIR}/.env"
    else
        echo "[警告] 未找到 .env 文件，将使用 .env.example 创建默认配置"
        cp "${SCRIPT_DIR}/.env.example" "${INSTALL_DIR}/.env"
        chmod 640 "${INSTALL_DIR}/.env"
        chown ${SERVICE_USER}:${SERVICE_GROUP} "${INSTALL_DIR}/.env"
    fi
else
    echo "  [跳过] 原地部署，无需复制文件"
    # 确保 .env 存在
    if [ ! -f "${INSTALL_DIR}/.env" ]; then
        if [ -f "${INSTALL_DIR}/.env.example" ]; then
            cp "${INSTALL_DIR}/.env.example" "${INSTALL_DIR}/.env"
            echo "[警告] 已从 .env.example 创建 .env，请检查配置"
        else
            echo "[错误] 未找到 .env 文件，请先创建 ${INSTALL_DIR}/.env"
            exit 1
        fi
    fi
    chmod 640 "${INSTALL_DIR}/.env"
fi

echo "[4/7] 安装 npm 依赖..."
cd ${INSTALL_DIR}
if command -v pnpm &> /dev/null; then
    echo "  使用 pnpm 安装依赖..."
    pnpm install --production --frozen-lockfile
elif command -v npm &> /dev/null; then
    echo "  使用 npm 安装依赖..."
    npm ci --only=production
else
    echo "[错误] 未找到 pnpm 或 npm"
    exit 1
fi

echo "[5/7] 配置 systemd 服务..."
# 创建服务文件，替换路径占位符为实际安装目录
sed "s|__INSTALL_DIR__|${INSTALL_DIR}|g" ${INSTALL_DIR}/${SERVICE_NAME}.service > /etc/systemd/system/${SERVICE_NAME}.service
chmod 644 /etc/systemd/system/${SERVICE_NAME}.service

# 创建日志配置文件
cat > /etc/rsyslog.d/${SERVICE_NAME}.conf << EOF
if \$programname == '${SERVICE_NAME}' then /var/log/${SERVICE_NAME}/service.log
& stop
EOF

cat > /etc/logrotate.d/${SERVICE_NAME} << EOF
/var/log/${SERVICE_NAME}/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 ${SERVICE_USER} ${SERVICE_GROUP}
    sharedscripts
    postrotate
        systemctl kill -s HUP ${SERVICE_NAME} 2>/dev/null || true
    endscript
}
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}

echo "[6/7] 设置文件权限..."
chown -R ${SERVICE_USER}:${SERVICE_GROUP} ${INSTALL_DIR}
find ${INSTALL_DIR} -type f -name "*.sh" -exec chmod 750 {} \;
find ${INSTALL_DIR} -type f -name "*.js" -exec chmod 640 {} \;
find ${INSTALL_DIR} -type f -name "*.json" -exec chmod 640 {} \;

echo "[7/7] 启动服务..."
systemctl start ${SERVICE_NAME}

# 等待服务启动
echo "等待服务启动..."
for i in {1..10}; do
    if systemctl is-active --quiet ${SERVICE_NAME}; then
        break
    fi
    sleep 1
    echo -n "."
done
echo ""

if systemctl is-active --quiet ${SERVICE_NAME}; then
    echo ""
    echo "========================================="
    echo " 部署成功！"
    echo "========================================="
    echo ""
    echo " 服务信息:"
    echo "  - 名称: ${SERVICE_NAME}"
    echo "  - 安装目录: ${INSTALL_DIR}"
    echo "  - 日志目录: ${LOG_DIR}"
    echo "  - 运行用户: ${SERVICE_USER}:${SERVICE_GROUP}"
    echo ""
    echo " 管理命令:"
    echo "  - 状态检查: systemctl status ${SERVICE_NAME}"
    echo "  - 启动服务: systemctl start ${SERVICE_NAME}"
    echo "  - 停止服务: systemctl stop ${SERVICE_NAME}"
    echo "  - 重启服务: systemctl restart ${SERVICE_NAME}"
    echo "  - 重载配置: systemctl reload ${SERVICE_NAME}"
    echo "  - 开机自启: systemctl enable ${SERVICE_NAME}"
    echo "  - 禁用自启: systemctl disable ${SERVICE_NAME}"
    echo ""
    echo " 日志查看:"
    echo "  - 实时日志: journalctl -u ${SERVICE_NAME} -f"
    echo "  - 最近日志: journalctl -u ${SERVICE_NAME} -n 50"
    echo "  - 服务日志: tail -f ${LOG_DIR}/service.log"
    echo "  - 所有日志: journalctl -u ${SERVICE_NAME} --since today"
    echo ""
    
    # 获取访问地址
    if [ -f "${INSTALL_DIR}/.env" ]; then
        source "${INSTALL_DIR}/.env"
        echo " 访问地址:"
        echo "  - http://localhost:${PORT:-8081}/"
        if [ -n "${LOCAL_IP}" ] && [ "${LOCAL_IP}" != "your_server_ip" ]; then
            echo "  - http://${LOCAL_IP}:${PORT:-8081}/"
        fi
    fi
    
    echo ""
    echo " 下一步:"
    echo "  1. 检查防火墙设置: ufw allow ${PORT:-8081}/tcp"
    echo "  2. 验证服务运行: curl -f http://localhost:${PORT:-8081}/"
    echo "  3. 查看详细日志: journalctl -u ${SERVICE_NAME} -f"
    echo ""
else
    echo ""
    echo "========================================="
    echo " 服务启动失败！"
    echo "========================================="
    echo ""
    echo " 故障排除步骤:"
    echo "  1. 检查服务状态: systemctl status ${SERVICE_NAME}"
    echo "  2. 查看详细日志: journalctl -u ${SERVICE_NAME} -n 100"
    echo "  3. 检查配置文件: cat ${INSTALL_DIR}/.env"
    echo "  4. 手动测试启动: cd ${INSTALL_DIR} && node server.js"
    echo ""
    echo " 常见问题:"
    echo "  - 端口被占用: netstat -tulpn | grep :${PORT:-8081}"
    echo "  - 权限问题: ls -la ${INSTALL_DIR}"
    echo "  - 环境变量: cat ${INSTALL_DIR}/.env"
    echo ""
    exit 1
fi
