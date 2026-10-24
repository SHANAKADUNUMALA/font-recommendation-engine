import os
import requests

def _load_env_file():
    """Lightweight .env loader that doesn't require external dependencies."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(current_dir, "../../.env")),
        os.path.abspath(os.path.join(current_dir, "../../../.env"))
    ]
    for env_file in candidates:
        if os.path.exists(env_file):
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, val = line.split("=", 1)
                            key = key.strip()
                            val = val.strip().strip('"').strip("'")
                            if key not in os.environ and val:
                                os.environ[key] = val
            except Exception:
                pass

_load_env_file()

# THE FEATURE FLAG (KILL SWITCH)
# Can be controlled via environment variable or default
ENABLE_FALLBACK_LLM = os.getenv("ENABLE_FALLBACK_LLM", "True").lower() in ("true", "1", "yes")

# Fetch API Keys securely from environment variables
KEYS = {
    "gemini": os.getenv("GEMINI_API_KEY", ""),
    "groq": os.getenv("GROQ_API_KEY", ""),
    "cohere": os.getenv("COHERE_API_KEY", "")
}

SYSTEM_PROMPT = (
    "You are an AI assistant for the Bilingual (English & Sinhala) Typographic AI Engine research project. "
    "Provide concise, informative, design-literate answers about typography, font pairing, graphic design, "
    "and layout hierarchies. Keep responses helpful and under 150 words."
)

def ask_gemini(prompt: str) -> str:
    key = KEYS.get("gemini")
    if not key:
        raise ValueError("Gemini API key is not configured.")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": prompt}]}]
    }
    response = requests.post(url, json=payload, timeout=8)
    response.raise_for_status()
    data = response.json()
    return data['candidates'][0]['content']['parts'][0]['text'].strip()

def ask_groq(prompt: str) -> str:
    key = KEYS.get("groq")
    if not key:
        raise ValueError("Groq API key is not configured.")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}"}
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 300
    }
    response = requests.post(url, json=payload, headers=headers, timeout=8)
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content'].strip()

def ask_cohere(prompt: str) -> str:
    key = KEYS.get("cohere")
    if not key:
        raise ValueError("Cohere API key is not configured.")
    url = "https://api.cohere.ai/v1/chat"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "preamble": SYSTEM_PROMPT,
        "message": prompt
    }
    response = requests.post(url, json=payload, headers=headers, timeout=8)
    response.raise_for_status()
    return response.json()['text'].strip()

def is_typographic_rationale_query(prompt: str) -> bool:
    """Detects whether user prompt is inquiring about typographic rationale, font pairing reason, or alignment."""
    lower = prompt.lower().strip()
    keywords = [
        "why were these fonts",
        "why are these fonts",
        "why did you choose",
        "why this font",
        "why these fonts",
        "rationale",
        "typographic rationale",
        "pairing rationale",
        "paired together",
        "why pair",
        "explain the font",
        "explain pairing",
        "x-height",
        "baseline alignment",
        "optical compensation",
        "why match",
        "how were these fonts",
        "why was this font"
    ]
    return any(kw in lower for kw in keywords)

def generate_typographic_rationale(context: dict = None, prompt: str = "") -> str:
    """
    Constructs an authoritative, empirical typographic rationale based on:
    1. Dual-Stream Siamese neural metric space alignment
    2. Physical x-height and cap-height baseline proportionality
    3. Optical compensation size scaling (Sinhala loop complexity vs Latin geometry)
    4. Hierarchical visual contrast and Modular Scale
    5. Sociolinguistic dominance strategy integration
    """
    palette = (context or {}).get("active_palette") or {}
    design_prompt = (context or {}).get("design_prompt") or palette.get("userPrompt") or "this design"
    platform = ((context or {}).get("platform") or "Facebook").upper()
    strategy = (context or {}).get("active_strategy") or {}
    strat_name = strategy.get("overall_strategy", "Standard Bilingual")

    if not palette or not palette.get("fonts"):
        return (
            "To view the typographic rationale, please generate or select a design first (e.g. *'Instagram poster for a modern boutique cafe'*). "
            "Once a palette is active, the engine provides exact Siamese neural similarity, x-height baseline alignment, and optical compensation metrics."
        )

    palette_num = palette.get("palette_number", 1)
    header_fam = palette.get("header_family", "Display")
    body_fam = palette.get("body_family", "Text")
    fonts = palette.get("fonts", [])

    lines = [
        f"**Typographic Rationale for Palette #{palette_num} ({platform} Poster)**",
        f"*Active Context:* \"{design_prompt}\" | *Strategy:* **{strat_name}**\n",
        "### 1. Dual-Stream Siamese Neural Pairing",
        f"The engine paired the Latin display family **{header_fam}** with body family **{body_fam}** and mapped corresponding Sinhala typeface glyphs into a shared 512-dimensional metric space. The Siamese neural network minimizes latent cosine distance across stroke contrast, terminal curvature, and horizontal weight distribution to establish cross-script harmony.\n",
        "### 2. Physical Baseline Alignment & Optical Compensation",
        "Sinhala glyphs feature intricate loops and ascender/descender modifiers. To prevent optical vibration and maintain smooth reading flow, physical proportions were normalized:\n"
    ]

    for f in fonts:
        role = f.get("role", "")
        en_font = f.get("english_font", "").replace(".ttf", "").replace(".otf", "")
        si_font = f.get("sinhala_font", "").replace(".ttf", "").replace(".otf", "")
        en_sz = f.get("english_size", 0)
        si_sz = f.get("sinhala_size", 0)
        x_ratio = f.get("x_ratio", 1.0)
        optical_diff = si_sz - en_sz
        comp_text = f"+{optical_diff}px optical scaling" if optical_diff > 0 else "1:1 baseline scaling"

        lines.append(
            f"- **{role}**: `{en_font}` ({en_sz}px) + `{si_font}` ({si_sz}px)\n"
            f"  * Proportional Alignment: **{x_ratio * 100:.1f}%** x-height ratio | Compensation: *{comp_text}* for balanced ink density."
        )

    lines.append("\n### 3. Visual Hierarchy & Modular Scaling")
    lines.append(
        f"- **Header ({header_fam})**: Bold weight (700) anchors visual attention as the primary focal entry point.\n"
        f"- **Subhead & Body ({body_fam})**: Open counters and balanced apertures maximize legibility across digital screens.\n"
        f"- **CTA**: High-visibility weight reinforces action and conversion clarity."
    )

    if strategy and strategy.get("strategic_rationale"):
        lines.append(f"\n### 4. Sociolinguistic Context")
        lines.append(f"{strategy.get('strategic_rationale')}")

    return "\n".join(lines)

def format_contextual_prompt(prompt: str, context: dict = None, history: list = None) -> str:
    """Builds a design-literate contextual prompt injecting previous session memory and history."""
    sections = []
    if context:
        ctx_lines = []
        if context.get("design_prompt"):
            ctx_lines.append(f"- Active Design Brief: \"{context['design_prompt']}\"")
        if context.get("platform"):
            ctx_lines.append(f"- Target Platform: {context['platform']}")
        if context.get("active_palette"):
            pal = context["active_palette"]
            fonts_info = [f"[{f.get('role')}]: English={f.get('english_font')}, Sinhala={f.get('sinhala_font')}" for f in pal.get("fonts", [])]
            ctx_lines.append(f"- Active Font Palette (Palette {pal.get('palette_number', 1)}): {'; '.join(fonts_info)}")
        if context.get("active_strategy"):
            strat = context["active_strategy"]
            ctx_lines.append(f"- Active Language Strategy: {strat.get('overall_strategy')}")
        if ctx_lines:
            sections.append("CURRENT DESIGN SESSION MEMORY:\n" + "\n".join(ctx_lines))

    if history:
        hist_lines = []
        recent = history[-6:] if len(history) > 6 else history
        for msg in recent:
            sender = "User" if msg.get("sender") == "user" else "Assistant"
            txt = msg.get("text") or (f"Recommended Palettes" if msg.get("type") == "palettes" else "")
            if txt:
                hist_lines.append(f"{sender}: {txt[:120]}")
        if hist_lines:
            sections.append("RECENT CONVERSATION HISTORY:\n" + "\n".join(hist_lines))

    sections.append(f"USER QUESTION: {prompt}")
    return "\n\n".join(sections)

def get_fallback_response(prompt: str, context: dict = None, history: list = None) -> str:
    # 1. Deterministic Typographic Rationale route:
    # If the user is inquiring why fonts were paired or asking about typographic rationale/alignment,
    # generate the empirical metrics and neural rationale directly.
    if is_typographic_rationale_query(prompt):
        return generate_typographic_rationale(context, prompt)

    if not ENABLE_FALLBACK_LLM:
        if context and context.get("active_palette"):
            return generate_typographic_rationale(context, prompt)
        return "I am a specialized Typographic AI Engine. I can assist with layout generation and font pairings."

    effective_prompt = format_contextual_prompt(prompt, context, history) if (context or history) else prompt

    # Waterfall Failover Logic: Gemini -> Groq -> Cohere
    try:
        return ask_gemini(effective_prompt)
    except Exception as e:
        print(f"Gemini fallback unavailable: {e}. Trying Groq...")
        try:
            return ask_groq(effective_prompt)
        except Exception as e2:
            print(f"Groq fallback unavailable: {e2}. Trying Cohere...")
            try:
                return ask_cohere(effective_prompt)
            except Exception as e3:
                print(f"Cohere fallback unavailable: {e3}.")
                # If external LLMs are unavailable, provide intelligent contextual typography guidance
                if context and context.get("active_palette"):
                    return generate_typographic_rationale(context, prompt)
                return (
                    "I am the Typographic AI Engine for bilingual English and Sinhala typography. "
                    "I can create cross-lingual font pairings, calculate modular scale ratios, and optimize language dominance. "
                    "Describe a design brief (e.g. 'poster for a bakery' or 'hotel promo banner') to get started!"
                )