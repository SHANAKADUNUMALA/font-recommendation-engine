# 🔤 Typographic AI Engine
### Dual-Stream Siamese Font Pairing Recommendation Engine for English & Sinhala Typography

An academic research platform and interactive AI system developed to automate cross-lingual typographic pairing between the Latin (English) and Sinhala writing scripts. The engine bridges visual harmony and semantic intent across bilingual print and digital social media layouts.

---

## 🏛️ System Architecture

```
                                  [ User Design Brief ]
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │    React 18 / Vite UI     │
                              │  (Gatekeeper Intent Flow) │
                              └─────────────┬─────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │ Route B                    │ Route A                    │ Route C
        (Generative Pairing)         (Language Strategy)           (Educational Fallback)
               ▼                            ▼                            ▼
      ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
      │  /recommend     │          │/language-strategy│          │     /chat       │
      │   (FastAPI)     │          │   (FastAPI)     │          │   (FastAPI)     │
      └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
               │                            │                            │
      ┌────────┴────────┐          ┌────────┴────────┐          ┌────────┴────────┐
      │ Query           │          │ SBERT Semantic  │          │ Multi-Provider  │
      │ Disentanglement │          │ Anchor Scoring  │          │ LLM Waterfall   │
      │ (Brand 70% /    │          │ (Local vs       │          │ (Gemini → Groq  │
      │  Campaign 30%)  │          │  Global Bias)   │          │  → Cohere)      │
      └────────┬────────┘          └────────┬────────┘          └─────────────────┘
               │                            │
      ┌────────┴────────┐          ┌────────┴────────┐
      │ SBERT English   │          │ Role-by-Role    │
      │ Family Ranking  │          │ Language Weight │
      └────────┬────────┘          │ Allocation      │
               │                   └────────┬────────┘
      ┌────────┴────────┐                   │
      │ Dual-Stream     │                   │
      │ Siamese Network │                   │
      │ (Visual 512-d + │                   │
      │  Semantic 384-d)│                   │
      └────────┬────────┘                   │
               │                            │
      ┌────────┴────────┐                   │
      │ Physical Metric │                   │
      │ Penalties (x-ht,│                   │
      │  Bounding Box)  │                   │
      └────────┬────────┘                   │
               │                            │
      ┌────────┴────────┐                   │
      │ Modular Scale   │                   │
      │ Rule Engine     │                   │
      │ (1.618 / 1.333) │                   │
      └────────┬────────┘                   │
               │                            │
               └─────────────┬──────────────┘
                             │
                             ▼
               ┌───────────────────────────┐
               │   Fabric.js Canvas Engine │
               │ (Bilingual Editable Layout│
               │  + 2x High-Res PNG Export)│
               └─────────────┬─────────────┘
                             │
                             ▼
               ┌───────────────────────────┐
               │ 5-Star Telemetry Database │
               │  (/api/evaluate → SQLite) │
               └───────────────────────────┘
```

---

## 🚀 Key Features

1. **Dual-Stream Siamese Metric Matching (`DualStreamSiameseNet`)**:
   - Concatenates 512-dimensional visual glyph features (from pre-trained ResNet-18) and 384-dimensional semantic descriptors (from SBERT).
   - Projects into a 128-dimensional L2-normalized embedding space to compute structural distances between English and Sinhala typefaces.
2. **Query Disentanglement**:
   - Isolates Brand Identity (70% weight) from Campaign / Promotional noise (30% weight) to avoid semantic drag.
3. **Typographic Baseline & Aspect Ratio Penalties**:
   - Penalizes candidate pairs with normalized x-height ratio $< 0.90$ or bounding box ratio $< 0.75$.
4. **Platform-Aware Modular Scale Engine**:
   - Supports **Facebook** (1200×630) and **Instagram** (1080×1080).
   - Applies Golden Ratio ($1.618$) for high-impact promos, Perfect Fourth ($1.333$) for standard editorial, and Major Second ($1.250$) for information-dense designs.
5. **Sociolinguistic Language Dominance**:
   - Dynamically reorganizes hierarchy between *Sinhala-Dominant*, *English-Dominant*, and *Bilingual-Balanced* layouts.
6. **Editable Fabric.js Canvas**:
   - Live double-click in-browser typography editing.
   - Clean 2x resolution PNG exporter.
7. **Empirical Evaluation Telemetry**:
   - Embedded 5-star user evaluation module.
   - Automated MOS (Mean Opinion Score), variance, and standard deviation export via `backend/export_evaluations.py`.

---

## 🛠️ Project Structure

```
font-recommendation-engine/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── V1/
│   │   │       └── endpoints/
│   │   │           └── evaluation.py       # Telemetry feedback & stats API
│   │   ├── Core/
│   │   │   ├── config.py                  # YAML design rule loader
│   │   │   ├── cache.py                   # In-memory session & vector cache
│   │   │   └── design_rules.yaml          # Platform specs, modular scales, keywords
│   │   ├── db/
│   │   │   ├── repository.py              # SQLite font fetching & blob decoder
│   │   │   └── session.py                 # Safe database context manager
│   │   ├── Models/
│   │   │   ├── loader.py                  # PyTorch Siamese & SBERT model loader
│   │   │   └── siamese_net.py             # DualStreamSiameseNet interface
│   │   ├── schemas/
│   │   │   ├── request.py                 # Pydantic request models
│   │   │   └── response.py                # Pydantic response models
│   │   ├── Services/
│   │   │   ├── intent_analyzer.py         # SBERT modern/traditional intent classifier
│   │   │   ├── recommender.py             # Core dual-stream font pairing engine
│   │   │   ├── slot_extractor.py          # NLP slot parsing & Sinhala i18n
│   │   │   ├── sociolinguistic.py         # Language hierarchy strategist
│   │   │   └── fallback_llm.py            # External LLM waterfall (Gemini/Groq/Cohere)
│   │   └── main.py                        # FastAPI application entry point
│   ├── artifacts/
│   │   ├── fonts.db                       # Font metadata & pre-computed vectors
│   │   └── siamese_font_matcher.pth       # Trained PyTorch weights (128-d projection)
│   ├── tests/
│   │   └── test_engine.py                 # Automated unit and integration test suite
│   ├── export_evaluations.py              # Research thesis statistical analysis script
│   ├── requirements.txt                   # Backend dependencies
│   └── .env.example                       # Environment variables template
├── frontend/
│   ├── public/
│   │   └── fonts/                         # 400 English + 200 Sinhala curated TTF fonts
│   ├── src/
│   │   ├── components/
│   │   │   ├── CanvasPreview.jsx          # Fabric.js interactive canvas renderer
│   │   │   └── Feedback/
│   │   │       └── Feedback.jsx           # Standalone telemetry component
│   │   ├── App.jsx                        # React 18 chat interface & state router
│   │   └── index.jsx                      # React DOM mount
│   ├── package.json
│   └── vite.config.js                     # Vite build & proxy configuration
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# (Optional) Configure Fallback LLM keys in backend/.env:
cp .env.example .env

# Run automated test suite:
python tests/test_engine.py

# Launch FastAPI development server:
uvicorn app.main:app --reload --port 8000
```

The API docs are available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📊 Generating Research Thesis Evaluation Statistics

To export user evaluation data and generate descriptive statistics (Mean Opinion Score, Standard Deviation, Star Distribution):

```bash
python backend/export_evaluations.py
```

Output:
- Generates `backend/evaluation_results.csv`
- Prints statistical summary in terminal:
  - Sample Size ($N$)
  - Mean Opinion Score (MOS out of $5.00$)
  - Sample Variance ($s^2$) & Standard Deviation ($s$)
  - Frequency distribution per rating

---

## 🧪 Testing Standards

Run the comprehensive test suite anytime with:

```bash
python backend/tests/test_engine.py
```

The suite validates:
- Intent classification accuracy (Modern/Sans vs Traditional/Serif)
- NLP slot extraction, Sinhala Unicode preservation, and i18n translation
- Modular scale ratio calculations across platforms
- Dual-stream Siamese palette ranking
- Sociolinguistic strategy determination
- LLM fallback isolation (custom models run 100% offline)
- SQLite database integrity

