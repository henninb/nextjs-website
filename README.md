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
               "Principal": "*",
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

gcloud compute firewall-rules create allow_port_3000_instance_group \
  --network default \
  --allow tcp:3000 \
  --target-tags webserver  # Assuming "instance-group-1-hrvt" has a tag named "webserver"
  --source-ranges 0.0.0.0/0  # Allow access from anywhere (caution advised)

gcloud compute firewall-rules list

nc -v -z 34.145.86.56 3000
nc: connectx to 34.145.86.56 port 3000 (tcp) failed: Connection refused
nc -v -z 35.226.225.26 3000

aws lambda create-function --function-name my-function \
--zip-file fileb://function.zip --handler index.handler --runtime nodejs20.x \
--role arn:aws:iam::123456789012:role/lambda-ex
