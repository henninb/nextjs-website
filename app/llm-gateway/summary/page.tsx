"use client";

import React from "react";
import Link from "next/link";

export default function SummaryPage() {
  return (
    <div className="summary-container">
      <style jsx>{`
        .summary-container {
          min-height: 100vh;
          padding: 0;
          color: white;
        }

        .header {
          text-align: center;
          padding: 3rem 2rem 2rem;
          max-width: 1400px;
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

        .achievement-banner {
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
          border-radius: 20px;
          padding: 3rem;
          margin: 3rem 0;
          text-align: center;
          box-shadow: 0 10px 40px rgba(46, 204, 113, 0.3);
        }

        .achievement-banner h2 {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }

        .achievement-banner p {
          font-size: 1.75rem;
          opacity: 0.95;
          line-height: 1.8;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2.5rem;
          margin: 4rem 0;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-8px);
          border-color: rgba(46, 204, 113, 0.5);
        }

        .stat-value {
          font-size: 5rem;
          font-weight: 700;
          color: #2ecc71;
          display: block;
          margin-bottom: 1rem;
        }

        .stat-label {
          font-size: 1.5rem;
          opacity: 0.95;
          line-height: 1.6;
        }

        .highlights-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          margin: 3rem 0;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .highlights-section h2 {
          font-size: 3rem;
          margin-bottom: 2rem;
          text-align: center;
          color: #2ecc71;
        }

        .highlight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2.5rem;
          margin-top: 2rem;
        }

        .highlight-card {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 2.5rem;
          border-left: 5px solid #2ecc71;
        }

        .highlight-card h3 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #2ecc71;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .highlight-card .icon {
          font-size: 2.5rem;
        }

        .highlight-card p {
          font-size: 1.35rem;
          line-height: 1.8;
          opacity: 0.95;
        }

        .tech-summary {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          margin: 3rem 0;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .tech-summary h2 {
          font-size: 3rem;
          margin-bottom: 2rem;
          text-align: center;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .tech-badge {
          background: rgba(46, 204, 113, 0.2);
          border: 2px solid #2ecc71;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          font-size: 1.35rem;
          font-weight: 600;
        }

        .bottom-nav {
          display: flex;
          justify-content: center;
          margin: 4rem auto 2rem;
        }

        .nav-button {
          display: inline-block;
          background: rgba(46, 204, 113, 0.3);
          padding: 1.25rem 3rem;
          border-radius: 12px;
          text-decoration: none;
          color: white;
          font-weight: 600;
          font-size: 1.35rem;
          border: 2px solid #2ecc71;
          transition: all 0.3s ease;
        }

        .nav-button:hover {
          background: rgba(46, 204, 113, 0.5);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 3rem;
          }

          .stats-grid,
          .highlight-grid,
          .tech-grid {
            grid-template-columns: 1fr;
          }

          .stat-value {
            font-size: 3.5rem;
          }
        }
      `}</style>

      <div className="header">
        <h1>📊 Project Summary</h1>
        <p>
          Production-grade AWS infrastructure demonstrating enterprise security,
          cost optimization, and modern DevOps practices
        </p>
      </div>

      <div className="content">
        <div className="achievement-banner">
          <h2>🎉 All Requirements Exceeded</h2>
          <p>
            5/5 core objectives met • 2/2 stretch goals achieved • 100%
            Infrastructure as Code • Production-ready deployment
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">7</span>
            <span className="stat-label">AI Models Deployed</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">50-90%</span>
            <span className="stat-label">Cost Savings with SPOT</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">100%</span>
            <span className="stat-label">Infrastructure as Code</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">Zero</span>
            <span className="stat-label">Static AWS Credentials</span>
          </div>
        </div>

        <div className="highlights-section">
          <h2>Key Achievements</h2>

          <div className="highlight-grid">
            <div className="highlight-card">
              <h3>
                <span className="icon">☸️</span>
                Production Kubernetes
              </h3>
              <p>
                AWS EKS cluster with multi-AZ deployment, auto-scaling, and
                zero-trust network policies
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🔐</span>
                Enterprise Security
              </h3>
              <p>
                IRSA authentication, geo-restriction, CloudFlare protection, and
                defense-in-depth controls
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">💰</span>
                Cost Optimized
              </h3>
              <p>
                SPOT instances and single NAT gateway reducing monthly costs by
                $150-200 (50-60%)
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🤖</span>
                Multi-Provider AI
              </h3>
              <p>
                7 models from AWS Bedrock and Perplexity via unified
                OpenAI-compatible API
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🚀</span>
                Automated Deployment
              </h3>
              <p>
                30+ Make commands for streamlined infrastructure provisioning
                and operations
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🎭</span>
                Arena Mode
              </h3>
              <p>
                Blind model comparison for unbiased AI evaluation with live demo
                at openwebui.bhenning.com
              </p>
            </div>
          </div>
        </div>

        <div className="tech-summary">
          <h2>Technology Stack</h2>

          <div className="tech-grid">
            <div className="tech-badge">AWS EKS</div>
            <div className="tech-badge">Kubernetes 1.34</div>
            <div className="tech-badge">Terraform</div>
            <div className="tech-badge">LiteLLM</div>
            <div className="tech-badge">OpenWebUI</div>
            <div className="tech-badge">AWS Bedrock</div>
            <div className="tech-badge">Perplexity API</div>
            <div className="tech-badge">CloudFlare</div>
            <div className="tech-badge">IRSA</div>
            <div className="tech-badge">Network Policies</div>
            <div className="tech-badge">SPOT Instances</div>
            <div className="tech-badge">ACM Certificates</div>
          </div>
        </div>

        <div className="bottom-nav">
          <Link href="/llm-gateway" className="nav-button">
            ← Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
