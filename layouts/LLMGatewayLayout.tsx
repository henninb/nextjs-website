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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)" }}>
      <style jsx>{`
        .nav-bar {
          position: sticky;
          top: 0;
          z-index: 1100;
          background: linear-gradient(135deg, #00a8cc 0%, #00d4ff 100%);
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 212, 255, 0.4);
          backdrop-filter: blur(10px);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .nav-links {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
          border-radius: 12px;
          text-decoration: none;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .nav-link:hover:not(.active) {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.2) 100%);
          border-color: rgba(255, 255, 255, 0.6);
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .nav-link.active {
          background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
          color: #00a8cc;
          font-weight: 700;
          border: 3px solid white;
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
        }

        .demo-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
          border-radius: 12px;
          text-decoration: none;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          border: 3px solid #2ecc71;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
        }

        .demo-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(46, 204, 113, 0.6);
          background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        }

        .content {
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .nav-bar {
            padding: 1rem;
            position: sticky;
            top: 0;
            z-index: 1100;
          }

          .nav-links {
            gap: 0.5rem;
          }

          .nav-link {
            font-size: 0.85rem;
            padding: 0.5rem 0.875rem;
            gap: 0.35rem;
          }

          .nav-link span:first-child {
            font-size: 1rem;
          }

          .demo-button {
            font-size: 0.85rem;
            padding: 0.5rem 1rem;
          }
        }
      `}</style>

      <nav className="nav-bar">
        <div className="nav-container">
          <div className="nav-links">
            <Link href="/llm-gateway" className={`nav-link ${isActive("/llm-gateway") ? "active" : ""}`}>
              <span>🏠</span>
              <span>Overview</span>
            </Link>
            <Link href="/llm-gateway/requirements" className={`nav-link ${isActive("/llm-gateway/requirements") ? "active" : ""}`}>
              <span>🎯</span>
              <span>Requirements</span>
            </Link>
            <Link href="/llm-gateway/architecture" className={`nav-link ${isActive("/llm-gateway/architecture") ? "active" : ""}`}>
              <span>🏗️</span>
              <span>Architecture</span>
            </Link>
            <Link href="/llm-gateway/deployment" className={`nav-link ${isActive("/llm-gateway/deployment") ? "active" : ""}`}>
              <span>🚀</span>
              <span>Deployment</span>
            </Link>
            <Link href="/llm-gateway/features" className={`nav-link ${isActive("/llm-gateway/features") ? "active" : ""}`}>
              <span>✨</span>
              <span>Features</span>
            </Link>
            <Link href="/llm-gateway/security" className={`nav-link ${isActive("/llm-gateway/security") ? "active" : ""}`}>
              <span>🔒</span>
              <span>Security</span>
            </Link>
            <Link href="/llm-gateway/cost" className={`nav-link ${isActive("/llm-gateway/cost") ? "active" : ""}`}>
              <span>💰</span>
              <span>Cost</span>
            </Link>
            <Link href="/llm-gateway/summary" className={`nav-link ${isActive("/llm-gateway/summary") ? "active" : ""}`}>
              <span>📊</span>
              <span>Summary</span>
            </Link>
            <a
              href="https://openwebui.bhenning.com"
              target="_blank"
              rel="noopener noreferrer"
              className="demo-button"
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
