#!/usr/bin/env bash

set -euo pipefail

REPORT_HTML="coverage/lcov-report/index.html"
REPORT_JSON="coverage/coverage-summary.json"

echo "=== Running Jest tests with coverage ==="
npx jest --coverage --coverageReporters=lcov --coverageReporters=json-summary --coverageReporters=text 2>&1

echo ""
echo "=== Coverage Summary ==="
if [ -f "$REPORT_JSON" ]; then
    node -e "
const s = require('./$REPORT_JSON').total;
const fmt = (x) => (x.pct + '%').padStart(7) + '  (' + x.covered + '/' + x.total + ')';
console.log('Statements: ' + fmt(s.statements));
console.log('Branches:   ' + fmt(s.branches));
console.log('Functions:  ' + fmt(s.functions));
console.log('Lines:      ' + fmt(s.lines));
"
else
    echo "Coverage summary not found at $REPORT_JSON"
fi

echo ""
echo "HTML report: $REPORT_HTML"
if command -v xdg-open &>/dev/null && [ -n "${DISPLAY:-}" ]; then
    xdg-open "$REPORT_HTML"
fi

exit 0
