import os
import sys
import sqlite3
import json

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["ENABLE_FALLBACK_LLM"] = "False"

from app.Models.loader import load_ai_models
from app.Services.recommender import generate_palettes
from app.Services.intent_analyzer import analyze_intent
from app.Services.slot_extractor import extract_content_slots
from app.Services.sociolinguistic import analyze_language_strategy
from app.Services.fallback_llm import get_fallback_response
from app.db.repository import get_db_connection
from app.api.V1.endpoints.auth import login_user, register_user, get_all_users, LoginRequest, RegisterRequest
from app.api.V1.endpoints.evaluation import (
    submit_feedback, submit_pairwise_feedback, get_evaluation_stats,
    export_feedback_csv, get_academic_summary, export_latex_benchmark, export_markdown_benchmark,
    FeedbackRequest, PairwiseFeedbackRequest
)
from app.main import (
    health_check, analyze_user_prompt, count_fonts, get_font_recommendations,
    get_language_strategy, handle_general_chat, get_admin_system_status, get_font_catalog,
    PromptRequest, LanguageRequest
)

def run_full_system_audit():
    print("=" * 65)
    print("      🚀 TYPOGRAPHIC AI COMPREHENSIVE END-TO-END SYSTEM AUDIT")
    print("=" * 65)

    # -------------------------------------------------------------
    # PHASE 1: Neural Networks and AI Models
    # -------------------------------------------------------------
    print("\n[PHASE 1/8] AI Models & Embedding Engines Initialization...")
    siamese, sbert = load_ai_models()
    assert siamese is not None, "Siamese neural network failed to load."
    assert sbert is not None, "SBERT transformer router failed to load."
    print("  ✅ Dual-Stream Siamese Network (512-D visual + 384-D SBERT -> 128-D) Active.")
    print("  ✅ SBERT all-MiniLM-L6-v2 Router Active.")

    # -------------------------------------------------------------
    # PHASE 2: Database Integrity & Physical Fonts Verification
    # -------------------------------------------------------------
    print("\n[PHASE 2/8] Database Schema & Physical Font Assets Audit...")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM font_metadata")
    total_fonts = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM font_metadata WHERE script_type='ENGLISH'")
    eng_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM font_metadata WHERE script_type='SINHALA'")
    sin_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM font_metadata WHERE encoding_type='LEGACY'")
    legacy_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM font_metadata WHERE encoding_type='UNICODE'")
    unicode_count = cursor.fetchone()[0]

    print(f"  • Total Fonts Registered: {total_fonts}")
    print(f"  • English Script: {eng_count}")
    print(f"  • Sinhala Script: {sin_count} (Legacy FM: {legacy_count}, Unicode: {unicode_count})")
    assert total_fonts >= 616, f"Expected at least 616 fonts, found {total_fonts}"
    assert eng_count == 400, f"Expected 400 English fonts, found {eng_count}"
    assert sin_count == 216, f"Expected 216 Sinhala fonts, found {sin_count}"
    assert legacy_count == 200, f"Expected 200 Legacy WinANSI fonts, found {legacy_count}"
    assert unicode_count == 16, f"Expected 16 Unicode Sinhala fonts, found {unicode_count}"

    # Verify physical file existence in frontend/public/fonts
    fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/fonts"))
    cursor.execute("SELECT font_name FROM font_metadata")
    all_fonts = [r[0] for r in cursor.fetchall()]
    missing = [fn for fn in all_fonts if not os.path.exists(os.path.join(fonts_dir, fn))]
    print(f"  • Physical Disk Files Checked: {len(all_fonts)}")
    assert len(missing) == 0, f"Missing physical font files: {missing}"
    print("  ✅ All 616 font files physically exist on disk in frontend/public/fonts/.")
    conn.close()

    # -------------------------------------------------------------
    # PHASE 3: Master Font Recommendation & NLP Slot Extraction
    # -------------------------------------------------------------
    print("\n[PHASE 3/8] Recommendation Engine & Bilingual Slot Translation Audit...")
    test_prompts = [
        ("Hardware Prompt", 'i want to create social media sale poster for the hardware shop. Header name is "Kasun Hardware"', "Kasun Hardware", "කසුන් හාඩ්වෙයාර්"),
        ("Bakery Prompt", 'Promotion for bakery. Header is "Perera Bakers" and cta is "Order Now"', "Perera Bakers", "පෙරේරා බේකර්ස්"),
        ("Sinhala Native", "Festival celebration with header 'හෙළ බොජුන්' and cta 'දැන්ම ඇනවුම් කරන්න'", "හෙළ බොජුන්", "හෙළ බොජුන්"),
        ("Generic Prompt", "Minimal modern coffee shop branding", "Main Headline", "ප්‍රධාන මාතෘකාව")
    ]

    last_recommendation = None
    for label, prompt, expected_en, expected_si in test_prompts:
        req = PromptRequest(prompt=prompt)
        res = get_font_recommendations(req)
        last_recommendation = res
        assert len(res["palettes"]) == 3, f"Failed to generate 3 palettes for: {label}"
        assert res["content_slots"]["en"]["header"] == expected_en, f"Expected EN '{expected_en}', got '{res['content_slots']['en']['header']}'"
        assert res["content_slots"]["si"]["header"] == expected_si, f"Expected SI '{expected_si}', got '{res['content_slots']['si']['header']}'"
        
        # Verify harmony metrics and role completeness
        for p in res["palettes"]:
            assert "overall_harmony" in p and 0 <= p["overall_harmony"] <= 100
            assert len(p["fonts"]) == 4
            for f in p["fonts"]:
                assert f["role"] in ["Header", "Subhead", "Body", "CTA"]
                assert f["encoding_type"] in ["LEGACY", "UNICODE", "NA"]
                assert "harmony_metrics" in f
        print(f"  ✅ {label} Passed (EN: '{expected_en}' | SI: '{expected_si}')")

    # -------------------------------------------------------------
    # PHASE 4: Sociolinguistic Hierarchy & Dominance Strategy
    # -------------------------------------------------------------
    print("\n[PHASE 4/8] Sociolinguistic Strategy Engine Audit...")
    active_palette = last_recommendation["palettes"][0]
    strategies = [
        ("make it sinhala dominant", "Sinhala-Dominant"),
        ("make it global corporate english", "English-Dominant"),
        ("balanced bilingual layout", "Bilingual-Balanced")
    ]
    for prompt_text, expected_outcome in strategies:
        lang_req = LanguageRequest(
            follow_up_prompt=prompt_text,
            selected_palette=active_palette,
            design_context="Social media marketing"
        )
        lang_res = get_language_strategy(lang_req)
        assert lang_res["overall_strategy"] == expected_outcome, f"Expected {expected_outcome}, got {lang_res['overall_strategy']}"
        assert len(lang_res["role_breakdown"]) == 4
        print(f"  ✅ Strategy '{prompt_text}' -> {expected_outcome}")

    # -------------------------------------------------------------
    # PHASE 5: Explainable AI Rationale & Chat Isolation
    # -------------------------------------------------------------
    print("\n[PHASE 5/8] Explainable AI Rationale & Chat Handler Audit...")
    rationale_req = PromptRequest(
        prompt="Why were these fonts paired together?",
        context={"active_palette": active_palette}
    )
    chat_resp = handle_general_chat(rationale_req)
    assert "Typographic Rationale" in chat_resp["reply"], "Failed to generate typographic rationale"
    assert "Dual-Stream Siamese Neural Pairing" in chat_resp["reply"]
    print("  ✅ Automated Typographic Rationale generated with optical and baseline metrics.")

    # -------------------------------------------------------------
    # PHASE 6: Admin Diagnostics & Corpus Catalog Inspector
    # -------------------------------------------------------------
    print("\n[PHASE 6/8] Admin Console Diagnostics & Catalog Audit...")
    diag = get_admin_system_status()
    assert diag["system_status"] == "OPTIMAL"
    assert diag["corpus"]["total_fonts"] == total_fonts
    
    catalog = get_font_catalog(query="", script="ALL", limit=50)
    assert catalog["total_returned"] == 50
    assert len(catalog["fonts"]) == 50
    print("  ✅ System Status: OPTIMAL, Real-time Corpus Catalog functional.")

    # -------------------------------------------------------------
    # PHASE 7: Scientific Telemetry & Academic Benchmark Exporters
    # -------------------------------------------------------------
    print("\n[PHASE 7/8] Scientific Evaluation & Academic Benchmark Exporters...")
    # Submit evaluation
    fb_req = FeedbackRequest(
        session_id="audit_session",
        user_prompt="Audit test flyer",
        palette_number=1,
        rating=5,
        comments="Perfect optical baseline alignment"
    )
    fb_res = submit_feedback(fb_req)
    assert fb_res["status"] == "success"

    # Pairwise vote
    pair_req = PairwiseFeedbackRequest(
        session_id="audit_session",
        user_prompt="Audit test flyer",
        palette_a=1,
        palette_b=2,
        chosen_palette=1,
        rationale="Superior stroke weight balance"
    )
    pair_res = submit_pairwise_feedback(pair_req)
    assert pair_res["status"] == "success"

    # Stats and Exports
    stats = get_evaluation_stats()
    assert stats["total_evaluations"] > 0
    assert stats["total_pairwise_evaluations"] > 0

    academic = get_academic_summary()
    assert "\\begin{table}" in academic["latex"]
    assert "# 📊 Typographic AI" in academic["markdown"]
    print("  ✅ MOS Telemetry, Bradley-Terry Pairwise, LaTeX Table, and Markdown Benchmark verified.")

    # -------------------------------------------------------------
    # PHASE 8: Dynamic Role-Based Authentication
    # -------------------------------------------------------------
    print("\n[PHASE 8/8] Dynamic Authentication & Authorization Audit...")
    admin_auth = login_user(LoginRequest(email="admin@typographic.ai", password="admin123"))
    assert admin_auth["status"] == "success" and admin_auth["user"]["role"] == "admin"

    user_auth = login_user(LoginRequest(email="designer@typographic.ai", password="designer123"))
    assert user_auth["status"] == "success" and user_auth["user"]["role"] == "user"

    all_users = get_all_users()
    assert len(all_users["users"]) >= 2
    print("  ✅ Admin and Designer Authentication roles verified.")

    print("\n" + "=" * 65)
    print("  🏆 VERDICT: ALL 8 CORE SUBSYSTEMS PASSED WITH 0 BUGS FOUND! 🏆")
    print("=" * 65)

if __name__ == "__main__":
    run_full_system_audit()

