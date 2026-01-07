"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LLMGatewayLayoutProps {
  children: ReactNode;
}

export default function LLMGatewayLayout({ children }: LLMGatewayLayoutProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      }}
    >
      <style jsx global>{`
        .nav-bar {
          position: sticky;
          top: 0;
          z-index: 1100;
          background: rgba(15, 23, 42, 0.95);
          padding: 1rem 2rem;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .nav-link,
        .demo-link {
          display: inline-flex !important;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border-radius: 8px;
          text-decoration: none !important;
          color: rgba(226, 232, 240, 0.9) !important;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .nav-link:hover,
        .demo-link:hover {
          background: rgba(51, 65, 85, 0.5);
          color: rgb(224, 242, 254) !important;
        }

        .nav-link.active {
          background: rgba(56, 189, 248, 0.15);
          color: rgb(125, 211, 252) !important;
          font-weight: 600;
        }

        .content {
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .nav-bar {
            padding: 0.75rem 1rem;
          }

          .nav-links {
            gap: 0.25rem;
          }

          .nav-link,
          .demo-link {
            font-size: 0.75rem;
            padding: 0.375rem 0.75rem;
            gap: 0.35rem;
          }
        }
      `}</style>

      <nav className="nav-bar">
        <div className="nav-container">
          <div className="nav-links">
            <Link
              href="/llm-gateway"
              className={`nav-link ${isActive("/llm-gateway") ? "active" : ""}`}
            >
              <span>🏠</span>
              <span>Overview</span>
            </Link>
            <Link
              href="/llm-gateway/requirements"
              className={`nav-link ${isActive("/llm-gateway/requirements") ? "active" : ""}`}
            >
              <span>🎯</span>
              <span>Requirements</span>
            </Link>
            <Link
              href="/llm-gateway/architecture"
              className={`nav-link ${isActive("/llm-gateway/architecture") ? "active" : ""}`}
            >
              <span>🏗️</span>
              <span>Architecture</span>
            </Link>
            <Link
              href="/llm-gateway/deployment"
              className={`nav-link ${isActive("/llm-gateway/deployment") ? "active" : ""}`}
            >
              <span>🚀</span>
              <span>Deployment</span>
            </Link>
            <Link
              href="/llm-gateway/features"
              className={`nav-link ${isActive("/llm-gateway/features") ? "active" : ""}`}
            >
              <span>✨</span>
              <span>Features</span>
            </Link>
            <Link
              href="/llm-gateway/security"
              className={`nav-link ${isActive("/llm-gateway/security") ? "active" : ""}`}
            >
              <span>🔒</span>
              <span>Security</span>
            </Link>
            <Link
              href="/llm-gateway/cost"
              className={`nav-link ${isActive("/llm-gateway/cost") ? "active" : ""}`}
            >
              <span>💰</span>
              <span>Cost</span>
            </Link>
            <Link
              href="/llm-gateway/summary"
              className={`nav-link ${isActive("/llm-gateway/summary") ? "active" : ""}`}
            >
              <span>📊</span>
              <span>Summary</span>
            </Link>
            <a
              href="https://openwebui.bhenning.com"
              target="_blank"
              rel="noopener noreferrer"
              className="demo-link"
            >
              <span>🚀</span>
              <span>Live Demo</span>
            </a>
          </div>
        </div>
      </nav>

      <div className="content">{children}</div>
    </div>
  );
}
