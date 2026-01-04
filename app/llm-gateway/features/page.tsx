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

        .arena-section {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 3rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .arena-section h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .arena-flow {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .flow-step {
          background: rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .flow-step .step-num {
          background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          margin: 0 auto 1rem;
        }

        .flow-step h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }

        .flow-step p {
          font-size: 0.95rem;
          opacity: 0.9;
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

        .use-cases {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 3rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .use-cases h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .use-case {
          background: rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          margin: 1rem 0;
          border-radius: 8px;
          border-left: 4px solid #00d4ff;
        }

        .use-case h3 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: #00d4ff;
        }

        .use-case p {
          opacity: 0.95;
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

          .features-grid {
            grid-template-columns: 1fr;
          }

          .arena-flow {
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
        <h1>✨ Project Features</h1>
        <p>
          Experience the power of multi-provider AI with Arena Mode, advanced
          features, and real-world applications.
        </p>
      </div>

      <div className="content">
        <div className="features-grid">
          <div className="feature-card">
            <h2>
              <span className="icon">🎭</span>
              Arena Mode
            </h2>
            <p>
              Blind model comparison allows you to evaluate AI models without
              bias. Two random models compete, and you choose the winner.
            </p>
            <ul>
              <li>Anonymous model responses</li>
              <li>Side-by-side comparison</li>
              <li>Vote for the best response</li>
              <li>Models revealed after voting</li>
              <li>Tracks win rates and performance</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">🔄</span>
              Multi-Provider API
            </h2>
            <p>
              Unified OpenAI-compatible API for seamless access to AWS Bedrock
              and Perplexity models.
            </p>
            <ul>
              <li>Single endpoint for all providers</li>
              <li>Automatic request routing</li>
              <li>Fallback handling</li>
              <li>Cost tracking per model</li>
              <li>Usage analytics</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">💬</span>
              Chat Interface
            </h2>
            <p>
              Modern, responsive web UI with full conversation management and
              history.
            </p>
            <ul>
              <li>Real-time streaming responses</li>
              <li>Conversation history persistence</li>
              <li>Multi-turn conversations</li>
              <li>Markdown rendering</li>
              <li>Code syntax highlighting</li>
              <li>Export conversations</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">📊</span>
              Rate Limiting & Budgets
            </h2>
            <p>
              Built-in cost controls and usage limits prevent unexpected
              charges.
            </p>
            <ul>
              <li>Per-user request throttling</li>
              <li>Token limit enforcement</li>
              <li>Budget alerts via CloudWatch</li>
              <li>Real-time cost tracking</li>
              <li>Monthly spending caps</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">🔐</span>
              User Authentication
            </h2>
            <p>
              Secure user management with session handling and role-based
              access.
            </p>
            <ul>
              <li>User registration and login</li>
              <li>Session management</li>
              <li>Per-user conversation isolation</li>
              <li>API key generation</li>
              <li>Admin controls</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">📈</span>
              Analytics & Monitoring
            </h2>
            <p>
              Track usage, performance, and costs across all AI models and
              users.
            </p>
            <ul>
              <li>Request/response logging</li>
              <li>Latency metrics</li>
              <li>Error rate tracking</li>
              <li>Cost per model</li>
              <li>User activity reports</li>
            </ul>
          </div>

          <div className="feature-card">
            <h2>
              <span className="icon">🛡️</span>
              Custom Guardrails
            </h2>
            <p>
              Enterprise-grade content filtering system with streaming support
              to control both user inputs and AI outputs.
            </p>
            <ul>
              <li>Pre-call filtering (input validation)</li>
              <li>Post-call filtering (output validation)</li>
              <li>Discovered & fixed streaming bypass bug</li>
              <li>Streaming mode support (creative workaround)</li>
              <li>Conversation history sanitization</li>
              <li>Indirect bypass prevention</li>
              <li>12 comprehensive tests (6 per model)</li>
            </ul>
          </div>
        </div>

        <div className="arena-section">
          <h2>🎭 How Arena Mode Works</h2>
          <p style={{ textAlign: "center", opacity: "0.95" }}>
            Unbiased model comparison through blind testing
          </p>

          <div className="arena-flow">
            <div className="flow-step">
              <div className="step-num">1</div>
              <h3>Enter Prompt</h3>
              <p>Type your question or request in the Arena interface</p>
            </div>

            <div className="flow-step">
              <div className="step-num">2</div>
              <h3>Two Models Respond</h3>
              <p>
                Random models generate responses (identities hidden as Model A
                & B)
              </p>
            </div>

            <div className="flow-step">
              <div className="step-num">3</div>
              <h3>Vote for Winner</h3>
              <p>Compare responses and choose which one is better</p>
            </div>

            <div className="flow-step">
              <div className="step-num">4</div>
              <h3>Models Revealed</h3>
              <p>After voting, see which models were compared</p>
            </div>

            <div className="flow-step">
              <div className="step-num">5</div>
              <h3>Track Results</h3>
              <p>Arena maintains ELO ratings and win statistics</p>
            </div>
          </div>
        </div>

        <div className="models-section">
          <h2>🤖 Available AI Models</h2>

          <div className="models-grid">
            <div className="model-card">
              <h3>Nova Micro</h3>
              <div className="provider">AWS Bedrock (Amazon)</div>
              <ul>
                <li>• Best for: Quick tasks</li>
                <li>• Cost: Very low</li>
                <li>• Speed: Very fast</li>
                <li>• Context: 128K tokens</li>
              </ul>
            </div>

            <div className="model-card">
              <h3>Nova Lite</h3>
              <div className="provider">AWS Bedrock (Amazon)</div>
              <ul>
                <li>• Best for: Efficient responses</li>
                <li>• Cost: Low</li>
                <li>• Speed: Fast</li>
                <li>• Context: 128K tokens</li>
              </ul>
            </div>

            <div className="model-card">
              <h3>Nova Pro</h3>
              <div className="provider">AWS Bedrock (Amazon)</div>
              <ul>
                <li>• Best for: Complex reasoning</li>
                <li>• Cost: Medium</li>
                <li>• Speed: Fast</li>
                <li>• Context: 128K tokens</li>
              </ul>
            </div>

            <div className="model-card">
              <h3>Llama 3.2 1B</h3>
              <div className="provider">AWS Bedrock (Meta)</div>
              <ul>
                <li>• Best for: Simple queries</li>
                <li>• Cost: Very low</li>
                <li>• Speed: Very fast</li>
                <li>• Params: 1 billion</li>
              </ul>
            </div>

            <div className="model-card">
              <h3>Llama 3.2 3B</h3>
              <div className="provider">AWS Bedrock (Meta)</div>
              <ul>
                <li>• Best for: Quick responses</li>
                <li>• Cost: Low</li>
                <li>• Speed: Fast</li>
                <li>• Params: 3 billion</li>
              </ul>
            </div>

            <div className="model-card">
              <h3>Perplexity Sonar</h3>
              <div className="provider">Perplexity API</div>
              <ul>
                <li>• Best for: Web search, facts</li>
                <li>• Cost: Medium</li>
                <li>• Speed: Fast</li>
                <li>• Features: Real-time citations</li>
              </ul>
            </div>

            <div className="model-card">
              <h3>Perplexity Sonar Pro</h3>
              <div className="provider">Perplexity API</div>
              <ul>
                <li>• Best for: Deep research</li>
                <li>• Cost: Higher</li>
                <li>• Speed: Fast</li>
                <li>• Features: Advanced analysis</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="use-cases">
          <h2>💡 Real-World Use Cases</h2>

          <div className="use-case">
            <h3>1. Content Generation</h3>
            <p>
              Use Arena Mode to test different models for blog posts, marketing
              copy, or creative writing. Compare output quality, creativity,
              and adherence to instructions. Nova Pro excels at structured
              content, while Perplexity Sonar provides fact-based writing with
              citations.
            </p>
          </div>

          <div className="use-case">
            <h3>2. Research & Analysis</h3>
            <p>
              Leverage Perplexity's web search capabilities for up-to-date
              information and multi-source research. Deep Research mode
              provides comprehensive analysis with citations. Perfect for
              market research, competitive analysis, or fact-checking.
            </p>
          </div>

          <div className="use-case">
            <h3>3. Code Generation & Review</h3>
            <p>
              Compare code quality across models. Test algorithm
              implementations, code refactoring suggestions, and debugging
              help. Use Arena Mode to find which model produces the most
              efficient, readable code for your specific use case.
            </p>
          </div>

          <div className="use-case">
            <h3>4. Customer Support Automation</h3>
            <p>
              Integrate the OpenAI-compatible API into support tools. Use rate
              limiting and cost controls to manage expenses. Track which models
              provide the best customer satisfaction. IRSA ensures secure
              access to internal knowledge bases.
            </p>
          </div>

          <div className="use-case">
            <h3>5. Education & Training</h3>
            <p>
              Create interactive learning experiences with AI tutors. Use
              different models for different subjects (Llama for quick Q&A,
              Perplexity for research-heavy topics). Conversation history helps
              track student progress.
            </p>
          </div>

          <div className="use-case">
            <h3>6. Model Evaluation for Production</h3>
            <p>
              Before committing to a specific AI provider, use Arena Mode to
              test with real-world prompts. Gather unbiased performance data
              from actual users. Make data-driven decisions about which models
              to deploy at scale.
            </p>
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
