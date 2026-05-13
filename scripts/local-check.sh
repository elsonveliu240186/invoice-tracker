#!/usr/bin/env bash
# Fast local loop: backend tests + frontend tests only.
# Security gates (OWASP DC, Semgrep, Trivy, Grype, gitleaks) run in CI.
# Usage: bash scripts/local-check.sh
# Install as a hook: cp scripts/local-check.sh .git/hooks/pre-push && chmod +x .git/hooks/pre-push

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

echo "=== local-check: invoice-tracker ==="

# ── 1. Backend tests (unit + IT via -Pfast, skips OWASP DC + PMD) ────────────
echo ""
echo "--- 1/2  Backend tests (-Pfast verify) ---"
JAVA_HOME="${JAVA_HOME:-/c/Users/ExpertBook/.jdks/temurin-21.0.4}"
cd backend
if JAVA_HOME="$JAVA_HOME" ./mvnw -Pfast verify -q 2>&1; then
  pass "Backend tests (34 tests, JaCoCo gate)"
else
  fail "Backend tests failed — fix before pushing"
fi
cd "$ROOT"

# ── 2. Frontend tests (Vitest coverage) ──────────────────────────────────────
echo ""
echo "--- 2/2  Frontend tests (vitest --coverage) ---"
cd frontend
if pnpm test --coverage --run 2>&1; then
  pass "Frontend tests (coverage gate)"
else
  fail "Frontend tests failed — fix before pushing"
fi
cd "$ROOT"

echo ""
echo -e "${GREEN}=== All local checks passed — safe to push ===${NC}"
echo -e "${YELLOW}    Security gates (OWASP DC, Semgrep, Trivy, Grype) run in CI.${NC}"
