# ==============================================================================
# Multi-Stage Dockerfile for CIFAKE Full-Stack Production Deployment
# Builds React/Vite SPA and serves alongside FastAPI + PyTorch on a single port
# ==============================================================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.11-slim AS runtime
WORKDIR /app

# Install system runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements (using CPU-optimized PyTorch wheels)
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Copy backend application source
COPY app/ ./app/
COPY run_backend.py .
COPY .env.example .

# Copy pre-built frontend from stage 1 into dist
COPY --from=frontend-builder /app/dist ./dist

# Set production environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Launch unified full-stack application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
