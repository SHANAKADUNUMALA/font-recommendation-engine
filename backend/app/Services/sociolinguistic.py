import re
from sentence_transformers import util
from app.Models import loader

def analyze_language_strategy(follow_up_prompt: str, selected_palette: dict, design_context: str = None):
    """
    Analyzes intent and maps language preferences to specific layout roles.
    Uses deterministic keyword priority, previous design context memory, and SBERT semantic anchor comparison.
    """
    if loader.sbert_model is None:
        raise RuntimeError("SBERT model not loaded.")

    clean_prompt = follow_up_prompt.lower()
    
    # Extract prior design context from argument or palette memory
    resolved_context = (design_context or selected_palette.get("userPrompt") or "").strip()
    clean_context = resolved_context.lower()

    # 1. Strictly explicit language direction commands in follow-up prompt
    explicit_sinhala = ["sinhala", "local language", "domestic language", "prefer sinhala", "sinhala only", "sinhala dominant", "sinhala-dominant", "more sinhala", "local", "traditional", "cultural"]
    explicit_english = ["english", "global language", "international language", "prefer english", "english only", "english dominant", "english-dominant", "more english", "global", "corporate", "international"]
    explicit_bilingual = ["bilingual", "balanced", "bilingual-balanced", "both languages", "equal weight", "dual language", "both", "equal"]

    has_explicit_balanced = any(re.search(rf"\b{kw}\b", clean_prompt) for kw in explicit_bilingual)
    has_explicit_local = any(re.search(rf"\b{kw}\b", clean_prompt) for kw in explicit_sinhala)
    has_explicit_global = any(re.search(rf"\b{kw}\b", clean_prompt) for kw in explicit_english)

    target_name = resolved_context if resolved_context else "this design"

    if has_explicit_balanced:
        strategy = "Bilingual-Balanced"
        rationale = f"User explicitly requested a balanced bilingual layout for \"{target_name}\", giving equal visual priority to both English and Sinhala."
    elif has_explicit_local:
        strategy = "Sinhala-Dominant"
        rationale = f"User explicitly requested a local/traditional Sinhala-dominant strategy for \"{target_name}\" to prioritize authentic cultural resonance."
    elif has_explicit_global:
        strategy = "English-Dominant"
        rationale = f"User explicitly requested a global/corporate English-dominant strategy for \"{target_name}\" to establish a strong international commercial hierarchy."
    else:
        # 2. Context-Aware Evaluation: User is inquiring about language preferences for their design
        context_target = clean_context if clean_context else clean_prompt

        is_traditional = bool(re.search(r"\b(traditional|heritage|village|cultural|temple|ayurveda|native|folk|classic)\b", context_target))
        is_modern = bool(re.search(r"\b(modern|tech|corporate|software|startup|luxury|premium|global|international)\b", context_target))
        is_hospitality = bool(re.search(r"\b(hotel|resort|villa|spa|wellness|hospitality|tourism|restaurant|cafe|coffee|dining|bakery)\b", context_target))

        if is_traditional:
            strategy = "Sinhala-Dominant"
            rationale = f"Based on the traditional/cultural nature of \"{target_name}\", a Sinhala-Dominant hierarchy is recommended to establish immediate local resonance."
        elif is_hospitality and is_modern:
            strategy = "English-Dominant"
            rationale = f"For a modern hospitality/spa campaign (\"{target_name}\"), an English-Dominant hierarchy is recommended: an English Header provides international booking discoverability, while localized Sinhala Subhead and Body elements warmly engage domestic travelers."
        elif is_hospitality:
            strategy = "Bilingual-Balanced"
            rationale = f"For a hospitality campaign (\"{target_name}\"), a Bilingual-Balanced hierarchy ensures equal engagement for both international travelers (English) and domestic guests (Sinhala)."
        elif is_modern:
            strategy = "English-Dominant"
            rationale = f"For a modern/contemporary campaign (\"{target_name}\"), an English-Dominant hierarchy establishes clean commercial readability."
        else:
            # SBERT Semantic Anchor Similarity Fallback
            prompt_emb = loader.sbert_model.encode(context_target, convert_to_tensor=True)
            concept_local = loader.sbert_model.encode(
                "local cultural traditional community grassroots heritage rural domestic sinhala sri lanka",
                convert_to_tensor=True
            )
            concept_global = loader.sbert_model.encode(
                "global corporate international tech modern business foreign english premium",
                convert_to_tensor=True
            )

            score_local = util.cos_sim(prompt_emb, concept_local).item()
            score_global = util.cos_sim(prompt_emb, concept_global).item()

            if score_local > score_global + 0.03:
                strategy = "Sinhala-Dominant"
                rationale = "Semantic analysis indicates strong alignment with local cultural themes."
            elif score_global > score_local + 0.03:
                strategy = "English-Dominant"
                rationale = "Semantic analysis indicates strong alignment with global commercial themes."
            else:
                strategy = "Bilingual-Balanced"
                rationale = "Semantic analysis indicates balanced bilingual audience appeal."

    # 3. Map strategy across typographic hierarchy roles
    role_breakdown = []
    fonts = selected_palette.get("fonts", [])

    for font_data in fonts:
        role = font_data["role"]

        if strategy == "Sinhala-Dominant":
            if role == "Header":
                lang = "Sinhala"
                exp = "Establishes an authentic, local cultural identity immediately."
                font_name = font_data["sinhala_font"]
                size = font_data["sinhala_size"]
            elif role == "Subhead":
                lang = "English"
                exp = "Provides a clear translation or secondary description for a broader audience."
                font_name = font_data["english_font"]
                size = font_data["english_size"]
            elif role == "Body":
                lang = "Sinhala"
                exp = "Maintains the traditional warmth and storytelling when describing local details."
                font_name = font_data["sinhala_font"]
                size = font_data["sinhala_size"]
            else:  # CTA
                lang = "English"
                exp = "Ensures direct, high-contrast, and universally understood action."
                font_name = font_data["english_font"]
                size = font_data["english_size"]

        elif strategy == "English-Dominant":
            if role == "Header":
                lang = "English"
                exp = "Establishes a global, premium corporate hierarchy."
                font_name = font_data["english_font"]
                size = font_data["english_size"]
            elif role == "Subhead":
                lang = "Sinhala"
                exp = "Provides localized context without disrupting the global header."
                font_name = font_data["sinhala_font"]
                size = font_data["sinhala_size"]
            elif role == "Body":
                lang = "English"
                exp = "Maintains clean, modern readability for technical or corporate details."
                font_name = font_data["english_font"]
                size = font_data["english_size"]
            else:  # CTA
                lang = "English"
                exp = "Drives immediate action in the primary corporate language."
                font_name = font_data["english_font"]
                size = font_data["english_size"]

        else:  # Bilingual-Balanced
            lang = "Bilingual"
            exp = "Requires equal visual weight between Sinhala and English."
            font_name = f"{font_data['english_font']} + {font_data['sinhala_font']}"
            size = font_data["english_size"]

        weight = 700 if role in ["Header", "CTA"] else (500 if role == "Subhead" else 400)

        role_breakdown.append({
            "role": role,
            "language_preference": lang,
            "explanation": exp,
            "recommended_font": font_name,
            "layout_specs": f"Size: {size}px | Weight: {weight}"
        })

    return {
        "overall_strategy": strategy,
        "design_context": resolved_context or "Previous Design",
        "strategic_rationale": rationale,
        "role_breakdown": role_breakdown
    }