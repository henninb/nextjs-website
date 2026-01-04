"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LLMGatewayPage() {
  const router = useRouter();
  return (
    <div className="llm-gateway-container">
      <style jsx>{`
        .llm-gateway-container {
          padding: 0;
          max-width: 1400px;
          margin: 0 auto;
        }

        .hero {
          text-align: center;
          color: white;
          padding: 4rem 2rem 2rem;
        }

        .hero h1 {
          font-size: 5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          background: linear-gradient(135deg, #00d4ff 0%, #ffffff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero .subtitle {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          opacity: 0.95;
        }

        .hero .description {
          font-size: 1.5rem;
          max-width: 900px;
          margin: 0 auto 3rem;
          line-height: 1.8;
          opacity: 0.9;
        }

        .tech-section {
          text-align: center;
          margin: 3rem auto;
          padding: 0 2rem;
        }

        .tech-section h2 {
          font-size: 1.5rem;
          color: #00d4ff;
          margin-bottom: 1.5rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .tech-stack {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .tech-badge {
          display: inline-block;
          background: rgba(0, 212, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-size: 1rem;
          font-weight: 600;
          border: 2px solid rgba(0, 212, 255, 0.3);
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .tech-badge:hover {
          background: rgba(0, 212, 255, 0.25);
          border-color: rgba(0, 212, 255, 0.5);
          transform: translateY(-2px);
        }

        .what-is-section {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 4rem 3rem;
          margin: 4rem 2rem;
          border: 1px solid rgba(0, 212, 255, 0.2);
          display: flex;
          gap: 3rem;
          align-items: center;
        }

        .visual-container {
          flex: 0 0 250px;
          text-align: center;
        }

        .ai-icon {
          font-size: 12rem;
          line-height: 1;
          filter: drop-shadow(0 0 30px rgba(0, 212, 255, 0.5));
        }

        .what-content {
          flex: 1;
          color: white;
        }

        .what-content h2 {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          color: #00d4ff;
        }

        .what-content p {
          font-size: 1.35rem;
          line-height: 1.8;
          opacity: 0.95;
          margin-bottom: 1rem;
        }

        .what-content ul {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0;
        }

        .what-content li {
          font-size: 1.25rem;
          padding: 0.75rem 0;
          padding-left: 2rem;
          position: relative;
          opacity: 0.95;
        }

        .what-content li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #00d4ff;
          font-weight: bold;
          font-size: 1.5rem;
        }

        .cta-section {
          text-align: center;
          padding: 4rem 2rem;
        }

        .cta-buttons {
          display: flex;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 2.5rem;
          border-radius: 12px;
          font-size: 1.25rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.3s ease;
          border: 3px solid;
        }

        .cta-primary {
          background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
          color: white;
          border-color: #00d4ff;
          box-shadow: 0 8px 32px rgba(0, 212, 255, 0.4);
        }

        .cta-primary:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 48px rgba(0, 212, 255, 0.6);
        }

        .cta-secondary {
          background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
          color: white;
          border-color: #9b59b6;
          box-shadow: 0 8px 32px rgba(155, 89, 182, 0.4);
        }

        .cta-secondary:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 48px rgba(155, 89, 182, 0.6);
        }

        @media (max-width: 968px) {
          .what-is-section {
            flex-direction: column;
            text-align: center;
          }

          .visual-container {
            flex: 0 0 auto;
          }

          .ai-icon {
            font-size: 8rem;
          }
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

        .nav-button-link {
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

        .nav-button-link::before {
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

        .nav-button-link:hover {
          background: rgba(51, 65, 85, 0.8);
          border-color: rgba(56, 189, 248, 0.3);
          color: rgb(224, 242, 254);
          transform: translateY(-1px);
        }

        .nav-button-link:hover::before {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .hero h1 {
            font-size: 3rem;
          }

          .hero .subtitle {
            font-size: 1.5rem;
          }

          .hero .description {
            font-size: 1.25rem;
          }

          .what-is-section {
            padding: 2rem 1.5rem;
            margin: 2rem 1rem;
          }

          .what-content h2 {
            font-size: 2rem;
          }

          .what-content p,
          .what-content li {
            font-size: 1.1rem;
          }

          .cta-buttons {
            flex-direction: column;
            gap: 1rem;
          }

          .cta-button {
            width: 100%;
            max-width: 400px;
          }

          .bottom-nav {
            gap: 1rem;
            padding-bottom: 12rem;
          }

          .nav-button-link {
            min-width: 140px;
            font-size: 0.875rem;
            padding: 0.625rem 1.125rem;
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
      </div>

      <div className="tech-section">
        <h2>Technology Stack</h2>
        <div className="tech-stack">
          <a href="https://docs.aws.amazon.com/eks/" target="_blank" rel="noopener noreferrer" className="tech-badge">AWS EKS (Kubernetes)</a>
          <a href="https://en.wikipedia.org/wiki/Docker_(software)" target="_blank" rel="noopener noreferrer" className="tech-badge">AWS ECR (Docker)</a>
          <a href="https://en.wikipedia.org/wiki/Terraform_(software)" target="_blank" rel="noopener noreferrer" className="tech-badge">Terraform</a>
          <a href="https://en.wikipedia.org/wiki/Cloudflare" target="_blank" rel="noopener noreferrer" className="tech-badge">Cloudflare</a>
          <a href="https://github.com/BerriAI/litellm" target="_blank" rel="noopener noreferrer" className="tech-badge">LiteLLM</a>
          <a href="https://github.com/open-webui/open-webui" target="_blank" rel="noopener noreferrer" className="tech-badge">OpenWebUI</a>
          <a href="https://docs.aws.amazon.com/bedrock/" target="_blank" rel="noopener noreferrer" className="tech-badge">AWS Bedrock</a>
          <a href="https://en.wikipedia.org/wiki/Perplexity.ai" target="_blank" rel="noopener noreferrer" className="tech-badge">Perplexity</a>
        </div>
      </div>

      <div className="what-is-section">
        <div className="visual-container">
          <div className="ai-icon">☁️</div>
        </div>
        <div className="what-content">
          <h2>What is this?</h2>
          <p>
            A production-grade LLM Gateway infrastructure demonstrating modern
            cloud architecture, security best practices, and cost optimization
            on AWS.
          </p>
          <ul>
            <li>7 AI models from AWS Bedrock and Perplexity</li>
            <li>Custom content guardrails with streaming support</li>
            <li>Zero-trust network security with geo-restrictions</li>
            <li>50-90% cost savings with SPOT instances</li>
            <li>100% Infrastructure as Code with Terraform</li>
            <li>Multi-AZ deployment with auto-scaling</li>
          </ul>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-buttons">
          <a
            href="https://openwebui.bhenning.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button cta-primary"
          >
            <span>🚀</span>
            <span>Live Demo</span>
          </a>
          <a
            href="https://github.com/henninb/llm-gateway"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button cta-secondary"
          >
            <span>📚</span>
            <span>GitHub Repo</span>
          </a>
        </div>

        <div className="bottom-nav">
          <button
            className="nav-button-link"
            onClick={() => router.push("/llm-gateway/summary")}
          >
            ← Previous: Summary
          </button>
          <button
            className="nav-button-link"
            onClick={() => router.push("/llm-gateway/requirements")}
          >
            Next: Requirements →
          </button>
        </div>
      </div>
    </div>
  );
}
