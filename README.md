# website

hosted on cloudflare pages
hosted on vercel
hosted on netlify
hosted on gcp
hosted on aws

npm install -D @cloudflare/next-on-pages

## aws

aws s3 mb s3://bh-nextjs-website --region us-east-1

aws s3 cp --recursive .next/ s3://bh-nextjs-website/ --region us-east-1

aws s3api put-bucket-policy --bucket bh-nextjs-website --policy '{
"Version": "2012-10-17",
"Statement": [
{
"Effect": "Allow",
"Principal": "\*",
"Action": ["s3:GetObject"]
}
]
}'

local.env
NEXT_PUBLIC_AWS_S3_REGION=us-east-1
NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID=123
NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY=123
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=test

gcloud compute firewall-rules create allow-profile-rule \
 --network default \
 --allow tcp:3000 \
 --priority 1000

gcloud compute firewall-rules list

nc -v -z 35.226.225.26 3000
nc -v -z 35.226.225.26 3001

aws lambda create-function --function-name my-function \
--zip-file fileb://function.zip --handler index.handler --runtime nodejs20.x \
--role arn:aws:iam::123456789012:role/lambda-ex

gcloud compute firewall-rules create allow-ssh-from-workstation \
 --direction=INGRESS \
 --priority=1000 \
 --network=default \
 --action=ALLOW \
 --rules=tcp:22 \
 --source-ranges=68.46.77.58/32

gcloud compute firewall-rules create allow-port-3000-instance-group \
 --network default \
 --allow tcp:3000 \
--source-ranges 0.0.0.0/0

gcloud compute firewall-rules create allow-port-80-instance-group \
 --network default \
 --allow tcp:80 \
--source-ranges 0.0.0.0/0

## create new vm instance

```
gcloud compute instances create nginx-bhenning \
    --zone=us-central1-b \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --machine-type=e2-medium \
    --tags=nginx-server
```

connect to nginx-bhenning

```
gcloud compute ssh nginx-bhenning --zone=us-central1-b
gcloud compute scp ./ngx_http_pxnginx_module.so nginx-bhenning:/home/brianhenning/ngx_http_pxnginx_module.so --zone=us-central1-b
```

connect to www-bhenning-com

```
gcloud compute ssh www-bhenning-com --zone=us-central1-b
```

## curl nginx

http://34.170.134.90/

Wells Fargo

```
const transactions = [...document.querySelectorAll("tr.TransactionsRow__transaction-row___IjXn8")].map(row => {
    const cells = row.querySelectorAll("td");

    return {
        date: cells[1]?.innerText.trim(), // Transaction Date
        postedDate: cells[2]?.innerText.trim(), // Posted Date
        description: cells[3]?.querySelector("span")?.innerText.trim(), // Merchant/Description
        transactionId: cells[3]?.querySelector(".OneLinkNoTx")?.innerText.trim(), // Transaction ID
        amount: cells[4]?.innerText.trim(), // Transaction Amount
        balance: cells[5]?.innerText.trim() // Running Balance
    };
});

// Print to console
console.table(transactions);
```

curl -X 'POST' 'https://pages.bhenning.com/api/celsius' \
  -H 'accept: */*' \
  -H 'content-type: application/json' \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) \
AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" \
  --data-raw '{"fahrenheit":50}'

curl -X 'POST' 'https://www.brianhenning.com/api/celsius' \
  -H 'accept: */*' \
  -H 'content-type: application/json' \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) \
AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" \
  --data-raw '{"fahrenheit":100}'

https://captcha.px-cdn.net/PXjJ0cYtn9/captcha.js?a=c&u=1d0953eb-63f9-11f0-807c-1201d10bfd28&v=09daa62b-63f9-11f0-8948-82c124838a96&m=0&b=aHR0cHM6Ly93d3cuYmhlbm5pbmcuY29tL2FwaS9jZWxzaXVz&h=UE9TVA==
