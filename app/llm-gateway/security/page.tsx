"use client";

import React from "react";
import Link from "next/link";

export default function SecurityPage() {
  return (
    <div className="security-container">
      <style jsx>{`
        .security-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
          padding: 2rem;
          color: white;
        }

        .header {
          text-align: center;
          padding: 3rem 2rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header p {
          font-size: 1.125rem;
          opacity: 0.9;
          max-width: 800px;
          margin: 0 auto;
        }

        .content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .security-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin: 2rem 0;
        }

        .security-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }

        .security-card:hover {
          transform: translateY(-5px);
        }

        .security-card h2 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .security-card .icon {
          font-size: 2rem;
        }

        .security-card h3 {
          font-size: 1.25rem;
          margin: 1.5rem 0 0.75rem;
          color: #4fd1c5;
        }

        .security-card ul {
          list-style: none;
          padding: 0;
        }

        .security-card li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          opacity: 0.95;
        }

        .security-card li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #4fd1c5;
          font-weight: bold;
        }

        .highlight-box {
          background: rgba(79, 209, 197, 0.2);
          border-left: 4px solid #4fd1c5;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 4px;
        }

        .code-block {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.875rem;
          overflow-x: auto;
          margin: 1rem 0;
          white-space: pre-wrap;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .defense-layers {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .defense-layers h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .layer {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          margin: 1rem 0;
          border-left: 4px solid #4fd1c5;
          border-radius: 4px;
        }

        .layer h3 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: #4fd1c5;
        }

        .layer p {
          opacity: 0.9;
          line-height: 1.6;
        }

        .back-link {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          color: white;
          font-weight: 600;
          margin: 2rem auto;
          display: block;
          text-align: center;
          max-width: 200px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .back-link:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }

          .security-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="header">
        <h1>🔒 Security Features</h1>
        <p>
          Production-grade security controls implementing defense-in-depth,
          zero-trust networking, and AWS best practices for Kubernetes
          workloads.
        </p>
      </div>

      <div className="content">
        <div className="security-grid">
          <div className="security-card">
            <h2>
              <span className="icon">🛡️</span>
              Zero-Trust Networking
            </h2>
            <p>
              Kubernetes NetworkPolicies enforce strict pod-to-pod
              communication rules with deny-by-default stance.
            </p>

            <h3>LiteLLM Network Policy</h3>
            <ul>
              <li>Only accepts traffic from OpenWebUI pods</li>
              <li>Blocks all other ingress (deny-by-default)</li>
              <li>Egress limited to DNS and external APIs</li>
              <li>AWS metadata service blocked (169.254.169.254)</li>
            </ul>

            <h3>OpenWebUI Network Policy</h3>
            <ul>
              <li>Accepts traffic from LoadBalancer only</li>
              <li>Egress restricted to LiteLLM pods</li>
              <li>Can access AWS Secrets Manager for keys</li>
              <li>DNS resolution allowed via kube-system</li>
            </ul>

            <div className="code-block">
              {`# Network isolation prevents:
- Pod-to-pod lateral movement
- Unauthorized API access
- Data exfiltration attempts
- SSRF attacks via metadata service`}
            </div>
          </div>

          <div className="security-card">
            <h2>
              <span className="icon">🔑</span>
              IRSA Authentication
            </h2>
            <p>
              IAM Roles for Service Accounts eliminates static credentials and
              provides fine-grained AWS access control.
            </p>

            <h3>How IRSA Works</h3>
            <ul>
              <li>OIDC provider authenticates Kubernetes pods</li>
              <li>IAM role mapped to service account</li>
              <li>Temporary credentials auto-rotated</li>
              <li>No static AWS keys in environment</li>
              <li>Least-privilege access policies</li>
            </ul>

            <h3>LiteLLM Permissions</h3>
            <ul>
              <li>bedrock:InvokeModel (Nova, Llama, Claude)</li>
              <li>secretsmanager:GetSecretValue (Perplexity key)</li>
              <li>Region-scoped: us-east-1 only</li>
              <li>Resource ARN restrictions applied</li>
            </ul>

            <div className="highlight-box">
              <strong>Security Benefit:</strong> If a pod is compromised,
              attackers cannot steal long-lived credentials or access resources
              outside the pod's IAM permissions.
            </div>
          </div>

          <div className="security-card">
            <h2>
              <span className="icon">👤</span>
              Non-Root Containers
            </h2>
            <p>
              All containers run as unprivileged users (UID 1000) to limit
              potential damage from container escapes.
            </p>

            <h3>Container Security</h3>
            <ul>
              <li>USER directive in Dockerfile sets UID 1000</li>
              <li>No root privileges inside containers</li>
              <li>Read-only root filesystem where possible</li>
              <li>Security context enforces non-root</li>
              <li>Prevents privilege escalation</li>
            </ul>

            <div className="code-block">
              {`# Dockerfile security
FROM ghcr.io/berriai/litellm:main-latest
RUN addgroup -g 1000 litellm && \\
    adduser -D -u 1000 -G litellm litellm
USER litellm

# If container escape occurs:
# - Cannot modify host system
# - Cannot install packages
# - Cannot access other users' files`}
            </div>
          </div>

          <div className="security-card">
            <h2>
              <span className="icon">🔐</span>
              TLS/SSL Encryption
            </h2>
            <p>
              End-to-end encryption with ACM certificates and NLB SSL
              termination protects data in transit.
            </p>

            <h3>Encryption Details</h3>
            <ul>
              <li>ACM certificate for openwebui.bhenning.com</li>
              <li>TLS 1.2+ enforced at NLB</li>
              <li>Automatic certificate renewal</li>
              <li>HTTP disabled (HTTPS only)</li>
              <li>Perfect forward secrecy enabled</li>
            </ul>

            <div className="highlight-box">
              <strong>Certificate:</strong>{" "}
              arn:aws:acm:us-east-1:667778672048:certificate/52c0714b-ab17-4466-9959-52d9288b6249
            </div>
          </div>

          <div className="security-card">
            <h2>
              <span className="icon">🌍</span>
              Geo-Restriction
            </h2>
            <p>
              CloudFlare geo-restriction with NLB security group enforcement
              limits access to US-only traffic and prevents direct bypass
              attempts.
            </p>

            <h3>CloudFlare Protection</h3>
            <ul>
              <li>Firewall rule blocks non-US traffic (HTTP 403)</li>
              <li>DDoS protection and WAF included</li>
              <li>Bot mitigation and rate limiting</li>
              <li>Analytics and logging for all requests</li>
            </ul>

            <h3>NLB Security Group</h3>
            <ul>
              <li>Only accepts HTTPS from CloudFlare IPs</li>
              <li>Blocks all other source IPs at AWS level</li>
              <li>Prevents direct NLB hostname access</li>
              <li>Auto-updated with CloudFlare IP ranges</li>
            </ul>

            <div className="highlight-box">
              <strong>Defense in Depth:</strong> Even if someone discovers the
              NLB hostname, they cannot bypass CloudFlare because the security
              group blocks all non-CloudFlare IPs.
            </div>
          </div>

          <div className="security-card">
            <h2>
              <span className="icon">🔒</span>
              Secrets Management
            </h2>
            <p>
              AWS Secrets Manager stores sensitive data with encryption at
              rest, automatic rotation, and audit logging.
            </p>

            <h3>Secrets Storage</h3>
            <ul>
              <li>LITELLM_MASTER_KEY in Secrets Manager</li>
              <li>WEBUI_SECRET_KEY in Secrets Manager</li>
              <li>PERPLEXITY_API_KEY in Secrets Manager</li>
              <li>KMS encryption at rest</li>
              <li>Access logged to CloudTrail</li>
            </ul>

            <h3>Access Control</h3>
            <ul>
              <li>Retrieved via IRSA (no static credentials)</li>
              <li>Temporary session tokens only</li>
              <li>Fine-grained IAM policies</li>
              <li>Rotation strategy configured</li>
            </ul>
          </div>

          <div className="security-card">
            <h2>
              <span className="icon">🛡️</span>
              Rate Limiting & Validation
            </h2>
            <p>
              Input validation and rate limiting prevent abuse, DoS attacks,
              and unexpected costs.
            </p>

            <h3>Protection Mechanisms</h3>
            <ul>
              <li>ENABLE_RATE_LIMIT=true (LiteLLM)</li>
              <li>Per-user request throttling</li>
              <li>Maximum token limits enforced</li>
              <li>LITELLM_DROP_PARAMS=true (sanitization)</li>
              <li>Budget alerts configured</li>
            </ul>

            <div className="code-block">
              {`# Rate limiting prevents:
- API abuse and cost overruns
- Denial of service attacks
- Brute force attempts
- Resource exhaustion`}
            </div>
          </div>
        </div>

        <div className="defense-layers">
          <h2>Defense-in-Depth Layers</h2>

          <div className="layer">
            <h3>Layer 1: Network Perimeter</h3>
            <p>
              CloudFlare proxy with geo-restriction (US-only) and DDoS
              protection filters traffic before it reaches AWS. NLB security
              group enforces CloudFlare-IP-only access, preventing direct
              bypass. ACM certificate ensures encrypted connections.
            </p>
          </div>

          <div className="layer">
            <h3>Layer 2: Network Policies</h3>
            <p>
              Kubernetes NetworkPolicies enforce zero-trust pod-to-pod
              communication. Even if the network is breached, lateral movement
              is blocked by explicit allow rules.
            </p>
          </div>

          <div className="layer">
            <h3>Layer 3: Pod Security</h3>
            <p>
              Non-root containers with security contexts limit the impact of
              container escapes. Read-only filesystems prevent malicious code
              execution.
            </p>
          </div>

          <div className="layer">
            <h3>Layer 4: Authentication</h3>
            <p>
              IRSA eliminates static credentials and provides temporary,
              auto-rotating tokens. Fine-grained IAM policies enforce
              least-privilege access to AWS resources.
            </p>
          </div>

          <div className="layer">
            <h3>Layer 5: Application Security</h3>
            <p>
              Rate limiting, input validation, and parameter sanitization
              protect against malicious requests. Budget alerts prevent
              cost-based DoS attacks.
            </p>
          </div>

          <div className="layer">
            <h3>Layer 6: Data Protection</h3>
            <p>
              Secrets stored in AWS Secrets Manager with KMS encryption. EBS
              volumes encrypted at rest. All API calls logged to CloudTrail
              for audit purposes.
            </p>
          </div>
        </div>

        <Link href="/llm-gateway" className="back-link">
          ← Back to Overview
        </Link>
      </div>
    </div>
  );
}
