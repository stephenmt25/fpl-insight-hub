it #!/usr/bin/env bash
# ============================================================
#  FPL Insight Hub - Local Startup Script
# ============================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ---- Colors ------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[OK]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()  { echo -e "${RED}[ERR]${NC}   $*"; }
info() { echo -e "${CYAN}[INFO]${NC}  $*"; }

# ---- Pre-flight checks ------------------------------------
info "Running pre-flight checks..."

# Node.js
if ! command -v node &>/dev/null; then
  err "Node.js is not installed. Install it from https://nodejs.org (v18+ recommended)."
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  err "Node.js v18+ required. Found: $(node -v)"
  exit 1
fi
log "Node.js $(node -v)"

# Package manager detection (prefer npm since package-lock.json exists)
if command -v npm &>/dev/null; then
  PKG_MGR="npm"
elif command -v bun &>/dev/null; then
  PKG_MGR="bun"
else
  err "No package manager found. Install npm (comes with Node.js) or bun."
  exit 1
fi
log "Using package manager: $PKG_MGR"

# ---- Environment -------------------------------------------
if [ ! -f ".env" ]; then
  warn ".env file not found. Creating from defaults..."
  cat > .env <<'ENVEOF'
VITE_SUPABASE_PROJECT_ID="lyqozlofyngahpslmwti"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cW96bG9meW5nYWhwc2xtd3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwNzY2NTQsImV4cCI6MjA1MTY1MjY1NH0.R1Xn9x3bzKgKf1Ek0Nz1_PYFk1fa9d_MhbdgO_iuHtg"
VITE_SUPABASE_URL="https://lyqozlofyngahpslmwti.supabase.co"
ENVEOF
  log ".env created with Supabase config"
else
  log ".env file found"
fi

# ---- Install dependencies ----------------------------------
info "Installing dependencies..."

if [ "$PKG_MGR" = "npm" ]; then
  npm install
elif [ "$PKG_MGR" = "bun" ]; then
  bun install
fi

log "Dependencies installed"

# ---- Start dev server --------------------------------------
echo ""
echo -e "${CYAN}=================================================${NC}"
echo -e "${CYAN}  FPL Insight Hub - Starting Dev Server${NC}"
echo -e "${CYAN}  URL: http://localhost:8080${NC}"
echo -e "${CYAN}  Press Ctrl+C to stop${NC}"
echo -e "${CYAN}=================================================${NC}"
echo ""

if [ "$PKG_MGR" = "npm" ]; then
  npm run dev
elif [ "$PKG_MGR" = "bun" ]; then
  bun run dev
fi
