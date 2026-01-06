"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FeaturesPage() {
  const router = useRouter();
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text.trim());
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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

        .demo-questions-section {
          background: rgba(155, 89, 182, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem auto;
          max-width: 900px;
          border: 1px solid rgba(155, 89, 182, 0.3);
        }

        .demo-questions-section h2 {
          font-size: 1.75rem;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #9b59b6;
        }

        .demo-questions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .question-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 1.25rem;
          border-radius: 10px;
          border: 1px solid rgba(155, 89, 182, 0.2);
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
        }

        .question-card:hover {
          background: rgba(155, 89, 182, 0.2);
          border-color: rgba(155, 89, 182, 0.5);
          transform: translateY(-3px);
        }

        .question-card .question-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .question-card .question-text {
          font-size: 1.1rem;
          line-height: 1.5;
          opacity: 0.95;
          font-style: italic;
          padding-right: 2.5rem;
        }

        .copy-button {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(155, 89, 182, 0.2);
          color: rgba(155, 89, 182, 0.9);
          border: 1px solid rgba(155, 89, 182, 0.4);
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }

        .copy-button:hover {
          background: rgba(155, 89, 182, 0.3);
          color: rgba(155, 89, 182, 1);
          border-color: rgba(155, 89, 182, 0.6);
          box-shadow: 0 0 10px rgba(155, 89, 182, 0.4);
        }

        .copy-button.copied {
          background: rgba(34, 197, 94, 0.2);
          color: rgba(134, 239, 172, 1);
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
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
          content: "✓";
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
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%);
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
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(250, 112, 154, 0.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .nav-button:hover {
          background: linear-gradient(135deg, rgba(51, 65, 85, 0.95) 0%, rgba(71, 85, 105, 0.95) 100%);
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

          .features-grid {
            grid-template-columns: 1fr;
          }

          .models-grid {
            grid-template-columns: 1fr;
          }

          .demo-questions-grid {
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

      <div className="demo-questions-section">
        <h2>💬 Demo Questions</h2>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', opacity: 0.9 }}>
          Try these sample questions during the live demo at <a href="https://openwebui.bhenning.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', textDecoration: 'underline' }}>openwebui.bhenning.com</a>
        </p>
        <div className="demo-questions-grid">
          <div className="question-card">
            <button
              className={`copy-button ${copiedIndex === 1 ? "copied" : ""}`}
              onClick={() => copyToClipboard("Tell me about duckies and bunnies", 1)}
              title={copiedIndex === 1 ? "Copied!" : "Copy to clipboard"}
            >
              {copiedIndex === 1 ? "✓" : "⧉"}
            </button>
            <div className="question-icon">🦆</div>
            <div className="question-text">"Tell me about duckies and bunnies"</div>
          </div>
          <div className="question-card">
            <button
              className={`copy-button ${copiedIndex === 2 ? "copied" : ""}`}
              onClick={() => copyToClipboard("What are some famous lines from 'Macbeth'", 2)}
              title={copiedIndex === 2 ? "Copied!" : "Copy to clipboard"}
            >
              {copiedIndex === 2 ? "✓" : "⧉"}
            </button>
            <div className="question-icon">📖</div>
            <div className="question-text">"What are some famous lines from 'Macbeth'"</div>
          </div>
          <div className="question-card">
            <button
              className={`copy-button ${copiedIndex === 3 ? "copied" : ""}`}
              onClick={() => copyToClipboard("What is a bird that quacks?", 3)}
              title={copiedIndex === 3 ? "Copied!" : "Copy to clipboard"}
            >
              {copiedIndex === 3 ? "✓" : "⧉"}
            </button>
            <div className="question-icon">🐦</div>
            <div className="question-text">"What is a bird that quacks?"</div>
          </div>
          <div className="question-card">
            <button
              className={`copy-button ${copiedIndex === 4 ? "copied" : ""}`}
              onClick={() => copyToClipboard("What is the capital of Japan", 4)}
              title={copiedIndex === 4 ? "Copied!" : "Copy to clipboard"}
            >
              {copiedIndex === 4 ? "✓" : "⧉"}
            </button>
            <div className="question-icon">🗾</div>
            <div className="question-text">"What is the capital of Japan"</div>
          </div>
        </div>
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
              Production content filtering with complete response validation. LiteLLM v1.80.11 streaming bug workaround where post-call hooks aren't invoked for streaming responses, implemented stream=false forcing.
            </p>
            <ul>
              <li>Pre-call filtering (input validation before LLM)</li>
              <li>Post-call filtering (complete output validation after LLM)</li>
              <li>LiteLLM v1.80.11 streaming bug workaround (post_call hooks bypass)</li>
              <li>Implemented stream=false forcing to ensure hook execution</li>
              <li>Conversation history sanitization (context poisoning prevention)</li>
              <li>OpenWebUI/client streaming preferences overridden for security</li>
              <li>12 comprehensive tests validating all attack vectors</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">💰</span>
              Cost Optimization
            </h2>
            <p>
              Engineered for 50-90% cost savings through strategic infrastructure decisions. ~$137-144/month total AWS spend.
            </p>
            <ul>
              <li>SPOT instances: 50-90% savings on compute (t3.medium pool)</li>
              <li>Single NAT Gateway: ~$32/month savings vs multi-AZ</li>
              <li>ECR instead of Docker Hub (avoids rate limits)</li>
              <li>Resource quotas prevent waste</li>
              <li>Built-in rate limiting & budget controls</li>
              <li>Built-in cost tracking per model</li>
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
              Blind random model selection for unbiased evaluation. ONE model randomly chosen per request (not simultaneous comparison). Currently disabled.
            </p>
            <ul>
              <li>Status: Currently disabled</li>
              <li>Configured models: nova-lite, nova-pro, llama3-2-3b</li>
              <li>Randomly selects ONE model per request (blind testing)</li>
              <li>Model identity hidden during conversation</li>
              <li>OpenWebUI forces stream=true for arena models (overrides LiteLLM config)</li>
              <li>Environment-based configuration (ENABLE_PERSISTENT_CONFIG=false)</li>
            </ul>
          </div>
        </div>

        <div className="bottom-nav">
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/deployment")}
          >
            <span className="arrow-left">←</span> Previous: Deployment
          </button>
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/security")}
          >
            Next: Security <span className="arrow-right">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
