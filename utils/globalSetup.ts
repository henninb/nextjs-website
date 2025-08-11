// Global setup that should run once, outside of React components
// This prevents Fast Refresh from constantly re-running global modifications

let isSetupComplete = false;

export function setupGlobalAPIs() {
  // Prevent multiple setups
  if (isSetupComplete || typeof window === "undefined") {
    return;
  }

  // Completely skip all setup in development to prevent Fast Refresh conflicts
  if (process.env.NODE_ENV === "development") {
    isSetupComplete = true;
    console.log(
      "GlobalSetup: Skipped in development mode to prevent HMR issues",
    );
    return;
  }

  // Setup PerimeterX domains
  (window as any)._pxCustomAbrDomains = [
    "amazonaws.com",
    "execute-api.us-east-1.amazonaws.com",
  ];

  // Setup cookie synchronization
  const customCookieHeader = "x-px-cookies";
  const cookiesToSync = ["_px2", "_px3", "_pxhd", "_pxvid", "pxcts"];
  const domainsToSync = [
    "amazonaws.com",
    "execute-api.us-east-1.amazonaws.com",
  ];

  if (customCookieHeader && cookiesToSync.length && domainsToSync.length) {
    // XMLHttpRequest modification
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (...args) {
      originalOpen.apply(this, args);
      try {
        if (shouldSyncCookies(args[1])) {
          const cookies = getCookiesToSync();
          if (cookies) {
            this.setRequestHeader(customCookieHeader, cookies);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    // Fetch modification
    if (window.fetch) {
      const originalFetch = window.fetch;
      window.fetch = function (...args) {
        try {
          if (shouldSyncCookies(args[0] as string)) {
            const cookies = getCookiesToSync();
            if (cookies) {
              if (!args[1]) args[1] = {};
              if (!args[1].headers) args[1].headers = {};
              (args[1].headers as Record<string, string>)[customCookieHeader] =
                cookies;
            }
          }
        } catch (error) {
          console.error(error);
        }
        return originalFetch.apply(this, args);
      };
    }
  }

  isSetupComplete = true;

  function shouldSyncCookies(url: string): boolean {
    const anchor = document.createElement("a");
    anchor.href = url;
    return domainsToSync.some((domain) => anchor.hostname.includes(domain));
  }

  function getCookiesToSync(): string {
    return document.cookie
      .split(/;\s?/)
      .filter((cookie) => cookiesToSync.includes(cookie.split("=")[0]))
      .join("; ");
  }
}
