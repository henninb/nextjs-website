"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const router = useRouter();
  return (
    <div className="security-container">
      <style jsx>{`
        .security-container {
          min-height: 100vh;
          padding: 0;
          color: white;
        }

        .header {
          text-align: center;
          padding: 3rem 2rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
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
          color: #00d4ff;
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
          color: #00d4ff;
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
          color: #00d4ff;
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

          .security-grid {
            grid-template-columns: 1fr;
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
              <li>bedrock:InvokeModel (Nova models, Llama models)</li>
              <li>secretsmanager:GetSecretValue (Perplexity API key)</li>
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
              Geo-Restriction (Optional)
            </h2>
            <p>
              CloudFlare geo-restriction capability with NLB security group enforcement.
              Optional firewall rules can limit access to US-only traffic.
            </p>

            <h3>CloudFlare Protection (Available)</h3>
            <ul>
              <li>Optional: Firewall rule to block non-US traffic (HTTP 403)</li>
              <li>DDoS protection and WAF included</li>
              <li>Bot mitigation and rate limiting</li>
              <li>Analytics and logging for all requests</li>
            </ul>

            <h3>NLB Security Group</h3>
            <ul>
              <li>Only accepts HTTPS from CloudFlare IPs</li>
              <li>Blocks all other source IPs at AWS level</li>
              <li>Prevents direct NLB hostname access</li>
              <li>Manually verified and updated monthly</li>
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
            </ul>

            <h3>Access Control</h3>
            <ul>
              <li>Retrieved via IRSA (no static credentials)</li>
              <li>Temporary session tokens only</li>
              <li>Fine-grained IAM policies</li>
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
            </ul>

            <div className="code-block">
              {`# Rate limiting prevents:
- API abuse and cost overruns
- Denial of service attacks
- Brute force attempts
- Resource exhaustion`}
            </div>
          </div>

          <div className="security-card">
            <h2>
              <span className="icon">🔍</span>
              Custom Guardrails
            </h2>
            <p>
              Enterprise-grade content filtering with pre_call and post_call
              hooks to validate both user inputs and AI model outputs.
            </p>

            <h3>Input Filtering (Pre-Call)</h3>
            <ul>
              <li>Validates user messages before LLM processing</li>
              <li>Sanitizes conversation history to prevent bypass</li>
              <li>Ensures proper message structure</li>
              <li>Forces stream=false for output filtering</li>
            </ul>

            <h3>Output Filtering (Post-Call)</h3>
            <ul>
              <li>Scans AI responses for prohibited content</li>
              <li>Works with streaming via stream=false forcing</li>
              <li>Prevents indirect bypass attempts</li>
              <li>HTTP 200 passthrough (no context corruption)</li>
            </ul>

            <h3>Testing & Validation</h3>
            <ul>
              <li>12 comprehensive tests (6 per model)</li>
              <li>Tests both AWS Bedrock and Perplexity</li>
              <li>Validates streaming fix (LiteLLM workaround)</li>
              <li>Catches indirect queries like "what is bird that quacks?"</li>
            </ul>

            <div className="highlight-box">
              <strong>Streaming Bug Workaround:</strong> LiteLLM v1.80.11 has a
              limitation where post_call hooks don't execute for streaming responses.
              Implemented workaround by auto-forcing stream=false in pre_call hook,
              maintaining guardrail protection for all request types. Validated fix
              with comprehensive test suite.
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
            <h3>Layer 6: Content Filtering (Guardrails)</h3>
            <p>
              Custom guardrails filter both user inputs (pre_call) and AI
              outputs (post_call) to prevent prohibited content, prompt
              injection, PII leakage, and policy violations. Streaming mode
              auto-fixes ensure protection for all request types.
            </p>
          </div>

          <div className="layer">
            <h3>Layer 7: Data Protection</h3>
            <p>
              Secrets stored in AWS Secrets Manager with KMS encryption. EBS
              volumes encrypted at rest.
            </p>
          </div>
        </div>

        <div className="bottom-nav">
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/features")}
          >
            ← Previous: Features
          </button>
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/cost")}
          >
            Next: Cost →
          </button>
        </div>
      </div>
    </div>
  );
}
