"use client";

import React from "react";
import Link from "next/link";

export default function RequirementsPage() {
  return (
    <div className="requirements-container">
      <style jsx>{`
        .requirements-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
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
          opacity: 0.95;
          max-width: 800px;
          margin: 0 auto;
        }

        .content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .overview-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .overview-section h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: #3498db;
        }

        .overview-section p {
          line-height: 1.8;
          opacity: 0.95;
          margin-bottom: 1rem;
        }

        .objectives-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .objectives-section h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .objective {
          background: rgba(255, 255, 255, 0.08);
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 12px;
          border-left: 5px solid #2ecc71;
        }

        .objective.exceeded {
          border-left-color: #f39c12;
        }

        .objective .number {
          font-size: 0.875rem;
          color: #3498db;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .objective h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .objective .status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-left: auto;
        }

        .status.complete {
          background: #2ecc71;
          color: white;
        }

        .status.exceeded {
          background: #f39c12;
          color: white;
        }

        .objective .requirement {
          background: rgba(0, 0, 0, 0.2);
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          border-left: 3px solid rgba(255, 255, 255, 0.3);
        }

        .objective .implementation {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(46, 204, 113, 0.15);
          border-radius: 8px;
        }

        .objective .implementation h4 {
          font-size: 1.125rem;
          margin-bottom: 0.75rem;
          color: #2ecc71;
        }

        .objective ul {
          list-style: none;
          padding: 0;
        }

        .objective li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .objective li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #2ecc71;
          font-weight: bold;
        }

        .stretch-goals {
          background: linear-gradient(
            135deg,
            rgba(241, 196, 15, 0.2) 0%,
            rgba(243, 156, 18, 0.2) 100%
          );
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          border: 2px solid #f39c12;
        }

        .stretch-goals h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #f39c12;
        }

        .stretch-goal {
          background: rgba(0, 0, 0, 0.2);
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 12px;
          border-left: 5px solid #f39c12;
        }

        .summary-section {
          background: rgba(46, 204, 113, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          margin: 3rem 0;
          border: 2px solid #2ecc71;
          text-align: center;
        }

        .summary-section h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #2ecc71;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .stat-box {
          background: rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          border-radius: 12px;
        }

        .stat-box .value {
          font-size: 3rem;
          font-weight: 700;
          color: #2ecc71;
          display: block;
          margin-bottom: 0.5rem;
        }

        .stat-box .label {
          font-size: 1rem;
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

          .objective h3 {
            flex-direction: column;
            align-items: flex-start;
          }

          .objective .status {
            margin-left: 0;
            margin-top: 0.5rem;
          }

          .summary-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="header">
        <h1>🎯 Project Requirements</h1>
        <p>
          Pre-sales Security Architect Interview - LiteLLM AWS Deployment
          Exercise
        </p>
      </div>

      <div className="content">
        <div className="overview-section">
          <h2>Project Overview</h2>
          <p>
            In this exercise, you will demonstrate your technical knowledge,
            problem-solving skills, and ability to communicate technical
            concepts to a technical audience. We look for our Pre-sales Security
            Architects to be familiar with the command line, creating basic
            scripts, and troubleshooting installation and deployment issues.
          </p>
        </div>

        <div className="objectives-section">
          <h2>Core Objectives</h2>

          <div className="objective exceeded">
            <div className="number">OBJECTIVE 1</div>
            <h3>
              Deploy LiteLLM in AWS
              <span className="status exceeded">✓ EXCEEDED</span>
            </h3>
            <div className="requirement">
              <strong>Requirement:</strong> Deploy LiteLLM in AWS
            </div>
            <div className="implementation">
              <h4>Implementation:</h4>
              <ul>
                <li>
                  Deployed on AWS EKS (Kubernetes 1.34) - exceeds basic EC2
                  deployment
                </li>
                <li>Production-grade container orchestration</li>
                <li>Multi-AZ deployment across 2 availability zones</li>
                <li>Auto-scaling node groups (min 2, max 4)</li>
                <li>SPOT instances for 50-90% cost savings</li>
                <li>100% Infrastructure as Code with Terraform</li>
              </ul>
            </div>
          </div>

          <div className="objective exceeded">
            <div className="number">OBJECTIVE 2</div>
            <h3>
              Configure Multiple AWS Bedrock Models
              <span className="status exceeded">✓ EXCEEDED</span>
            </h3>
            <div className="requirement">
              <strong>Requirement:</strong> Configure LiteLLM to provide access
              to at least two models in AWS Bedrock
            </div>
            <div className="implementation">
              <h4>Implementation - 7 Models Total:</h4>
              <ul>
                <li>
                  AWS Bedrock (5 models): nova-micro, nova-lite, nova-pro,
                  llama3-2-1b, llama3-2-3b
                </li>
                <li>Perplexity API (2 models): sonar, sonar-pro</li>
                <li>Multi-provider support (AWS + Perplexity)</li>
                <li>OpenAI-compatible API interface</li>
                <li>Unified endpoint for all models</li>
              </ul>
            </div>
          </div>

          <div className="objective exceeded">
            <div className="number">OBJECTIVE 3</div>
            <h3>
              Use IAM Roles (No Static Keys)
              <span className="status exceeded">✓ EXCEEDED</span>
            </h3>
            <div className="requirement">
              <strong>Requirement:</strong> Use IAM roles so that LiteLLM can
              access Bedrock without requiring static AWS keys
            </div>
            <div className="implementation">
              <h4>Implementation - IRSA:</h4>
              <ul>
                <li>
                  IRSA (IAM Roles for Service Accounts) fully implemented
                </li>
                <li>OIDC provider auto-derived from EKS cluster</li>
                <li>Temporary credentials with automatic rotation</li>
                <li>Fine-grained IAM policies (least-privilege)</li>
                <li>
                  Permissions: bedrock:InvokeModel, secretsmanager:GetSecretValue
                </li>
                <li>No static AWS keys anywhere in the deployment</li>
                <li>
                  Documented in: terraform/eks/irsa-litellm.tf
                </li>
              </ul>
            </div>
          </div>

          <div className="objective complete">
            <div className="number">OBJECTIVE 4</div>
            <h3>
              Test Model Access
              <span className="status complete">✓ COMPLETE</span>
            </h3>
            <div className="requirement">
              <strong>Requirement:</strong> Test model access through LiteLLM
              with cURL or a simple Python script
            </div>
            <div className="implementation">
              <h4>Implementation - Comprehensive Testing:</h4>
              <ul>
                <li>Python test suite: tests/test-litellm-api.py</li>
                <li>
                  Production test script: tests/test-production.sh
                </li>
                <li>
                  Interactive cURL examples: tests/curl-examples.sh
                </li>
                <li>Shell test script: tests/test-models.sh</li>
                <li>All 7 models tested and validated</li>
                <li>Tests documented in README.md with examples</li>
              </ul>
            </div>
          </div>

          <div className="objective exceeded">
            <div className="number">OBJECTIVE 5</div>
            <h3>
              Demonstrate Deployment
              <span className="status exceeded">✓ EXCEEDED</span>
            </h3>
            <div className="requirement">
              <strong>Requirement:</strong> Be prepared to walk through your
              setup and demonstrate your deployment's functionality
            </div>
            <div className="implementation">
              <h4>Implementation:</h4>
              <ul>
                <li>Live demo: https://openwebui.bhenning.com</li>
                <li>Complete README.md with deployment guide</li>
                <li>Architecture diagrams with ASCII art</li>
                <li>6-page visual presentation website (this site)</li>
                <li>Step-by-step Terraform deployment instructions</li>
                <li>Troubleshooting documentation</li>
                <li>Test scripts for validation</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="stretch-goals">
          <h2>🌟 Stretch Goals - BOTH ACHIEVED</h2>

          <div className="stretch-goal">
            <div className="number">STRETCH GOAL 1</div>
            <h3>
              Container Orchestration (ECS/EKS)
              <span className="status exceeded">✓ ACHIEVED</span>
            </h3>
            <div className="requirement">
              <strong>Requirement:</strong> Deploy LiteLLM into a container
              orchestration service like ECS or EKS instead of using an EC2
              instance
            </div>
            <div className="implementation">
              <h4>Implementation - AWS EKS:</h4>
              <ul>
                <li>AWS EKS cluster (Kubernetes 1.34)</li>
                <li>Container orchestration with auto-scaling</li>
                <li>Network policies for zero-trust isolation</li>
                <li>EBS CSI driver for persistent storage</li>
                <li>VPC CNI with network policy support</li>
                <li>LoadBalancer service with HTTPS/TLS</li>
                <li>Health checks and readiness probes</li>
              </ul>
            </div>
          </div>

          <div className="stretch-goal">
            <div className="number">STRETCH GOAL 2</div>
            <h3>
              Infrastructure as Code
              <span className="status exceeded">✓ ACHIEVED</span>
            </h3>
            <div className="requirement">
              <strong>Requirement:</strong> Create a Terraform or CloudFormation
              template to provision your LiteLLM deployment
            </div>
            <div className="implementation">
              <h4>Implementation - Complete Terraform:</h4>
              <ul>
                <li>terraform/ecr: ECR repository provisioning</li>
                <li>
                  terraform/eks-cluster: VPC, EKS cluster, networking, OIDC
                </li>
                <li>
                  terraform/eks: Application deployment, IRSA, network policies
                </li>
                <li>100% infrastructure defined as code</li>
                <li>Modular design with reusable components</li>
                <li>State management and versioning</li>
                <li>Documented variables and outputs</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h2>🎉 Project Summary</h2>
          <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
            All objectives met and exceeded
          </p>

          <div className="summary-stats">
            <div className="stat-box">
              <span className="value">5/5</span>
              <span className="label">Core Objectives</span>
            </div>

            <div className="stat-box">
              <span className="value">2/2</span>
              <span className="label">Stretch Goals</span>
            </div>

            <div className="stat-box">
              <span className="value">100%</span>
              <span className="label">Requirements Met</span>
            </div>

            <div className="stat-box">
              <span className="value">7</span>
              <span className="label">AI Models Deployed</span>
            </div>
          </div>

          <div style={{ marginTop: "2rem", opacity: "0.95" }}>
            <p>
              <strong>Beyond Requirements:</strong> This deployment demonstrates
              production-grade cloud architecture with enterprise security
              (zero-trust networking, IRSA, defense-in-depth), cost optimization
              (SPOT instances, single NAT), and comprehensive documentation.
            </p>
          </div>
        </div>

        <Link href="/llm-gateway" className="back-link">
          ← Back to Overview
        </Link>
      </div>
    </div>
  );
}
