#!/usr/bin/env bash
# Run this before every git push to catch what CI will catch.
# Usage: bash scripts/local-check.sh
# Install as a hook: cp scripts/local-check.sh .git/hooks/pre-push && chmod +x .git/hooks/pre-push

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "=== local-check: invoice-tracker ==="

# ── 1. Backend test-compile ───────────────────────────────────────────────────
echo ""
echo "--- 1/4  Backend compilation ---"
JAVA_HOME="${JAVA_HOME:-/c/Users/ExpertBook/.jdks/temurin-21.0.4}"
cd backend
if JAVA_HOME="$JAVA_HOME" ./mvnw -B test-compile -q 2>&1; then
  pass "Backend test-compile"
else
  fail "Backend test-compile failed — fix compilation errors before pushing"
fi
cd "$ROOT"

# ── 2. Frontend type-check ────────────────────────────────────────────────────
echo ""
echo "--- 2/4  Frontend type-check ---"
cd frontend
if pnpm exec tsc --noEmit 2>&1; then
  pass "Frontend TypeScript"
else
  fail "Frontend TypeScript errors — fix before pushing"
fi
cd "$ROOT"

# ── 3. Frontend lint ─────────────────────────────────────────────────────────
echo ""
echo "--- 3/4  Frontend lint ---"
cd frontend
if pnpm lint 2>&1; then
  pass "Frontend lint"
else
  fail "Frontend lint errors — fix before pushing"
fi
cd "$ROOT"

# ── 4. Semgrep SAST (requires Docker) ────────────────────────────────────────
echo ""
echo "--- 4/4  Semgrep SAST ---"
if ! docker info > /dev/null 2>&1; then
  warn "Docker not running — skipping Semgrep (will be checked in CI)"
else
  if docker run --rm -v "$(pwd):/src" returntocorp/semgrep:latest \
      semgrep --config=auto --error --quiet /src 2>&1; then
    pass "Semgrep SAST"
  else
    fail "Semgrep found security issues — fix before pushing"
  fi
fi

echo ""
echo -e "${GREEN}=== All local checks passed ===${NC}"
