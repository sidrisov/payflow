# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Payflow is an onchain social payments ecosystem built on Web3 technologies, focused on Farcaster integration. It's a monorepo containing multiple frontend apps, backend services, and shared packages for cross-chain payment functionality across Base, Optimism, Arbitrum, Zora, Mode, Degen L3, Worldchain, and Polygon.

## Monorepo Structure

This is an npm workspaces monorepo with the following components:

### Core Applications

**`app/`** - Main Payflow PWA (Progressive Web App)
- React 19 + TypeScript + Vite
- Material UI v7 for components
- Privy for authentication, Wagmi for wallet interactions
- SSR support with custom Express server
- Entry points: `src/entry-client.tsx` (CSR), `src/entry-server.tsx` (SSR), `server.js` (Express)

**`home/`** - Marketing/landing page
- React 19 + TypeScript + Vite
- Lighter dependencies, focused on presentation

### Services

**`services/payflow-service/`** - Backend API (Spring Boot + Java 21 + Gradle)
- REST API and GraphQL endpoints
- JPA with MySQL/H2 database
- Redis/Caffeine caching layers
- Flyway migrations in `sql/`
- Scheduled tasks with ShedLock
- Web3j for blockchain interactions
- Location: `src/main/java/ua/sinaver/web3/payflow/`

**`services/frames/`** - Farcaster Frames server
- TypeScript + Vike (SSR framework)
- Express server with Satori for image generation
- Entry point: `express-entry.ts`

**`services/onchain/`** - Onchain operations service
- NestJS framework
- Viem for blockchain interactions
- Vitest for testing

### Shared Code

**`packages/common/`** - Shared utilities and types
- TypeScript library built with Vite
- Exports: wallet utilities, token types, constants, payment/profile types
- Used by multiple workspaces via `@payflow/common`
- Token list at `src/tokens/tokens.json`

## Development Commands

### Initial Setup
```bash
npm install                          # Install all workspace dependencies
```

### Main App (`app/`)
```bash
npm run dev --workspace app          # Start dev server on port 4173 with HMR
npm run build --workspace app        # Build production client + server bundles
npm run build:ssr --workspace app    # Build both client and server for SSR
npm run serve:dev --workspace app    # Serve in development mode
npm run serve --workspace app        # Serve in production mode
npm run lint --workspace app         # Run ESLint
```

### Home Page (`home/`)
```bash
npm run dev --workspace home         # Start dev server
npm run build --workspace home       # Build for production
npm run lint --workspace home        # Run ESLint
```

### Shared Package (`packages/common/`)
```bash
npm run build --workspace @payflow/common       # Build once
npm run dev --workspace @payflow/common         # Build in watch mode
npm run type-check --workspace @payflow/common  # Type checking only
npm run lint --workspace @payflow/common        # Run ESLint
```

### Frames Service (`services/frames/`)
```bash
npm run dev --workspace payflow-frames    # Start dev server with tsx
npm run build --workspace payflow-frames  # Vite build
npm run start --workspace payflow-frames  # Production server
npm run lint --workspace payflow-frames   # Run ESLint
```

### Onchain Service (`services/onchain/`)
```bash
npm run dev --workspace onchain          # Start NestJS dev server
npm run dev:watch --workspace onchain    # Dev with watch mode
npm run build --workspace onchain        # Build NestJS app
npm run test --workspace onchain         # Run Vitest tests
npm run test:coverage --workspace onchain # Coverage report
npm run lint --workspace onchain         # Run ESLint
```

### Backend Service (Java - `services/payflow-service/`)
```bash
cd services/payflow-service

# Development
./gradlew bootRun                    # Run with local profile + caffeine cache
./gradlew bootRun -Predis            # Run with local profile + redis cache

# Build
./gradlew build                      # Full build with tests
./gradlew build -x test              # Skip tests

# Testing
./gradlew test                       # Run all tests
./gradlew test --tests ClassName     # Run specific test class

# GraphQL code generation (auto-runs before compile)
./gradlew generateAirstackJava       # Generate from airstack.graphqls
./gradlew generateMoxieStatsJava     # Generate from moxie_protocol_stats.graphqls
./gradlew generateMoxieVestingJava   # Generate from moxie_vesting.graphqls

# Docker image
./gradlew bootBuildImage             # Create Docker image with Java 21
./gradlew bootBuildImage -Pgcp-image-name=<name> --publishImage  # Build + publish to GCP

# Database
# Flyway migrations auto-run on startup
# SQL files in: sql/ directory
```

## Architecture Patterns

### Frontend State Management
- **Zustand** for global state (lightweight alternative to Redux)
- **React Query (@tanstack/react-query)** for server state with persistence
- **Privy** for authentication state
- **Wagmi** for wallet/blockchain state

### Component Structure
- Components in `app/src/components/` are organized by feature/domain
- Layouts in `app/src/layouts/`
- Pages in `app/src/pages/`
- Routing in `app/src/routes.tsx`
- Path aliases: `@/*` maps to `src/*`

### Backend Architecture (Java)
- **Layered architecture**: Controller → Service → Repository → Entity
- **Controllers** in `controller/` expose REST + GraphQL endpoints
- **Services** in `service/` contain business logic
- **Repositories** in `repository/` use Spring Data JPA
- **Entities** in `entity/` are JPA models
- **DTOs** in `dto/` for API contracts
- **Mappers** in `mapper/` use MapStruct for object transformations
- **Events** in `events/` for event-driven patterns
- **Config** in `config/` for Spring configurations

### Blockchain Integration
- **Viem** (2.21.57) for Ethereum interactions across all TypeScript services
- **Wagmi** for React hooks + wallet connections
- **Permissionless** (0.2.28) for account abstraction
- **Web3j** for Java blockchain operations
- Smart accounts via Rhinestone Module SDK
- Paymasters via Pimlico (in `packages/common/src/paymaster/`)

### Build Tooling
- **Vite** for all frontend builds (app, home, packages/common, frames)
- **Gradle** with Kotlin DSL for Java backend
- PWA support via `vite-plugin-pwa` with Workbox
- Code splitting configured in `vite.config.ts` (react-core, ui, viem, wagmi chunks)

## Testing

### TypeScript Services
- **Vitest** for `services/onchain/` tests
- Test files: `test/*.test.ts`
- Run with coverage: `npm run test:coverage --workspace onchain`

### Java Backend
- **JUnit 5** for unit/integration tests
- Test files: `src/test/java/**/*Test.java`
- Configuration: JUnit platform in `build.gradle.kts`

### Frontend
- No test framework currently configured for `app/` or `home/`

## Key Dependencies

### Web3 Stack
- `viem@2.21.57` - Ethereum library
- `wagmi@^2.9.0` - React hooks for Ethereum
- `permissionless@0.2.28` - Account abstraction
- `@privy-io/react-auth` - Authentication
- `@rhinestone/module-sdk` - Smart account modules
- `@paywithglide/glide-js` - Payment abstractions
- `@zoralabs/protocol-sdk` - Zora NFT integration
- `@withfabric/protocol-sdks` - Fabric protocol

### UI Framework
- `@mui/material@^7.0.1` - Material UI
- `@mui/icons-material@^7.0.1` - Material icons
- `@emotion/react` + `@emotion/styled` - CSS-in-JS styling

### Farcaster Integration
- `@farcaster/auth-kit` - Farcaster authentication
- `@farcaster/frame-sdk` - Frame development

## Environment Configuration

### Frontend Apps
Requires `.env.local` files (gitignored):
- `app/.env.local` - Main app configuration
- `home/.env` - Home page configuration
- Common pattern: `VITE_PAYFLOW_SERVICE_API_URL` for backend URL

### Java Backend
- `application.properties` in `src/main/resources/` (not in git)
- Profiles: `local,caffeine` or `local,redis`
- Test config: `src/test/resources/application.properties`

### Build Profiles
Java service supports conditional builds:
- `-Pgcp` - Include Google Cloud Platform dependencies
- `-Predis` - Use Redis cache instead of Caffeine

## Database

### MySQL Schema
- Managed via **Flyway** migrations in `services/payflow-service/sql/`
- Auto-runs on Spring Boot startup
- JPA entities in `entity/` package

## Code Generation

### GraphQL Clients (Java)
- Generated via DGS Codegen plugin
- Schema files in `src/main/resources/schema/`
- Generated code in `graphql.generated` package
- Auto-generates before Java compilation

### TypeScript from GraphQL
- Uses `@graphql-codegen/cli` in `app/`
- Configuration in `codegen.ts`

## Build Artifacts

### Generated Files (Gitignored)
- `dist/` - All build outputs
- `build/` - Java build outputs
- `dev-dist/` - Vite dev builds
- `node_modules/` - Dependencies
- `generated/` - Generated source code
- `.env.local`, `.env` - Environment files
- `stats.html` - Bundle analysis from rollup-plugin-visualizer

### Shared Artifacts
- `packages/common/src/tokens/tokens.json` copied to Java resources during build
- Gradle task `copyTokensJson` handles this before `bootRun`

## Special Considerations

### React Compiler
- `babel-plugin-react-compiler` enabled in `app/`
- Optimizes React components automatically

### PWA Configuration
- Service worker + manifest in `app/public/`
- Workbox runtime caching configured in `vite.config.ts`
- Cache strategies for API calls, static assets, and external resources

### Workspace Dependencies
- Changes in `packages/common` require rebuild
- `app` auto-watches common package in dev mode via `watch:deps` script
- Use `npm run build:deps` before production builds

### SSR Considerations
- `app/` supports both CSR and SSR
- SSR build: `npm run build:ssr --workspace app`
- Server entry: `src/entry-server.tsx`
- Express middleware in `server.js`

## Git Workflow

Recent commits show:
- Feature work on `develop` branch
- Main production branch: `main`
- Seasonal features (e.g., "degen 15 season airdrop claim", "season16 claim")
- Active development on Farcaster dependencies and storage fee updates
