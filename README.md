# NextJS Website

A comprehensive Next.js application featuring personal finance management, sports data, blog functionality, and various utility tools. Built with TypeScript, React 19, and Material-UI.

## 🚀 Live Deployments

The application is deployed across multiple platforms:

- **Cloudflare Pages**: `https://pages.bhenning.com`
- **Vercel**: Production deployment
- **Netlify**: Alternative hosting
- **Google Cloud Platform**: Custom VM deployment
- **AWS**: S3 static hosting

## 🛠️ Tech Stack

- **Framework**: Next.js 15.4.5 with React 19.1.1
- **Language**: TypeScript (relaxed strict mode)
- **Styling**: Material-UI with custom themes (Dracula & Modern)
- **State Management**: React Query + SWR for server state, React hooks for client state
- **Testing**: Jest with SWC, React Testing Library, MSW for API mocking
- **Node.js**: Supports versions 20.x, 22.x, 23.x, 24.x

## 📋 Features

### Personal Finance Management

- Account management and tracking
- Transaction import and categorization
- Payment scheduling and transfers
- Budget tracking and reporting
- Data visualization with MUI DataGrid

### Sports Data Integration

- NFL, NBA, MLB, NHL statistics
- Real-time sports data APIs
- Interactive data displays

### Blog System

- MDX support for rich content
- Dynamic routing for blog posts
- Gray matter for frontmatter parsing

### Utility Tools

- Temperature conversion (Celsius/Fahrenheit)
- Lead generation forms
- Authentication system with JWT

## 🚦 Getting Started

### Prerequisites

- Node.js (20.x, 22.x, 23.x, or 24.x)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nextjs-website

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with deprecation warnings suppressed
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run all Jest tests
npm test -- -t "test name"  # Run specific test
npm test -- --testPathPattern=path/to/test  # Run tests in specific path

# Code Quality
npm run prettier     # Format code with Prettier

# Deployment
npm run pages:build  # Build for Cloudflare Pages
npm run analyze      # Analyze bundle size
```

## 🏗️ Project Structure

```
├── components/          # Reusable UI components
├── contexts/           # React contexts (UIContext)
├── hooks/              # Custom React hooks (40+ hooks)
├── layouts/            # Page layout components
├── model/              # TypeScript interfaces and types
├── pages/              # Next.js pages and API routes
│   ├── api/           # API endpoints
│   ├── finance/       # Finance management pages
│   ├── blog/          # Blog system
│   └── tools/         # Utility tools
├── themes/            # MUI theme configurations
├── __tests__/         # Jest test files
├── __mocks__/         # Mock implementations
└── data/              # Test data and dummy data
```

## 🧪 Testing

The project uses Jest with comprehensive testing setup:

- **Environment**: jsdom for React components
- **Transpilation**: SWC for fast builds
- **Mocking**: MSW v2.10.4 for API mocking
- **Coverage**: Configured for all TypeScript/JavaScript files

### Test Categories

- **Hook Tests**: Finance operations, user management, data fetching
- **Component Tests**: UI components with React Testing Library
- **Page Tests**: Full page functionality testing

## ☁️ Deployment

### AWS S3 Static Hosting

```bash
# Create S3 bucket
aws s3 mb s3://bh-nextjs-website --region us-east-1

# Deploy build files
aws s3 cp --recursive .next/ s3://bh-nextjs-website/ --region us-east-1

# Set bucket policy for public access
aws s3api put-bucket-policy --bucket bh-nextjs-website --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::bh-nextjs-website/*"
    }
  ]
}'
```

### Google Cloud Platform

#### VM Instance Creation

```bash
gcloud compute instances create nginx-bhenning \
    --zone=us-central1-b \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --machine-type=e2-medium \
    --tags=nginx-server
```

#### Firewall Configuration

```bash
# Allow development server
gcloud compute firewall-rules create allow-profile-rule \
    --network default \
    --allow tcp:3000 \
    --priority 1000

# Allow HTTP traffic
gcloud compute firewall-rules create allow-port-80-instance-group \
    --network default \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0

# SSH access from specific IP
gcloud compute firewall-rules create allow-ssh-from-workstation \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:22 \
    --source-ranges=68.46.77.58/32
```

#### VM Connection

```bash
# Connect to instances
gcloud compute ssh nginx-bhenning --zone=us-central1-b
gcloud compute ssh www-bhenning-com --zone=us-central1-b

# File transfer
gcloud compute scp ./ngx_http_pxnginx_module.so nginx-bhenning:/home/brianhenning/ngx_http_pxnginx_module.so --zone=us-central1-b
```

### Cloudflare Pages

```bash
# Install Cloudflare Pages CLI
npm install -D @cloudflare/next-on-pages

# Build for Cloudflare Pages
npm run pages:build
```

## 🔧 Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_AWS_S3_REGION=us-east-1
NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID=your_access_key
NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY=your_secret_key
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=your_bucket_name
```

## 🧰 Development Tools

### Wells Fargo Transaction Scraper

```javascript
const transactions = [
  ...document.querySelectorAll("tr.TransactionsRow__transaction-row___IjXn8"),
].map((row) => {
  const cells = row.querySelectorAll("td");

  return {
    date: cells[1]?.innerText.trim(),
    postedDate: cells[2]?.innerText.trim(),
    description: cells[3]?.querySelector("span")?.innerText.trim(),
    transactionId: cells[3]?.querySelector(".OneLinkNoTx")?.innerText.trim(),
    amount: cells[4]?.innerText.trim(),
    balance: cells[5]?.innerText.trim(),
  };
});

console.table(transactions);
```

### API Testing

```bash
# Test temperature conversion API
curl -X 'POST' 'https://pages.bhenning.com/api/celsius' \
 -H 'accept: */*' \
 -H 'content-type: application/json' \
 -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" \
 --data-raw '{"fahrenheit":50}'
```

## 📚 Documentation

For detailed development guidelines and project conventions, see [CLAUDE.md](./CLAUDE.md).

## 🤝 Contributing

1. Follow the TypeScript and React conventions outlined in CLAUDE.md
2. Write tests for new features using Jest and React Testing Library
3. Use the established project structure and naming conventions
4. Run tests and linting before submitting changes

## 📄 License

This project is private and proprietary.

curl -v -X POST 'https://finance.bhenning.com/graphql' -H 'Content-Type: application/json' -H 'Accept: application/json' -H "Cookie: token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Imhlbm5pbmIrZ3B0QGdtYWlsLmNvbSIsIm5iZiI6MTc1NTg3NDU1MCwiZXhwIjoxNzU1ODc4MTUwfQ.X2o7UVRAqm_EMbPQbnXLdaPjZzK_ikUDUY0V43WhLNE" --data '{"query":"query Transfers { transfers { transferId sourceAccount destination Account transactionDate amount activeStatus } }"}'


wrangler pages deployment tail --project-name=nextjs-website --environment=production
