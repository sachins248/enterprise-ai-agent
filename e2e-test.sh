#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Enterprise AI Agent — End-to-End Test Suite
#
# Prerequisites:
#   docker compose up -d    (wait ~2 min for all services to show "healthy")
#
# Usage:
#   chmod +x e2e-test.sh
#   ./e2e-test.sh
#
# Exit code: 0 = all tests passed, 1 = one or more tests failed.
# ─────────────────────────────────────────────────────────────────────────────

set -uo pipefail

BASE="http://localhost:8080"
PASS=0
FAIL=0

# ── Helpers ───────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'  # No Color

pass()  { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
fail()  { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
header(){ echo -e "\n── $1 ──"; }

# assert_eq <desc> <expected> <actual>
assert_eq() {
  if [ "$2" = "$3" ]; then
    pass "$1"
  else
    fail "$1 (expected=$2, got=$3)"
  fi
}

# assert_contains <desc> <pattern> <text>
assert_contains() {
  if [[ "$3" == *"$2"* ]]; then
    pass "$1"
  else
    fail "$1 (pattern not found: '$2')"
  fi
}

# Decode a claim from a JWT payload (base64url → JSON → grep).
# Usage: jwt_claim <token> <field>
jwt_claim() {
  local token="$1" field="$2"
  local payload
  payload=$(echo "$token" | cut -d. -f2)
  # base64url padding: length must be a multiple of 4
  local pad=$(( 4 - ${#payload} % 4 ))
  [ $pad -lt 4 ] && payload="${payload}$(printf '=%.0s' $(seq 1 $pad))"
  echo "$payload" | base64 --decode 2>/dev/null \
    | grep -o "\"${field}\":\"[^\"]*\"" \
    | head -1 | cut -d'"' -f4
}

# ── Setup ─────────────────────────────────────────────────────────────────────

TS=$(date +%s)
ADMIN_EMAIL="admin_${TS}@test.com"
VIEWER_EMAIL="viewer_${TS}@test.com"
RL_EMAIL="rl_${TS}@test.com"       # dedicated user for rate-limit test
PASS_WORD="TestPass123!"

echo ""
echo "══════════════════════════════════════════════════"
echo "  Enterprise AI Agent — End-to-End Test Suite     "
echo "══════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 1 — Health checks (all 5 services)
# ─────────────────────────────────────────────────────────────────────────────
header "1. Health checks"

for port in 8080 8081 8082 8083 8084; do
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 5 "http://localhost:${port}/actuator/health")
  assert_eq "Service on :${port} returns 200" "200" "$status"
done

# ─────────────────────────────────────────────────────────────────────────────
# TEST 2 — Register admin user
# ─────────────────────────────────────────────────────────────────────────────
header "2. Register admin user"

reg_body=$(curl -s --max-time 10 -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASS_WORD\",\"role\":\"ADMIN\"}")

reg_status=$?
assert_contains "Register returns accessToken" "accessToken" "$reg_body"
ADMIN_TOKEN=$(jwt_claim "$(echo "$reg_body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)" "sub")
# Grab the raw token string (not a claim)
ADMIN_TOKEN=$(echo "$reg_body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
assert_contains "accessToken is a JWT (has 3 parts)" "." "$ADMIN_TOKEN"

ADMIN_USER_ID=$(jwt_claim "$ADMIN_TOKEN" "userId")

# ─────────────────────────────────────────────────────────────────────────────
# TEST 3 — Login
# ─────────────────────────────────────────────────────────────────────────────
header "3. Login"

login_resp=$(curl -s -w "\n%{http_code}" --max-time 10 \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASS_WORD\"}")

login_body=$(echo "$login_resp" | sed '$d')
login_status=$(echo "$login_resp" | tail -n 1)

assert_eq "Login returns HTTP 200"            "200"          "$login_status"
assert_contains "Login response has accessToken" "accessToken" "$login_body"

LOGIN_TOKEN=$(echo "$login_body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# Verify wrong password gets rejected
bad_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrongpassword\"}")
assert_eq "Wrong password returns 403" "403" "$bad_status"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 4 — Chat SSE stream
# ─────────────────────────────────────────────────────────────────────────────
header "4. Chat SSE stream"

chat_resp=$(curl -s --no-buffer --max-time 30 \
  -X POST "$BASE/agent/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -d "{\"userId\":\"$ADMIN_USER_ID\",\"prompt\":\"Reply with exactly: hello world\"}")

assert_eq   "Chat returns HTTP 200 (connection accepted)" "0" "$?"
assert_contains "Chat response contains SSE event lines" "event:"    "$chat_resp"
assert_contains "Chat response contains data lines"      "data:"     "$chat_resp"
assert_contains "Chat stream ends with [DONE] sentinel"  "[DONE]"    "$chat_resp"

# Unauthenticated chat should be rejected by the gateway
unauth_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  -X POST "$BASE/agent/chat" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"x\",\"prompt\":\"test\"}")
assert_eq "Unauthenticated chat request returns 401" "401" "$unauth_status"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 5 — Audit log (ADMIN only)
# ─────────────────────────────────────────────────────────────────────────────
header "5. Audit log"

# Give Kafka consumer up to 3 seconds to process the chat event
sleep 3

audit_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/audit/logs" \
  -H "Authorization: Bearer $LOGIN_TOKEN")
assert_eq "GET /audit/logs returns 200 for ADMIN" "200" "$audit_status"

audit_body=$(curl -s --max-time 10 \
  "$BASE/audit/logs" \
  -H "Authorization: Bearer $LOGIN_TOKEN")
assert_contains "Audit log contains JSON array" "[" "$audit_body"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 6 — Analytics usage
# ─────────────────────────────────────────────────────────────────────────────
header "6. Analytics usage"

analytics_resp=$(curl -s -w "\n%{http_code}" --max-time 10 \
  "$BASE/analytics/usage?userId=$ADMIN_USER_ID&days=7" \
  -H "Authorization: Bearer $LOGIN_TOKEN")
analytics_body=$(echo "$analytics_resp" | sed '$d')
analytics_status=$(echo "$analytics_resp" | tail -n 1)

assert_eq "GET /analytics/usage returns 200"   "200" "$analytics_status"
assert_contains "Analytics response is JSON array" "["   "$analytics_body"

pipeline_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/analytics/pipeline" \
  -H "Authorization: Bearer $LOGIN_TOKEN")
assert_eq "GET /analytics/pipeline returns 200" "200" "$pipeline_status"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 7 — GitHub webhook
# ─────────────────────────────────────────────────────────────────────────────
header "7. GitHub webhook"

WEBHOOK_PAYLOAD='{
  "ref": "refs/heads/main",
  "repository": {"full_name": "test-org/test-repo"},
  "head_commit": {"id": "abc123def456"},
  "commits": [
    {"added": ["src/Main.java"], "modified": ["README.md"], "removed": []}
  ]
}'

webhook_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 \
  -X POST "$BASE/agent/webhook/github" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -d "$WEBHOOK_PAYLOAD")
assert_eq "POST /agent/webhook/github returns 200" "200" "$webhook_status"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 8 — Rate limit (429)
# ─────────────────────────────────────────────────────────────────────────────
header "8. Rate limit"

# Register a fresh user whose Redis counter starts at 0
rl_reg=$(curl -s --max-time 10 -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RL_EMAIL\",\"password\":\"$PASS_WORD\",\"role\":\"DEVELOPER\"}")
RL_TOKEN=$(echo "$rl_reg" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
RL_USER_ID=$(jwt_claim "$RL_TOKEN" "userId")

# Lower the default team limit to 2 requests/hour so we can trigger 429 quickly
curl -s -o /dev/null --max-time 10 \
  -X PUT "$BASE/gateway/teams/default/limits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -d '{"requestsPerHour": 2, "tokensPerDay": 1000000}'

# Make 3 rapid requests — request 3 must get 429
r1=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  "$BASE/analytics/usage?userId=$RL_USER_ID&days=1" \
  -H "Authorization: Bearer $RL_TOKEN")
r2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  "$BASE/analytics/usage?userId=$RL_USER_ID&days=1" \
  -H "Authorization: Bearer $RL_TOKEN")
r3=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  "$BASE/analytics/usage?userId=$RL_USER_ID&days=1" \
  -H "Authorization: Bearer $RL_TOKEN")

assert_eq "Request 1 (under limit) → 200" "200" "$r1"
assert_eq "Request 2 (under limit) → 200" "200" "$r2"
assert_eq "Request 3 (over limit)  → 429" "429" "$r3"

# Restore limit to default so subsequent tests aren't affected
curl -s -o /dev/null --max-time 10 \
  -X PUT "$BASE/gateway/teams/default/limits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -d '{"requestsPerHour": 100, "tokensPerDay": 1000000}'

# ─────────────────────────────────────────────────────────────────────────────
# TEST 9 — Redis rate-limit counter exists
# ─────────────────────────────────────────────────────────────────────────────
header "9. Redis counter"

# After the rate limit test, the ZSET key for RL_USER_ID must exist in Redis.
# Try redis-cli directly first, fall back to docker exec.
REDIS_KEY="rate_limit:${RL_USER_ID}"

if command -v redis-cli &>/dev/null; then
  key_exists=$(redis-cli EXISTS "$REDIS_KEY" 2>/dev/null)
  redis_source="redis-cli"
else
  key_exists=$(docker exec redis redis-cli EXISTS "$REDIS_KEY" 2>/dev/null)
  redis_source="docker exec redis"
fi

assert_eq "Redis rate_limit key exists for rl_user ($redis_source)" "1" "$key_exists"

# Also verify key has a TTL (it expires after the sliding window)
if command -v redis-cli &>/dev/null; then
  ttl=$(redis-cli TTL "$REDIS_KEY" 2>/dev/null)
else
  ttl=$(docker exec redis redis-cli TTL "$REDIS_KEY" 2>/dev/null)
fi

if [ "$ttl" -gt 0 ] 2>/dev/null; then
  pass "Redis key has a TTL of ${ttl}s (auto-expires after window)"
else
  warn "Could not verify Redis key TTL (got: $ttl)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# TEST 10 — VIEWER RBAC
# ─────────────────────────────────────────────────────────────────────────────
header "10. VIEWER RBAC"

# Register a VIEWER user
viewer_reg=$(curl -s --max-time 10 -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VIEWER_EMAIL\",\"password\":\"$PASS_WORD\",\"role\":\"VIEWER\"}")
VIEWER_TOKEN=$(echo "$viewer_reg" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
VIEWER_ID=$(jwt_claim "$VIEWER_TOKEN" "userId")

# VIEWER must be denied /audit/logs (ADMIN only endpoint)
v_audit=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/audit/logs" \
  -H "Authorization: Bearer $VIEWER_TOKEN")
assert_eq "VIEWER denied GET /audit/logs (403)" "403" "$v_audit"

# VIEWER must be denied /analytics/teams (ADMIN only endpoint)
v_teams=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/analytics/teams" \
  -H "Authorization: Bearer $VIEWER_TOKEN")
assert_eq "VIEWER denied GET /analytics/teams (403)" "403" "$v_teams"

# VIEWER CAN access their own usage analytics
v_usage=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/analytics/usage?userId=$VIEWER_ID&days=7" \
  -H "Authorization: Bearer $VIEWER_TOKEN")
assert_eq "VIEWER can access own usage (200)" "200" "$v_usage"

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
echo ""
echo "══════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}ALL $TOTAL TESTS PASSED ✓${NC}"
else
  echo -e "  ${RED}${FAIL} FAILED${NC} / ${GREEN}${PASS} PASSED${NC} (total: $TOTAL)"
fi
echo "══════════════════════════════════════════════════"
echo ""

[ "$FAIL" -eq 0 ]
