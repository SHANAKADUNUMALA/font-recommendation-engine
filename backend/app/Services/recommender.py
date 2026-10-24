import re
import torch
import torch.nn.functional as F
import numpy as np
from sentence_transformers import util

from app.Models import loader
from app.db.repository import fetch_fonts_by_script
from app.Services.intent_analyzer import analyze_intent
from app.Services.slot_extractor import extract_content_slots
from app.Core.config import DESIGN_RULES

# Cache for static Sinhala font embeddings to avoid re-querying SQLite and re-projecting on every call
_cached_sin_fonts = None
_cached_sin_embeddings = None

def invalidate_font_cache():
    """Invalidates the in-memory Siamese embedding cache when new fonts are ingested."""
    global _cached_sin_fonts, _cached_sin_embeddings
    _cached_sin_fonts = None
    _cached_sin_embeddings = None

def get_cached_sinhala_embeddings(device):
    global _cached_sin_fonts, _cached_sin_embeddings
    if _cached_sin_fonts is None or _cached_sin_embeddings is None or _cached_sin_embeddings.device != device:
        _cached_sin_fonts = fetch_fonts_by_script("SINHALA")
        sin_vectors = np.array([combine_vectors(s) for s in _cached_sin_fonts])
        sin_tensors = torch.tensor(sin_vectors, dtype=torch.float32).to(device)
        with torch.no_grad():
            _cached_sin_embeddings = loader.siamese_model.forward_one(sin_tensors)
    return _cached_sin_fonts, _cached_sin_embeddings

def get_typographic_penalties(en_font, si_font):
    """Calculates physical baseline alignment penalties with None-safety."""
    en_cap = en_font.get('cap_height')
    si_cap = si_font.get('cap_height')
    en_x = en_font.get('x_height')
    si_x = si_font.get('x_height')

    if not en_cap or not si_cap or not en_x or not si_x:
        return 0.0, 1.0

    en_norm_x = en_x / en_cap
    si_norm_x = si_x / si_cap

    x_max = max(en_norm_x, si_norm_x)
    x_ratio = min(en_norm_x, si_norm_x) / x_max if x_max > 0 else 1.0

    en_bbox = en_font.get('bounding_box_ratio') or 1.0
    si_bbox = si_font.get('bounding_box_ratio') or 1.0
    w_max = max(en_bbox, si_bbox)
    w_ratio = min(en_bbox, si_bbox) / w_max if w_max > 0 else 1.0

    x_penalty = 0.0 if x_ratio >= 0.90 else (0.90 - x_ratio) * 10
    w_penalty = 0.0 if w_ratio >= 0.75 else (0.75 - w_ratio) * 2 

    return (x_penalty + w_penalty), x_ratio

def compute_typographic_harmony(eng_font, sin_font):
    """
    Computes a 5-axis Explainable AI (XAI) typographic harmony profile:
    1. x_height_alignment (Optical x-height to cap-height ratio)
    2. geometric_cohesion (ResNet-18 visual feature cosine similarity)
    3. stroke_weight_balance (Stroke weight proportion)
    4. semantic_mood_match (SBERT semantic cosine similarity)
    5. bounding_box_symmetry (Bounding box aspect ratio balance)
    Returns: dict of normalized percentages [0-100] and overall_harmony score [0-100].
    """
    en_cap = eng_font.get('cap_height') or 1000.0
    si_cap = sin_font.get('cap_height') or 1000.0
    en_x = eng_font.get('x_height') or 500.0
    si_x = sin_font.get('x_height') or 500.0

    en_norm_x = en_x / en_cap
    si_norm_x = si_x / si_cap
    x_max = max(en_norm_x, si_norm_x)
    x_ratio = min(en_norm_x, si_norm_x) / x_max if x_max > 0 else 1.0
    x_score = round(x_ratio * 100.0, 1)

    en_vis = eng_font.get('visual_feature_vector')
    si_vis = sin_font.get('visual_feature_vector')
    if en_vis is not None and si_vis is not None:
        dot = float(np.dot(en_vis, si_vis))
        norm_e = float(np.linalg.norm(en_vis))
        norm_s = float(np.linalg.norm(si_vis))
        cos_vis = dot / (norm_e * norm_s) if (norm_e * norm_s) > 0 else 0.8
        geo_score = round(float(np.clip((cos_vis + 0.2) / 1.2 * 100.0, 65.0, 99.0)), 1)
    else:
        geo_score = 86.0

    en_sw = float(eng_font.get('stroke_weight') or 400.0)
    si_sw = float(sin_font.get('stroke_weight') or 400.0)
    # Unit normalization: legacy Sinhala stroke_weights <= 30 in fonts.db represent pixel stem width (5px - 20px)
    if si_sw <= 30.0:
        si_sw = 300.0 + (si_sw / 20.0) * 500.0
    sw_max = max(en_sw, si_sw)
    sw_ratio = min(en_sw, si_sw) / sw_max if sw_max > 0 else 1.0
    sw_score = round(sw_ratio * 100.0, 1)

    en_sem = eng_font.get('sbert_feature_vector')
    si_sem = sin_font.get('sbert_feature_vector')
    if en_sem is not None and si_sem is not None:
        dot_sem = float(np.dot(en_sem, si_sem))
        norm_se = float(np.linalg.norm(en_sem))
        norm_ss = float(np.linalg.norm(si_sem))
        cos_sem = dot_sem / (norm_se * norm_ss) if (norm_se * norm_ss) > 0 else 0.55
        # Cross-lingual SBERT embeddings across English and Sinhala descriptions run in 0.45..0.65
        sem_score = round(float(np.clip(70.0 + ((cos_sem - 0.45) / 0.20) * 28.0, 68.0, 99.0)), 1)
    else:
        sem_score = 88.0

    en_bbox = eng_font.get('bounding_box_ratio') or 1.0
    si_bbox = sin_font.get('bounding_box_ratio') or 1.0
    bbox_max = max(en_bbox, si_bbox)
    bbox_ratio = min(en_bbox, si_bbox) / bbox_max if bbox_max > 0 else 1.0
    bbox_score = round(bbox_ratio * 100.0, 1)

    overall = round((x_score + geo_score + sw_score + sem_score + bbox_score) / 5.0, 1)

    return {
        "x_height_alignment": x_score,
        "geometric_cohesion": geo_score,
        "stroke_weight_balance": sw_score,
        "semantic_mood_match": sem_score,
        "bounding_box_symmetry": bbox_score,
        "overall_harmony": overall
    }

def combine_vectors(font):
    vis = font.get('visual_feature_vector', np.zeros(512, dtype=np.float32))
    sem = font.get('sbert_feature_vector', np.zeros(384, dtype=np.float32))
    return np.concatenate([vis, sem])

def disentangle_query(user_prompt: str):
    """
    Splits the user prompt into Brand Identity and Campaign Context
    to prevent semantic drag during SBERT font scoring.
    """
    campaign_keywords = DESIGN_RULES.get('campaign_keywords', [])
    lower = user_prompt.lower()

    # Extract detected campaign tokens
    found_campaign = [kw for kw in campaign_keywords if kw in lower]
    campaign_part = " ".join(found_campaign)

    # Remove campaign tokens, punctuation, and structural words from the brand query
    cleaned_brand = lower
    for kw in found_campaign:
        cleaned_brand = re.sub(rf'\b{re.escape(kw)}\b', '', cleaned_brand)

    structural_words = ["i want to create", "create", "social media", "post", "poster", "for", "a", "an"]
    for sw in structural_words:
        cleaned_brand = re.sub(rf'\b{re.escape(sw)}\b', '', cleaned_brand)

    brand_part = " ".join(cleaned_brand.split())
    if not brand_part:
        brand_part = user_prompt  # Fallback to full prompt if empty

    return brand_part, campaign_part

def resolve_platform_and_scale(user_prompt: str):
    """
    Detects target social media platform (defaults to Facebook) and
    calculates canvas dimensions, modular scale ratio, and base font sizes.
    """
    lower = user_prompt.lower()
    platforms_cfg = DESIGN_RULES.get('platforms', {})
    scales_cfg = DESIGN_RULES.get('modular_scales', {})

    selected_platform_key = "facebook"
    for p_key, p_val in platforms_cfg.items():
        if any(kw in lower for kw in p_val.get('keywords', [])):
            selected_platform_key = p_key
            break

    platform_data = platforms_cfg[selected_platform_key]
    canvas = platform_data['canvas']

    scale_category = "standard"
    if any(kw in lower for kw in scales_cfg['high_impact']['keywords']):
        scale_category = "high_impact"
    elif any(kw in lower for kw in scales_cfg['dense_info']['keywords']):
        scale_category = "dense_info"

    ratio = scales_cfg[scale_category]['ratio']
    base_sizes = platform_data['base_font_sizes'][scale_category]
    base_en = base_sizes['base_en']
    base_si = base_sizes['base_si']

    return {
        "platform": selected_platform_key,
        "canvas_width": canvas['width'],
        "canvas_height": canvas['height'],
        "ratio": ratio,
        "base_en": base_en,
        "base_si": base_si
    }

def generate_palettes(user_prompt: str):
    """Executes the dual-stream pipeline and returns Top-3 typographic palettes with disentangled semantic weights and content slots."""
    intent_data = analyze_intent(user_prompt)
    header_target = intent_data['header_target']
    body_target = intent_data['body_target']

    eng_fonts = fetch_fonts_by_script("ENGLISH")

    header_candidates = [f for f in eng_fonts if f.get('typographic_style') == header_target]
    body_candidates = [f for f in eng_fonts if f.get('typographic_style') == body_target]

    header_families = {}
    for f in header_candidates:
        family = f['font_name'].split('-')[0] if '-' in f['font_name'] else f['font_name']
        header_families.setdefault(family, []).append(f)

    body_families = {}
    for f in body_candidates:
        family = f['font_name'].split('-')[0] if '-' in f['font_name'] else f['font_name']
        body_families.setdefault(family, []).append(f)

    device = next(loader.siamese_model.parameters()).device

    # Query Disentanglement: Compute Brand (70%) and Campaign (30%) Embeddings
    brand_query, campaign_query = disentangle_query(user_prompt)
    brand_emb = loader.sbert_model.encode(brand_query, convert_to_tensor=True).to(device)
    campaign_emb = loader.sbert_model.encode(campaign_query, convert_to_tensor=True).to(device) if campaign_query else None

    def get_family_score(family_list):
        vectors = [f['sbert_feature_vector'] for f in family_list if f.get('sbert_feature_vector') is not None]
        if not vectors: 
            return -1.0
        fam_tensor = torch.tensor(np.array(vectors), dtype=torch.float32).to(device)

        # 70% Brand Tone weight
        sim_brand = util.cos_sim(brand_emb, fam_tensor)
        brand_score = torch.max(sim_brand).item()

        if campaign_emb is not None:
            # 30% Campaign Context weight
            sim_campaign = util.cos_sim(campaign_emb, fam_tensor)
            campaign_score = torch.max(sim_campaign).item()
            return (0.70 * brand_score) + (0.30 * campaign_score)

        return brand_score

    sorted_headers = sorted(header_families.items(), key=lambda x: get_family_score(x[1]), reverse=True)
    sorted_bodies = sorted(body_families.items(), key=lambda x: get_family_score(x[1]), reverse=True)

    sin_fonts, sin_embeddings = get_cached_sinhala_embeddings(device)

    palettes = []

    # Dynamic modular scale & platform resolver
    spec = resolve_platform_and_scale(user_prompt)
    ratio = spec["ratio"]
    base_en = spec["base_en"]
    base_si = spec["base_si"]

    roles = [
        {
            "name": "Header", 
            "weights": ["Bold", "SemiBold", "Black"], 
            "size": int(base_en * (ratio ** 3)), 
            "si_size": int(base_si * (ratio ** 3))
        },
        {
            "name": "Subhead", 
            "weights": ["Medium", "Regular"], 
            "size": int(base_en * (ratio ** 2)), 
            "si_size": int(base_si * (ratio ** 2))
        },
        {
            "name": "Body", 
            "weights": ["Regular", "Light", "Thin"], 
            "size": base_en, 
            "si_size": base_si
        },
        {
            "name": "CTA", 
            "weights": ["Bold", "SemiBold", "Medium"], 
            "size": int(base_en * ratio), 
            "si_size": int(base_si * ratio)
        }
    ]

    globally_used_sinhala = set()
    used_sinhala_by_role = {r["name"]: set() for r in roles}

    for i in range(3):
        if i >= len(sorted_headers) or i >= len(sorted_bodies): 
            break

        h_fam_name, h_fam_list = sorted_headers[i]
        b_fam_name, b_fam_list = sorted_bodies[i]

        palette_fonts = []
        palette_used_sinhala = set()  # Scope Sinhala uniqueness per palette
        palette_used_english = set()  # Ensure distinct weights/variants within palette

        for role in roles:
            role_name = role["name"]
            active_pool = h_fam_list if role_name in ["Header", "CTA"] else b_fam_list
            unused_active = [f for f in active_pool if f['font_name'] not in palette_used_english]
            
            # Prioritize an unused font matching role weights
            eng_font = next((f for f in unused_active if any(w.lower() in f['font_name'].lower() for w in role["weights"])), None)
            if not eng_font and unused_active:
                eng_font = unused_active[0]
            if not eng_font and role_name == "CTA":
                # Fallback to bold/medium from body family if header family had only one weight
                unused_alt = [f for f in b_fam_list if f['font_name'] not in palette_used_english]
                eng_font = next((f for f in unused_alt if any(w.lower() in f['font_name'].lower() for w in role["weights"])), None)
                if not eng_font and unused_alt:
                    eng_font = unused_alt[0]
            if not eng_font:
                eng_font = next((f for f in active_pool if any(w.lower() in f['font_name'].lower() for w in role["weights"])), active_pool[0])
            
            palette_used_english.add(eng_font['font_name'])

            eng_combined = combine_vectors(eng_font)
            eng_tensor = torch.tensor(eng_combined, dtype=torch.float32).unsqueeze(0).to(device)

            with torch.no_grad():
                eng_emb = loader.siamese_model.forward_one(eng_tensor)
                distances = F.pairwise_distance(eng_emb.expand_as(sin_embeddings), sin_embeddings).cpu().numpy()

            scored_candidates = []
            for idx, sin_font in enumerate(sin_fonts):
                penalty, x_ratio = get_typographic_penalties(eng_font, sin_font)
                hybrid_score = distances[idx] + penalty
                scored_candidates.append((idx, hybrid_score, x_ratio))

            ranked = sorted(scored_candidates, key=lambda x: x[1])

            # Multi-tier selection for maximum visual diversity across palettes and roles
            best_candidate = None
            # Tier 1: Fresh Sinhala font never used in any palette yet, and not for this role
            for cand in ranked:
                s_name = sin_fonts[cand[0]]['font_name']
                if s_name not in globally_used_sinhala and s_name not in used_sinhala_by_role[role_name]:
                    best_candidate = cand
                    break
            # Tier 2: Not used for this role across palettes, and not in current palette
            if not best_candidate:
                for cand in ranked:
                    s_name = sin_fonts[cand[0]]['font_name']
                    if s_name not in used_sinhala_by_role[role_name] and s_name not in palette_used_sinhala:
                        best_candidate = cand
                        break
            # Tier 3: Unused in current palette
            if not best_candidate:
                for cand in ranked:
                    s_name = sin_fonts[cand[0]]['font_name']
                    if s_name not in palette_used_sinhala:
                        best_candidate = cand
                        break
            # Tier 4: Top ranked candidate
            if not best_candidate:
                best_candidate = ranked[0]

            best_sin = sin_fonts[best_candidate[0]]
            best_x_ratio = best_candidate[2]
            palette_used_sinhala.add(best_sin['font_name'])
            globally_used_sinhala.add(best_sin['font_name'])
            used_sinhala_by_role[role_name].add(best_sin['font_name'])

            harmony = compute_typographic_harmony(eng_font, best_sin)

            palette_fonts.append({
                "role": role_name,
                "english_font": eng_font['font_name'],
                "sinhala_font": best_sin['font_name'],
                "encoding_type": best_sin.get('encoding_type', 'LEGACY'),
                "english_size": role["size"],
                "sinhala_size": role["si_size"],
                "x_ratio": round(best_x_ratio, 3),
                "harmony_metrics": harmony
            })

        avg_harmony = round(float(np.mean([f['harmony_metrics']['overall_harmony'] for f in palette_fonts])), 1) if palette_fonts else 85.0

        palettes.append({
            "palette_number": i + 1,
            "header_family": h_fam_name,
            "body_family": b_fam_name,
            "overall_harmony": avg_harmony,
            "fonts": palette_fonts
        })

    # Extract dynamic user-defined copy slots (Header, Subhead, Body, CTA)
    content_slots = extract_content_slots(user_prompt)

    return {
        "intent_analysis": intent_data,
        "platform_spec": {
            "platform": spec["platform"],
            "canvas_width": spec["canvas_width"],
            "canvas_height": spec["canvas_height"]
        },
        "content_slots": content_slots,
        "palettes": palettes
    }