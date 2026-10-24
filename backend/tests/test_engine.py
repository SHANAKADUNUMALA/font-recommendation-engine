import sys
import os
import unittest

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force offline mode for SBERT in test environment
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["ENABLE_FALLBACK_LLM"] = "False"

from app.Models.loader import load_ai_models
from app.Services.intent_analyzer import analyze_intent
from app.Services.slot_extractor import extract_content_slots, contains_sinhala, generate_sinhala_translation
from app.Services.recommender import (
    disentangle_query,
    resolve_platform_and_scale,
    get_typographic_penalties,
    generate_palettes
)
from app.Services.sociolinguistic import analyze_language_strategy
from app.Services.fallback_llm import get_fallback_response
from app.db.repository import get_db_connection

class TestTypographicAIEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Loads models once for all tests."""
        print("\n[SETUP] Initializing AI Models for automated test suite...")
        load_ai_models()
        print("[SETUP] Models loaded successfully.")

    def test_01_intent_analyzer_modern(self):
        res = analyze_intent("A modern minimal tech startup product launch")
        self.assertEqual(res["intent"], "Modern/Contemporary")
        self.assertEqual(res["header_target"], "Sans-Serif")
        self.assertEqual(res["body_target"], "Serif")
        self.assertIn("scores", res)

    def test_02_intent_analyzer_traditional(self):
        res = analyze_intent("Traditional vintage heritage cultural ceremony")
        self.assertEqual(res["intent"], "Traditional/Classic")
        self.assertEqual(res["header_target"], "Serif")
        self.assertEqual(res["body_target"], "Sans-Serif")

    def test_03_slot_extractor_default_wireframes(self):
        """Verify that prompts without explicit slot syntax retain clean independent wireframes."""
        res = extract_content_slots("Create a poster for a coffee shop")
        self.assertIn("en", res)
        self.assertIn("si", res)
        
        # Verify no Frankenstein sentence blending (e.g. English text mixed with Sinhala prepositions)
        self.assertEqual(res["en"]["header"], "Main Headline")
        self.assertEqual(res["si"]["header"], "ප්‍රධාන මාතෘකාව")
        self.assertEqual(res["si"]["subhead"], "ඔබේ ප්‍රවර්ධන වැකිය හෝ උප මාතෘකාව")
        self.assertEqual(res["si"]["body"], "වැඩිදුර විස්තර, සේවාවන් සහ අන්තර්ගතය මෙහි ඇතුළත් කරන්න.")
        self.assertEqual(res["si"]["cta"], "මෙතනින් පිවිසෙන්න")

    def test_04_slot_extractor_user_slots_translation(self):
        """Verify user slot parsing and domain dictionary translation."""
        prompt = "FB sales poster for food. Header name is yummy food and cta is order now"
        res = extract_content_slots(prompt)
        
        self.assertEqual(res["en"]["header"], "yummy food")
        self.assertEqual(res["si"]["header"], "රසවත් ආහාර")  # Translated via i18n
        self.assertEqual(res["en"]["cta"], "order now")
        self.assertEqual(res["si"]["cta"], "දැන්ම ඇනවුම් කරන්න")  # Translated via i18n
        # Unspecified slots must retain pristine Sinhala wireframe fallbacks
        self.assertEqual(res["si"]["subhead"], "ඔබේ ප්‍රවර්ධන වැකිය හෝ උප මාතෘකාව")

    def test_05_slot_extractor_sinhala_preservation(self):
        """Verify that user-provided Sinhala text is preserved without corruption."""
        self.assertTrue(contains_sinhala("හෙළ බොජුන්"))
        self.assertFalse(contains_sinhala("Hello World"))
        
        prompt = "Poster with header 'හෙළ බොජුන්' and cta 'order now'"
        res = extract_content_slots(prompt)
        self.assertEqual(res["en"]["header"], "හෙළ බොජුන්")
        self.assertEqual(res["si"]["header"], "හෙළ බොජුන්")

    def test_06_query_disentanglement(self):
        """Verify separating brand tone from promotional campaign keywords."""
        brand, campaign = disentangle_query("I want to create a social media post for modern luxury spa big sale holiday discount")
        self.assertIn("luxury spa", brand)
        self.assertIn("sale", campaign)
        self.assertIn("discount", campaign)

    def test_07_platform_and_scale_resolution(self):
        """Verify platform dimensions and modular ratio selection."""
        # Facebook default standard
        spec_fb = resolve_platform_and_scale("Social media post for a library")
        self.assertEqual(spec_fb["platform"], "facebook")
        self.assertEqual(spec_fb["canvas_width"], 1200)
        self.assertEqual(spec_fb["canvas_height"], 630)
        self.assertEqual(spec_fb["ratio"], 1.333)

        # Instagram high-impact sale
        spec_ig = resolve_platform_and_scale("Instagram poster for a mega sale discount")
        self.assertEqual(spec_ig["platform"], "instagram")
        self.assertEqual(spec_ig["canvas_width"], 1080)
        self.assertEqual(spec_ig["canvas_height"], 1080)
        self.assertEqual(spec_ig["ratio"], 1.618)

    def test_08_typographic_penalties(self):
        """Verify None-safety and ratio penalty calculation."""
        font_a = {"cap_height": 1000, "x_height": 500, "bounding_box_ratio": 0.8}
        font_b = {"cap_height": 1000, "x_height": 480, "bounding_box_ratio": 0.78}
        penalty, x_ratio = get_typographic_penalties(font_a, font_b)
        self.assertIsInstance(penalty, float)
        self.assertGreaterEqual(x_ratio, 0.0)

        # Incomplete metrics safety
        font_none = {"cap_height": None, "x_height": None, "bounding_box_ratio": None}
        p_safe, r_safe = get_typographic_penalties(font_a, font_none)
        self.assertEqual(p_safe, 0.0)
        self.assertEqual(r_safe, 1.0)

    def test_09_full_recommender_pipeline(self):
        """Verify end-to-end recommendation generates 3 complete palettes."""
        res = generate_palettes("Instagram poster for a modern boutique cafe. Header is Fresh Brew")
        self.assertIn("palettes", res)
        self.assertEqual(len(res["palettes"]), 3)
        self.assertIn("platform_spec", res)
        self.assertIn("content_slots", res)
        
        for p in res["palettes"]:
            self.assertIn("palette_number", p)
            self.assertIn("header_family", p)
            self.assertIn("body_family", p)
            self.assertEqual(len(p["fonts"]), 4)  # Header, Subhead, Body, CTA
            roles = [f["role"] for f in p["fonts"]]
            self.assertEqual(roles, ["Header", "Subhead", "Body", "CTA"])
            # Ensure English font sizes obey hierarchical order: Header > Subhead > CTA > Body
            f_map = {f["role"]: f["english_size"] for f in p["fonts"]}
            self.assertGreater(f_map["Header"], f_map["Subhead"])
            self.assertGreater(f_map["Subhead"], f_map["CTA"])
            self.assertGreater(f_map["CTA"], f_map["Body"])

    def test_10_sociolinguistic_strategy(self):
        """Verify deterministic language dominance mapping."""
        palette = {
            "fonts": [
                {"role": "Header", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 76, "sinhala_size": 84},
                {"role": "Subhead", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 47, "sinhala_size": 52},
                {"role": "Body", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 18, "sinhala_size": 20},
                {"role": "CTA", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 29, "sinhala_size": 32}
            ]
        }
        res_si = analyze_language_strategy("make it sinhala dominant", palette)
        self.assertEqual(res_si["overall_strategy"], "Sinhala-Dominant")

        res_en = analyze_language_strategy("make it english corporate", palette)
        self.assertEqual(res_en["overall_strategy"], "English-Dominant")

        res_bi = analyze_language_strategy("keep it balanced bilingual", palette)
        self.assertEqual(res_bi["overall_strategy"], "Bilingual-Balanced")

    def test_11_fallback_llm_isolation(self):
        """Verify fallback returns safe message when disabled without crashing."""
        reply = get_fallback_response("What is typography?")
        self.assertIsInstance(reply, str)
        self.assertGreater(len(reply), 10)

    def test_12_evaluation_db_connection(self):
        """Verify SQLite evaluation telemetry connectivity."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in cursor.fetchall()]
        conn.close()
        self.assertIn("font_metadata", tables)

    def test_13_context_aware_language_strategy_memory(self):
        """Verify that language preferences reference previous design context from session memory."""
        palette = {
            "userPrompt": "i want to create social media poster for hotel",
            "fonts": [
                {"role": "Header", "english_font": "PassionOne-Black.ttf", "sinhala_font": "akasa_v.ttf", "english_size": 76, "sinhala_size": 84},
                {"role": "Subhead", "english_font": "Taviraj-Medium.ttf", "sinhala_font": "akasa_derana.ttf", "english_size": 47, "sinhala_size": 52},
                {"role": "Body", "english_font": "Taviraj-Light.ttf", "sinhala_font": "akasa_apex.ttf", "english_size": 18, "sinhala_size": 20},
                {"role": "CTA", "english_font": "PassionOne-Bold.ttf", "sinhala_font": "akasa_araliya.ttf", "english_size": 29, "sinhala_size": 32}
            ]
        }
        res = analyze_language_strategy(
            "i want to language prefercnces for previouse hotel poster", 
            palette, 
            design_context="i want to create social media poster for hotel"
        )
        self.assertIn("overall_strategy", res)
        self.assertIn("role_breakdown", res)
        self.assertIn("strategic_rationale", res)
        self.assertIn("hotel", res["strategic_rationale"].lower())
        self.assertEqual(res["design_context"], "i want to create social media poster for hotel")

    def test_14_chat_context_formatting(self):
        """Verify that conversational chat prompts inject design memory and font details."""
        from app.Services.fallback_llm import format_contextual_prompt
        ctx = {
            "design_prompt": "i want to create social media poster for hotel",
            "platform": "facebook",
            "active_palette": {
                "palette_number": 1,
                "fonts": [{"role": "Header", "english_font": "PassionOne.ttf", "sinhala_font": "Akasa.ttf"}]
            }
        }
        prompt = format_contextual_prompt("Why did you pick PassionOne?", ctx)
        self.assertIn("CURRENT DESIGN SESSION MEMORY", prompt)
        self.assertIn("hotel", prompt)
        self.assertIn("PassionOne.ttf", prompt)

    def test_15_local_traditional_language_intent(self):
        """Verify Local/Traditional language preferences expect Sinhala-Dominant layout."""
        palette = {
            "userPrompt": "i want to create social media poster for hotel",
            "fonts": [
                {"role": "Header", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 76, "sinhala_size": 84},
                {"role": "Subhead", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 47, "sinhala_size": 52},
                {"role": "Body", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 18, "sinhala_size": 20},
                {"role": "CTA", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 29, "sinhala_size": 32}
            ]
        }
        # Direct intent prompt
        res1 = analyze_language_strategy("Please use local language preferences for this design.", palette)
        self.assertEqual(res1["overall_strategy"], "Sinhala-Dominant")

        # Benchmark meta-prompt
        res2 = analyze_language_strategy('Local/Traditional Intent: "Please use local language preferences for this design." (Expects Sinhala-Dominant layout)', palette)
        self.assertEqual(res2["overall_strategy"], "Sinhala-Dominant")

        # Verify role language assignments
        header_role = next(r for r in res1["role_breakdown"] if r["role"] == "Header")
        body_role = next(r for r in res1["role_breakdown"] if r["role"] == "Body")
        self.assertEqual(header_role["language_preference"], "Sinhala")
        self.assertEqual(body_role["language_preference"], "Sinhala")

    def test_16_global_corporate_language_intent(self):
        """Verify Global/Corporate language preferences expect English-Dominant layout."""
        palette = {
            "userPrompt": "i want to create social media poster for hotel",
            "fonts": [
                {"role": "Header", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 76, "sinhala_size": 84},
                {"role": "Subhead", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 47, "sinhala_size": 52},
                {"role": "Body", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 18, "sinhala_size": 20},
                {"role": "CTA", "english_font": "A.ttf", "sinhala_font": "S.ttf", "english_size": 29, "sinhala_size": 32}
            ]
        }
        # Direct intent prompt
        res1 = analyze_language_strategy("Make the strategy feel very global and corporate.", palette)
        self.assertEqual(res1["overall_strategy"], "English-Dominant")

        # Benchmark meta-prompt
        res2 = analyze_language_strategy('8. Global/Corporate Intent: "Make the strategy feel very global and corporate." (Expects English-Dominant layout). this is related language prefrences. please handle this', palette)
        self.assertEqual(res2["overall_strategy"], "English-Dominant")

        # Verify role language assignments
        header_role = next(r for r in res1["role_breakdown"] if r["role"] == "Header")
        body_role = next(r for r in res1["role_breakdown"] if r["role"] == "Body")
        self.assertEqual(header_role["language_preference"], "English")
        self.assertEqual(body_role["language_preference"], "English")

    def test_17_typographic_rationale_query_detection(self):
        """Verify queries asking why fonts were paired or asking for rationale are accurately detected."""
        from app.Services.fallback_llm import is_typographic_rationale_query
        self.assertTrue(is_typographic_rationale_query("Why were these fonts paired together?"))
        self.assertTrue(is_typographic_rationale_query("typographic rationale"))
        self.assertTrue(is_typographic_rationale_query("Explain the font pairing"))
        self.assertTrue(is_typographic_rationale_query("Why did you choose this font?"))
        self.assertFalse(is_typographic_rationale_query("Create a poster for a coffee shop"))

    def test_18_typographic_rationale_generation(self):
        """Verify typographic rationale generator builds a comprehensive breakdown from active palette."""
        from app.Services.fallback_llm import get_fallback_response
        palette = {
            "palette_number": 1,
            "header_family": "CabinCondensed",
            "body_family": "Halant",
            "userPrompt": "i want to create social media poster for hotel",
            "fonts": [
                {"role": "Header", "english_font": "CabinCondensed-Bold.ttf", "sinhala_font": "akasa_kk.ttf", "english_size": 76, "sinhala_size": 84, "x_ratio": 1.0},
                {"role": "Subhead", "english_font": "Halant-Regular.ttf", "sinhala_font": "akasa_derana.ttf", "english_size": 47, "sinhala_size": 52, "x_ratio": 1.0},
                {"role": "Body", "english_font": "Halant-Light.ttf", "sinhala_font": "StickNoBills.ttf", "english_size": 18, "sinhala_size": 20, "x_ratio": 0.952},
                {"role": "CTA", "english_font": "CabinCondensed-SemiBold.ttf", "sinhala_font": "akasa_araliya.ttf", "english_size": 29, "sinhala_size": 32, "x_ratio": 1.0}
            ]
        }
        ctx = {
            "design_prompt": "i want to create social media poster for hotel",
            "platform": "facebook",
            "active_palette": palette
        }
        resp = get_fallback_response("Why were these fonts paired together?", context=ctx)
        self.assertIn("Typographic Rationale for Palette #1", resp)
        self.assertIn("Dual-Stream Siamese Neural Pairing", resp)
        self.assertIn("Physical Baseline Alignment", resp)
        self.assertIn("CabinCondensed-Bold", resp)
        self.assertIn("akasa_kk", resp)
        self.assertIn("100.0%", resp)

    def test_19_evaluation_telemetry_and_csv_export(self):
        """Verify evaluation stats and CSV exporter return proper research telemetry."""
        from app.api.V1.endpoints.evaluation import get_evaluation_stats, export_feedback_csv
        stats = get_evaluation_stats()
        self.assertIn("total_evaluations", stats)
        self.assertIn("average_rating", stats)
        self.assertIn("rating_distribution", stats)

        csv_resp = export_feedback_csv()
        self.assertEqual(csv_resp.status_code, 200)
        self.assertEqual(csv_resp.media_type, "text/csv")
        self.assertIn("user_prompt,palette_number,rating", csv_resp.body.decode("utf-8"))

    def test_20_encoding_type_in_recommendations(self):
        """Verify that recommended palettes contain encoding_type ('LEGACY' or 'UNICODE') for every Sinhala font."""
        from app.Services.recommender import generate_palettes
        res = generate_palettes("Modern luxury hotel branding poster")
        self.assertIn("palettes", res)
        self.assertGreater(len(res["palettes"]), 0)
        for palette in res["palettes"]:
            for font_item in palette["fonts"]:
                self.assertIn("encoding_type", font_item)
                self.assertIn(font_item["encoding_type"], ["LEGACY", "UNICODE"])

    def test_21_harmony_metrics_in_recommendations(self):
        """Verify that recommended palettes contain 5-axis Explainable AI harmony metrics and overall_harmony score."""
        from app.Services.recommender import generate_palettes
        res = generate_palettes("Modern luxury hotel branding poster")
        self.assertIn("palettes", res)
        for palette in res["palettes"]:
            self.assertIn("overall_harmony", palette)
            self.assertGreaterEqual(palette["overall_harmony"], 0.0)
            self.assertLessEqual(palette["overall_harmony"], 100.0)
            for font_item in palette["fonts"]:
                self.assertIn("harmony_metrics", font_item)
                hm = font_item["harmony_metrics"]
                for axis in ["x_height_alignment", "geometric_cohesion", "stroke_weight_balance", "semantic_mood_match", "bounding_box_symmetry", "overall_harmony"]:
                    self.assertIn(axis, hm)
                    self.assertGreaterEqual(hm[axis], 0.0)
                    self.assertLessEqual(hm[axis], 100.0)

    def test_22_pairwise_evaluation_endpoint(self):
        """Verify that pairwise comparative votes are recorded and reflected in evaluation stats."""
        from app.api.V1.endpoints.evaluation import submit_pairwise_feedback, get_evaluation_stats, PairwiseFeedbackRequest
        req = PairwiseFeedbackRequest(
            session_id="test_session_pairwise",
            user_prompt="Modern coffee shop flyer",
            palette_a=1,
            palette_b=2,
            chosen_palette=1,
            rationale="Better optical x-height alignment"
        )
        res = submit_pairwise_feedback(req)
        self.assertEqual(res["status"], "success")

        stats = get_evaluation_stats()
        self.assertIn("total_pairwise_evaluations", stats)
        self.assertGreater(stats["total_pairwise_evaluations"], 0)
        self.assertIn("recent_pairwise", stats)

    def test_23_academic_benchmark_exporters(self):
        """Verify that LaTeX and Markdown academic benchmark exporters generate valid benchmark reports."""
        from app.api.V1.endpoints.evaluation import get_academic_summary, export_latex_benchmark, export_markdown_benchmark
        summary = get_academic_summary()
        self.assertIn("latex", summary)
        self.assertIn("markdown", summary)
        self.assertIn("mean_mos", summary)
        self.assertIn("\\begin{table}", summary["latex"])
        self.assertIn("\\end{table}", summary["latex"])
        self.assertIn("# 📊 Typographic AI Empirical Evaluation Benchmark Report", summary["markdown"])

        latex_resp = export_latex_benchmark()
        self.assertEqual(latex_resp.media_type, "text/plain; charset=utf-8")
        self.assertIn(b"\\begin{table}", latex_resp.body)

        md_resp = export_markdown_benchmark()
        self.assertEqual(md_resp.media_type, "text/markdown; charset=utf-8")
        self.assertIn(b"# \xf0\x9f\x93\x8a Typographic AI", md_resp.body)

    def test_24_auth_endpoints(self):
        """Verify dynamic authentication for admin and designer/user roles."""
        from app.api.V1.endpoints.auth import login_user, register_user, LoginRequest, RegisterRequest
        # Admin login
        admin_req = LoginRequest(email="admin@typographic.ai", password="admin123")
        admin_res = login_user(admin_req)
        self.assertEqual(admin_res["status"], "success")
        self.assertEqual(admin_res["user"]["role"], "admin")

        # Designer login
        user_req = LoginRequest(email="designer@typographic.ai", password="designer123")
        user_res = login_user(user_req)
        self.assertEqual(user_res["status"], "success")
        self.assertEqual(user_res["user"]["role"], "user")

    def test_25_admin_console_endpoints(self):
        """Verify Admin Console endpoints: user management, system diagnostics, and font catalog."""
        from app.api.V1.endpoints.auth import get_all_users
        from app.main import get_admin_system_status, get_font_catalog

        # 1. Users list
        users_res = get_all_users()
        self.assertIn("users", users_res)
        self.assertGreaterEqual(len(users_res["users"]), 2)
        roles = [u["role"] for u in users_res["users"]]
        self.assertIn("admin", roles)
        self.assertIn("user", roles)

        # 2. System Status & Diagnostics
        status_res = get_admin_system_status()
        self.assertEqual(status_res["system_status"], "OPTIMAL")
        self.assertIn("models", status_res)
        self.assertIn("siamese_network", status_res["models"])
        self.assertIn("corpus", status_res)
        self.assertGreater(status_res["corpus"]["total_fonts"], 0)

        # 3. Font Catalog Inspector
        catalog_res = get_font_catalog(query="", script="ALL", limit=10)
        self.assertIn("fonts", catalog_res)
        self.assertGreater(len(catalog_res["fonts"]), 0)
        font = catalog_res["fonts"][0]
        self.assertIn("font_name", font)
        self.assertIn("script_type", font)
        self.assertIn("typographic_style", font)

    def test_26_font_analysis_and_ingestion(self):
        """Verify automated font analysis, visual and SBERT feature extraction, and database ingestion."""
        import os
        import numpy as np
        from app.Services.font_ingestion import analyze_font_bytes, generate_visual_vector, generate_sbert_vector, ingest_new_font
        from app.main import api_delete_font

        # 1. Analyze an English font
        eng_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/fonts/AlegreyaSC-Black.ttf"))
        with open(eng_path, "rb") as f:
            eng_bytes = f.read()

        analysis_eng = analyze_font_bytes(eng_bytes, "AlegreyaSC-Black.ttf")
        self.assertEqual(analysis_eng["script_type"], "ENGLISH")
        self.assertEqual(analysis_eng["encoding_type"], "NA")
        self.assertFalse(analysis_eng["has_sinhala_unicode"])
        self.assertGreater(analysis_eng["x_height"], 0)
        self.assertGreater(analysis_eng["cap_height"], 0)

        # 2. Analyze a Sinhala Unicode font
        sin_uni_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/fonts/akasa_abhayalibre-777bc7fa5a2fbd2e.ttf"))
        with open(sin_uni_path, "rb") as f:
            sin_uni_bytes = f.read()

        analysis_sin_uni = analyze_font_bytes(sin_uni_bytes, "akasa_abhayalibre.ttf")
        self.assertEqual(analysis_sin_uni["script_type"], "SINHALA")
        self.assertEqual(analysis_sin_uni["encoding_type"], "UNICODE")
        self.assertTrue(analysis_sin_uni["has_sinhala_unicode"])

        # 3. Analyze a Sinhala WinANSI Legacy font
        sin_leg_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/fonts/akasa_fm-bindux-266844da7a8ab24e.ttf"))
        with open(sin_leg_path, "rb") as f:
            sin_leg_bytes = f.read()

        analysis_sin_leg = analyze_font_bytes(sin_leg_bytes, "akasa_fm-bindux.ttf")
        self.assertEqual(analysis_sin_leg["script_type"], "SINHALA")
        self.assertEqual(analysis_sin_leg["encoding_type"], "LEGACY")
        self.assertFalse(analysis_sin_leg["has_sinhala_unicode"])

        # 4. Verify vector generation shapes and properties
        vis_vec = generate_visual_vector(eng_bytes, "ENGLISH", "NA", "Serif", 900.0)
        self.assertEqual(vis_vec.shape, (512,))
        self.assertGreater(float(np.linalg.norm(vis_vec)), 15.0)

        sem_vec = generate_sbert_vector("Alegreya SC", "ENGLISH", "NA", "Serif", "bold elegant display")
        self.assertEqual(sem_vec.shape, (384,))
        self.assertGreater(float(np.linalg.norm(sem_vec)), 0.0)

        # 5. Ingestion and deletion lifecycle
        test_font_name = "AutomatedTestFont-Regular.ttf"
        ingest_res = ingest_new_font(
            file_bytes=eng_bytes,
            filename=test_font_name,
            script_type="ENGLISH",
            encoding_type="NA",
            typographic_style="Sans-Serif",
            stroke_weight=400.0,
            x_height=520.0,
            cap_height=720.0,
            bounding_box_ratio=1.45,
            tags="test font verification"
        )
        self.assertTrue(ingest_res["success"])
        self.assertEqual(ingest_res["font"]["font_name"], test_font_name)

        # Clean up test font
        del_res = api_delete_font(test_font_name)
        self.assertTrue(del_res["success"])
        # Also remove physical file created
        test_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), f"../../frontend/public/fonts/{test_font_name}"))
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

    def test_27_duplicate_font_prevention(self):
        """Verify that attempting to add an already included .ttf font is strictly blocked."""
        import os
        from app.Services.font_ingestion import analyze_font_bytes, ingest_new_font

        # 1. Inspect an existing font file
        existing_font = "AlegreyaSC-Black.ttf"
        font_path = os.path.abspath(os.path.join(os.path.dirname(__file__), f"../../frontend/public/fonts/{existing_font}"))
        with open(font_path, "rb") as f:
            font_bytes = f.read()

        # Proactive duplicate detection
        analysis = analyze_font_bytes(font_bytes, existing_font)
        self.assertTrue(analysis["is_duplicate"])
        self.assertIsNotNone(analysis["duplicate_warning"])
        self.assertIn("already present", analysis["duplicate_warning"])

        # Also case-insensitive check
        analysis_lower = analyze_font_bytes(font_bytes, "algreyasc-black.ttf")
        # Ingestion level rejection
        with self.assertRaises(ValueError) as ctx:
            ingest_new_font(
                file_bytes=font_bytes,
                filename=existing_font,
                script_type="ENGLISH",
                encoding_type="NA",
                typographic_style="Sans-Serif",
                stroke_weight=900.0,
                x_height=512.0,
                cap_height=657.0,
                bounding_box_ratio=1.28
            )
        self.assertIn("already registered", str(ctx.exception))

    def test_28_english_brand_sinhala_slot_conversion(self):
        """Verify that informative prompts with English headers (e.g. 'Kasun Hardware') convert to Sinhala Unicode."""
        # 1. Exact prompt from user: "Kasun Hardware"
        prompt_kasun = 'i want to create social media sale poster for the hardware shop. Header name is "Kasun Hardware"'
        res_kasun = extract_content_slots(prompt_kasun)
        self.assertEqual(res_kasun["en"]["header"], "Kasun Hardware")
        self.assertEqual(res_kasun["si"]["header"], "කසුන් හාඩ්වෙයාර්")
        # Ensure default slots are intact
        self.assertEqual(res_kasun["si"]["subhead"], "ඔබේ ප්‍රවර්ධන වැකිය හෝ උප මාතෘකාව")
        self.assertEqual(res_kasun["si"]["cta"], "මෙතනින් පිවිසෙන්න")

        # 2. Additional commercial entities
        prompt_bakers = 'Promotion for bakery. Header is "Perera Bakers" and cta is "Order Now"'
        res_bakers = extract_content_slots(prompt_bakers)
        self.assertEqual(res_bakers["en"]["header"], "Perera Bakers")
        self.assertEqual(res_bakers["si"]["header"], "පෙරේරා බේකර්ස්")
        self.assertEqual(res_bakers["si"]["cta"], "දැන්ම ඇනවුම් කරන්න")

        prompt_motors = 'Poster with header "Nimal Motors"'
        res_motors = extract_content_slots(prompt_motors)
        self.assertEqual(res_motors["en"]["header"], "Nimal Motors")
        self.assertEqual(res_motors["si"]["header"], "නිමල් මෝටර්ස්")

if __name__ == "__main__":
    unittest.main(verbosity=2)




