"use client";

import React from "react";
import Link from "next/link";

export default function DeploymentPage() {
  return (
    <div className="deployment-container">
      <style jsx>{`
        .deployment-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          padding: 2rem;
          color: #333;
        }

        .header {
          text-align: center;
          padding: 3rem 2rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          color: white;
        }

        .header h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header p {
          font-size: 1.125rem;
          opacity: 0.95;
          max-width: 800px;
          margin: 0 auto;
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
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
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
          font-size: 0.875rem;
          overflow-x: auto;
          margin: 1rem 0;
          white-space: pre;
          line-height: 1.5;
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
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
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
              Start by cloning the LLM Gateway repository from GitHub to your
              local machine.
            </p>
            <div className="code-block">
{`git clone https://github.com/henninb/llm-gateway.git
cd llm-gateway`}
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
{`cd terraform/ecr
terraform init
terraform apply

<span class="comment"># Outputs:</span>
<span class="comment"># litellm_repository_url = "667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/litellm"</span>
<span class="comment"># openwebui_repository_url = "667778672048.dkr.ecr.us-east-1.amazonaws.com/llm-gateway/openwebui"</span>`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h2>Build and Push Docker Images</h2>
            <p>
              Build the LiteLLM and OpenWebUI containers and push them to ECR.
            </p>
            <div className="code-block">
{`cd ../..
./tools/build-and-push-ecr.sh

<span class="comment"># This script:</span>
<span class="comment"># - Authenticates with ECR</span>
<span class="comment"># - Builds Docker images for LiteLLM and OpenWebUI</span>
<span class="comment"># - Tags images with latest and git commit SHA</span>
<span class="comment"># - Pushes to ECR repositories</span>`}
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
{`cd terraform/eks-cluster
terraform init
terraform apply

<span class="comment"># This creates:</span>
<span class="comment"># - VPC with public/private subnets</span>
<span class="comment"># - EKS cluster (control plane)</span>
<span class="comment"># - SPOT instance node group</span>
<span class="comment"># - Internet Gateway + NAT Gateway</span>
<span class="comment"># - Security groups</span>
<span class="comment"># - OIDC provider for IRSA</span>
<span class="comment"># - EBS CSI driver addon</span>
<span class="comment"># - VPC CNI addon with NetworkPolicy support</span>

<span class="comment"># Wait ~15 minutes for cluster to be ready</span>`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">5</div>
            <h2>Configure kubectl</h2>
            <p>
              Update your local kubeconfig to connect to the new EKS cluster.
            </p>
            <div className="code-block">
{`aws eks update-kubeconfig \\
  --region us-east-1 \\
  --name llm-gateway-eks

<span class="comment"># Verify connection</span>
kubectl get nodes

<span class="comment"># Output:</span>
<span class="comment"># NAME                             STATUS   ROLES    AGE   VERSION</span>
<span class="comment"># ip-10-0-10-123.ec2.internal      Ready    <none>   5m    v1.34.0-eks-...</span>
<span class="comment"># ip-10-0-11-456.ec2.internal      Ready    <none>   5m    v1.34.0-eks-...</span>`}
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
{`<span class="comment"># Request certificate (via AWS Console or CLI)</span>
aws acm request-certificate \\
  --domain-name openwebui.bhenning.com \\
  --validation-method DNS \\
  --region us-east-1

<span class="comment"># Add DNS validation records to your DNS provider</span>
<span class="comment"># Wait for certificate to be issued (~5-10 minutes)</span>

<span class="comment"># Get certificate ARN for next step</span>
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
{`cd terraform/eks
make eks-secrets-populate

<span class="comment"># You'll be prompted to enter:</span>
<span class="comment"># - LITELLM_MASTER_KEY (generate with: openssl rand -hex 32)</span>
<span class="comment"># - WEBUI_SECRET_KEY (generate with: openssl rand -hex 32)</span>
<span class="comment"># - PERPLEXITY_API_KEY (from Perplexity account)</span>

<span class="comment"># Secrets are encrypted with AWS KMS</span>`}
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
{`<span class="comment"># Edit terraform/eks/terraform.tfvars</span>
vim terraform.tfvars

<span class="comment"># Update these values:</span>
cluster_name = "llm-gateway-eks"
aws_region = "us-east-1"
environment = "dev"

<span class="comment"># Add your ACM certificate ARN</span>
acm_certificate_arn = "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID"

<span class="comment"># Enable ECR images</span>
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
{`cd terraform/eks
terraform init
terraform apply

<span class="comment"># This creates:</span>
<span class="comment"># - Kubernetes namespace (llm-gateway)</span>
<span class="comment"># - IRSA role for LiteLLM (Bedrock + Secrets Manager access)</span>
<span class="comment"># - LiteLLM deployment + service</span>
<span class="comment"># - OpenWebUI deployment + service + PVC</span>
<span class="comment"># - Network Load Balancer with ACM certificate</span>
<span class="comment"># - NetworkPolicies for zero-trust isolation</span>

<span class="comment"># Wait ~5 minutes for LoadBalancer to provision</span>`}
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
{`kubectl get svc openwebui -n llm-gateway

<span class="comment"># Output:</span>
<span class="comment"># NAME        TYPE           EXTERNAL-IP</span>
<span class="comment"># openwebui   LoadBalancer   a4e51119...elb.us-east-1.amazonaws.com</span>

<span class="comment"># Copy the EXTERNAL-IP for next step</span>`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">11</div>
            <h2>Configure DNS</h2>
            <p>
              Create a CNAME record in CloudFlare (or your DNS provider)
              pointing to the LoadBalancer.
            </p>
            <div className="code-block">
{`<span class="comment"># In CloudFlare dashboard:</span>
Type: CNAME
Name: openwebui
Target: a4e51119be1d84777819e4effb129b14-6ba95aeb4b36de2e.elb.us-east-1.amazonaws.com
Proxy status: DNS only (not proxied)
TTL: Auto

<span class="comment"># Wait 5-10 minutes for DNS propagation</span>`}
            </div>
          </div>

          <div className="step">
            <div className="step-number">12</div>
            <h2>Verify Deployment</h2>
            <p>
              Test the deployment by accessing the OpenWebUI interface via
              HTTPS.
            </p>
            <div className="code-block">
{`<span class="comment"># Check pod status</span>
kubectl get pods -n llm-gateway

<span class="comment"># Check network policies</span>
kubectl get networkpolicies -n llm-gateway

<span class="comment"># Test HTTPS connection</span>
curl -I https://openwebui.bhenning.com

<span class="comment"># Expected: HTTP/2 200 OK</span>

<span class="comment"># Access in browser:</span>
<span class="comment"># https://openwebui.bhenning.com</span>`}
            </div>
          </div>
        </div>

        <div className="prerequisites" style={{ marginTop: "3rem" }}>
          <h2>Post-Deployment Tasks</h2>
          <ul>
            <li>Create CloudWatch alarms for cost monitoring</li>
            <li>Set up CloudTrail logging for audit trail</li>
            <li>Configure automated EBS snapshots for backups</li>
            <li>Test Arena Mode with multiple models</li>
            <li>Verify network policies are enforcing isolation</li>
            <li>Review IAM permissions for least-privilege</li>
            <li>Document deployment for team members</li>
          </ul>
        </div>

        <Link href="/llm-gateway" className="back-link">
          ← Back to Overview
        </Link>
      </div>
    </div>
  );
}
