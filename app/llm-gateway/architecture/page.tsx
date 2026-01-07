"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ArchitecturePage() {
  const router = useRouter();
  return (
    <div className="architecture-container">
      <style jsx>{`
        .architecture-container {
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

        .diagram-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .architecture-image-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          margin: 1rem 0;
        }

        .architecture-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .components-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .component-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .component-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .component-card ul {
          list-style: none;
          padding: 0;
        }

        .component-card li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .component-card li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #00d4ff;
          font-weight: bold;
        }

        .tech-details {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .tech-details h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
        }

        .tech-row {
          display: flex;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tech-row:last-child {
          border-bottom: none;
        }

        .tech-label {
          font-weight: 600;
          min-width: 200px;
          color: #00d4ff;
        }

        .tech-value {
          opacity: 0.9;
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
          background: linear-gradient(
            135deg,
            rgba(30, 41, 59, 0.8) 0%,
            rgba(51, 65, 85, 0.8) 100%
          );
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          text-decoration: none;
          color: #e2e8f0;
          font-weight: 600;
          font-size: 1rem;
          border: 1px solid rgba(0, 212, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          pointer-events: auto;
          min-width: 180px;
          position: relative;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .nav-button::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(0, 212, 255, 0.3),
            rgba(250, 112, 154, 0.3)
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .nav-button:hover {
          background: linear-gradient(
            135deg,
            rgba(51, 65, 85, 0.95) 0%,
            rgba(71, 85, 105, 0.95) 100%
          );
          border-color: rgba(0, 212, 255, 0.5);
          color: #00d4ff;
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 212, 255, 0.3);
        }

        .nav-button:hover::before {
          opacity: 1;
        }

        .arrow-left,
        .arrow-right {
          font-size: 2.5rem;
          color: #00d4ff;
          font-weight: 900;
          transition: transform 0.2s ease;
        }

        .arrow-left {
          margin-right: 0.75rem;
        }

        .arrow-right {
          margin-left: 0.75rem;
        }

        .nav-button:hover .arrow-left {
          transform: translateX(-4px);
        }

        .nav-button:hover .arrow-right {
          transform: translateX(4px);
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }

          .components-grid {
            grid-template-columns: 1fr;
          }

          .architecture-image-container {
            padding: 1rem;
          }

          .tech-row {
            flex-direction: column;
          }

          .tech-label {
            margin-bottom: 0.5rem;
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
        <h1>🏗️ Architecture</h1>
        <p>
          Comprehensive overview of the LLM Gateway system architecture,
          infrastructure design, and component interactions on AWS EKS.
        </p>
      </div>

      <div className="content">
        <div className="diagram-section">
          <h2
            style={{
              marginBottom: "1.5rem",
              fontSize: "2.5rem",
              textAlign: "center",
            }}
          >
            System Architecture
          </h2>
          <div className="architecture-image-container">
            <img
              src="/img/architecture.png"
              alt="LLM Gateway System Architecture Diagram showing AWS EKS cluster with OpenWebUI and LiteLLM pods, Application Load Balancer, CloudFlare DNS, AWS Bedrock, Perplexity API, and Meta Llama integration"
              className="architecture-image"
            />
          </div>
        </div>

        <h2 style={{ fontSize: "2rem", margin: "3rem 0 1.5rem" }}>
          Key Components
        </h2>

        <div className="components-grid">
          <div className="component-card">
            <h3>🎨 OpenWebUI</h3>
            <ul>
              <li>
                <strong>Runs as non-root user (UID 1000)</strong>
              </li>
              <li>Modern web interface for LLM interactions</li>
              <li>
                Arena Mode (currently disabled): blind random selection
                (nova-lite, nova-pro, llama3-2-3b)
              </li>
              <li>Chat history with EBS persistence</li>
              <li>Connects to LiteLLM via internal network</li>
              <li>Exposed via ALB with HTTPS</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>🔄 LiteLLM</h3>
            <ul>
              <li>
                <strong>Runs as non-root user (UID 1000)</strong>
              </li>
              <li>Universal LLM proxy server (7 models)</li>
              <li>Multi-provider support (AWS Bedrock, Perplexity)</li>
              <li>OpenAI-compatible API interface</li>
              <li>Custom guardrails with streaming support</li>
              <li>Built-in rate limiting & cost tracking</li>
              <li>IRSA for AWS Bedrock authentication</li>
              <li>Secrets Manager for Perplexity API key</li>
              <li>Internal-only access (port 4000)</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>☸️ AWS EKS</h3>
            <ul>
              <li>Auto-scaling node groups (SPOT instances)</li>
              <li>Default 1 node (can scale to 2+ for HA)</li>
              <li>Instance types: t3.medium, t3a.medium, t2.medium</li>
              <li>EBS-backed persistent storage</li>
              <li>IRSA for secure AWS service access</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>🌐 Networking</h3>
            <ul>
              <li>VPC with public & private subnets</li>
              <li>Single NAT Gateway (cost optimized)</li>
              <li>Application Load Balancer (ALB) with CloudFlare Origin cert</li>
              <li>CloudFlare Proxy Mode (DDoS/WAF enabled)</li>
              <li>
                ALB security groups allow CloudFlare IP ranges only
              </li>
              <li>Zero-trust NetworkPolicies for pod isolation</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>🔐 Security</h3>
            <ul>
              <li>Zero-trust network policies (deny-by-default)</li>
              <li>IRSA (no static credentials)</li>
              <li>Non-root containers (UID 1000)</li>
              <li>TLS/SSL termination at ALB</li>
              <li>AWS metadata service blocked</li>
              <li>Secrets in AWS Secrets Manager</li>
              <li>On-demand IP allowlisting with make eks-allow-ip</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>💾 Storage</h3>
            <ul>
              <li>Persistent volumes for OpenWebUI data</li>
              <li>User data and conversations stored in EBS volumes</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>🤖 AI Providers</h3>
            <ul>
              <li>
                <strong>AWS Bedrock Nova (3 models)</strong>
              </li>
              <li>nova-micro, nova-lite, nova-pro</li>
              <li>
                <strong>AWS Bedrock Llama (2 models)</strong>
              </li>
              <li>llama3-2-1b, llama3-2-3b</li>
              <li>
                <strong>Perplexity (2 models)</strong>
              </li>
              <li>perplexity-sonar, perplexity-sonar-pro</li>
              <li>
                <strong>Total: 7 unified models</strong>
              </li>
            </ul>
          </div>

          <div className="component-card">
            <h3>🛡️ Custom Guardrails</h3>
            <ul>
              <li>Pre-call hook: Input content filtering</li>
              <li>Post-call hook: Output content filtering</li>
              <li>Streaming support with LiteLLM workaround</li>
              <li>History sanitization (bypass prevention)</li>
              <li>Passthrough mode (HTTP 200 with errors)</li>
              <li>Prevents UI context corruption</li>
              <li>Extensible for PII, compliance, safety</li>
            </ul>
          </div>
        </div>

        <div className="tech-details">
          <h2>Technical Specifications</h2>

          <div className="tech-row">
            <div className="tech-label">Region</div>
            <div className="tech-value">us-east-1</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Node Instance Types</div>
            <div className="tech-value">
              t3.medium, t3a.medium, t2.medium (SPOT)
            </div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Node Scaling</div>
            <div className="tech-value">
              Default 1 node (scalable to 2+ for HA)
            </div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Load Balancer</div>
            <div className="tech-value">
              Application Load Balancer (ALB) with ACM
            </div>
          </div>

          <div className="tech-row">
            <div className="tech-label">DNS & Security</div>
            <div className="tech-value">CloudFlare Proxy Mode (DDoS/WAF/Edge Caching)</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Infrastructure as Code</div>
            <div className="tech-value">Terraform 1.0+</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Container Registry</div>
            <div className="tech-value">Amazon ECR</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">AI Providers</div>
            <div className="tech-value">
              AWS Bedrock Nova (nova-pro, nova-lite, nova-micro), AWS Bedrock
              Llama (llama3-2-1b, llama3-2-3b), Perplexity (perplexity-sonar,
              perplexity-sonar-pro) - 7 models total
            </div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Custom Guardrails</div>
            <div className="tech-value">
              Pre-call & post-call hooks with streaming support, passthrough
              mode
            </div>
          </div>
        </div>

        <div className="bottom-nav">
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/requirements")}
          >
            <span className="arrow-left">←</span> Previous: Requirements
          </button>
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/deployment")}
          >
            Next: Deployment <span className="arrow-right">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
