#!/bin/sh

echo npx amplitude init
echo npx amplify configure

aws iam list-attached-user-policies --user-name henninb

aws iam attach-user-policy \
  --user-name henninb \
  --policy-arn arn:aws:iam::aws:policy/AWSAmplifyAdminAccess

aws amplify list-apps --query 'apps[*].appId'

# aws amplify create-domain-association --app-id d2ykjuyo12kys7 --domain-name bhenning.com --sub-domain-settings "[{\"prefix\":\"amplify\",\"branchName\":\"main\"}]"

aws amplify get-domain-association --app-id d2ykjuyo12kys7 --domain-name bhenning.com

aws acm list-certificates --query 'CertificateSummaryList[*].{CertificateArn:CertificateArn,DomainName:DomainName}'

exit 0
