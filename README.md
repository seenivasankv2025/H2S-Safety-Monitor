# H₂S Safety Monitor — SIH 2026 AI + Vision Web Application

**H₂S Safety Monitor** is a full-stack industrial safety platform engineered for **Smart India Hackathon (SIH) 2026**. It uses AI and computer vision to analyze **H2S sensing strips** containing an independent **Expiry / Chemical Stability Patch** and a **6-stage physical color reference scale**.

---

## Key Domain Features

1. **6 Physical Color Stages**:
   - `WHITE`
   - `PALE YELLOW`
   - `DARK YELLOW`
   - `LIGHT BROWN`
   - `DARK BROWN`
   - `BLACK`
   *(Physical color response stages, NOT hardcoded ppm or arbitrary AI predictions)*

2. **5 Safety Output Levels**:
   - `VERY LOW`
   - `LOW`
   - `MODERATE`
   - `RISK`
   - `HIGH RISK`

3. **Expiry / Chemical Stability Patch Gatekeeping**:
   - Checked **BEFORE** H₂S risk evaluation.
   - If `EXPIRED` or `INVALID` → Terminates analysis immediately with **`INVALID STRIP — REPLACE STRIP`**. Never produces H₂S risk levels from expired strips.

4. **15-Step Computer Vision & YOLO11 Pipeline**:
   - YOLO11 complete strip localization (in memory).
   - Bounding box geometry, aspect ratio & pixel resolution check.
   - Image quality check (Laplacian blur variance, mean brightness, contrast, glare overexposure).
   - Visibility checks for sensing zone, reference scale, and expiry patch.
   - Expiry patch chemical status validation (`VALID`, `WARNING`, `EXPIRED`, `NOT_VISIBLE`).
   - Lighting CLAHE color normalization & perspective alignment.
   - Dust & spot contamination analysis (`CLEAN`, `MINOR_CONTAMINATION`, `SEVERE_CONTAMINATION`).
   - RGB + HSV (+ LAB) statistical extraction across region (median, mean, 10-90th percentiles, variance).
   - Distance matching against calibrated physical reference benchmarks stored in MongoDB.
   - Physical stage → 5 safety levels mapping matrix.
   - Temporal stability verification for live camera streams across consecutive frames.

5. **Multi-Role Authorization**:
   - **WORKER**: Login, Dashboard, Live Camera with reticle overlay, Single Image Upload, Personal History & Alerts.
   - **WORKER**: Login, Dashboard, Live Camera, Single Image Upload, Personal History, and safety analysis results.

---

## Project Structure

```
SIH/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── worker.py
│   │   │   ├── analysis.py
│   │   │   └── calibration.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   ├── vision/
│   │   │   ├── validation.py
│   │   │   ├── quality.py
│   │   │   ├── contamination.py
│   │   │   ├── calibration.py
│   │   │   ├── color_analysis.py
│   │   │   ├── expiry.py
│   │   │   └── pipeline.py
│   │   ├── ml/
│   │   │   └── yolov11/
│   │   │       ├── detector.py
│   │   │       ├── config.yaml
│   │   │       └── dataset_generator.py
│   │   └── main.py
│   ├── sample_data/
│   │   └── generate_samples.py
│   ├── test_app.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StripVisualizer.jsx
│   │   │   ├── PipelineStepper.jsx
│   │   │   ├── SafetyBadge.jsx
│   │   │   ├── ExpiryBadge.jsx
│   │   │   └── DemoBanner.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── worker/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Quick Start & Run Commands

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ & npm
- MongoDB (optional local service on `mongodb://localhost:27017` — fallback in-memory database activates automatically if daemon is offline)

### 2. Backend Setup
```bash
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate test sample images
python sample_data/generate_samples.py

# 3. Launch FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend interactive API documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# 1. Install NPM packages
npm install

# 2. Launch Vite dev server
npm run dev
```
Open application in browser: `http://localhost:5173/`

---

## Demo Login Credentials

- **Worker Account**:
  - Username: `worker1`
  - Password: `password123`
*(Alternatively, use the one-click worker preset login button on the `/login` screen.)*
