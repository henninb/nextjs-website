"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DeploymentPage() {
  const router = useRouter();
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text.trim());
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="deployment-container">
      <style jsx>{`
        .deployment-container {
          min-height: 100vh;
          padding: 0;
          color: white;
        }

        .output-block pre {
          margin: 0;
          white-space: inherit;
        }

        .header {
          text-align: center;
          padding: 3rem 2rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          color: white;
        }

        .header h1 {
          font-size: 4.5rem;
          margin-bottom: 1.5rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header p {
          font-size: 1.75rem;
          opacity: 0.95;
          max-width: 1000px;
          margin: 0 auto;
          line-height: 1.8;
        }

        .content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .workflow-steps {
          margin: 2rem 0;
        }

        .step {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .step-number {
          position: absolute;
          top: -15px;
          left: 2rem;
          background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .step h2 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
          margin-top: 1rem;
          color: #fa709a;
        }

        .step p {
          line-height: 1.6;
          margin-bottom: 1rem;
          color: #555;
        }

        .code-block {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1.25rem;
          border-radius: 8px;
          font-family: "Courier New", monospace;
          font-size: 1.1rem;
          overflow-x: auto;
          margin: 0.75rem 0;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
          line-height: 1.6;
          position: relative;
        }

        .output-block {
          background: #2d2d2d;
          color: #9ca3af;
          padding: 1.25rem;
          border-radius: 8px;
          font-family: "Courier New", monospace;
          font-size: 0.95rem;
          overflow-x: auto;
          margin: 0.75rem 0;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
          line-height: 1.6;
          border-left: 3px solid #4b5563;
          width: 100%;
          box-sizing: border-box;
        }

        .command-label {
          color: #555;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .command-label:first-of-type {
          margin-top: 0.5rem;
        }

        .copy-button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }

        .copy-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .copy-button.copied {
          background: rgba(34, 197, 94, 0.1);
          color: rgba(134, 239, 172, 1);
          border-color: rgba(34, 197, 94, 0.2);
        }

        .code-block .comment {
          color: #6a9955;
        }

        .code-block .command {
          color: #4ec9b0;
        }

        .prerequisites {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .prerequisites h2 {
          color: #fa709a;
          font-size: 2rem;
          margin-bottom: 1.5rem;
        }

        .prerequisites ul {
          list-style: none;
          padding: 0;
        }

        .prerequisites li {
          padding: 0.75rem 0;
          padding-left: 2rem;
          position: relative;
          color: #555;
          font-size: 1.125rem;
        }

        .prerequisites li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #fa709a;
          font-weight: bold;
          font-size: 1.25rem;
        }

        .terraform-modules {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .terraform-modules h2 {
          color: #fa709a;
          font-size: 2rem;
          margin-bottom: 1.5rem;
        }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .module-card {
          background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .module-card h3 {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .module-card p {
          font-size: 0.95rem;
          opacity: 0.95;
          color: white;
        }

        .back-link {
          display: inline-block;
          background: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          color: #fa709a;
          font-weight: 600;
          margin: 2rem auto;
          display: block;
          text-align: center;
          max-width: 200px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .back-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
        }

        .bottom-nav {
          display: flex;
          gap: 2rem;
          justify-content: center;
          align-items: center;
          margin: 4rem auto 0;
          padding-bottom: 10rem;
          flex-wrap: wrap;
          max-width: 1000px;
        }

        .nav-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(30, 41, 59, 0.6);
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          text-decoration: none;
          color: rgba(226, 232, 240, 0.95);
          font-weight: 600;
          font-size: 1rem;
          border: 1px solid rgba(148, 163, 184, 0.15);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          pointer-events: auto;
          min-width: 180px;
          position: relative;
        }

        .nav-button::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(14, 165, 233, 0.1));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .nav-button:hover {
          background: rgba(51, 65, 85, 0.8);
          border-color: rgba(56, 189, 248, 0.3);
          color: rgb(224, 242, 254);
          transform: translateY(-1px);
        }

        .nav-button:hover::before {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }

          .step {
            padding: 1.5rem 1rem 2rem;
          }

          .step-number {
            left: 1rem;
          }

          .module-grid {
            grid-template-columns: 1fr;
          }

          .code-block {
            font-size: 0.75rem;
          }

          .bottom-nav {
            gap: 1rem;
            padding-bottom: 12rem;
          }

          .nav-button {
            min-width: 140px;
            font-size: 0.875rem;
            padding: 0.625rem 1.125rem;
          }
        }
      `}</style>

      <div className="header">
        <h1>🚀 Deployment Workflow</h1>
        <p>
          Step-by-step guide to deploying the LLM Gateway infrastructure on AWS
          using Terraform and Kubernetes.
        </p>
      </div>

      <div className="content">
        <div className="prerequisites">
          <h2>Prerequisites</h2>
          <ul>
            <li>AWS account with appropriate permissions (EKS, VPC, EC2, IAM)</li>
            <li>Terraform 1.0+ installed</li>
            <li>AWS CLI configured with credentials</li>
            <li>kubectl installed</li>
            <li>Docker installed (for local testing)</li>
            <li>AWS Bedrock access enabled in your account</li>
            <li>Perplexity API key</li>
            <li>Domain name configured (optional but recommended)</li>
          </ul>
        </div>

        <div className="terraform-modules">
          <h2>Terraform Module Structure</h2>
          <div className="module-grid">
            <div className="module-card">
              <h3>📦 terraform/ecr</h3>
              <p>
                Creates ECR repositories for LiteLLM and OpenWebUI container
                images.
              </p>
            </div>

            <div className="module-card">
              <h3>🏗️ terraform/eks-cluster</h3>
              <p>
                Provisions EKS cluster, VPC networking, SPOT node groups, and
                EBS CSI driver.
              </p>
            </div>

            <div className="module-card">
              <h3>☸️ terraform/eks</h3>
              <p>
                Deploys applications (LiteLLM, OpenWebUI), network policies,
                and IRSA roles.
              </p>
            </div>
          </div>
        </div>

        <div className="workflow-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h2>Clone Repository</h2>
            <p>
              Start by cloning the LLM Gateway repository from GitHub. The project
              includes 30+ automated Make commands to simplify deployment.
            </p>

            <div className="command-label">Clone and navigate to repository:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 10 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`git clone https://github.com/henninb/llm-gateway.git`, 10)}
                title={copiedIndex === 10 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 10 ? "✓" : "⧉"}
              </button>
git clone https://github.com/henninb/llm-gateway.git
            </div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 11 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`cd llm-gateway`, 11)}
                title={copiedIndex === 11 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 11 ? "✓" : "⧉"}
              </button>
cd llm-gateway
            </div>

            <div className="command-label">View all available commands:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 12 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make help`, 12)}
                title={copiedIndex === 12 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 12 ? "✓" : "⧉"}
              </button>
make help
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`LLM Gateway - Available Commands:

  help                              Show this help message
  validate-setup                    Validate required tools are installed
  local-deploy                      Deploy containers locally with docker-compose
  local-status                      Show status of Docker containers, networks, and volumes
  local-port-forward                Forward proxy port 8000 to localhost (Ctrl+C to stop)
  local-destroy                     Destroy local Docker containers, volumes, networks, and images
  test-health                       Check service health and connectivity
  test-litellm-models               Test all LiteLLM models (optionally set ENDPOINT=http://host:port)
  test-guardrails                   Test custom guardrails (pre_call and post_call hooks)
  test-all                          Run all tests (setup validation, health check, model tests, guardrails)
  aws-costs                         Generate AWS cost report for current resources (shell version)
  aws-costs-py                      Generate AWS cost report (Python version with rich formatting)
  iam-report                        Show IAM roles and security architecture for this project
  ecr-init                          Initialize Terraform for ECR repositories
  ecr-plan                          Plan Terraform changes for ECR
  ecr-apply                         Apply Terraform to create ECR repositories
  ecr-destroy                       Destroy ECR repositories
  ecr-login                         Login to AWS ECR
  ecr-build-push                    Build and push Docker images to ECR
  eks-cluster-init                  Initialize Terraform for EKS cluster creation
  eks-cluster-plan                  Plan Terraform changes for EKS cluster
  eks-cluster-apply                 Apply Terraform to create EKS cluster
  eks-cluster-destroy               Destroy EKS cluster infrastructure
  eks-cluster-kubeconfig            Configure kubectl for EKS cluster
  eks-secrets-ensure                Ensure AWS Secrets Manager secret exists (idempotent, creates if missing)
  eks-secrets-populate              Populate AWS Secrets Manager with API keys (auto-sources .secrets ifexists)
  eks-init                          Initialize Terraform for EKS deployment
  eks-plan                          Plan Terraform changes for EKS
  eks-apply                         Apply Terraform to deploy to EKS (auto-populates secrets first)
  eks-destroy                       Destroy EKS deployment
  eks-port-forward                  Forward LiteLLM from EKS to localhost:4000 (Ctrl+C to stop)
  eks-verify-cloudflare             Verify CloudFlare IP ranges in NLB security group
  eks-test-cloudflare-restriction   Test that NLB only accepts CloudFlare IPs (optionally set DOMAIN=your-domain.com)
  eks-verify-cloudflare-dns         Verify/setup CloudFlare DNS (auto-sources .secrets if exists, optionally set DOMAIN=your-domain.com)`}</pre>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h2>Create ECR Repositories</h2>
            <p>
              Set up Amazon ECR repositories to store your container images.
              This eliminates Docker Hub rate limits.
            </p>

            <div className="command-label">Using Make commands (recommended):</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 20 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make ecr-init`, 20)}
                title={copiedIndex === 20 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 20 ? "✓" : "⧉"}
              </button>
make ecr-init
            </div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 21 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make ecr-apply`, 21)}
                title={copiedIndex === 21 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 21 ? "✓" : "⧉"}
              </button>
make ecr-apply
            </div>

            <div className="command-label">Or manually:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 22 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`cd terraform/ecr && terraform init && terraform apply`, 22)}
                title={copiedIndex === 22 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 22 ? "✓" : "⧉"}
              </button>
cd terraform/ecr && terraform init && terraform apply
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`litellm_repository_url = "667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/litellm"
openwebui_repository_url = "667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/openwebui"`}</pre>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h2>Build and Push Docker Images</h2>
            <p>
              Build the LiteLLM and OpenWebUI containers and push them to ECR.
              This authenticates with ECR, builds images, tags them with latest and git commit SHA, and pushes to ECR repositories.
            </p>

            <div className="command-label">Using Make commands (recommended):</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 30 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make ecr-login`, 30)}
                title={copiedIndex === 30 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 30 ? "✓" : "⧉"}
              </button>
make ecr-login
            </div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 31 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make ecr-build-push`, 31)}
                title={copiedIndex === 31 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 31 ? "✓" : "⧉"}
              </button>
make ecr-build-push
            </div>

            <div className="command-label">Or manually:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 32 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`./tools/build-and-push-ecr.sh`, 32)}
                title={copiedIndex === 32 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 32 ? "✓" : "⧉"}
              </button>
./tools/build-and-push-ecr.sh
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`========================================
  LLM Gateway - ECR Image Builder
========================================
AWS Region: us-east-1
AWS Account: 667778672048
Image Tag: latest

Logging in to AWS ECR...
Login Succeeded

========================================
Building LiteLLM image...
========================================
[+] Building 1.0s (14/14) FINISHED                                                        docker:default
 => [internal] load build definition from Dockerfile                                                0.0s
 => => transferring dockerfile: 1.70kB                                                              0.0s
 => [internal] load metadata for ghcr.io/berriai/litellm:main-latest@sha256:fff53d2f4fe65fc9baaee0  0.9s
 => [internal] load .dockerignore                                                                   0.0s
 => => transferring context: 461B                                                                   0.0s
 => [1/9] FROM ghcr.io/berriai/litellm:main-latest@sha256:fff53d2f4fe65fc9baaee005a31aaf477c734b63  0.0s
 => [internal] load build context                                                                   0.0s
 => => transferring context: 195B                                                                   0.0s
 => CACHED [2/9] WORKDIR /app                                                                       0.0s
 => CACHED [3/9] RUN which netstat || (echo "ERROR: netstat not found in base image" && exit 1)     0.0s
 => CACHED [4/9] COPY patches/apply_litellm_fix.py /tmp/                                            0.0s
 => CACHED [5/9] RUN python3 /tmp/apply_litellm_fix.py && rm /tmp/apply_litellm_fix.py              0.0s
 => CACHED [6/9] RUN addgroup -g 1000 litellm &&     adduser -D -u 1000 -G litellm litellm          0.0s
 => CACHED [7/9] COPY config/litellm_config.yaml /app/config.yaml                                   0.0s
 => CACHED [8/9] COPY config/custom_guardrail.py /app/custom_guardrail.py                           0.0s
 => CACHED [9/9] RUN chown litellm:litellm /app/config.yaml /app/custom_guardrail.py                0.0s
 => exporting to image                                                                              0.0s
 => => exporting layers                                                                             0.0s
 => => writing image sha256:c1874c9a389b0e3140315fff137afb3720947c83f8b388a5eedb2154c4bb6ba7        0.0s
 => => naming to 667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/litellm:latest            0.0s
Pushing LiteLLM image to ECR...
The push refers to repository [667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/litellm]
a922996a45d9: Layer already exists
70873e3ccff0: Layer already exists
cb86da8cccc8: Layer already exists
0c1c0791aa12: Layer already exists
e28691598689: Layer already exists
d8debd30a5e3: Layer already exists
5f70bf18a086: Layer already exists
9217483fecfc: Layer already exists
97fd3e4fa036: Layer already exists
0e58bbc54472: Layer already exists
5927a22d5011: Layer already exists
f9018c851d2c: Layer already exists
8f514b6a4025: Layer already exists
030790cc38cc: Layer already exists
f08d51e691c3: Layer already exists
379d0c2544cc: Layer already exists
6faea7b2b79c: Layer already exists
0ab57e890071: Layer already exists
1681e53285c3: Layer already exists
0976d876f3fa: Layer already exists
918b394b9a9b: Layer already exists
14c17f327a48: Layer already exists
9cb5532c87b3: Layer already exists
c77d0e99fd08: Layer already exists
7aeac29b5883: Layer already exists
4fb8934e770e: Layer already exists
d1a8ae7e4b6d: Layer already exists
d8ac61f31f80: Layer already exists
846629027186: Layer already exists
latest: digest: sha256:3fefee1b1007e2110ffb5fe8f6fd3fd19414c5067a360beb5aef4ef1e68c2876 size: 7217
✓ LiteLLM image pushed successfully

========================================
Building OpenWebUI image...
========================================
[+] Building 0.6s (8/8) FINISHED                                                          docker:default
 => [internal] load build definition from Dockerfile.openwebui                                      0.0s
 => => transferring dockerfile: 867B                                                                0.0s
 => [internal] load metadata for ghcr.io/open-webui/open-webui:v0.6.43                              0.5s
 => [internal] load .dockerignore                                                                   0.0s
 => => transferring context: 461B                                                                   0.0s
 => [1/4] FROM ghcr.io/open-webui/open-webui:v0.6.43@sha256:9cb724e0bc84f05ba2f81a3da5f53f5add07e1  0.0s
 => CACHED [2/4] RUN which curl || (echo "ERROR: curl not found in base image" && exit 1)           0.0s
 => CACHED [3/4] RUN groupadd -g 1000 openwebui &&     useradd -u 1000 -g 1000 -m -s /bin/bash ope  0.0s
 => CACHED [4/4] RUN chown -R openwebui:openwebui /app                                              0.0s
 => exporting to image                                                                              0.0s
 => => exporting layers                                                                             0.0s
 => => writing image sha256:0a696a48772ff171fbf9cd6aa1541e2384b1885a458f86b6f83b823ca74988e9        0.0s
 => => naming to 667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/openwebui:latest          0.0s
Pushing OpenWebUI image to ECR...
The push refers to repository [667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/openwebui]
e1a74a9dbdd8: Layer already exists
fcda31d608bb: Layer already exists
5f70bf18a086: Layer already exists
e0d1c9f6ac74: Layer already exists
23dddb7fc9a7: Layer already exists
0a02296e6abf: Layer already exists
cda66797c30d: Layer already exists
03c9c2960532: Layer already exists
265d21df8805: Layer already exists
e6c4d8917a85: Layer already exists
c5bac91127ec: Layer already exists
652f6f61751e: Layer already exists
f2387fbb4fc7: Layer already exists
b64015d335a2: Layer already exists
54ef8ce1a594: Layer already exists
91833cdc5e63: Layer already exists
abe743884ea0: Layer already exists
latest: digest: sha256:b8f86b51d6defcf39917a814aa6d560727b4f8eafdac68d5f36ca48b4118a97c size: 4709
✓ OpenWebUI image pushed successfully

========================================
  Build Complete!
========================================
LiteLLM Image:
  667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/litellm:latest

OpenWebUI Image:
  667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/openwebui:latest

Next steps:
  1. cd terraform/eks
  2. terraform init
  3. terraform plan
  4. terraform apply`}</pre>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <h2>Provision EKS Cluster</h2>
            <p>
              Create the EKS cluster, VPC with public/private subnets, SPOT instance node group,
              Internet Gateway + NAT Gateway, security groups, OIDC provider for IRSA,
              EBS CSI driver addon, and VPC CNI addon with NetworkPolicy support.
              Wait approximately 15 minutes for cluster to be ready.
            </p>

            <div className="command-label">Using Make commands (recommended):</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 40 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-cluster-init`, 40)}
                title={copiedIndex === 40 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 40 ? "✓" : "⧉"}
              </button>
make eks-cluster-init
            </div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 41 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-cluster-apply`, 41)}
                title={copiedIndex === 41 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 41 ? "✓" : "⧉"}
              </button>
make eks-cluster-apply
            </div>

            <div className="command-label">Or manually:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 42 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`cd terraform/eks-cluster && terraform init && terraform apply`, 42)}
                title={copiedIndex === 42 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 42 ? "✓" : "⧉"}
              </button>
cd terraform/eks-cluster && terraform init && terraform apply
            </div>
          </div>

          <div className="step">
            <div className="step-number">5</div>
            <h2>Configure kubectl</h2>
            <p>
              Update your local kubeconfig to connect to the new EKS cluster.
            </p>

            <div className="command-label">Using Make command (recommended):</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 50 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-cluster-kubeconfig`, 50)}
                title={copiedIndex === 50 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 50 ? "✓" : "⧉"}
              </button>
make eks-cluster-kubeconfig
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`Updated context arn:aws:eks:us-east-1:667778672048:cluster/llm-gateway-eks in /home/henninb/.kube/config`}</pre>
            </div>

            <div className="command-label">Or manually:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 51 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`aws eks update-kubeconfig --region us-east-1 --name llm-gateway-eks`, 51)}
                title={copiedIndex === 51 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 51 ? "✓" : "⧉"}
              </button>
aws eks update-kubeconfig --region us-east-1 --name llm-gateway-eks
            </div>

            <div className="command-label">Verify connection:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 52 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`kubectl get nodes`, 52)}
                title={copiedIndex === 52 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 52 ? "✓" : "⧉"}
              </button>
kubectl get nodes
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`NAME                          STATUS   ROLES    AGE    VERSION
ip-10-0-11-142.ec2.internal   Ready    <none>   3h4m   v1.34.2-eks-ecaa3a6`}</pre>
            </div>
          </div>

          <div className="step">
            <div className="step-number">6</div>
            <h2>Request ACM Certificate</h2>
            <p>
              Request an SSL/TLS certificate from AWS Certificate Manager for your domain.
              After running the command, add DNS validation records to your DNS provider and
              wait approximately 5-10 minutes for the certificate to be issued.
            </p>

            <div className="command-label">Request certificate:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 60 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`aws acm request-certificate --domain-name openwebui.bhenning.com --validation-method DNS --region us-east-1`, 60)}
                title={copiedIndex === 60 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 60 ? "✓" : "⧉"}
              </button>
aws acm request-certificate --domain-name openwebui.bhenning.com --validation-method DNS --region us-east-1
            </div>

            <div className="command-label">Get certificate ARN for next step:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 61 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`aws acm list-certificates --region us-east-1`, 61)}
                title={copiedIndex === 61 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 61 ? "✓" : "⧉"}
              </button>
aws acm list-certificates --region us-east-1
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`{
    "CertificateSummaryList": [
        {
            "CertificateArn": "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/52c0714b-ab17-4466-9959-52d9288b6249",
            "DomainName": "openwebui.bhenning.com",
            "SubjectAlternativeNameSummaries": [
                "openwebui.bhenning.com"
            ],
            "HasAdditionalSubjectAlternativeNames": false,
            "Status": "ISSUED",
            "Type": "AMAZON_ISSUED",
            "KeyAlgorithm": "RSA-2048",
            "KeyUsages": [
                "DIGITAL_SIGNATURE",
                "KEY_ENCIPHERMENT"
            ],
            "ExtendedKeyUsages": [
                "TLS_WEB_SERVER_AUTHENTICATION"
            ],
            "ExportOption": "DISABLED",
            "InUse": true,
            "Exported": false,
            "RenewalEligibility": "ELIGIBLE",
            "NotBefore": 1767139200.0,
            "NotAfter": 1801267199.0,
            "CreatedAt": 1767208919.133,
            "IssuedAt": 1767208933.283
        }
    ]
}`}</pre>
            </div>
          </div>

          <div className="step">
            <div className="step-number">7</div>
            <h2>Create Secrets in AWS Secrets Manager</h2>
            <p>
              Store sensitive API keys and secrets in AWS Secrets Manager for secure access by pods.
              Auto-sources from .secrets file if available. Secrets are encrypted with AWS KMS.
            </p>
            <p>
              Required environment variables (set in .secrets file or export):
              LITELLM_MASTER_KEY (generate with: openssl rand -hex 32),
              WEBUI_SECRET_KEY (generate with: openssl rand -hex 32),
              PERPLEXITY_API_KEY (from Perplexity account).
            </p>

            <div className="command-label">Using Make command (recommended):</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 70 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-secrets-populate`, 70)}
                title={copiedIndex === 70 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 70 ? "✓" : "⧉"}
              </button>
make eks-secrets-populate
            </div>
          </div>

          <div className="step">
            <div className="step-number">8</div>
            <h2>Configure Terraform Variables</h2>
            <p>
              Update terraform/eks/terraform.tfvars with your ACM certificate ARN and configuration.
              Set cluster_name, aws_region, environment, acm_certificate_arn, use_ecr_images, and ecr_image_tag.
            </p>

            <div className="command-label">Edit configuration file:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 80 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`vim terraform/eks/terraform.tfvars`, 80)}
                title={copiedIndex === 80 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 80 ? "✓" : "⧉"}
              </button>
vim terraform/eks/terraform.tfvars
            </div>

            <div className="command-label">Example configuration:</div>
            <div className="output-block">
              <pre>{`cluster_name = "llm-gateway-eks"
aws_region = "us-east-1"
environment = "dev"
acm_certificate_arn = "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID"
use_ecr_images = true
ecr_image_tag = "latest"`}</pre>
            </div>
          </div>

          <div className="step">
            <div className="step-number">9</div>
            <h2>Deploy Applications to EKS</h2>
            <p>
              Deploy LiteLLM, OpenWebUI, network policies, and configure IRSA roles.
              The make command auto-populates secrets first. This creates Kubernetes namespace,
              IRSA role for LiteLLM (Bedrock + Secrets Manager access), LiteLLM deployment + service,
              OpenWebUI deployment + service + PVC, Network Load Balancer with ACM certificate,
              and NetworkPolicies for zero-trust isolation.
              Wait approximately 5 minutes for LoadBalancer to provision.
            </p>

            <div className="command-label">Using Make commands (recommended):</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 90 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-init`, 90)}
                title={copiedIndex === 90 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 90 ? "✓" : "⧉"}
              </button>
make eks-init
            </div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 91 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-apply`, 91)}
                title={copiedIndex === 91 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 91 ? "✓" : "⧉"}
              </button>
make eks-apply
            </div>

            <div className="command-label">Or manually:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 92 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`cd terraform/eks && terraform init && terraform apply`, 92)}
                title={copiedIndex === 92 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 92 ? "✓" : "⧉"}
              </button>
cd terraform/eks && terraform init && terraform apply
            </div>
          </div>

          <div className="step">
            <div className="step-number">10</div>
            <h2>Get LoadBalancer DNS</h2>
            <p>
              Retrieve the Network Load Balancer DNS name for DNS configuration.
              Copy the EXTERNAL-IP for the next step.
            </p>

            <div className="command-label">Get LoadBalancer DNS:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 100 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`kubectl get svc openwebui -n llm-gateway`, 100)}
                title={copiedIndex === 100 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 100 ? "✓" : "⧉"}
              </button>
kubectl get svc openwebui -n llm-gateway
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`NAME        TYPE           EXTERNAL-IP
openwebui   LoadBalancer   a4e51119...elb.us-east-1.amazonaws.com`}</pre>
            </div>
          </div>

          <div className="step">
            <div className="step-number">11</div>
            <h2>Configure DNS & Security</h2>
            <p>
              Create a CNAME record in CloudFlare and enable proxy mode (orange cloud)
              for geo-restriction and DDoS protection. The make command can auto-setup DNS if CLOUDFLARE_API_TOKEN is in .secrets.
              Alternatively, configure manually in CloudFlare dashboard.
            </p>

            <div className="command-label">Using Make command (recommended):</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 110 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-verify-cloudflare-dns`, 110)}
                title={copiedIndex === 110 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 110 ? "✓" : "⧉"}
              </button>
make eks-verify-cloudflare-dns
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`=== CloudFlare DNS Setup for openwebui.bhenning.com ===

  Authentication: Global API Key

1. Getting LoadBalancer hostname from Kubernetes...
  LoadBalancer: adbfc9821e89940efb696ac92fd33f87-3ee10353c1b6a805.elb.us-east-1.amazonaws.com

2. Looking up CloudFlare zone ID for bhenning.com...
  Zone ID: 3d1dfa959372e2996636f272f2c747d8

3. Checking if DNS record exists for openwebui.bhenning.com...
  ✓ DNS record exists
  Record ID: bee89039a0ac110b7d67a13d450bfb4f
  Current target: adbfc9821e89940efb696ac92fd33f87-3ee10353c1b6a805.elb.us-east-1.amazonaws.com
  ✓ Record points to correct LoadBalancer

5. Verifying DNS resolution...
  Local DNS: ✓ Resolves to: 52.1.180.76

6. Checking CNAME record...
  CNAME: openwebui.bhenning.com -> adbfc9821e89940efb696ac92fd33f87-3ee10353c1b6a805.elb.us-east-1.amazonaws.com.
  ✓ CNAME points to correct LoadBalancer

7. Testing HTTPS connectivity...
  ✓ HTTPS endpoint is reachable (HTTP 200)

=== Summary ===
Domain: openwebui.bhenning.com
Points to: adbfc9821e89940efb696ac92fd33f87-3ee10353c1b6a805.elb.us-east-1.amazonaws.com

You can now access OpenWebUI at:
  https://openwebui.bhenning.com`}</pre>
            </div>

            <div className="command-label">Or manually in CloudFlare dashboard:</div>
            <div className="output-block">
              <pre>{`Type: CNAME
Name: openwebui
Target: a4e51119be1d84777819e4effb129b14-6ba95aeb4b36de2e.elb.us-east-1.amazonaws.com
Proxy status: Proxied (orange cloud) - for US-only access
TTL: Auto

Optional: Configure CloudFlare firewall rule for US-only access
See docs/cloudflare-setup.md for full guide`}</pre>
            </div>
          </div>

          <div className="step">
            <div className="step-number">12</div>
            <h2>Verify Deployment</h2>
            <p>
              Test the deployment using automated verification commands and
              access the OpenWebUI interface at https://openwebui.bhenning.com
            </p>

            <div className="command-label">Verify CloudFlare security:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 120 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-verify-cloudflare`, 120)}
                title={copiedIndex === 120 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 120 ? "✓" : "⧉"}
              </button>
make eks-verify-cloudflare
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`=== CloudFlare IP Ranges Verification ===

1. Fetching current CloudFlare IP ranges...
  IPv4 ranges: 15
  IPv6 ranges: 7

2. Finding CloudFlare security group...
  Security Group ID: sg-0a742c6c0256454bc

3. Checking configured IP ranges in security group...
  Configured IPv4 ranges: 15
  Configured IPv6 ranges: 7

4. Comparing with CloudFlare published ranges...
  IPv4: ✓ Match (15 ranges)
  IPv6: ✓ Match (7 ranges)

5. Verifying sample IP ranges...
  Sample check: ✓ 173.245.48.0/20 is configured

=== Summary ===
✓ Security group is up-to-date with current CloudFlare IP ranges`}</pre>
            </div>

            <div className="command-label">Test CloudFlare IP restriction:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 121 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-test-cloudflare-restriction`, 121)}
                title={copiedIndex === 121 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 121 ? "✓" : "⧉"}
              </button>
make eks-test-cloudflare-restriction
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`=== Testing CloudFlare-Only Access Restriction ===

1. Getting your public IP address...
  Your IP: 172.58.10.129

2. Checking if your IP is in CloudFlare ranges...
  ✓ Your IP is NOT in CloudFlare ranges
  This is expected for most users

3. Getting LoadBalancer hostname...
  LoadBalancer: adbfc9821e89940efb696ac92fd33f87-3ee10353c1b6a805.elb.us-east-1.amazonaws.com
  NLB IP: 52.1.180.76

4. Checking security group configuration...
  Security Group: sg-0a742c6c0256454bc
  Sample allowed CIDRs:
    - 162.158.0.0/15
    - 108.162.192.0/18
    - 173.245.48.0/20
  (showing first 3 of 15 CloudFlare ranges)

5. Testing direct access to NLB (should be BLOCKED)...
  Attempting HTTPS connection to adbfc9821e89940efb696ac92fd33f87-3ee10353c1b6a805.elb.us-east-1.amazonaws.com...
  ✓ PASS: Connection blocked (timed out/refused)
  This confirms the NLB only accepts CloudFlare IPs

6. Checking for additional security groups on NLB...
  Security groups attached: 1
  ✓ Only CloudFlare security group attached

7. Testing access through domain openwebui.bhenning.com...
  ✓ Domain accessible (HTTP 200)
  Note: DNS record is in 'DNS only' mode, so this goes directly to NLB

=== Test Summary ===
Your IP: 172.58.10.129
In CloudFlare range: false
Direct NLB access: PASS

✓ SUCCESS: NLB is properly restricted to CloudFlare IPs
Non-CloudFlare IPs cannot access the NLB directly`}</pre>
            </div>

            <div className="command-label">Check pod status:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 122 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`kubectl get pods -n llm-gateway`, 122)}
                title={copiedIndex === 122 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 122 ? "✓" : "⧉"}
              </button>
kubectl get pods -n llm-gateway
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`NAME                         READY   STATUS    RESTARTS   AGE
litellm-86b89f5446-8hvdv     1/1     Running   0          62m
openwebui-69476b998c-v9dxn   1/1     Running   0          62m`}</pre>
            </div>

            <div className="command-label">Test HTTPS connection:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 123 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`curl -I https://openwebui.bhenning.com`, 123)}
                title={copiedIndex === 123 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 123 ? "✓" : "⧉"}
              </button>
curl -I https://openwebui.bhenning.com
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`HTTP/1.1 200 OK
date: Sun, 04 Jan 2026 14:19:26 GMT
server: uvicorn
content-type: text/html; charset=utf-8
accept-ranges: bytes
content-length: 7514
last-modified: Mon, 22 Dec 2025 06:07:10 GMT
etag: "cbe34544a3acd481c8c9621575f8e3e5"
x-process-time: 0`}</pre>
            </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">13</div>
            <h2>Local Testing</h2>
            <p>
              Forward LiteLLM from the EKS cluster to your machine to run local tests
              against the deployed service.
            </p>

            <div className="command-label">Port-forward LiteLLM locally:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 130 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-port-forward`, 130)}
                title={copiedIndex === 130 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 130 ? "✓" : "⧉"}
              </button>
make eks-port-forward
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`Forwarding localhost:4000 -> llm-gateway/litellm:80 (press Ctrl+C to stop)
Forwarding from 127.0.0.1:4000 -> 4000
Forwarding from [::1]:4000 -> 4000`}</pre>
            </div>

            <div className="command-label">Test all LiteLLM models:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 131 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make test-litellm-models`, 131)}
                title={copiedIndex === 131 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 131 ? "✓" : "⧉"}
              </button>
make test-litellm-models
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`Checking if endpoint is available: http://localhost:4000
✓ Service is responding

Testing all LiteLLM models
Endpoint: http://localhost:4000

=== Perplexity Models (Primary - API Key Required) ===
Testing perplexity-sonar... OK
  Response: Hi! How can I help you today?[1][2][4]...
Testing perplexity-sonar-pro... OK
  Response: Hello there![1][3]...

=== Amazon Nova Models (AWS Native - No Payment Required) ===
Testing nova-micro... OK
  Response: Hello! How can I assist you today? Whether you have a questi...
Testing nova-lite... OK
  Response: Hello! How can I assist you today? If you have questions, ne...
Testing nova-pro... OK
  Response: Hello! It's nice to have you here. I'm here to help with wha...

=== Llama Models (Meta) ===
Testing llama3-2-1b... OK
  Response: How can I assist you today?...
Testing llama3-2-3b... OK
  Response: Hello! It's nice to meet you. Is there something I can help ...

=== Test Summary ===

Total tests: 7
Passed: 7
Failed: 0

Active Models:
  ✓ Perplexity (perplexity-sonar, perplexity-sonar-pro)
  ✓ Amazon Nova (nova-micro, nova-lite, nova-pro) - No payment required
  ✓ Meta Llama (llama3-2-1b, llama3-2-3b) - May need approval

All tests passed!`}</pre>
            </div>

            <div className="command-label">Test custom guardrails (pre_call and post_call hooks):</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 132 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make test-guardrails`, 132)}
                title={copiedIndex === 132 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 132 ? "✓" : "⧉"}
              </button>
make test-guardrails
            </div>

            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`╔====================================================================╗
║                    GUARDRAIL TEST SUITE                            ║
╚====================================================================╝

LiteLLM URL: http://localhost:4000
Models to test: llama3-2-3b, perplexity-sonar


######################################################################
# TESTING MODEL: llama3-2-3b
######################################################################

**********************************************************************
* PRE_CALL TESTS (Input Filtering)
**********************************************************************

======================================================================
Test 1 (llama3-2-3b): Direct mention should be blocked
======================================================================
Status: 200
Response: ⚠️ BLOCKED: Your message mentions duckies or bunnies. Discussions about cute animals may causeexcessive happiness and distraction. Please rephrase yo...
✅ PASS: Request blocked (200 OK with BLOCKED message)

======================================================================
Test 2 (llama3-2-3b): Bypass prevention (history sanitization)
======================================================================
Simulating conversation:
  1. User: 'duckies and bunnies' → BLOCKED
  2. User: 'why no duckies?' → BLOCKED
  3. User: 'hi' → Should respond normally WITHOUT mentioning ducks/bunnies

Status: 200
Response: how can i assist you today?...
✅ PASS: Normal response without mentioning blocked topics
   History sanitization working correctly!

======================================================================
Test 3 (llama3-2-3b): Normal conversation (no blocking)
======================================================================
Status: 200
Response: 2 + 2 = 4....
✅ PASS: Normal conversation allowed

**********************************************************************
* POST_CALL TESTS (Output Filtering)
**********************************************************************

======================================================================
Test 4 (llama3-2-3b): Output filtering - non-streaming (post_call hook)
======================================================================
Asking: 'What's another name for rabbit?'
Expected: LLM would naturally say 'bunny', but post_call hook should block it

Status: 200
Response: ⚠️ BLOCKED: Your message mentions duckies or bunnies. Discussions about cute animals may causeexcessive happiness and distraction. Please rephrase yo...
✅ PASS: LLM output blocked (post_call hook working)

======================================================================
Test 5 (llama3-2-3b): Output filtering - streaming (post_call hook)
======================================================================
Asking: 'What's another name for rabbit?' with streaming=true
Expected: LLM would naturally say 'bunny', but post_call hook should block it
This tests the LiteLLM streaming bug fix

Status: 200
Response: ⚠️ BLOCKED: Your message mentions duckies or bunnies. Discussions about cute animals may causeexcessive happiness and distraction. Please rephrase yo...
✅ PASS: LLM output blocked in streaming mode (post_call hook + patch working)

======================================================================
Test 6 (llama3-2-3b): Indirect bypass - 'what is bird that quacks?' (post_call hook)
======================================================================
Asking: 'what is bird that quacks?'
Expected: Input passes pre_call (no blocked words), but LLM response
          contains 'duck/mallard' which should be blocked by post_call hook

Status: 200
Response: ⚠️ BLOCKED: The response contains mentions of duckies or bunnies. Discussions about cute animals may cause excessive happiness and distraction. Please...
✅ PASS: Indirect bypass blocked (post_call hook caught LLM response)

----------------------------------------------------------------------
Model 'llama3-2-3b' Results: 6/6 tests passed
----------------------------------------------------------------------

######################################################################
# TESTING MODEL: perplexity-sonar
######################################################################

**********************************************************************
* PRE_CALL TESTS (Input Filtering)
**********************************************************************

======================================================================
Test 1 (perplexity-sonar): Direct mention should be blocked
======================================================================
Status: 200
Response: ⚠️ BLOCKED: Your message mentions duckies or bunnies. Discussions about cute animals may causeexcessive happiness and distraction. Please rephrase yo...
✅ PASS: Request blocked (200 OK with BLOCKED message)

======================================================================
Test 2 (perplexity-sonar): Bypass prevention (history sanitization)
======================================================================
Simulating conversation:
  1. User: 'duckies and bunnies' → BLOCKED
  2. User: 'why no duckies?' → BLOCKED
  3. User: 'hi' → Should respond normally WITHOUT mentioning ducks/bunnies

Status: 200
Response: hi! how can i help you today?[1][2][4]...
✅ PASS: Normal response without mentioning blocked topics
   History sanitization working correctly!

======================================================================
Test 3 (perplexity-sonar): Normal conversation (no blocking)
======================================================================
Status: 200
Response: **2 + 2 equals 4.**[1][3]

This is a basic arithmetic operation where addition combines two units of 2 to yield a total of 4, as confirmed by standard...
✅ PASS: Normal conversation allowed

**********************************************************************
* POST_CALL TESTS (Output Filtering)
**********************************************************************

======================================================================
Test 4 (perplexity-sonar): Output filtering - non-streaming (post_call hook)
======================================================================
Asking: 'What's another name for rabbit?'
Expected: LLM would naturally say 'bunny', but post_call hook should block it

Status: 200
Response: ⚠️ BLOCKED: Your message mentions duckies or bunnies. Discussions about cute animals may causeexcessive happiness and distraction. Please rephrase yo...
✅ PASS: LLM output blocked (post_call hook working)

======================================================================
Test 5 (perplexity-sonar): Output filtering - streaming (post_call hook)
======================================================================
Asking: 'What's another name for rabbit?' with streaming=true
Expected: LLM would naturally say 'bunny', but post_call hook should block it
This tests the LiteLLM streaming bug fix

Status: 200
Response: ⚠️ BLOCKED: Your message mentions duckies or bunnies. Discussions about cute animals may causeexcessive happiness and distraction. Please rephrase yo...
✅ PASS: LLM output blocked in streaming mode (post_call hook + patch working)

======================================================================
Test 6 (perplexity-sonar): Indirect bypass - 'what is bird that quacks?' (post_call hook)
======================================================================
Asking: 'what is bird that quacks?'
Expected: Input passes pre_call (no blocked words), but LLM response
          contains 'duck/mallard' which should be blocked by post_call hook

Status: 200
Response: ⚠️ BLOCKED: The response contains mentions of duckies or bunnies. Discussions about cute animals may cause excessive happiness and distraction. Please...
✅ PASS: Indirect bypass blocked (post_call hook caught LLM response)

----------------------------------------------------------------------
Model 'perplexity-sonar' Results: 6/6 tests passed
----------------------------------------------------------------------

======================================================================
FINAL SUMMARY
======================================================================
Total: 12/12 tests passed
Failed: 0/12

🎉 All tests passed!`}</pre>
            </div>

            <div className="command-label">Tail application logs:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 140 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`kubectl logs -n llm-gateway deployment/litellm -f`, 140)}
                title={copiedIndex === 140 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 140 ? "✓" : "⧉"}
              </button>
kubectl logs -n llm-gateway deployment/litellm -f
            </div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 141 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`kubectl logs -n llm-gateway deployment/openwebui -f`, 141)}
                title={copiedIndex === 141 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 141 ? "✓" : "⧉"}
              </button>
kubectl logs -n llm-gateway deployment/openwebui -f
            </div>

            <div className="command-label">Inspect services and ingress:</div>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 142 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`kubectl get svc,ingress -n llm-gateway`, 142)}
                title={copiedIndex === 142 ? "Copied!" : "Copy to clipboard"}
              >
                {copiedIndex === 142 ? "✓" : "⧉"}
              </button>
kubectl get svc,ingress -n llm-gateway
            </div>
            <div className="command-label">Expected output:</div>
            <div className="output-block">
              <pre>{`NAME                TYPE           CLUSTER-IP       EXTERNAL-IP                           PORT(S)         AGE
service/litellm     ClusterIP      172.20.208.156   <none>                           80/TCP          167m
service/openwebui   LoadBalancer   172.20.74.57     adbfc9821e89940efb696ac92fd33f87-3ee10353c1b6a805.elb.us-east-1.amazonaws.com   443:32390/TCP   167m`}</pre>
            </div>
          </div>

        <div className="prerequisites" style={{ marginTop: "3rem" }}>
          <h2>Operations & Monitoring</h2>
          <ul>
            <li>Run monthly: make eks-verify-cloudflare (check CloudFlare IPs)</li>
            <li>Monitor costs: make aws-costs-py (view AWS spending)</li>
            <li>Review security: make iam-report (IAM roles and architecture)</li>
            <li>Test models: make test-all (validate all 7 AI models)</li>
            <li>Local testing: make eks-port-forward (access LiteLLM API)</li>
            <li>Set up CloudWatch alarms for cost monitoring</li>
            <li>Configure automated EBS snapshots for backups</li>
            <li>Test Arena Mode with multiple models</li>
          </ul>
        </div>

        <div className="bottom-nav">
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/architecture")}
          >
            ← Previous: Architecture
          </button>
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/features")}
          >
            Next: Features →
          </button>
        </div>
      </div>
    </div>
  );
}
