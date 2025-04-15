# IoT-Edge-LLM: Edge AI Engine Analysis

A project that combines IoT sensor data analysis with edge-deployed large language models for intelligent engine vibration analysis.

This project serves as the code foundation for a two-part blog series:
- [The Power of LLM models at the Edge - AWS IoT - Part 1](https://jeremyritchie.com/posts/16)
- [The Power of LLM models at the Edge - AWS IoT - Part 2](https://jeremyritchie.com/posts/17)

## Overview

IoT-Edge-LLM demonstrates how to deploy large language models to the edge.

## Architecture

The project consists of two main components:

### Frontend (React)
- Modern React application with Cloudscape Design components
- Interactive parameter controls for simulation
- Visualization of vibration data
- Real-time AI analysis results and metrics


### Edge-LLM (Python)
- FastAPI backend for data processing and API endpoints
- LLM integration via Ollama for local model deployment
- WebSocket communication for streaming responses
- Data processing utilities for vibration analysis

## Setup Instructions

### Prerequisites
- Node.js 16+ for frontend
- Python 3.9+ for backend
- Ollama installed for local LLM serving
- A preferred LLM model (default: gemma3:1b or qwen3:1.7b)

### Backend Setup
1. Navigate to the edge-llm directory:
   ```
   cd edge-llm
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```
   python main.py
   ```
   The server will run on port 8081 by default.

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   The frontend will be available at http://localhost:5173