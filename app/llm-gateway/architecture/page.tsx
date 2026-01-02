"use client";

import React from "react";
import Link from "next/link";

export default function ArchitecturePage() {
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

        .visual-diagram {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin: 1rem 0;
        }

        .diagram-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 1rem;
          text-align: center;
        }

        .diagram-box h4 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .diagram-box p {
          font-size: 1.1rem;
          opacity: 0.95;
          margin: 0.25rem 0;
        }

        .diagram-arrow {
          text-align: center;
          font-size: 2rem;
          color: white;
          margin: 0.5rem 0;
        }

        .diagram-row {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .diagram-row .diagram-box {
          flex: 1;
          min-width: 280px;
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
          content: "→";
          position: absolute;
          left: 0;
          color: #00d4ff;
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
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 3rem auto 0;
          padding: 1.5rem 0;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .nav-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          color: white;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .nav-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }

          .components-grid {
            grid-template-columns: 1fr;
          }

          .diagram {
            font-size: 0.65rem;
          }

          .tech-row {
            flex-direction: column;
          }

          .tech-label {
            margin-bottom: 0.5rem;
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
          <h2 style={{ marginBottom: "1rem", fontSize: "2.5rem" }}>System Architecture</h2>
          <div className="visual-diagram">
            <div className="diagram-box" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
              <h4>🌐 User Access</h4>
              <p>openwebui.bhenning.com</p>
            </div>

            <div className="diagram-arrow">↓</div>

            <div className="diagram-box" style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
              <h4>☁️ CloudFlare DNS</h4>
              <p>US-Only Geo-Restriction • DDoS Protection</p>
            </div>

            <div className="diagram-arrow">↓</div>

            <div className="diagram-box" style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
              <h4>🔐 Network Load Balancer</h4>
              <p>HTTPS Port 443 • ACM Certificate • SSL Termination</p>
            </div>

            <div className="diagram-arrow">↓</div>

            <div style={{ background: "rgba(255,255,255,0.15)", padding: "2rem", borderRadius: "12px", margin: "1rem" }}>
              <h3 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "1.5rem", color: "white" }}>
                ☸️ AWS EKS Cluster (Kubernetes 1.34)
              </h3>

              <div className="diagram-row">
                <div className="diagram-box" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <h4>🎨 OpenWebUI Pod</h4>
                  <p>Port 8080</p>
                  <p>React Frontend</p>
                  <p>Arena Mode</p>
                  <p>EBS Storage</p>
                  <p>Non-root (UID 1000)</p>
                </div>

                <div className="diagram-box" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <h4>🔄 LiteLLM Pod</h4>
                  <p>Port 4000</p>
                  <p>Multi-Provider API</p>
                  <p>Rate Limiting</p>
                  <p>IRSA Auth</p>
                  <p>Non-root (UID 1000)</p>
                </div>
              </div>

              <div className="diagram-box" style={{ background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)", marginTop: "1rem" }}>
                <h4>🛡️ Network Policies</h4>
                <p>Zero-Trust Pod Isolation • Deny-by-Default</p>
              </div>
            </div>

            <div className="diagram-arrow">↓</div>

            <div className="diagram-row">
              <div className="diagram-box" style={{ background: "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)" }}>
                <h4>🤖 AWS Bedrock</h4>
                <p>Nova Models (3)</p>
                <p>Llama Models (2)</p>
              </div>

              <div className="diagram-box" style={{ background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" }}>
                <h4>🔍 Perplexity API</h4>
                <p>Sonar</p>
                <p>Sonar Pro</p>
              </div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: "2rem", margin: "3rem 0 1.5rem" }}>
          Key Components
        </h2>

        <div className="components-grid">
          <div className="component-card">
            <h3>🎨 OpenWebUI</h3>
            <ul>
              <li><strong>Runs as non-root user (UID 1000)</strong></li>
              <li>React-based web interface</li>
              <li>User authentication & session management</li>
              <li>Arena Mode for model comparison</li>
              <li>Chat history with EBS persistence</li>
              <li>Connects to LiteLLM via internal network</li>
              <li>Exposed via NLB on port 443 (HTTPS)</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>🔄 LiteLLM</h3>
            <ul>
              <li><strong>Runs as non-root user (UID 1000)</strong></li>
              <li>Universal LLM proxy server</li>
              <li>Multi-provider support (AWS, Perplexity)</li>
              <li>OpenAI-compatible API interface</li>
              <li>Built-in rate limiting & cost tracking</li>
              <li>IRSA for AWS Bedrock authentication</li>
              <li>Internal-only access (port 4000)</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>☸️ AWS EKS</h3>
            <ul>
              <li>Managed Kubernetes 1.34 control plane</li>
              <li>Auto-scaling node groups (SPOT)</li>
              <li>VPC CNI with network policy support</li>
              <li>EBS CSI driver for persistent storage</li>
              <li>IRSA for secure AWS service access</li>
              <li>Two availability zones for HA</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>🌐 Networking</h3>
            <ul>
              <li>VPC with public & private subnets</li>
              <li>Single NAT Gateway (cost optimized)</li>
              <li>Network Load Balancer with ACM cert</li>
              <li>CloudFlare DNS (DNS-only mode)</li>
              <li>NetworkPolicies for pod isolation</li>
              <li>No direct internet access for pods</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>🔐 Security</h3>
            <ul>
              <li>Zero-trust network policies</li>
              <li>IRSA (no static credentials)</li>
              <li>Non-root containers (UID 1000)</li>
              <li>TLS/SSL termination at NLB</li>
              <li>AWS metadata service blocked</li>
              <li>Secrets in AWS Secrets Manager</li>
            </ul>
          </div>

          <div className="component-card">
            <h3>💾 Storage</h3>
            <ul>
              <li>EBS CSI driver addon</li>
              <li>PersistentVolumes for OpenWebUI data</li>
              <li>20GB gp3 volumes</li>
              <li>Automatic provisioning</li>
              <li>Backup via EBS snapshots</li>
              <li>Encrypted at rest</li>
            </ul>
          </div>
        </div>

        <div className="tech-details">
          <h2>Technical Specifications</h2>

          <div className="tech-row">
            <div className="tech-label">Kubernetes Version</div>
            <div className="tech-value">1.34</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Region</div>
            <div className="tech-value">us-east-1</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Availability Zones</div>
            <div className="tech-value">2 (us-east-1a, us-east-1b)</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">VPC CIDR</div>
            <div className="tech-value">10.0.0.0/16</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Node Instance Types</div>
            <div className="tech-value">
              t3.medium, t3a.medium, t2.medium (SPOT)
            </div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Node Scaling</div>
            <div className="tech-value">Min: 2, Desired: 2, Max: 4</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Container Runtime</div>
            <div className="tech-value">containerd</div>
          </div>

          <div className="tech-row">
            <div className="tech-label">CNI Plugin</div>
            <div className="tech-value">
              AWS VPC CNI (with NetworkPolicy support)
            </div>
          </div>

          <div className="tech-row">
            <div className="tech-label">Load Balancer</div>
            <div className="tech-value">
              Network Load Balancer (NLB) with ACM
            </div>
          </div>

          <div className="tech-row">
            <div className="tech-label">DNS</div>
            <div className="tech-value">
              CloudFlare (DNS-only, no proxy)
            </div>
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
              AWS Bedrock (Nova, Llama, Claude), Perplexity (Sonar)
            </div>
          </div>
        </div>

        <div className="bottom-nav">
          <Link href="/llm-gateway/requirements" className="nav-button">
            ← Previous: Requirements
          </Link>
          <Link href="/llm-gateway/deployment" className="nav-button">
            Next: Deployment →
          </Link>
        </div>
      </div>
    </div>
  );
}
