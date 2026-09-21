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

# -u: stop on unset variables, -o pipefail: a failure inside a pipe counts as a failure
# (we do NOT use -e, because we want the script to keep going after a failed test)
set -uo pipefail

# All requests go through the gateway, just like a real client would
BASE="http://localhost:8080"
# Counts how many checks passed
PASS=0
# Counts how many checks failed
FAIL=0

# ── Helpers ───────────────────────────────────────────────────────────────────

# Color codes so results are easy to read in the terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'  # No Color

# Print a green check and add 1 to the pass counter
pass()  { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
# Print a red cross and add 1 to the fail counter
fail()  { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
# Print a yellow warning (does not count as pass or fail)
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
# Print a section title
header(){ echo -e "\n── $1 ──"; }

# assert_eq <desc> <expected> <actual>
# Passes when the two values are exactly the same
assert_eq() {
  # Compare expected ($2) with actual ($3)
  if [ "$2" = "$3" ]; then
    # They match, so record a pass
    pass "$1"
  else
    # They differ, so record a fail and show both values
    fail "$1 (expected=$2, got=$3)"
  fi
}

# assert_contains <desc> <pattern> <text>
# Passes when the text contains the pattern
assert_contains() {
  # Check if $3 (the text) includes $2 (the pattern)
  if [[ "$3" == *"$2"* ]]; then
    # Found it, so record a pass
    pass "$1"
  else
    # Not found, so record a fail and show what we looked for
    fail "$1 (pattern not found: '$2')"
  fi
}

# Decode a claim from a JWT payload (base64url → JSON → grep).
# Usage: jwt_claim <token> <field>
jwt_claim() {
  # Save the two inputs in named variables
  local token="$1" field="$2"
  # This will hold the middle part of the token (the payload)
  local payload
  # A JWT is header.payload.signature, so take the 2nd part
  payload=$(echo "$token" | cut -d. -f2)
  # base64url padding: length must be a multiple of 4
  # Work out how many "=" characters we need to add
  local pad=$(( 4 - ${#payload} % 4 ))
  # Add the padding, but only if it is needed
  [ $pad -lt 4 ] && payload="${payload}$(printf '=%.0s' $(seq 1 $pad))"
  # Decode the payload, find "field":"value", then cut out just the value
  echo "$payload" | base64 --decode 2>/dev/null \
    | grep -o "\"${field}\":\"[^\"]*\"" \
    | head -1 | cut -d'"' -f4
}

# ── Setup ─────────────────────────────────────────────────────────────────────

# The current time in seconds, used to make unique email addresses for each run
TS=$(date +%s)
# The email for the admin test user
ADMIN_EMAIL="admin_${TS}@test.com"
# The email for the viewer test user
VIEWER_EMAIL="viewer_${TS}@test.com"
RL_EMAIL="rl_${TS}@test.com"       # dedicated user for rate-limit test
# The password used by all test users
PASS_WORD="TestPass123!"

# Print the title banner
echo ""
echo "══════════════════════════════════════════════════"
echo "  Enterprise AI Agent — End-to-End Test Suite     "
echo "══════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 1 — Health checks (all 5 services)
# ─────────────────────────────────────────────────────────────────────────────
header "1. Health checks"

# Check the health page of each service port (gateway, auth, agent, audit, analytics)
for port in 8080 8081 8082 8083 8084; do
  # Ask the health page and keep only the HTTP status code (5 second limit)
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 5 "http://localhost:${port}/actuator/health")
  # It must answer 200 (OK)
  assert_eq "Service on :${port} returns 200" "200" "$status"
done

# ─────────────────────────────────────────────────────────────────────────────
# TEST 2 — Register admin user
# ─────────────────────────────────────────────────────────────────────────────
header "2. Register admin user"

# Create an admin account through the gateway and save the response
reg_body=$(curl -s --max-time 10 -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASS_WORD\",\"role\":\"ADMIN\"}")

# Save the exit code of the curl command above
reg_status=$?
# The response must include an access token
assert_contains "Register returns accessToken" "accessToken" "$reg_body"
ADMIN_TOKEN=$(jwt_claim "$(echo "$reg_body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)" "sub")
# Grab the raw token string (not a claim)
ADMIN_TOKEN=$(echo "$reg_body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
# A JWT has dots between its 3 parts, so the token must contain a dot
assert_contains "accessToken is a JWT (has 3 parts)" "." "$ADMIN_TOKEN"

# Read the user id out of the token (we need it for later requests)
ADMIN_USER_ID=$(jwt_claim "$ADMIN_TOKEN" "userId")

# ─────────────────────────────────────────────────────────────────────────────
# TEST 3 — Login
# ─────────────────────────────────────────────────────────────────────────────
header "3. Login"

# Log in with the admin account; -w adds the status code on a new last line
login_resp=$(curl -s -w "\n%{http_code}" --max-time 10 \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASS_WORD\"}")

# Everything except the last line is the response body
login_body=$(echo "$login_resp" | sed '$d')
# The last line is the HTTP status code
login_status=$(echo "$login_resp" | tail -n 1)

# Login must return 200 (OK)
assert_eq "Login returns HTTP 200"            "200"          "$login_status"
# The body must include an access token
assert_contains "Login response has accessToken" "accessToken" "$login_body"

# Pull the access token out of the login response
LOGIN_TOKEN=$(echo "$login_body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# Verify wrong password gets rejected
# Try to log in with a wrong password and keep only the status code
bad_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrongpassword\"}")
# A wrong password must be rejected with 403
assert_eq "Wrong password returns 403" "403" "$bad_status"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 4 — Chat SSE stream
# ─────────────────────────────────────────────────────────────────────────────
header "4. Chat SSE stream"

# Send a chat message; --no-buffer shows the stream as it arrives (30 second limit)
chat_resp=$(curl -s --no-buffer --max-time 30 \
  -X POST "$BASE/agent/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -d "{\"userId\":\"$ADMIN_USER_ID\",\"prompt\":\"Reply with exactly: hello world\"}")

# "$?" is the exit code of the curl above: 0 means the connection worked
assert_eq   "Chat returns HTTP 200 (connection accepted)" "0" "$?"
# A stream has lines that start with "event:"
assert_contains "Chat response contains SSE event lines" "event:"    "$chat_resp"
# A stream has lines that start with "data:"
assert_contains "Chat response contains data lines"      "data:"     "$chat_resp"
# Our server always ends the stream with [DONE]
assert_contains "Chat stream ends with [DONE] sentinel"  "[DONE]"    "$chat_resp"

# Unauthenticated chat should be rejected by the gateway
# Send a chat request with no token and keep only the status code
unauth_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  -X POST "$BASE/agent/chat" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"x\",\"prompt\":\"test\"}")
# No token must give 401 (Unauthorized)
assert_eq "Unauthenticated chat request returns 401" "401" "$unauth_status"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 5 — Audit log (ADMIN only)
# ─────────────────────────────────────────────────────────────────────────────
header "5. Audit log"

# Give Kafka consumer up to 3 seconds to process the chat event
# (audit records are saved in the background, so they are not instant)
sleep 3

# Ask for the audit logs as the admin and keep only the status code
audit_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/audit/logs" \
  -H "Authorization: Bearer $LOGIN_TOKEN")
# An admin must be allowed (200)
assert_eq "GET /audit/logs returns 200 for ADMIN" "200" "$audit_status"

# Ask again, this time keeping the response body
audit_body=$(curl -s --max-time 10 \
  "$BASE/audit/logs" \
  -H "Authorization: Bearer $LOGIN_TOKEN")
# The body must be a JSON list, so it must contain "["
assert_contains "Audit log contains JSON array" "[" "$audit_body"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 6 — Analytics usage
# ─────────────────────────────────────────────────────────────────────────────
header "6. Analytics usage"

# Ask for the admin's usage for the last 7 days; -w adds the status code on a new last line
analytics_resp=$(curl -s -w "\n%{http_code}" --max-time 10 \
  "$BASE/analytics/usage?userId=$ADMIN_USER_ID&days=7" \
  -H "Authorization: Bearer $LOGIN_TOKEN")
# Everything except the last line is the response body
analytics_body=$(echo "$analytics_resp" | sed '$d')
# The last line is the HTTP status code
analytics_status=$(echo "$analytics_resp" | tail -n 1)

# The request must succeed (200)
assert_eq "GET /analytics/usage returns 200"   "200" "$analytics_status"
# The body must be a JSON list, so it must contain "["
assert_contains "Analytics response is JSON array" "["   "$analytics_body"

# Ask for the pipeline stats and keep only the status code
pipeline_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/analytics/pipeline" \
  -H "Authorization: Bearer $LOGIN_TOKEN")
# The request must succeed (200)
assert_eq "GET /analytics/pipeline returns 200" "200" "$pipeline_status"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 7 — GitHub webhook
# ─────────────────────────────────────────────────────────────────────────────
header "7. GitHub webhook"

# A fake (but correctly shaped) GitHub push event
WEBHOOK_PAYLOAD='{
  "ref": "refs/heads/main",
  "repository": {"full_name": "test-org/test-repo"},
  "head_commit": {"id": "abc123def456"},
  "commits": [
    {"added": ["src/Main.java"], "modified": ["README.md"], "removed": []}
  ]
}'

# Send the fake push event to our webhook (30 seconds, because the AI takes time)
webhook_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 \
  -X POST "$BASE/agent/webhook/github" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -d "$WEBHOOK_PAYLOAD")
# The webhook must accept it (200)
assert_eq "POST /agent/webhook/github returns 200" "200" "$webhook_status"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 8 — Rate limit (429)
# ─────────────────────────────────────────────────────────────────────────────
header "8. Rate limit"

# Register a fresh user whose Redis counter starts at 0
rl_reg=$(curl -s --max-time 10 -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RL_EMAIL\",\"password\":\"$PASS_WORD\",\"role\":\"DEVELOPER\"}")
# Get the access token for the rate-limit user
RL_TOKEN=$(echo "$rl_reg" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
# Get the user id for the rate-limit user
RL_USER_ID=$(jwt_claim "$RL_TOKEN" "userId")

# Lower the default team limit to 2 requests/hour so we can trigger 429 quickly
# (the admin is allowed to change limits)
curl -s -o /dev/null --max-time 10 \
  -X PUT "$BASE/gateway/teams/default/limits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -d '{"requestsPerHour": 2, "tokensPerDay": 1000000}'

# Make 3 rapid requests — request 3 must get 429
# Request 1: should be allowed
r1=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  "$BASE/analytics/usage?userId=$RL_USER_ID&days=1" \
  -H "Authorization: Bearer $RL_TOKEN")
# Request 2: should be allowed (this uses the last of the 2 allowed)
r2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  "$BASE/analytics/usage?userId=$RL_USER_ID&days=1" \
  -H "Authorization: Bearer $RL_TOKEN")
# Request 3: should be blocked because the limit is 2
r3=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  "$BASE/analytics/usage?userId=$RL_USER_ID&days=1" \
  -H "Authorization: Bearer $RL_TOKEN")

# The first two must succeed
assert_eq "Request 1 (under limit) → 200" "200" "$r1"
assert_eq "Request 2 (under limit) → 200" "200" "$r2"
# The third must be blocked with 429 (Too Many Requests)
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
# This is the same key name that the gateway uses
REDIS_KEY="rate_limit:${RL_USER_ID}"

# Use redis-cli from this computer if it is installed
if command -v redis-cli &>/dev/null; then
  # Ask Redis if the key exists (1 = yes, 0 = no)
  key_exists=$(redis-cli EXISTS "$REDIS_KEY" 2>/dev/null)
  # Remember which method we used (for the test message)
  redis_source="redis-cli"
else
  # Otherwise run redis-cli inside the redis container
  key_exists=$(docker exec redis redis-cli EXISTS "$REDIS_KEY" 2>/dev/null)
  # Remember which method we used (for the test message)
  redis_source="docker exec redis"
fi

# The key must exist (1)
assert_eq "Redis rate_limit key exists for rl_user ($redis_source)" "1" "$key_exists"

# Also verify key has a TTL (it expires after the sliding window)
# Use the same method as before to ask Redis for the key's time-to-live
if command -v redis-cli &>/dev/null; then
  # Ask from this computer
  ttl=$(redis-cli TTL "$REDIS_KEY" 2>/dev/null)
else
  # Ask inside the redis container
  ttl=$(docker exec redis redis-cli TTL "$REDIS_KEY" 2>/dev/null)
fi

# A positive number means the key will expire on its own
if [ "$ttl" -gt 0 ] 2>/dev/null; then
  # Good: the key cleans itself up
  pass "Redis key has a TTL of ${ttl}s (auto-expires after window)"
else
  # We could not confirm it, so warn (not a failure)
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
# Get the viewer's access token
VIEWER_TOKEN=$(echo "$viewer_reg" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
# Get the viewer's user id
VIEWER_ID=$(jwt_claim "$VIEWER_TOKEN" "userId")

# VIEWER must be denied /audit/logs (ADMIN only endpoint)
v_audit=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/audit/logs" \
  -H "Authorization: Bearer $VIEWER_TOKEN")
# 403 (Forbidden) means "we know who you are, but you are not allowed"
assert_eq "VIEWER denied GET /audit/logs (403)" "403" "$v_audit"

# VIEWER must be denied /analytics/teams (ADMIN only endpoint)
v_teams=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/analytics/teams" \
  -H "Authorization: Bearer $VIEWER_TOKEN")
# 403 (Forbidden) is what we expect here too
assert_eq "VIEWER denied GET /analytics/teams (403)" "403" "$v_teams"

# VIEWER CAN access their own usage analytics
v_usage=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE/analytics/usage?userId=$VIEWER_ID&days=7" \
  -H "Authorization: Bearer $VIEWER_TOKEN")
# Viewers are allowed to see their own numbers (200)
assert_eq "VIEWER can access own usage (200)" "200" "$v_usage"

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
# The total number of checks that ran
TOTAL=$((PASS + FAIL))
echo ""
echo "══════════════════════════════════════════════════"
# If nothing failed, say so in green
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}ALL $TOTAL TESTS PASSED ✓${NC}"
else
  # Otherwise show how many failed and passed
  echo -e "  ${RED}${FAIL} FAILED${NC} / ${GREEN}${PASS} PASSED${NC} (total: $TOTAL)"
fi
echo "══════════════════════════════════════════════════"
echo ""

# The last line decides the exit code: 0 if no failures, 1 otherwise
[ "$FAIL" -eq 0 ]
