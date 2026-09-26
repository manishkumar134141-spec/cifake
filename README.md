# CIFAKE V2 — Deep-Learning Image Authenticity & Forensic Analysis Platform

> ### 🚀 Made by Manish Kumar
> **GitHub**: [@manishkumar134141-spec](https://github.com/manishkumar134141-spec)  
> **Academic Project Report**: [**`CIFAKE_Project_Report_Manish_Kumar.pdf`**](CIFAKE_Project_Report_Manish_Kumar.pdf) *(Included in this repository)*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C.svg)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**CIFAKE V2** is a full-stack, enterprise-grade digital image authenticity platform created by **Manish Kumar**. Built on the **CIFAKE benchmark** (120,000 images: 60,000 real CIFAR-10 photographs and 60,000 synthetic images generated via Stable Diffusion v1.4), the platform couples precision convolutional neural networks with multimodal Vision LLM review engines and an advanced suite of forensic tools.

---

## 📸 Key Capabilities

### 1. Dual-Layer Detection Engine
- **Layer 1: Calibrated Deep Neural Detector (Required)**
  - **Modified ResNet18 (11.17M parameters)**: Re-engineered with a 3×3 stride-1 stem tailored for 32×32 resolution, producing 97.77% peak validation accuracy on the CIFAKE dataset. The only required detector engine.
- **Layer 2: Multimodal Vision Review (Required API)**
  - **Google Gemini Vision**: Secondary verification using Google Gemini multimodal vision model (`gemini-2.0-flash` / `gemini-1.5-flash`). Free API tier available from Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

### 2. Comprehensive Forensic Toolsuite
- **Real PyTorch Grad-CAM**: Gradient-weighted Class Activation Mapping computes pixel-level saliency heatmaps and overlays identifying generative artifacts.
- **Controlled Robustness Testing**: Automated stress testing evaluating decision boundary stability under perturbations (JPEG compression quality 40, Gaussian blur, bicubic downsampling, center crop, and contrast scaling).
- **Cryptographic & Technical Metadata**: Extracts SHA-256 cryptographic digests, original dimensions, color space, bit depth, and EXIF camera parameters.
- **C2PA / Content Credentials Provenance**: Inspects binary manifests for digital signatures and JUMBF assertion records.
- **High-Throughput Batch Scanning**: Queue-based bulk image processing with real-time progress tracking.
- **Side-by-Side Model Comparison**: Concurrent multi-model execution and delta confidence comparison.
- **Multi-Format Export**: Generates structured JSON data, tabular CSV records, or printable Executive Summary audit reports.
- **API Lab**: Interactive diagnostic testbed for provider status, connectivity, and latency monitoring.

---

## 🏛️ System Architecture

```text
                                  CIFAKE V2 PLATFORM
                                          │
                 ┌────────────────────────┴────────────────────────┐
                 ▼                                                 ▼
        LAYER 1: DETECTOR                               LAYER 2: VISION REVIEW
   (Benchmark-Calibrated Scores)                       (Multimodal Observations)
                 │                                                 │
    Modified ResNet18 (11.17M)                           Google Gemini Vision
  (97.77% Peak Val Accuracy)                         (Free tier via AI Studio)
                 │                                                 │
                 └────────────────────────┬────────────────────────┘
                                          │
                                          ▼
                                FORENSIC TOOLSUITE
                                          │
   ├── PyTorch Grad-CAM Heatmaps & Overlays
   ├── Perturbation Robustness Testing (Blur, Compression, Noise, Crop)
   ├── SHA-256 Cryptographic Digest & EXIF Metadata Extractor
   ├── C2PA / Content Credentials Digital Provenance Inspector
   ├── Batch Queue Processing & Real-time Evaluation
   └── Export Engines (JSON, CSV, Executive Audit Reports)
```

---

## 📁 Repository Structure

```text
CIFAKE/
├── app/                        # FastAPI Backend Service
│   ├── api/
│   │   ├── routes/
│   │   │   ├── analyze.py      # POST /api/analyze (FAST / DEEP / CUSTOM)
│   │   │   ├── compare.py      # POST /api/analyze/compare
│   │   │   ├── batch.py        # POST /api/analyze/batch
│   │   │   ├── evidence.py     # POST /api/evidence/gradcam
│   │   │   ├── robustness.py   # POST /api/robustness
│   │   │   ├── metadata.py     # POST /api/metadata
│   │   │   ├── provenance.py   # POST /api/provenance
│   │   │   ├── providers.py    # POST /api/providers/{provider}/test
│   │   │   ├── export.py       # POST /api/export
│   │   │   ├── models.py       # GET /api/models
│   │   │   └── benchmark.py    # GET /api/benchmark
│   │   └── api.py              # Root API Router
│   ├── checkpoints/            # Model weight directory (holds .pth files)
│   │   └── .gitkeep
│   ├── core/
│   │   └── config.py           # Application settings, keys & benchmark stats
│   ├── models/
│   │   └── resnet18.py         # 11.17M parameter Modified ResNet18 (Required Detector)
│   ├── schemas/
│   │   └── analysis.py         # Pydantic schemas and serialization models
│   ├── services/
│   │   ├── inference.py        # PyTorch forward pass & probability scoring
│   │   ├── model_loader.py     # Cached model weights loader with fallback
│   │   ├── preprocessing.py    # Multi-format validation & 32x32 normalization
│   │   ├── gradcam_service.py  # PyTorch gradient activation mapping
│   │   ├── robustness_service.py # Controlled image perturbations
│   │   ├── metadata_extractor.py # SHA-256, format, & EXIF parser
│   │   ├── provenance_service.py # C2PA signature inspector
│   │   ├── provider_adapters.py# Google Gemini vision adapter
│   │   └── export_service.py   # JSON, CSV, and summary report generator
│   └── main.py                 # FastAPI application factory & CORS configuration
├── src/                        # Vite + React 19 Frontend
│   ├── components/
│   │   ├── analysis/           # ConfidenceIndicator, ImagePreview, MetadataGrid, ResultDisplay, UploadZone
│   │   ├── common/             # EmptyState, ErrorState, StatusIndicator
│   │   └── navigation/         # Header, Sidebar, MobileNav
│   ├── hooks/                  # useAnalysis, useHistory, useTheme
│   ├── layouts/                # MainLayout
│   ├── lib/                    # model-registry, utils
│   ├── pages/
│   │   ├── AnalyzePage.tsx     # Primary scan workflow (FAST / DEEP / CUSTOM)
│   │   ├── ComparePage.tsx     # Side-by-side multi-detector evaluation
│   │   ├── BatchPage.tsx       # Bulk queue processor
│   │   ├── HistoryPage.tsx     # Filterable analysis history
│   │   ├── ModelsPage.tsx      # Detector architectures & Layer 2 settings
│   │   ├── BenchmarkPage.tsx   # CIFAKE benchmark metrics & confusion matrices
│   │   ├── ApiLabPage.tsx      # Provider test console & latency inspector
│   │   └── SettingsPage.tsx    # Theme & session preferences
│   ├── services/               # Typed frontend HTTP client
│   └── types/                  # TypeScript interface definitions
├── scripts/
│   └── calibrate_models.py     # Offline model fine-tuning & weight calibration
├── tests/
│   ├── test_pipeline.py        # End-to-end FastAPI endpoint integration tests
│   ├── test_forensics.py       # FFT, gradient kurtosis, and residual noise tests
│   ├── test_formats.py         # Multi-format test (JPEG, PNG, WEBP, BMP, GIF, TIFF, ICO, PPM)
│   └── verify_accuracy.py      # Real vs AI sample accuracy validation
├── CIFAKE_Project_Report_Manish_Kumar.pdf # Academic Project Report by Manish Kumar
├── requirements.txt            # Python dependencies
├── package.json                # Node.js dependencies & scripts
├── run_backend.py              # Single-file backend launcher
├── .env.example                # Environment variables template
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: Version 3.10, 3.11, or 3.12
- **Node.js**: Version 18.0 or higher
- **npm** or **yarn**

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/manishkumar134141-spec/cifake.git
cd cifake

# Create and activate a virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux / macOS:
# source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Copy environment file for Vision LLM API keys
cp .env.example .env
```

### 2. Frontend Setup

```bash
# In the repository root:
npm install
```

### 3. Running the Application

In two separate terminal windows:

**Terminal 1 — Backend:**
```bash
python run_backend.py
# Or:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

**Terminal 2 — Frontend:**
```bash
npm run dev
```
Open your browser to: `http://localhost:5173`

---

## ☁️ Deploying to Vercel

The frontend is ready for 1-click deployment on **Vercel** with the included [vercel.json](vercel.json):

1. Push your repository to GitHub.
2. Import the repository in your [Vercel Dashboard](https://vercel.com/new).
3. Vercel automatically detects the Vite configuration:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Project Settings** → **Environment Variables**, add:
   - `VITE_API_URL`: URL of your deployed backend service (e.g. `https://your-cifake-backend.onrender.com` or your cloud server).
5. Click **Deploy**. Vercel rewrites will ensure client-side routing works smoothly across all pages.

---

## 🔬 Calibrating Models

Model checkpoints (`.pth`) can be generated or fine-tuned locally using the included calibration script:

```bash
python scripts/calibrate_models.py
```
This script initializes the Modified ResNet18 and PaperCNN models, generates augmented reference batches, and saves the calibrated weights to `app/checkpoints/`.

---

## 🧪 Testing & Verification

Run the comprehensive automated test suite:

```bash
# Full backend API endpoint integration test
python tests/test_pipeline.py

# Multi-format image compatibility (JPEG, PNG, WEBP, BMP, GIF, TIFF, ICO, PPM)
python tests/test_formats.py

# Benchmark accuracy on sample dataset
python tests/verify_accuracy.py

# Spectral & forensic noise tests (2D FFT, Gradient Kurtosis, Deep Norms)
python tests/test_forensics.py
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Single image analysis (FAST, DEEP, or CUSTOM mode) |
| `POST` | `/api/analyze/compare` | Multi-model side-by-side analysis |
| `POST` | `/api/analyze/batch` | Bulk image processing |
| `POST` | `/api/evidence/gradcam` | Generate PyTorch Grad-CAM saliency map & overlay |
| `POST` | `/api/robustness` | Execute perturbation tests (blur, compression, crop, noise) |
| `POST` | `/api/metadata` | Extract cryptographic SHA-256 and EXIF headers |
| `POST` | `/api/provenance` | Inspect C2PA / Content Credentials manifest |
| `POST` | `/api/providers/{provider}/test` | Check Vision LLM provider health & latency |
| `POST` | `/api/export` | Export analysis records (JSON, CSV, Summary report) |
| `GET` | `/api/models` | List active detector models and specifications |
| `GET` | `/api/benchmark` | Retrieve CIFAKE benchmark performance metrics |
| `GET` | `/api/health` | Backend service health check |

---

## 📄 Documentation & Academic Report

For detailed methodology, mathematical formulations, architectural diagrams, and experimental evaluation results, refer to the complete official project report included in this repository:
- 📖 [**`CIFAKE_Project_Report_Manish_Kumar.pdf`**](CIFAKE_Project_Report_Manish_Kumar.pdf) *(Comprehensive Project Report by Manish Kumar)*

---

## 👤 Author & Acknowledgements

- **Made by**: **Manish Kumar** ([@manishkumar134141-spec](https://github.com/manishkumar134141-spec))
- **Benchmark**: [CIFAKE: Image Classification and Explainable Identification of AI-Generated Synthetic Images](https://arxiv.org/abs/2303.14126) (Bird & Lotfi, 2023)
- **License**: MIT
