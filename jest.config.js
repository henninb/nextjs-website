// jest.config.js
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!<rootDir>/.next/**",
    "!<rootDir>/coverage/**",
    "!jest.config.js",
    "!jest.setup.js",
  ],
  moduleNameMapper: {
    // Handle module aliases (if you have them)
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/pages/(.*)$": "<rootDir>/pages/$1",
    "^@/styles/(.*)$": "<rootDir>/styles/$1",
    // Handle CSS imports (if you use CSS modules)
    "\\.(scss|sass|css)$": "identity-obj-proxy",
  },
  transform: {
    // Use SWC for faster transpilation
    "^.+\\.(js|jsx|ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: false,
            dynamicImport: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx?|jsx?)$",
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!(@mswjs|jose|msw|node-fetch|fetch-blob|formdata-polyfill|data-uri-to-buffer|@mui))"
  ],
};
