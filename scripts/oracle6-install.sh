#!/usr/bin/env bash
set -euo pipefail
: "${LIVEKIT_API_KEY:?set LIVEKIT_API_KEY}"
: "${LIVEKIT_API_SECRET:?set LIVEKIT_API_SECRET}"
: "${ORACLE6_PUBLIC_IP:?set ORACLE6_PUBLIC_IP}"
: "${ORACLE6_PRIVATE_IP:?set ORACLE6_PRIVATE_IP}"
: "${COTURN_USER:?set COTURN_USER}"
: "${COTURN_PASS:?set COTURN_PASS}"

mkdir -p /opt/livekit
cat >/opt/livekit/config.yaml <<EOF
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 7882
  port_range_end: 7892
  use_external_ip: true
keys:
  ${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}
EOF

docker pull livekit/livekit-server
docker rm -f livekit 2>/dev/null || true
docker run -d --name livekit --restart always \
  -p 7880:7880 -p 7881:7881 -p 7882-7892:7882-7892/udp \
  -v /opt/livekit/config.yaml:/config.yaml:ro \
  livekit/livekit-server --config /config.yaml

docker pull coturn/coturn
docker rm -f coturn 2>/dev/null || true
docker run -d --name coturn --restart always \
  -p 3478:3478 -p 3478:3478/udp -p 5349:5349 -p 5349:5349/udp \
  coturn/coturn -n --log-file stdout \
  --external-ip="${ORACLE6_PUBLIC_IP}/${ORACLE6_PRIVATE_IP}" \
  --realm=oracle6 --lt-cred-mech --user="${COTURN_USER}:${COTURN_PASS}"

docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
ss -lntup | grep -E ':(3478|5349|7880|7881|7882)' || true
