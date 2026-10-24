import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.Models.loader import load_ai_models
from app.Services.recommender import generate_palettes, invalidate_font_cache
from app.Services.intent_analyzer import analyze_intent
from app.db.repository import fetch_fonts_by_script, get_db_connection
from app.Services.sociolinguistic import analyze_language_strategy
from app.Services.fallback_llm import get_fallback_response
from app.Services.font_ingestion import analyze_font_bytes, ingest_new_font
from app.api.V1.endpoints.evaluation import router as evaluation_router, get_evaluation_stats
from app.api.V1.endpoints.auth import router as auth_router
from app.schemas.request import PromptRequest, LanguageRequest, FontAnalyzeRequest, FontIngestRequest
from app.schemas.response import HealthResponse, FontCountResponse, ChatResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- Server Starting Up ---")
    load_ai_models()
    yield
    print("--- Server Shutting Down ---")

app = FastAPI(
    title="Typographic AI Engine",
    description="Dual-Stream Siamese Font Pairing Recommendation Engine for English and Sinhala Typography",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "Server is running successfully, and AI Models are loaded!"}

@app.post("/analyze")
def analyze_user_prompt(request: PromptRequest):
    return analyze_intent(request.prompt)

@app.get("/fonts/count", response_model=FontCountResponse)
def count_fonts():
    """Tests the database connection by counting loaded fonts."""
    eng_fonts = fetch_fonts_by_script("ENGLISH")
    sin_fonts = fetch_fonts_by_script("SINHALA")
    return {
        "english_count": len(eng_fonts),
        "sinhala_count": len(sin_fonts),
        "total": len(eng_fonts) + len(sin_fonts)
    }

@app.post("/recommend")
def get_font_recommendations(request: PromptRequest):
    """The master endpoint that generates the top 3 bilingual palettes."""
    return generate_palettes(request.prompt)

@app.post("/language-strategy")
def get_language_strategy(request: LanguageRequest):
    """Secondary endpoint to determine language hierarchy based on user preference and design context."""
    return analyze_language_strategy(request.follow_up_prompt, request.selected_palette, request.design_context)

@app.post("/chat", response_model=ChatResponse)
def handle_general_chat(request: PromptRequest):
    """Gatekeeper endpoint for out-of-scope, educational, or typography questions with conversational memory."""
    answer = get_fallback_response(request.prompt, request.context, request.history)
    return {"reply": answer}

@app.get("/admin/system-status")
@app.get("/api/admin/system-status")
def get_admin_system_status():
    """Returns AI model runtime telemetry, cache status, and database diagnostics."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM font_metadata WHERE script_type = 'ENGLISH'")
    eng_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM font_metadata WHERE script_type = 'SINHALA'")
    sin_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM font_metadata WHERE encoding_type = 'LEGACY'")
    legacy_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM font_metadata WHERE encoding_type = 'UNICODE'")
    unicode_count = cursor.fetchone()[0]
    conn.close()

    eval_stats = get_evaluation_stats()

    return {
        "system_status": "OPTIMAL",
        "models": {
            "siamese_network": {
                "status": "LOADED_ACTIVE",
                "weights": "siamese_font_matcher.pth",
                "embedding_dim": 512,
                "framework": "PyTorch (CPU/MPS)"
            },
            "intent_analyzer": {
                "status": "LOADED_ACTIVE",
                "model": "sentence-transformers/all-MiniLM-L6-v2",
                "embedding_dim": 384
            },
            "sociolinguistic_engine": {
                "status": "ACTIVE",
                "memory_tracking": True
            }
        },
        "corpus": {
            "english_fonts": eng_count,
            "sinhala_fonts": sin_count,
            "total_fonts": eng_count + sin_count,
            "legacy_winansi_count": legacy_count,
            "unicode_sinhala_count": unicode_count
        },
        "telemetry_summary": {
            "total_evaluations": eval_stats.get("total_evaluations", 0),
            "average_rating": eval_stats.get("average_rating", 0.0),
            "pairwise_votes": eval_stats.get("total_pairwise_votes", 0)
        }
    }

@app.get("/fonts/catalog")
@app.get("/api/fonts/catalog")
def get_font_catalog(query: str = "", script: str = "ALL", limit: int = 1000):
    """Admin corpus inspector: returns font metadata for catalog analysis without heavy embedding BLOBs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = """
        SELECT font_name, script_type, encoding_type, typographic_style, 
               x_height, cap_height, stroke_weight, bounding_box_ratio 
        FROM font_metadata
        WHERE 1=1
    """
    params = []
    if script and script.upper() != "ALL":
        sql += " AND script_type = ?"
        params.append(script.upper())
    if query:
        sql += " AND font_name LIKE ?"
        params.append(f"%{query}%")
        
    sql += " ORDER BY script_type ASC, font_name ASC"
    if limit and limit > 0:
        sql += " LIMIT ?"
        params.append(limit)
    
    cursor.execute(sql, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    
    return {
        "total_returned": len(rows),
        "fonts": [dict(r) for r in rows]
    }

@app.post("/fonts/analyze-ttf")
@app.post("/api/fonts/analyze-ttf")
def api_analyze_ttf(request: FontAnalyzeRequest):
    """Analyzes an uploaded TTF/OTF font file and returns detected typographic metadata and encoding architecture."""
    try:
        file_bytes = base64.b64decode(request.file_base64)
        result = analyze_font_bytes(file_bytes, request.filename)
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Font file analysis failed: {str(e)}")

@app.post("/fonts/ingest")
@app.post("/api/fonts/ingest")
def api_ingest_font(request: FontIngestRequest):
    """
    Ingests a newly released or custom TTF font: saves file to disk, generates 512-D visual and
    384-D SBERT embeddings, inserts into SQLite, and refreshes the Siamese pairing pool.
    """
    try:
        file_bytes = base64.b64decode(request.file_base64)
        result = ingest_new_font(
            file_bytes=file_bytes,
            filename=request.filename,
            script_type=request.script_type,
            encoding_type=request.encoding_type,
            typographic_style=request.typographic_style,
            stroke_weight=request.stroke_weight,
            x_height=request.x_height,
            cap_height=request.cap_height,
            bounding_box_ratio=request.bounding_box_ratio,
            tags=request.tags or ""
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=409, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Font ingestion failed: {str(e)}")

@app.delete("/fonts/{font_name}")
@app.delete("/api/fonts/{font_name}")
def api_delete_font(font_name: str):
    """Removes a font from the database and refreshes the in-memory Siamese pairing cache."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT font_name FROM font_metadata WHERE font_name = ?", (font_name,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Font '{font_name}' not found in database.")
    
    cursor.execute("DELETE FROM font_metadata WHERE font_name = ?", (font_name,))
    conn.commit()
    cursor.execute("SELECT COUNT(*) FROM font_metadata")
    remaining = cursor.fetchone()[0]
    conn.close()

    invalidate_font_cache()
    return {
        "success": True,
        "message": f"Font '{font_name}' removed from repository.",
        "total_fonts": remaining
    }

# Mount Modules:
# 1. Root mount: Handles Vite proxy requests
app.include_router(evaluation_router)
app.include_router(auth_router)
# 2. Prefix mount: Handles direct /api requests
app.include_router(evaluation_router, prefix="/api")
app.include_router(auth_router, prefix="/api")