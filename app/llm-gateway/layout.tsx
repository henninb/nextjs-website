import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "LLM Gateway - Production AI Infrastructure",
    template: "%s | LLM Gateway",
  },
  description:
    "Production-ready, secure, and cost-optimized LLM gateway deployed on AWS EKS with comprehensive security controls and multi-provider AI model support.",
  keywords: [
    "LLM Gateway",
    "AWS EKS",
    "Kubernetes",
    "AI Infrastructure",
    "LiteLLM",
    "OpenWebUI",
    "AWS Bedrock",
    "Perplexity",
    "Zero-Trust Security",
    "DevOps",
    "Terraform",
  ],
  openGraph: {
    title: "LLM Gateway - Production AI Infrastructure on AWS EKS",
    description:
      "Production-ready, secure, and cost-optimized LLM gateway with zero-trust networking and multi-provider AI model support.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LLM Gateway - Production AI Infrastructure",
    description:
      "Secure, cost-optimized LLM gateway on AWS EKS with 7 AI models from AWS Bedrock and Perplexity.",
  },
};

export default function LLMGatewayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
