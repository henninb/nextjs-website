"use client";

import React from "react";
import Link from "next/link";

export default function LLMGatewayPage() {
  return (
    <div className="llm-gateway-container">
      <style jsx>{`
        .llm-gateway-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .hero {
          text-align: center;
          color: white;
          padding: 4rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero h1 {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .hero .subtitle {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          opacity: 0.95;
        }

        .hero .description {
          font-size: 1.125rem;
          max-width: 800px;
          margin: 0 auto 3rem;
          line-height: 1.6;
          opacity: 0.9;
        }

        .tech-stack {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }

        .tech-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1.25rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .pages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 0;
        }

        .page-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          text-decoration: none;
          color: #333;
          display: flex;
          flex-direction: column;
        }

        .page-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .page-card h2 {
          color: #667eea;
          font-size: 1.75rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-card .icon {
          font-size: 2rem;
        }

        .page-card p {
          color: #666;
          line-height: 1.6;
          flex-grow: 1;
        }

        .page-card .learn-more {
          color: #667eea;
          font-weight: 600;
          margin-top: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stats-section {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 3rem auto;
          max-width: 1200px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .stat {
          text-align: center;
          color: white;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          display: block;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 1rem;
          opacity: 0.9;
        }

        .demo-link {
          display: inline-block;
          background: white;
          color: #667eea;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          margin-top: 2rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .demo-link:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }

          .hero .subtitle {
            font-size: 1.25rem;
          }

          .pages-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="hero">
        <h1>LLM Gateway</h1>
        <p className="subtitle">
          Production-Ready AI Infrastructure on AWS EKS
        </p>
        <p className="description">
          A secure, cost-optimized, and enterprise-grade LLM gateway deployed
          on AWS EKS with comprehensive security controls, zero-trust
          networking, and multi-provider AI model support.
        </p>

        <div className="tech-stack">
          <span className="tech-badge">AWS EKS</span>
          <span className="tech-badge">Kubernetes</span>
          <span className="tech-badge">Terraform</span>
          <span className="tech-badge">LiteLLM</span>
          <span className="tech-badge">OpenWebUI</span>
          <span className="tech-badge">AWS Bedrock</span>
          <span className="tech-badge">Perplexity</span>
        </div>

        <a
          href="https://openwebui.bhenning.com"
          target="_blank"
          rel="noopener noreferrer"
          className="demo-link"
        >
          View Live Demo →
        </a>

        <div className="stats-section">
          <h2 style={{ color: "white", marginBottom: "1rem" }}>
            Project Highlights
          </h2>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-value">50-90%</span>
              <span className="stat-label">Cost Savings with SPOT</span>
            </div>
            <div className="stat">
              <span className="stat-value">7 Models</span>
              <span className="stat-label">AWS Bedrock + Perplexity</span>
            </div>
            <div className="stat">
              <span className="stat-value">Zero-Trust</span>
              <span className="stat-label">Network Security</span>
            </div>
            <div className="stat">
              <span className="stat-value">100%</span>
              <span className="stat-label">Infrastructure as Code</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pages-grid">
        <Link href="/llm-gateway/architecture" className="page-card">
          <h2>
            <span className="icon">🏗️</span>
            Architecture
          </h2>
          <p>
            Explore the system architecture, AWS EKS cluster design, VPC
            networking, and how components interact in a production Kubernetes
            environment.
          </p>
          <span className="learn-more">
            Learn more <span>→</span>
          </span>
        </Link>

        <Link href="/llm-gateway/security" className="page-card">
          <h2>
            <span className="icon">🔒</span>
            Security Features
          </h2>
          <p>
            Dive into zero-trust networking, Kubernetes NetworkPolicies, IRSA
            authentication, non-root containers, and defense-in-depth security
            controls.
          </p>
          <span className="learn-more">
            Learn more <span>→</span>
          </span>
        </Link>

        <Link href="/llm-gateway/cost" className="page-card">
          <h2>
            <span className="icon">💰</span>
            Cost Optimization
          </h2>
          <p>
            Discover how SPOT instances, single NAT gateway, and smart resource
            allocation reduce monthly AWS costs by 50-90% without compromising
            reliability.
          </p>
          <span className="learn-more">
            Learn more <span>→</span>
          </span>
        </Link>

        <Link href="/llm-gateway/deployment" className="page-card">
          <h2>
            <span className="icon">🚀</span>
            Deployment Workflow
          </h2>
          <p>
            Walk through the complete deployment process using Terraform, from
            infrastructure provisioning to application deployment and DNS
            configuration.
          </p>
          <span className="learn-more">
            Learn more <span>→</span>
          </span>
        </Link>

        <Link href="/llm-gateway/features" className="page-card">
          <h2>
            <span className="icon">✨</span>
            Features & Demo
          </h2>
          <p>
            Experience Arena Mode for blind model comparison, multi-provider AI
            access, and see the system in action with real-world use cases.
          </p>
          <span className="learn-more">
            Learn more <span>→</span>
          </span>
        </Link>

        <Link href="/llm-gateway/requirements" className="page-card">
          <h2>
            <span className="icon">🎯</span>
            Project Requirements
          </h2>
          <p>
            Review the original project objectives and stretch goals. See how
            each requirement was met and exceeded in this production deployment.
          </p>
          <span className="learn-more">
            View Requirements <span>→</span>
          </span>
        </Link>

        <a
          href="https://github.com/henninb/llm-gateway"
          target="_blank"
          rel="noopener noreferrer"
          className="page-card"
        >
          <h2>
            <span className="icon">📚</span>
            Documentation
          </h2>
          <p>
            Access the complete source code, README, configuration examples,
            and deployment guides on GitHub. Everything is open source and
            production-ready.
          </p>
          <span className="learn-more">
            View on GitHub <span>→</span>
          </span>
        </a>
      </div>
    </div>
  );
}
