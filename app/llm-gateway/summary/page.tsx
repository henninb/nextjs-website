"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SummaryPage() {
  const router = useRouter();
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
            font-size: 3rem;
          }

          .stats-grid,
          .highlight-grid {
            grid-template-columns: 1fr;
          }

          .stat-value {
            font-size: 3.5rem;
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
        <h1>📊 Project Summary</h1>
        <p>
          Production-ready LLM gateway on AWS EKS with zero-trust security, cost
          optimization, and multi-provider AI access
        </p>
      </div>

      <div className="content">
        <div className="achievement-banner">
          <h2>✅ Production-Ready Deployment</h2>
          <p>
            Unified OpenAI-compatible API across AWS Bedrock and Perplexity,
            secured with IRSA, NetworkPolicies, and HTTPS via ALB
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">7</span>
            <span className="stat-label">AI Models Deployed</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">3</span>
            <span className="stat-label">Providers Integrated</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">50-90%</span>
            <span className="stat-label">Cost Savings with SPOT</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">12/12</span>
            <span className="stat-label">Guardrail Tests Passing</span>
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
                AWS EKS deployment with auto-scaling, EBS persistence, and ALB
                HTTPS termination
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🔐</span>
                Enterprise Security
              </h3>
              <p>
                NetworkPolicies, IRSA, non-root containers, ALB TLS, metadata
                service blocking, and input validation
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🐛</span>
                Custom Guardrails
              </h3>
              <p>
                Pre-call and post-call filtering with history sanitization,
                passthrough responses (HTTP 200), and stream=false forcing to
                enable output filtering
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">💰</span>
                Cost Optimized
              </h3>
              <p>
                SPOT instances and single NAT gateway achieving significant cost
                savings (50-90% on compute)
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🤖</span>
                Multi-Provider AI
              </h3>
              <p>
                7 models across 3 providers: AWS Bedrock Nova (3 models), AWS
                Bedrock Llama (2 models), Perplexity (2 models) - all via
                unified OpenAI-compatible API
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🚀</span>
                Automated Operations
              </h3>
              <p>
                Make-based workflows for deployment, testing, cost reporting,
                and IAM architecture visibility
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🎭</span>
                Arena Mode
              </h3>
              <p>
                Blind random model selection for unbiased evaluation. Currently
                disabled, configured for nova-lite, nova-pro, and llama3-2-3b
              </p>
            </div>

            <div className="highlight-card">
              <h3>
                <span className="icon">🌐</span>
                DNS & HTTPS
              </h3>
              <p>
                CloudFlare proxy mode with origin certificates, providing DDoS
                protection, WAF, and edge caching with automated DNS
                verification
              </p>
            </div>
          </div>
        </div>

        <div className="bottom-nav">
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/cost")}
          >
            <span className="arrow-left">←</span> Previous: Cost
          </button>
        </div>
      </div>
    </div>
  );
}
