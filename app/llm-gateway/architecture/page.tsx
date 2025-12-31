"use client";

import React from "react";
import Link from "next/link";

export default function ArchitecturePage() {
  return (
    <div className="architecture-container">
      <style jsx>{`
        .architecture-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
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

        .diagram-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .diagram {
          background: white;
          color: #333;
          padding: 2rem;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.75rem;
          line-height: 1.4;
          overflow-x: auto;
          white-space: pre;
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
          color: #4fd1c5;
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
          color: #4fd1c5;
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
          <h2 style={{ marginBottom: "1rem" }}>System Architecture Diagram</h2>
          <div className="diagram">
{`┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  AWS EKS Cluster                                │
│                          (llm-gateway-eks / Kubernetes 1.34)                    │
│                                                                                 │
│  ┌───────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │       OpenWebUI Pod               │   │       LiteLLM Pod               │  │
│  │   ┌───────────────────────────┐   │   │   ┌─────────────────────────┐   │  │
│  │   │  Web Interface            │   │   │   │  LLM Proxy Server       │   │  │
│  │   │  - React Frontend         │   │   │   │  - Multi-provider API   │   │  │
│  │   │  - User Authentication    │   │   │   │  - Rate Limiting        │   │  │
│  │   │  - Arena Mode             │◄──┼───┼───┤  - Cost Tracking        │   │  │
│  │   │  - Chat History           │   │   │   │  - Request Routing      │   │  │
│  │   └───────────────────────────┘   │   │   └─────────────────────────┘   │  │
│  │                                   │   │                                 │  │
│  │   Port: 8080                      │   │   Port: 4000                    │  │
│  │   User: 1000 (non-root)           │   │   User: 1000 (non-root)         │  │
│  │   Storage: EBS PersistentVolume   │   │   IRSA Role: Bedrock Access     │  │
│  └───────────┬───────────────────────┘   └──────────────┬──────────────────┘  │
│              │                                           │                     │
│              │  Network Policies                         │                     │
│              │  (Zero-Trust Isolation)                   │                     │
│              │                                           │                     │
└──────────────┼───────────────────────────────────────────┼─────────────────────┘
               │                                           │
               │                                           │
       ┌───────▼────────────┐                             │
       │                    │                             ├──► AWS Bedrock
       │  Network LB (NLB)  │                             │    - Nova Pro
       │  Port: 443 (HTTPS) │                             │    - Llama 3.2
       │  ACM Certificate   │                             │    - Claude 3.5
       │  SSL Termination   │                             │
       └───────┬────────────┘                             └──► Perplexity API
               │                                                - Sonar Pro
               │                                                - Deep Research
       ┌───────▼────────────┐
       │                    │
       │   CloudFlare DNS   │
       │   (DNS Only Mode)  │
       └───────┬────────────┘
               │
               ▼
       openwebui.bhenning.com


┌─────────────────────────────────────────────────────────────────────────────────┐
│                              VPC Network Layout                                 │
│                                  10.0.0.0/16                                    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Public Subnets (2 AZs)                                                 │   │
│  │  10.0.0.0/24, 10.0.1.0/24                                               │   │
│  │                                                                         │   │
│  │    [Internet Gateway] ───► [NAT Gateway]                               │   │
│  │             │                      │                                    │   │
│  │             │                      │                                    │   │
│  │             ▼                      │                                    │   │
│  │       [NLB - HTTPS]                │                                    │   │
│  └────────────────────────────────────┼─────────────────────────────────────┘   │
│                                       │                                         │
│  ┌────────────────────────────────────▼─────────────────────────────────────┐   │
│  │  Private Subnets (2 AZs)                                                │   │
│  │  10.0.10.0/24, 10.0.11.0/24                                             │   │
│  │                                                                         │   │
│  │    [EKS Worker Nodes - SPOT Instances]                                 │   │
│  │    - t3.medium, t3a.medium, t2.medium                                  │   │
│  │    - OpenWebUI Pod + LiteLLM Pod                                       │   │
│  │    - EBS CSI Driver for Persistent Storage                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘`}
          </div>
        </div>

        <h2 style={{ fontSize: "2rem", margin: "3rem 0 1.5rem" }}>
          Key Components
        </h2>

        <div className="components-grid">
          <div className="component-card">
            <h3>🎨 OpenWebUI</h3>
            <ul>
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

        <Link href="/llm-gateway" className="back-link">
          ← Back to Overview
        </Link>
      </div>
    </div>
  );
}
