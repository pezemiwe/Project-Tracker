#!/bin/bash

# Lighthouse Audit Script for All Pages
# Phase 9.11: Performance & Accessibility Testing
#
# Prerequisites:
# 1. Dev server running: cd frontend && npm run dev
# 2. Lighthouse installed: npm install -g lighthouse
# 3. Authenticated session (login first, copy cookies)
#
# Usage: ./scripts/lighthouse-audit.sh

BASE_URL="http://localhost:5173"
OUTPUT_DIR="./lighthouse-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create output directory
mkdir -p "$OUTPUT_DIR/$TIMESTAMP"

echo "========================================="
echo "Lighthouse Audit - Phase 9.11"
echo "========================================="
echo "Output: $OUTPUT_DIR/$TIMESTAMP"
echo ""

# Public pages (no auth required)
PUBLIC_PAGES=(
  "login:/login"
)

# Protected pages (requires authentication)
# Note: Must login manually first, then run this script
PROTECTED_PAGES=(
  "dashboard:/"
  "users:/users"
  "objectives:/objectives"
  "objective-detail:/objectives/1"
  "activities:/activities"
  "approvals:/approvals"
  "audit:/audit"
  "import-export:/import-export"
  "settings:/settings"
)

# Function to run Lighthouse audit
run_audit() {
  local name=$1
  local path=$2
  local url="$BASE_URL$path"
  local output_file="$OUTPUT_DIR/$TIMESTAMP/${name}"

  echo "Auditing: $name ($url)"

  lighthouse "$url" \
    --output html \
    --output json \
    --output-path "$output_file" \
    --chrome-flags="--headless=new" \
    --quiet \
    --only-categories=performance,accessibility,best-practices,seo

  if [ $? -eq 0 ]; then
    echo "✓ Completed: $name"
  else
    echo "✗ Failed: $name"
  fi
  echo ""
}

# Run audits on public pages
echo "Testing Public Pages..."
echo "-------------------------------------"
for page in "${PUBLIC_PAGES[@]}"; do
  IFS=':' read -r name path <<< "$page"
  run_audit "$name" "$path"
done

echo ""
echo "Testing Protected Pages..."
echo "-------------------------------------"
echo "⚠️  Authentication required for protected pages"
echo "   Please login at http://localhost:5173/login first"
echo "   Press Enter when ready..."
read

for page in "${PROTECTED_PAGES[@]}"; do
  IFS=':' read -r name path <<< "$page"
  run_audit "$name" "$path"
done

# Generate summary
echo ""
echo "========================================="
echo "Audit Summary"
echo "========================================="
echo "Reports saved to: $OUTPUT_DIR/$TIMESTAMP"
echo ""
echo "To view reports:"
echo "  open $OUTPUT_DIR/$TIMESTAMP/*.html"
echo ""
echo "Next steps:"
echo "  1. Review performance scores (target: ≥90)"
echo "  2. Review accessibility scores (target: ≥90)"
echo "  3. Fix any critical issues found"
echo "  4. Re-run audit to verify fixes"
echo ""
