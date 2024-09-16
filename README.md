# website

hosted on cloudflare pages
hosted on vercel
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
