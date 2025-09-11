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

# Use curl to fetch headers
HEADERS=$(curl -s -I -L "$URL" 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch headers from $URL"
    exit 1
fi

echo "Response Headers:"
echo "$HEADERS"
echo ""

# Function to check for specific header
check_header() {
    header_name="$1"
    header_description="$2"
    pci_relevance="$3"
    
    header_value=$(echo "$HEADERS" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r\n')
    
    printf "%-30s: " "$header_name"
    if [ -n "$header_value" ]; then
        echo "PRESENT - $header_value"
        echo "  Description: $header_description"
        echo "  PCI DSS 11.6.1 Relevance: $pci_relevance"
    else
        echo "MISSING"
        echo "  Description: $header_description"
        echo "  PCI DSS 11.6.1 Relevance: $pci_relevance"
        echo "  ⚠️  RECOMMENDATION: Implement this header for better security"
    fi
    echo ""
}

echo "=== PCI DSS 11.6.1 RELEVANT SECURITY HEADERS ==="
echo ""

# Check critical security headers for payment pages
check_header "Strict-Transport-Security" \
    "Enforces HTTPS connections" \
    "CRITICAL - Ensures encrypted transmission of payment data"

check_header "Content-Security-Policy" \
    "Controls resource loading to prevent XSS" \
    "HIGH - Prevents injection of malicious scripts that could capture payment data"

check_header "X-Frame-Options" \
    "Prevents clickjacking attacks" \
    "HIGH - Prevents payment forms from being embedded in malicious frames"

check_header "X-Content-Type-Options" \
    "Prevents MIME type sniffing" \
    "MEDIUM - Prevents browsers from misinterpreting file types"

check_header "Referrer-Policy" \
    "Controls referrer information leakage" \
    "MEDIUM - Prevents sensitive payment URLs from being leaked"

check_header "X-XSS-Protection" \
    "Enables XSS filtering (legacy browsers)" \
    "MEDIUM - Additional XSS protection for older browsers"

check_header "Permissions-Policy" \
    "Controls browser feature access" \
    "MEDIUM - Restricts access to sensitive browser features"

check_header "Cache-Control" \
    "Controls caching behavior" \
    "HIGH - Prevents payment data from being cached"

check_header "Pragma" \
    "HTTP/1.0 cache control" \
    "MEDIUM - Legacy cache prevention"

check_header "Expires" \
    "Specifies expiration date" \
    "MEDIUM - Ensures payment pages are not cached"

# Check if HTTPS is being used
echo "=== TRANSPORT SECURITY ==="
case "$URL" in
    https://*)
        echo "✅ HTTPS: ENABLED - Payment data will be encrypted in transit"
        ;;
    http://*)
        echo "❌ HTTPS: DISABLED - CRITICAL SECURITY ISSUE"
        echo "   PCI DSS 11.6.1 requires encrypted transmission of payment data"
        ;;
esac
echo ""

# Summary
echo "=== SECURITY ASSESSMENT SUMMARY ==="
missing_critical=$(echo "$HEADERS" | grep -i "strict-transport-security" > /dev/null || echo "1")
missing_csp=$(echo "$HEADERS" | grep -i "content-security-policy" > /dev/null || echo "1")
missing_frame=$(echo "$HEADERS" | grep -i "x-frame-options" > /dev/null || echo "1")

if [ "$missing_critical" = "1" ] || [ "$missing_csp" = "1" ] || [ "$missing_frame" = "1" ]; then
    echo "⚠️  SECURITY GAPS IDENTIFIED"
    echo "   Review missing headers above and implement per PCI DSS 11.6.1 requirements"
else
    echo "✅ Core security headers are present"
fi

case "$URL" in
    http://*)
        echo "❌ CRITICAL: Use HTTPS for all payment pages (PCI DSS requirement)"
        ;;
esac

echo ""
echo "=== PCI DSS 11.6.1 COMPLIANCE NOTES ==="
echo "• Requirement 11.6.1: Deploy change-detection mechanisms"
echo "• Security headers help prevent common attack vectors"
echo "• Regular monitoring of these headers is recommended"
echo "• Consider implementing Content Security Policy monitoring"
echo "• Ensure all payment-related pages use HTTPS"