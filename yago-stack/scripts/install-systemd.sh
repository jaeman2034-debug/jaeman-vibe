#!/bin/bash
# YAGO Stack systemd 서비스 설치 스크립트

echo "🚀 YAGO Stack systemd 서비스 설치를 시작합니다..."

# systemd 서비스 파일 생성
sudo tee /etc/systemd/system/yago-stack.service >/dev/null <<'UNIT'
[Unit]
Description=YAGO Stack (Caddy + OG + Webhook)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/yago-stack
ExecStart=/usr/bin/docker compose up -d --build
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
UNIT

# systemd 리로드 및 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable yago-stack

echo "✅ systemd 서비스 설치 완료!"
echo "📋 사용법:"
echo "  시작: sudo systemctl start yago-stack"
echo "  중지: sudo systemctl stop yago-stack"
echo "  상태: sudo systemctl status yago-stack"
echo "  로그: sudo journalctl -u yago-stack -f"
