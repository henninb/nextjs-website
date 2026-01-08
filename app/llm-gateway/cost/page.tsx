"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CostPage() {
  const router = useRouter();
  return (
    <div className="cost-container">
      <style jsx>{`
        .cost-container {
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

        .cost-breakdown {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .cost-breakdown h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .cost-table {
          width: 100%;
          margin: 1rem 0;
          border-collapse: separate;
          border-spacing: 0;
          overflow: hidden;
          border-radius: 8px;
        }

        .cost-table th,
        .cost-table td {
          padding: 1rem;
          text-align: left;
        }

        .cost-table th {
          background: rgba(255, 255, 255, 0.2);
          font-weight: 600;
        }

        .cost-table tr {
          background: rgba(255, 255, 255, 0.05);
        }

        .cost-table tr:nth-child(even) {
          background: rgba(255, 255, 255, 0.1);
        }

        .savings-highlight {
          color: #00d4ff;
          font-weight: 700;
        }

        .total-row {
          font-weight: 700;
          font-size: 1.125rem;
          background: rgba(255, 255, 255, 0.15) !important;
        }

        .optimization-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin: 2rem 0;
        }

        .optimization-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .optimization-card h2 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .optimization-card .icon {
          font-size: 2.5rem;
        }

        .optimization-card .savings {
          background: rgba(0, 229, 204, 0.2);
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          border-left: 4px solid #00e5cc;
        }

        .optimization-card .savings .amount {
          font-size: 2rem;
          font-weight: 700;
          color: #00d4ff;
          display: block;
        }

        .optimization-card ul {
          list-style: none;
          padding: 0;
        }

        .optimization-card li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .optimization-card li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #00d4ff;
          font-weight: bold;
        }

        .comparison-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .comparison-box {
          background: rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          border-radius: 8px;
        }

        .comparison-box h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #00d4ff;
        }

        .comparison-box .price {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 1rem 0;
        }

        .comparison-box ul {
          list-style: none;
          padding: 0;
          opacity: 0.9;
        }

        .comparison-box li {
          padding: 0.25rem 0;
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

          .optimization-grid {
            grid-template-columns: 1fr;
          }

          .comparison-grid {
            grid-template-columns: 1fr;
          }

          .cost-table {
            font-size: 0.875rem;
          }

          .cost-table th,
          .cost-table td {
            padding: 0.75rem 0.5rem;
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
        <h1>💰 Cost Optimization</h1>
        <p>
          Strategic cost reduction through SPOT instances, efficient networking,
          and smart resource allocation — total monthly cost ~$152-170 with
          50-90% savings on compute.
        </p>
      </div>

      <div className="content">
        <div className="cost-breakdown">
          <h2>Monthly Cost Breakdown (us-east-1)</h2>

          <table className="cost-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Configuration</th>
                <th>Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>EKS Control Plane</td>
                <td>Managed Kubernetes (1 cluster)</td>
                <td>$73.00</td>
              </tr>
              <tr>
                <td>EC2 SPOT Instances</td>
                <td>
                  1x node (t3.medium, t3a.medium, t2.medium pool - avg ~70%
                  discount)
                </td>
                <td className="savings-highlight">$8-15</td>
              </tr>
              <tr>
                <td>NAT Gateway</td>
                <td>Single NAT (1 AZ instead of 2)</td>
                <td className="savings-highlight">$32.00</td>
              </tr>
              <tr>
                <td>Application Load Balancer</td>
                <td>ALB with TLS termination</td>
                <td>$16-22</td>
              </tr>
              <tr>
                <td>EBS Volumes</td>
                <td>Persistent storage for OpenWebUI data</td>
                <td>$8.00</td>
              </tr>
              <tr>
                <td>VPC Endpoints</td>
                <td>
                  Private AWS access (2 endpoints: Bedrock Runtime $7.20 +
                  Secrets Manager $7.20)
                </td>
                <td>$14.40</td>
              </tr>
              <tr>
                <td>ECR Storage</td>
                <td>Container image storage (~4 GB for 2 images)</td>
                <td>$0.40</td>
              </tr>
              <tr>
                <td>Data Transfer</td>
                <td>Variable</td>
                <td>Variable</td>
              </tr>
              <tr className="total-row">
                <td colSpan={2}>
                  <strong>Total Monthly Cost</strong>
                </td>
                <td>
                  <strong>~$152-170</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="optimization-grid">
          <div className="optimization-card">
            <h2>
              <span className="icon">⚡</span>
              SPOT Instances
            </h2>

            <div className="savings">
              <span className="amount">50-90%</span>
              <span>Cost Savings on Compute</span>
            </div>

            <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem" }}>
              Strategy
            </h3>
            <ul>
              <li>Use EC2 SPOT instances instead of on-demand</li>
              <li>
                Multiple instance types (t3.medium, t3a.medium, t2.medium)
              </li>
              <li>SPOT diversity reduces interruption risk</li>
              <li>EKS handles automatic replacement</li>
              <li>Stateless workloads = SPOT friendly</li>
              <li>Persistent data on EBS volumes</li>
            </ul>

            <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem" }}>
              Trade-offs
            </h3>
            <ul>
              <li>SPOT can be interrupted (rare)</li>
              <li>2-minute warning before termination</li>
              <li>Auto-scaling replaces instances</li>
              <li>No SLA for SPOT availability</li>
            </ul>
          </div>

          <div className="optimization-card">
            <h2>
              <span className="icon">🌐</span>
              Single NAT Gateway
            </h2>

            <div className="savings">
              <span className="amount">~$32/mo</span>
              <span>Saved vs Multi-AZ NAT</span>
            </div>

            <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem" }}>
              Strategy
            </h3>
            <ul>
              <li>Deploy 1 NAT gateway (not 2)</li>
              <li>All private subnets route through it</li>
              <li>Sufficient for low-medium traffic</li>
              <li>Trade availability for cost</li>
            </ul>

            <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem" }}>
              Trade-offs
            </h3>
            <ul>
              <li>Single point of failure</li>
              <li>If NAT fails, private subnets lose internet</li>
              <li>AWS automatically replaces failed NATs</li>
              <li>Acceptable for dev/demo environments</li>
            </ul>
          </div>

          <div className="optimization-card">
            <h2>
              <span className="icon">📦</span>
              Resource Efficiency
            </h2>

            <div className="savings">
              <span className="amount">Right-Sized</span>
              <span>No Over-Provisioning</span>
            </div>

            <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem" }}>
              Strategy
            </h3>
            <ul>
              <li>t3/t3a/t2.medium instances sufficient for LLM proxy</li>
              <li>Default 1 node (scales to 2+ for HA)</li>
              <li>Resource limits on pods</li>
              <li>Resource quotas prevent resource waste</li>
              <li>ECR instead of Docker Hub (no rate limits)</li>
            </ul>

            <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem" }}>
              Benefits
            </h3>
            <ul>
              <li>Pay only for what you use</li>
              <li>Scale up during peak usage</li>
              <li>Scale down to save costs</li>
              <li>No idle resource waste</li>
            </ul>
          </div>

          <div className="optimization-card">
            <h2>
              <span className="icon">🔄</span>
              Rate Limiting
            </h2>

            <div className="savings">
              <span className="amount">Budget Control</span>
              <span>Prevent Cost Overruns</span>
            </div>

            <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem" }}>
              Strategy
            </h3>
            <ul>
              <li>Per-user request throttling</li>
              <li>Maximum token limits enforced</li>
              <li>Built-in cost tracking per model</li>
            </ul>

            <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem" }}>
              Protection
            </h3>
            <ul>
              <li>Prevents abuse and runaway costs</li>
              <li>Blocks DoS-style API spamming</li>
              <li>Rate limiting prevents cost overruns</li>
            </ul>
          </div>
        </div>

        <div className="bottom-nav">
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/security")}
          >
            <span className="arrow-left">←</span> Previous: Security
          </button>
          <button
            className="nav-button"
            onClick={() => router.push("/llm-gateway/summary")}
          >
            Next: Summary <span className="arrow-right">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
