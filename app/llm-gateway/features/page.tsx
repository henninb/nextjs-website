"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FeaturesPage() {
  const router = useRouter();
  return (
    <div className="features-container">
      <style jsx>{`
        .features-container {
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

        .demo-link-box {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem auto;
          max-width: 600px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .demo-link-box h2 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .demo-button {
          display: inline-block;
          background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
          color: white;
          padding: 1rem 2.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.125rem;
          text-decoration: none;
          margin-top: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
        }

        .demo-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 212, 255, 0.5);
          background: linear-gradient(135deg, #00e5ff 0%, #00aaff 100%);
        }

        .content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin: 2rem 0;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
        }

        .feature-card h2 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .feature-card .icon {
          font-size: 2.5rem;
        }

        .feature-card p {
          line-height: 1.6;
          opacity: 0.95;
          margin-bottom: 1rem;
        }

        .feature-card ul {
          list-style: none;
          padding: 0;
        }

        .feature-card li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          opacity: 0.95;
        }

        .feature-card li:before {
          content: "→";
          position: absolute;
          left: 0;
          color: #00d4ff;
          font-weight: bold;
        }

        .models-section {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 3rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .models-section h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .models-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .model-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .model-card h3 {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
          color: #00d4ff;
        }

        .model-card .provider {
          font-size: 0.875rem;
          opacity: 0.8;
          margin-bottom: 0.75rem;
        }

        .model-card ul {
          list-style: none;
          padding: 0;
          font-size: 0.95rem;
        }

        .model-card li {
          padding: 0.25rem 0;
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

          .features-grid {
            grid-template-columns: 1fr;
          }

          .models-grid {
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
        <h1>✨ Technical Highlights</h1>
        <p>
          Production-grade security, cost optimization, and multi-provider AI infrastructure demonstrating enterprise engineering practices.
        </p>
      </div>

      <div className="content">
        <div className="features-grid">
          <div className="feature-card">
            <h2>
              <span className="icon">🔒</span>
              Security Architecture
            </h2>
            <p>
              Enterprise zero-trust networking with defense-in-depth security controls. No static credentials anywhere in the infrastructure.
            </p>
            <ul>
              <li>Zero-Trust Network Policies (pod-to-pod isolation)</li>
              <li>IRSA (IAM Roles for Service Accounts) - no static AWS keys</li>
              <li>Non-root containers (UID 1000, read-only filesystem)</li>
              <li>CloudFlare IP allowlist on NLB (geo-restriction capable)</li>
              <li>AWS Metadata Service blocking (SSRF prevention)</li>
              <li>HTTPS/TLS with ACM certificate management</li>
              <li>Secrets Manager integration for API keys</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">🛡️</span>
              Custom Guardrails
            </h2>
            <p>
              Production content filtering with streaming support. Discovered and documented LiteLLM streaming bug, implemented workaround.
            </p>
            <ul>
              <li>Pre-call filtering (input validation before LLM)</li>
              <li>Post-call filtering (output validation after LLM)</li>
              <li>Discovered LiteLLM v1.80.11 streaming bypass bug</li>
              <li>Implemented stream=false forcing workaround</li>
              <li>Conversation history sanitization</li>
              <li>Indirect bypass prevention (context poisoning)</li>
              <li>12 comprehensive tests validating all attack vectors</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">💰</span>
              Cost Optimization
            </h2>
            <p>
              Engineered for 50-90% cost savings through strategic infrastructure decisions. ~$144-179/month total AWS spend.
            </p>
            <ul>
              <li>SPOT instances: 50-90% savings on compute (t3.medium pool)</li>
              <li>Single NAT Gateway: ~$32/month savings vs multi-AZ</li>
              <li>ECR instead of Docker Hub (avoids rate limits)</li>
              <li>Resource quotas prevent waste</li>
              <li>Built-in rate limiting & budget controls</li>
              <li>Cost tracking per model with CloudWatch alerts</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">🔄</span>
              Multi-Provider Integration
            </h2>
            <p>
              Unified OpenAI-compatible API for 7 models across 3 providers. Single endpoint, automatic routing, comprehensive testing.
            </p>
            <ul>
              <li>AWS Bedrock Nova: nova-micro, nova-lite, nova-pro</li>
              <li>AWS Bedrock Llama: llama3-2-1b, llama3-2-3b</li>
              <li>Perplexity: perplexity-sonar, perplexity-sonar-pro</li>
              <li>OpenAI-compatible REST API</li>
              <li>Automated testing suite (all 7 models validated)</li>
              <li>LiteLLM proxy with cost tracking</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">🎭</span>
              Arena Mode
            </h2>
            <p>
              Blind model comparison for unbiased evaluation. 3 models (one per provider) compete anonymously.
            </p>
            <ul>
              <li>Models: perplexity-sonar-pro, nova-pro, llama3-2-3b</li>
              <li>Anonymous side-by-side responses (Model A vs B)</li>
              <li>Vote for best response, models revealed after</li>
              <li>ELO ratings track performance over time</li>
              <li>Production use: model selection for specific tasks</li>
            </ul>
          </div>
        </div>

        <div className="models-section">
          <h2>🤖 7 AI Models Across 3 Providers</h2>

          <div className="models-grid">
            <div className="model-card">
              <h3>AWS Bedrock - Nova (Amazon)</h3>
              <ul>
                <li>• nova-micro (128K context, very low cost)</li>
                <li>• nova-lite (128K context, low cost)</li>
                <li>• nova-pro (128K context, complex reasoning)</li>
              </ul>
            </div>

            <div className="model-card">
              <h3>AWS Bedrock - Llama (Meta)</h3>
              <ul>
                <li>• llama3-2-1b (1B params, very fast)</li>
                <li>• llama3-2-3b (3B params, balanced)</li>
              </ul>
            </div>

            <div className="model-card">
              <h3>Perplexity API</h3>
              <ul>
                <li>• perplexity-sonar (web search, citations)</li>
                <li>• perplexity-sonar-pro (deep research)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bottom-nav">
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/deployment")}
          >
            ← Previous: Deployment
          </button>
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/security")}
          >
            Next: Security →
          </button>
        </div>
      </div>
    </div>
  );
}
