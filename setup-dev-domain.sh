#!/bin/bash

echo "🔧 Setting up development domain for JWT cookie authentication"
echo ""

# Check if the hosts entry already exists
if grep -q "dev.finance.bhenning.com" /etc/hosts; then
    echo "✅ dev.finance.bhenning.com already exists in /etc/hosts"
else
    echo "❌ dev.finance.bhenning.com not found in /etc/hosts"
    echo ""
    echo "Please run the following command to add it:"
    echo "sudo bash -c 'echo \"127.0.0.1 dev.finance.bhenning.com\" >> /etc/hosts'"
    echo ""
    echo "Or manually edit /etc/hosts and add this line:"
    echo "127.0.0.1 dev.finance.bhenning.com"
fi

echo ""
echo "📋 After adding the hosts entry:"
echo "1. Access your app at: http://dev.finance.bhenning.com:3000"
echo "2. JWT cookies from finance.bhenning.com will now work!"
echo "3. The 403 errors should be resolved"
echo ""
echo "🔍 To verify the setup:"
echo "ping dev.finance.bhenning.com (should resolve to 127.0.0.1)"