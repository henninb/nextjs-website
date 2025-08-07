/**
 * Content Security Policy (CSP) violation reporting and management
 */

export interface CSPViolation {
  documentURI: string;
  referrer: string;
  blockedURI: string;
  violatedDirective: string;
  originalPolicy: string;
  effectiveDirective: string;
  statusCode: number;
  scriptSample: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface CSPViolationReport {
  'csp-report': CSPViolation;
}

/**
 * CSP violation logger and analyzer
 */
export class CSPManager {
  private static violations: Map<string, number> = new Map();
  private static readonly MAX_LOG_SIZE = 1000;

  /**
   * Log CSP violation for analysis
   */
  static logViolation(violation: CSPViolation): void {
    const key = `${violation.violatedDirective}:${violation.blockedURI}`;
    const count = this.violations.get(key) || 0;
    this.violations.set(key, count + 1);

    // Clean up if map gets too large
    if (this.violations.size > this.MAX_LOG_SIZE) {
      const firstKey = this.violations.keys().next().value;
      if (firstKey) this.violations.delete(firstKey);
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('🛡️ CSP Violation:', {
        directive: violation.violatedDirective,
        blockedURI: violation.blockedURI,
        documentURI: violation.documentURI,
        count: this.violations.get(key),
      });
    }
  }

  /**
   * Get common CSP violations for policy updates
   */
  static getCommonViolations(): Array<{ pattern: string; count: number; suggestion: string }> {
    const sorted = Array.from(this.violations.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return sorted.map(([pattern, count]) => {
      const [directive, uri] = pattern.split(':');
      return {
        pattern,
        count,
        suggestion: this.getSuggestion(directive, uri),
      };
    });
  }

  /**
   * Generate suggestion for fixing CSP violation
   */
  private static getSuggestion(directive: string, uri: string): string {
    const domain = this.extractDomain(uri);
    
    switch (directive) {
      case 'script-src':
        return `Add "https://${domain}" to script-src directive`;
      case 'style-src':
        return `Add "https://${domain}" to style-src directive`;
      case 'font-src':
        return `Add "https://${domain}" to font-src directive`;
      case 'img-src':
        return `Add "https://${domain}" to img-src directive`;
      case 'connect-src':
        return `Add "https://${domain}" to connect-src directive`;
      default:
        return `Add "https://${domain}" to ${directive} directive`;
    }
  }

  /**
   * Extract domain from URI
   */
  private static extractDomain(uri: string): string {
    try {
      const url = new URL(uri);
      return url.hostname;
    } catch {
      // If URI parsing fails, try to extract domain manually
      const match = uri.match(/https?:\/\/([^\/]+)/);
      return match ? match[1] : uri;
    }
  }

  /**
   * Generate CSP policy update suggestions
   */
  static generatePolicyUpdate(): string {
    const violations = this.getCommonViolations();
    
    if (violations.length === 0) {
      return 'No CSP violations detected - current policy looks good!';
    }

    const suggestions = violations
      .map(v => `// ${v.suggestion} (${v.count} violations)`)
      .join('\n');

    return `CSP Policy Update Suggestions:\n\n${suggestions}`;
  }

  /**
   * Check if a domain should be trusted (basic security check)
   */
  static shouldTrustDomain(domain: string): boolean {
    const trustedDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdnjs.cloudflare.com',
      'api.weather.com',
      'statsapi.mlb.com',
      'fixturedownload.com',
      'finance.bhenning.com',
      'henninb.github.io'
    ];

    const suspiciousDomains = [
      'malicious-site.com',
      'evil.com',
      'phishing-site.net'
    ];

    if (suspiciousDomains.includes(domain)) {
      return false;
    }

    return trustedDomains.includes(domain) || 
           domain.endsWith('.amazonaws.com') ||
           domain.endsWith('.px-cloud.net');
  }

  /**
   * Security assessment of blocked resources
   */
  static assessBlockedResource(uri: string): {
    risk: 'low' | 'medium' | 'high';
    reason: string;
    recommendation: string;
  } {
    const domain = this.extractDomain(uri);

    // High risk indicators
    if (uri.includes('eval') || uri.includes('inline') || uri.includes('javascript:')) {
      return {
        risk: 'high',
        reason: 'Contains potentially dangerous code execution patterns',
        recommendation: 'Do not add to CSP - review code for safer alternatives'
      };
    }

    // Medium risk indicators
    if (!uri.startsWith('https://')) {
      return {
        risk: 'medium',
        reason: 'Non-HTTPS resource could be intercepted',
        recommendation: 'Use HTTPS version if available'
      };
    }

    if (!this.shouldTrustDomain(domain)) {
      return {
        risk: 'medium',
        reason: 'Domain not in trusted list',
        recommendation: 'Verify domain legitimacy before adding to CSP'
      };
    }

    return {
      risk: 'low',
      reason: 'Trusted domain with secure connection',
      recommendation: 'Safe to add to CSP if resource is needed'
    };
  }
}

/**
 * Development helper to monitor CSP violations in real-time
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  document.addEventListener('securitypolicyviolation', (e) => {
    CSPManager.logViolation({
      documentURI: e.documentURI,
      referrer: e.referrer,
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
      effectiveDirective: e.effectiveDirective,
      statusCode: e.statusCode,
      scriptSample: e.sample,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber,
      columnNumber: e.columnNumber,
    });
  });

  // Add development helper to console
  (window as any).cspHelper = {
    getViolations: () => CSPManager.getCommonViolations(),
    getPolicyUpdate: () => console.log(CSPManager.generatePolicyUpdate()),
  };
}

export default CSPManager;