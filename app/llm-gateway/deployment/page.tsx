"use client";

import React from "react";
import Link from "next/link";

export default function DeploymentPage() {
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
          margin: 1rem 0;
          white-space: pre;
          line-height: 1.6;
          position: relative;
        }

        .copy-button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(46, 204, 113, 0.9);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .copy-button:hover {
          background: rgba(46, 204, 113, 1);
          transform: scale(1.05);
        }

        .copy-button.copied {
          background: rgba(52, 152, 219, 0.9);
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
          gap: 1rem;
          justify-content: center;
          margin: 3rem auto 2rem;
          flex-wrap: wrap;
          max-width: 1000px;
        }

        .nav-button {
          display: inline-block;
          background: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          color: #fa709a;
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .nav-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
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
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 1 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`git clone https://github.com/henninb/llm-gateway.git
cd llm-gateway

# View all available commands
make help`, 1)}
              >
                {copiedIndex === 1 ? "Copied!" : "Copy"}
              </button>
{`git clone https://github.com/henninb/llm-gateway.git
cd llm-gateway

# View all available commands
make help`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h2>Create ECR Repositories</h2>
            <p>
              Set up Amazon ECR repositories to store your container images.
              This eliminates Docker Hub rate limits.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 2 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`cd terraform/ecr
terraform init
terraform apply`, 2)}
              >
                {copiedIndex === 2 ? "Copied!" : "Copy"}
              </button>
{`cd terraform/ecr
terraform init
terraform apply

# Outputs:
# litellm_repository_url = "667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/litellm"
# openwebui_repository_url = "667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/openwebui"`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h2>Build and Push Docker Images</h2>
            <p>
              Build the LiteLLM and OpenWebUI containers and push them to ECR.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 3 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`cd ../..
./tools/build-and-push-ecr.sh`, 3)}
              >
                {copiedIndex === 3 ? "Copied!" : "Copy"}
              </button>
{`cd ../..
./tools/build-and-push-ecr.sh

# This script:
# - Authenticates with ECR
# - Builds Docker images for LiteLLM and OpenWebUI
# - Tags images with latest and git commit SHA
# - Pushes to ECR repositories`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <h2>Provision EKS Cluster</h2>
            <p>
              Create the EKS cluster, VPC, subnets, NAT gateway, and worker
              nodes using Terraform.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 4 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`cd terraform/eks-cluster
terraform init
terraform apply`, 4)}
              >
                {copiedIndex === 4 ? "Copied!" : "Copy"}
              </button>
{`cd terraform/eks-cluster
terraform init
terraform apply

# This creates:
# - VPC with public/private subnets
# - EKS cluster (control plane)
# - SPOT instance node group
# - Internet Gateway + NAT Gateway
# - Security groups
# - OIDC provider for IRSA
# - EBS CSI driver addon
# - VPC CNI addon with NetworkPolicy support

# Wait ~15 minutes for cluster to be ready`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">5</div>
            <h2>Configure kubectl</h2>
            <p>
              Update your local kubeconfig to connect to the new EKS cluster.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 5 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`aws eks update-kubeconfig --region us-east-1 --name llm-gateway-eks
kubectl get nodes`, 5)}
              >
                {copiedIndex === 5 ? "Copied!" : "Copy"}
              </button>
{`aws eks update-kubeconfig \\
  --region us-east-1 \\
  --name llm-gateway-eks

# Verify connection
kubectl get nodes

# Output:
# NAME                             STATUS   ROLES    AGE   VERSION
# ip-10-0-10-123.ec2.internal      Ready    <none>   5m    v1.34.0-eks-...
# ip-10-0-11-456.ec2.internal      Ready    <none>   5m    v1.34.0-eks-...`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">6</div>
            <h2>Request ACM Certificate</h2>
            <p>
              Request an SSL/TLS certificate from AWS Certificate Manager for
              your domain.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 6 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`aws acm request-certificate --domain-name openwebui.bhenning.com --validation-method DNS --region us-east-1
aws acm list-certificates --region us-east-1`, 6)}
              >
                {copiedIndex === 6 ? "Copied!" : "Copy"}
              </button>
{`# Request certificate (via AWS Console or CLI)
aws acm request-certificate \\
  --domain-name openwebui.bhenning.com \\
  --validation-method DNS \\
  --region us-east-1

# Add DNS validation records to your DNS provider
# Wait for certificate to be issued (~5-10 minutes)

# Get certificate ARN for next step
aws acm list-certificates --region us-east-1`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">7</div>
            <h2>Create Secrets in AWS Secrets Manager</h2>
            <p>
              Store sensitive API keys and secrets in AWS Secrets Manager for
              secure access by pods.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 7 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`cd terraform/eks
make eks-secrets-populate`, 7)}
              >
                {copiedIndex === 7 ? "Copied!" : "Copy"}
              </button>
{`cd terraform/eks
make eks-secrets-populate

# You'll be prompted to enter:
# - LITELLM_MASTER_KEY (generate with: openssl rand -hex 32)
# - WEBUI_SECRET_KEY (generate with: openssl rand -hex 32)
# - PERPLEXITY_API_KEY (from Perplexity account)

# Secrets are encrypted with AWS KMS`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">8</div>
            <h2>Configure Terraform Variables</h2>
            <p>
              Update terraform.tfvars with your ACM certificate ARN and other
              configuration.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 8 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`vim terraform.tfvars`, 8)}
              >
                {copiedIndex === 8 ? "Copied!" : "Copy"}
              </button>
{`# Edit terraform/eks/terraform.tfvars
vim terraform.tfvars

# Update these values:
cluster_name = "llm-gateway-eks"
aws_region = "us-east-1"
environment = "dev"

# Add your ACM certificate ARN
acm_certificate_arn = "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID"

# Enable ECR images
use_ecr_images = true
ecr_image_tag = "latest"`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">9</div>
            <h2>Deploy Applications to EKS</h2>
            <p>
              Deploy LiteLLM, OpenWebUI, network policies, and configure IRSA
              roles.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 9 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`cd terraform/eks
terraform init
terraform apply`, 9)}
              >
                {copiedIndex === 9 ? "Copied!" : "Copy"}
              </button>
{`cd terraform/eks
terraform init
terraform apply

# This creates:
# - Kubernetes namespace (llm-gateway)
# - IRSA role for LiteLLM (Bedrock + Secrets Manager access)
# - LiteLLM deployment + service
# - OpenWebUI deployment + service + PVC
# - Network Load Balancer with ACM certificate
# - NetworkPolicies for zero-trust isolation

# Wait ~5 minutes for LoadBalancer to provision`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">10</div>
            <h2>Get LoadBalancer DNS</h2>
            <p>
              Retrieve the Network Load Balancer DNS name for DNS
              configuration.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 10 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`kubectl get svc openwebui -n llm-gateway`, 10)}
              >
                {copiedIndex === 10 ? "Copied!" : "Copy"}
              </button>
{`kubectl get svc openwebui -n llm-gateway

# Output:
# NAME        TYPE           EXTERNAL-IP
# openwebui   LoadBalancer   a4e51119...elb.us-east-1.amazonaws.com

# Copy the EXTERNAL-IP for next step`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">11</div>
            <h2>Configure DNS & Security</h2>
            <p>
              Create a CNAME record in CloudFlare. Enable proxy mode (orange cloud)
              for geo-restriction and DDoS protection.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 11 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-verify-dns`, 11)}
              >
                {copiedIndex === 11 ? "Copied!" : "Copy"}
              </button>
{`# In CloudFlare dashboard:
Type: CNAME
Name: openwebui
Target: a4e51119be1d84777819e4effb129b14-6ba95aeb4b36de2e.elb.us-east-1.amazonaws.com
Proxy status: Proxied (orange cloud) - for US-only access
TTL: Auto

# Optional: Configure CloudFlare firewall rule for US-only access
# See docs/cloudflare-setup.md for full guide

# Verify DNS configuration
make eks-verify-dns`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">12</div>
            <h2>Verify Deployment</h2>
            <p>
              Test the deployment using automated verification commands and
              access the OpenWebUI interface.
            </p>
            <div className="code-block">
              <button
                className={`copy-button ${copiedIndex === 12 ? "copied" : ""}`}
                onClick={() => copyToClipboard(`make eks-verify-cloudflare
make eks-verify-dns
kubectl get pods -n llm-gateway
curl -I https://openwebui.bhenning.com`, 12)}
              >
                {copiedIndex === 12 ? "Copied!" : "Copy"}
              </button>
{`# Verify CloudFlare security (IP ranges, geo-restriction)
make eks-verify-cloudflare

# Verify DNS configuration
make eks-verify-dns

# Check pod status
kubectl get pods -n llm-gateway

# Test HTTPS connection
curl -I https://openwebui.bhenning.com

# Access in browser:
# https://openwebui.bhenning.com`}
            </div>
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
          <Link href="/llm-gateway/architecture" className="nav-button">
            ← Previous: Architecture
          </Link>
          <Link href="/llm-gateway/features" className="nav-button">
            Next: Features →
          </Link>
        </div>
      </div>
    </div>
  );
}
