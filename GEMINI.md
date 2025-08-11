# GEMINI.md - Next.js Website Repository Guide

## Project Overview

This is a comprehensive Next.js application built with TypeScript and React 19. It features personal finance management, sports data integration, a blog, and various utility tools. The application is styled with Material-UI and uses React Query and SWR for state management. It's designed to be deployed on multiple platforms, including Cloudflare Pages, Vercel, Netlify, GCP, and AWS.

## Building and Running

### Prerequisites

- Node.js (versions 20.x, 22.x, 23.x, or 24.x)
- npm or yarn

### Key Commands

- **`npm run dev`**: Starts the development server.
- **`npm run build`**: Builds the application for production.
- **`npm run start`**: Starts the production server.
- **`npm test`**: Runs all Jest tests.
- **`npm run prettier`**: Formats the code with Prettier.
- **`npm run pages:build`**: Builds the application for Cloudflare Pages.
- **`npm run analyze`**: Analyzes the bundle size.

## Development Conventions

### Code Style

- **TypeScript**: The project uses TypeScript with relaxed strict mode.
- **Styling**: Material-UI is used for styling, with custom themes located in the `themes` directory.
- **State Management**: React Query and SWR are used for server state, while React hooks are used for client state.
- **Linting and Formatting**: Prettier is used for code formatting.

### Testing

- **Framework**: Jest is used for testing, with SWC for faster transpilation.
- **Utilities**: React Testing Library and Mock Service Worker (MSW) are used for testing components and mocking APIs.
- **Configuration**: The Jest configuration is in `jest.config.js`, and the setup file is `jest.setup.js`.
- **Test Files**: Tests are located in the `__tests__` directory and are organized by type (hooks, components, pages).

### Project Structure

- **`components`**: Contains reusable UI components.
- **`contexts`**: Contains React contexts.
- **`hooks`**: Contains custom React hooks for data fetching and mutations.
- **`layouts`**: Contains page layout components.
- **`model`**: Contains TypeScript interfaces and types.
- **`pages`**: Contains Next.js pages and API routes.
- **`themes`**: Contains Material-UI theme configurations.
- **`__tests__`**: Contains all Jest test files.
- **`data`**: Contains test and dummy data.
