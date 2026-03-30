# StockSense - Smart Finance Platform

StockSense is a comprehensive, intelligent financial platform built specifically for modern retail investors. Moving far beyond standard market tracking applications, it integrates real-time data feeds, AI-driven document analysis, algorithmic trust scoring, and conversational AI into a cohesive mentor and portfolio management system.

## Table of Contents
- [Overview](#overview)
- [Core Features](#core-features)
- [Performance and Optimizations](#performance-and-optimizations)
- [Security Measures](#security-measures)
- [Data Flow and Architecture](#data-flow-and-architecture)
- [Technology Stack](#technology-stack)
- [API Endpoints Summary](#api-endpoints-summary)
- [Installation and Local Setup](#installation-and-local-setup)
- [Deployment Guidelines](#deployment-guidelines)
- [Project Structure](#project-structure)
- [Future Roadmap](#future-roadmap)

---

## Overview

The primary goal of StockSense is to eliminate the guesswork and misinformation inherent in retail investing. By leveraging real-time financial sockets through Finnhub and integrating Large Language Models (LLaMA via Groq interface), the platform autonomously dissects raw SEC filings, determines the veracity of circulating financial news, and dynamically generates optimal portfolio allocations based strictly on mathematical and fundamental analyses.

---

## Core Features

- **Smart Predictor and Portfolio Builder**
  Users define their aggregate investment budget, designated timeline, and strict risk tolerance vectors. The backend engine runs rapid computational allocation scenarios across ETFs and top-tier equities to return an actionable, diversified portfolio mathematically tuned to those parameters.

- **Veracity Engine (Trust Feed)**
  To counter market manipulation, passing news is not just displayed; it is filtered. The Trust Feed intercepts live market updates and utilizes Natural Language Processing to assign a "Trust Score" (0-100) based on source reputation, historical skew, and sentiment validation.

- **SEC Document AI Analyzer**
  Investors no longer need to manually parse hundreds of pages of 10-K or 8-K filings. Complex regulatory documents uploaded to the Research Library securely interact with the backend processor to extract crucial fundamental shifts, strategic summaries, and risk highlights.

- **Live Asset Summary and Recommendations**
  Provides instantaneous market quotes blended directly with an AI Ensemble Score. The system processes moving averages, momentum metrics, and live analyst target aggregates to output definitive bullish or bearish signals.

- **Intelligent Financial Chatbot**
  An embedded conversational agent powered natively by LLaMA-based models. Equipped with external tool-calling capabilities, it can securely contact external APIs to fetch real-time stock quotes or query news headlines iteratively during user conversations without forcing a context switch.

- **Sector Screener and Macro Analytics**
  A macro-financial visualizing tool designed for market pulse. Tracks active capital rotation across core sectors (Technology, Healthcare, Finance) to indicate broader institutional movements.

- **Responsive Fluid Architecture**
  The entire client-side interface relies entirely on fluid REM units mapped to structural spacing tokens. The layout guarantees perfect usability across wide ultra-wide desktop monitors down to standard narrow mobile dimensions without breakpoint fracturing.

---

## Performance and Optimizations

- **Network Payload Compression**
  The Express backend pushes all RESTful responses through a Gzip/Deflate compression mechanism to drastically reduce JSON string payload sizes, decreasing transfer times significantly across unstable cellular networks.

- **Aggressive Client-Side Caching**
  Instead of hitting rapid API rate limits on simple route changes, the unified Axios networking client inherently caches static and low-velocity GET requests (such as top stocks or sector overviews) in a custom in-memory TTL map.

- **NProgress Load Balancing Simulation**
  UX is heavily smoothed during multi-stage data retrieval configurations by utilizing dynamic top-bar NProgress loaders rather than disruptive blocking overlay spinners.

---

## Security Measures

- **JWT Authentication**
  Stateless, heavily salted hash tokenization protects the entirety of the internal routing system. All external network endpoints require an active Bearer Token intercept.

- **Password Cryptography**
  Utilizes the robust Bcrypt module to implement standard high-cost password hashing. Passwords are never parsed in plain text, whether at rest or in network transition.

- **Strict CORS Polices**
  Cross-Origin Resource Sharing is tightly bound. The backend maintains a strict allowed list verifying exact origins (e.g. localhost for development and the explicit Netlify production URL), immediately halting any malicious external injection attempts via browser instances.

---

## Data Flow and Architecture

The platform operates as a decoupled monorepo, cleanly defining boundaries between presentation and business logic.

1. **Client Interaction:** React captures intent through the unified Context API state system.
2. **Gateway Transport:** Axios handles transmission, appending authorization headers securely.
3. **Restful Node Layer:** Express intercepts the token, validates the session, blocks invalid CORS requests, and passes control to the specified Controller logic.
4. **Service Handling:** The controller securely dials either the local MySQL datastore via pre-compiled ORM models or reaches entirely outward towards Finnhub/Groq over highly restricted outbound data bridges.
5. **Yield:** Normalized clean object data is compressed and fired back to the frontend parser.

---

## Technology Stack

### Frontend
- **Framework:** React.js bootstrapped with Vite 
- **Styling Layer:** Tailwind CSS, utilizing extensive custom CSS variable definitions for thematic cohesion 
- **Routing & Networking:** React Router DOM and Axios
- **Vector Icons:** Lucide React

### Backend
- **Core Runtime:** Node.js
- **Server Framework:** Express.js (Version 5.x)
- **Database Architecture:** MySQL 
- **Real-time Event Sockets:** Socket.io
- **Security Primitives:** JSON Web Tokens (JWT) and Bcrypt.js
- **File System Handling:** Multer configuration for temporary binary data holding (PDF reading)

### External Services
- **Market Data Feed:** Finnhub REST API
- **Inference Engine:** Groq API running specialized LLaMA inference instructions

---

## API Endpoints Summary

Below is an abbreviated summary mapping out the core backend architecture structure:

- /api/auth    - Session generation, user registration, payload verification
- /api/portfolio - Persistent data management of customized stock clusters
- /api/market  - Bridge querying for live ticker pricing and historical candlestick aggregates
- /api/ai        - LLM instruction passing for predictive analysis and portfolio generation
- /api/research  - Direct retrieval endpoints for related market news and sentiment graphs

---

## Installation and Local Setup

### System Prerequisites
- Node.js Environment (v18+)
- Active MySQL database instance
- Relevant generated keys from Finnhub & Groq developer platforms

### Initializing the Backend

1. Move to the directory:
   cd backend
2. Install node dependencies:
   npm install
3. Configure your local `.env` values (see Environment Section).
4. Run the runtime listener:
   npm run dev

### Initializing the Frontend

1. Move to the directory:
   cd frontend
2. Install node dependencies:
   npm install
3. Launch the Vite server:
   npm run dev

---

## Deployment Guidelines

### Frontend (Netlify/Vercel)
The `frontend` directory is statically exportable. Ensure that the build command is configured as `npm run build` targeting the `dist` directory. You will need to statically append an environment variable representing `VITE_API_URL` to point to the remote Render instance securely.

### Backend (Render/Heroku)
The Node process tracks the `server.js` file as the main execution loop. Ensure that the proper Node version runtime is supplied. Remember to bind `.env` parameters directly within your SaaS deployment dashboard, particularly securing the `CLIENT_URL` mapping to finalize connection handshake authorizations between the deployed frontend domain and the operational database environment.

---

## Project Structure

CodeCrafter_3.o/
|-- backend/
|   |-- src/
|   |   |-- config/     # Database and service connection configurations
|   |   |-- constants/  # Immutable systemic constants
|   |   |-- controller/ # Functional logical structures linked to endpoints
|   |   |-- middleware/ # Pipeline authorization parsing methods
|   |   |-- routes/     # Express route definitions
|   |   |-- services/   # Abstracted outward-facing external network calls
|   |-- uploads/        # Directory for temporary file stream reading
|   |-- server.js       # Core Express instantiation 
|   |-- package.json
|-- frontend/
|   |-- public/         # Direct static assets
|   |-- src/
|   |   |-- assets/     # Images and vector shapes
|   |   |-- components/ # Decoupled operational React elements (Navigation, Cards)
|   |   |-- context/    # Global Context Providers
|   |   |-- pages/      # Root layout aggregators for structural routing
|   |   |-- api.js      # Global network intercepts and fetch wrappers
|   |   |-- App.jsx     # Main structural DOM tree
|   |   |-- index.css   # Fluid scaling CSS baseline settings
|   |   |-- main.jsx    # React renderer boot
|   |-- vite.config.js  # Compiler build configuration
|   |-- package.json
|-- README.md           # This file

---

## Future Roadmap

The system remains an actively maintained project. Forthcoming structural additions include automated chronological chronological portfolio re-balancing triggers based on macro-environment shifts, an expanded multi-document conversational chat instance, and fully persistent websockets mapping out micro-second market movements across specified highly volatile sectors.
