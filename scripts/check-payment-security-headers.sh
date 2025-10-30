#!/bin/sh

# Payment Page Security Headers Checker
# Checks security headers relevant to PCI DSS 11.6.1 requirements

usage() {
    echo "Usage: $0 <payment_page_url>"
    echo "Example: $0 https://checkout.example.com/payment"
    exit 1
}

# Check if URL parameter is provided
if [ $# -ne 1 ]; then
    usage
fi

URL="$1"

# Validate URL format
case "$URL" in
    http://*|https://*)
        ;;
    *)
        echo "Error: URL must start with http:// or https://"
        exit 1
        ;;
esac

echo "=== Payment Page Security Headers Analysis ==="
echo "URL: $URL"
echo "Date: $(date)"
echo "PCI DSS 11.6.1 Security Header Check"
echo "======================================"

USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Function to fetch headers with specific HTTP method
fetch_with_method() {
    method="$1"
    curl -s -X "$method" -i -A "$USER_AGENT" "$URL" 2>/dev/null
}

echo ""

# Test OPTIONS method (silently)
OPTIONS_RESPONSE=$(fetch_with_method OPTIONS)
OPTIONS_EXIT_CODE=$?

if [ $OPTIONS_EXIT_CODE -eq 0 ]; then
    OPTIONS_HEADERS=$(echo "$OPTIONS_RESPONSE" | awk 'BEGIN{RS="\r\n\r\n"} NR==1')
    OPTIONS_STATUS=$(echo "$OPTIONS_HEADERS" | head -n 1 | awk '{print $2}')
else
    OPTIONS_STATUS="FAILED"
fi

# Test GET method (silently)
GET_RESPONSE=$(fetch_with_method GET)
GET_EXIT_CODE=$?

if [ $GET_EXIT_CODE -eq 0 ]; then
    GET_HEADERS=$(echo "$GET_RESPONSE" | awk 'BEGIN{RS="\r\n\r\n"} NR==1')
    GET_STATUS=$(echo "$GET_HEADERS" | head -n 1 | awk '{print $2}')
else
    GET_STATUS="FAILED"
fi

# Determine if methods work (for later reporting)
if [ "$OPTIONS_STATUS" != "FAILED" ] && [ "$OPTIONS_STATUS" -ge 200 ] && [ "$OPTIONS_STATUS" -lt 300 ] 2>/dev/null; then
    OPTIONS_WORKS=true
else
    OPTIONS_WORKS=false
fi

if [ "$GET_STATUS" != "FAILED" ] && [ "$GET_STATUS" -ge 200 ] && [ "$GET_STATUS" -lt 300 ] 2>/dev/null; then
    GET_WORKS=true
else
    GET_WORKS=false
fi

# Function to check for specific header
check_header() {
    header_name="$1"
    headers_to_check="$2"

    header_value=$(echo "$headers_to_check" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r\n')

    printf "%-30s: " "$header_name"
    if [ -n "$header_value" ]; then
        echo "PRESENT"
    else
        echo "MISSING"
    fi
}

# Function to analyze security headers for a given set of headers
analyze_security_headers() {
    method="$1"
    headers="$2"

    echo "=== PCI DSS 11.6.1 SECURITY HEADERS ($method) ==="
    echo ""

    # Check critical security headers for payment pages
    check_header "Strict-Transport-Security" "$headers"
    check_header "Content-Security-Policy" "$headers"
    check_header "X-Frame-Options" "$headers"
    check_header "X-Content-Type-Options" "$headers"
    check_header "Referrer-Policy" "$headers"
    check_header "X-XSS-Protection" "$headers"
    check_header "Permissions-Policy" "$headers"
    check_header "Cache-Control" "$headers"
    check_header "Pragma" "$headers"
    check_header "Expires" "$headers"

    echo ""
}

# Analyze headers from OPTIONS if available
if [ "$OPTIONS_EXIT_CODE" -eq 0 ] && [ -n "$OPTIONS_HEADERS" ]; then
    echo "Response Headers (OPTIONS):"
    echo "$OPTIONS_HEADERS"
    echo ""
    analyze_security_headers "OPTIONS" "$OPTIONS_HEADERS"
fi

# Analyze headers from GET if available
if [ "$GET_EXIT_CODE" -eq 0 ] && [ -n "$GET_HEADERS" ]; then
    echo "Response Headers (GET):"
    echo "$GET_HEADERS"
    echo ""
    analyze_security_headers "GET" "$GET_HEADERS"
fi

# Report on method availability at the end
echo "=== HTTP METHOD AVAILABILITY CHECK ==="
echo ""

printf "%-10s: Status %s" "OPTIONS" "$OPTIONS_STATUS"
if [ "$OPTIONS_WORKS" = true ]; then
    echo " ✅ WORKS (2xx)"
else
    echo " ❌ Does not work"
fi

printf "%-10s: Status %s" "GET" "$GET_STATUS"
if [ "$GET_WORKS" = true ]; then
    echo " ✅ WORKS (2xx)"
else
    echo " ❌ Does not work"
fi

echo ""

# Check if at least one method worked
if [ "$OPTIONS_WORKS" = false ] && [ "$GET_WORKS" = false ]; then
    echo "⚠️  WARNING: Neither OPTIONS nor GET returned a successful 2xx response"
fi

echo ""
echo "Note: For redirect responses (3xx), check the Location header in the response headers above to see the redirect destination."

