#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "======================================================="
echo "         MATHCA VIDEO STUDIO PRO (HYPERFRAMES)"
echo "  Phần mềm Trực quan Biên tập và Xuất Video MathCA 9:16"
echo "======================================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[LỖI] Không tìm thấy Node.js 22+. Cài Node.js LTS rồi chạy lại."
  exit 1
fi

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)" || {
  echo "[LỖI] MathCA Studio cần Node.js 22 trở lên."
  exit 1
}

if ! command -v npm >/dev/null 2>&1; then
  echo "[LỖI] Không tìm thấy npm đi kèm Node.js."
  exit 1
fi

if [ ! -f "node_modules/hyperframes/bin/hyperframes.mjs" ]; then
  echo "[INFO] Đang cài đặt các thành phần còn thiếu..."
  npm ci
fi

echo "[INFO] Đang kiểm tra bộ render cục bộ và khởi động Studio..."
echo "[INFO] Lần chạy đầu có thể mất vài phút để tải trình duyệt render."
(
  for _ in $(seq 1 180); do
    if command -v curl >/dev/null 2>&1 && curl -fsS "http://localhost:3300/api/health" >/dev/null 2>&1; then
      if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:3300"
      elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "http://localhost:3300" >/dev/null 2>&1 || true
      fi
      break
    fi
    sleep 1
  done
) &

npm start
