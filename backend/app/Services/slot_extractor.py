import re

# Default English Fallbacks
DEFAULT_SLOTS_EN = {
    "header": "Main Headline",
    "subhead": "Your Campaign Subtitle or Slogan",
    "body": "Your primary body content, features, or details will appear here.",
    "cta": "CALL TO ACTION"
}

# Universal Sinhala Fallbacks (Wireframes for layout mockups)
DEFAULT_SLOTS_SI = {
    "header": "ප්‍රධාන මාතෘකාව",
    "subhead": "ඔබේ ප්‍රවර්ධන වැකිය හෝ උප මාතෘකාව",
    "body": "වැඩිදුර විස්තර, සේවාවන් සහ අන්තර්ගතය මෙහි ඇතුළත් කරන්න.",
    "cta": "මෙතනින් පිවිසෙන්න"
}

# Industry-Standard Localization (i18n) Data Dictionary
# Domain-specific advertising, retail, hospitality, culinary, and marketing mappings
I18N_MAP = {
    # Commercial & Retail Domains
    "hardware shop": "හාඩ්වෙයාර් වෙළඳසැල",
    "hardware store": "හාඩ්වෙයාර් වෙළඳසැල",
    "hardware": "හාඩ්වෙයාර්",
    "supermarket": "සුපර්මාකට්",
    "grocery": "සිල්ලර වෙළඳසැල",
    "food city": "ෆුඩ් සිටි",
    "pharmacy": "ෆාමසිය",
    "bakery": "බේකර්ස්",
    "bakers": "බේකර්ස්",
    "bake house": "බේක් හවුස්",
    "salon and spa": "සැලෝන් සහ ස්පා",
    "salon": "සැලෝන්",
    "spa": "සුවතා මධ්‍යස්ථානය",
    "beauty care": "රූපලාවණ්‍යාගාරය",
    "motors": "මෝටර්ස්",
    "auto care": "ඔටෝ කෙයාර්",
    "auto": "ඔටෝ",
    "automobile": "ඔටෝමොබයිල්",
    "fashion": "ෆැෂන්",
    "fashions": "ෆැෂන්",
    "clothing": "ඇඳුම් පැළඳුම්",
    "garments": "ගාර්මන්ට්ස්",
    "textiles": "ටෙක්ස්ටයිල්ස්",
    "jewellers": "ජුවලර්ස්",
    "jewellery": "ජුවලර්ස්",
    "jewelry": "ජුවලර්ස්",
    "gems": "මැණික්",
    "furniture": "ෆර්නිචර්",
    "furnishings": "ගෘහ භාණ්ඩ",
    "electronics": "ඉලෙක්ට්‍රොනික්ස්",
    "electricals": "ඉලෙක්ට්‍රිකල්ස්",
    "enterprises": "එන්ටර්ප්‍රයිසස්",
    "holdings": "හෝල්ඩින්ග්ස්",
    "trading": "ට්‍රේඩිං",
    "traders": "ට්‍රේඩර්ස්",
    "stores": "ස්ටෝර්ස්",
    "store": "ස්ටෝර්ස්",
    "shop": "වෙළඳසැල",
    "studio": "ස්ටුඩියෝ",
    "photography": "ඡායාරූප ශිල්පය",
    "agency": "ඒජන්සිය",
    "hotel": "හෝටලය",
    "hotels": "හෝටල්",
    "resort": "රිසෝට්",
    "resorts": "රිසෝට්",
    "inn": "තානායම",
    "villas": "විලාස්",
    "villa": "විලා",
    "foods": "ෆුඩ්ස්",
    "food": "ආහාර",
    "cafe": "කැෆේ",
    "restaurant and dining": "ආපන ශාලාව සහ භෝජනාගාරය",
    "restaurant": "ආපන ශාලාව",
    "dining": "භෝජනාගාරය",
    "rice and curry": "බත් සහ ව්‍යංජන",
    "fresh juice": "නැවුම් යුෂ",
    "coffee": "කෝපි",
    "tea": "තේ",
    "sweets": "පැණිරස කෑම",
    "gym": "ව්‍යායාම මධ්‍යස්ථානය",
    "fitness": "ශරීර සුවතා මධ්‍යස්ථානය",
    "sports": "ක්‍රීඩා",
    "dental": "දන්ත සායනය",
    "clinic": "සායනය",
    "hospital": "රෝහල",
    "optical": "ඇස් කණ්ණාඩි",
    "opticals": "ඔප්ටිකල්ස්",
    "travels": "ට්‍රැවල්ස්",
    "tours": "ටුවර්ස්",
    "transport": "ප්‍රවාහන සේවා",
    "express": "එක්ස්ප්‍රස්",
    "courier": "කුරියර් සේවා",
    "communications": "සන්නිවේදන",
    "printers": "මුද්‍රණාලය",
    "printing": "මුද්‍රණ කටයුතු",
    "bookshop": "පොත්හල",
    "stationery": "ලිපිද්‍රව්‍ය",
    "tools": "මෙවලම්",
    "paints": "තීන්ත",
    "builders": "ඉදිකිරීම්",
    "construction": "ඉදිකිරීම්",
    "engineering": "ඉංජිනේරු",
    "solutions": "විසඳුම්",
    "services": "සේවාවන්",
    "digital": "ඩිජිටල්",
    "tech": "තාක්ෂණික",
    "technologies": "තාක්ෂණික",
    "logistics": "ලොජිස්ටික්ස්",
    "security": "ආරක්ෂක සේවා",

    # Popular Brands
    "yummy food": "රසවත් ආහාර",
    "delicious food": "රසවත් ආහාර",
    "good food": "හොඳ ආහාර",
    "tasty food": "රසවත් ආහාර",
    "hela bojun": "හෙළ බොජුන්",
    "mr kotthu": "මිස්ටර් කොත්තු",
    "tasty hub": "රසවත් හබ්",
    "cargills": "කාගිල්ස්",
    "keells": "කීල්ස්",
    "arpico": "ආපිකෝ",
    "singer": "සිංගර්",
    "damro": "දම්රෝ",
    "abans": "ඇබෑන්ස්",
    "softlogic": "සොෆ්ට්ලොජික්",
    "dialog": "ඩයලොග්",
    "mobitel": "මොබිටෙල්",
    "slt": "එස්.එල්.ටී",
    "boc": "බී.ඕ.සී",
    "commercial bank": "කොමර්ෂල් බැංකුව",
    "sampath bank": "සම්පත් බැංකුව",
    "hnb": "එච්.එන්.බී",
    "dsi": "ඩී.එස්.අයි",
    "bata": "බාටා",
    "atlas": "ඇට්ලස්",
    "maliban": "මැලිබන්",
    "munchee": "මන්චි",
    "kist": "කිස්ට්",
    "elephant house": "එලිෆන්ට් හවුස්",
    "kotmale": "කොත්මලේ",
    "pelwatte": "පැල්වත්ත",
    "highland": "හයිලන්ඩ්",
    "wijaya": "විජය",
    "harischandra": "හරිශ්චන්ද්‍ර",
    "dilmah": "දිල්මා",
    "mlesna": "ම්ලෙස්නා",

    # Actions / CTAs
    "order now": "දැන්ම ඇනවුම් කරන්න",
    "book now": "දැන්ම වෙන්කරවා ගන්න",
    "book your stay now": "දැන්ම වෙන්කරවා ගන්න",
    "book your stay": "දැන්ම වෙන්කරවා ගන්න",
    "book your discount": "ඔබේ වට්ටම ලබාගන්න",
    "shop now": "දැන්ම මිලදී ගන්න",
    "buy now": "දැන්ම මිලදී ගන්න",
    "call now": "දැන්ම අමතන්න",
    "contact us": "අප අමතන්න",
    "visit us": "අප වෙත පැමිණෙන්න",
    "learn more": "වැඩිදුර විස්තර",
    "call to action": "මෙතනින් පිවිසෙන්න",
    "subscribe": "දායක වන්න",
    "register now": "දැන්ම ලියාපදිංචි වන්න",

    # Promotions & Marketing
    "special offer": "විශේෂ දීමනාව",
    "super sale": "සුපිරි වට්ටම්",
    "big sale": "මහා වට්ටම්",
    "discount": "වට්ටම්",
    "mega sale": "දැවැන්ත වට්ටම්",
    "limited offer": "සීමිත දීමනාවකි",
    "limited time": "සීමිත කාලයක් සඳහා",
    "free delivery": "නොමිලේ බෙදාහැරීම",
    "new arrival": "නව පැමිණීම්",
    "taste the best": "හොඳම රස අත්විඳින්න",
    "best in town": "නගරයේ හොඳම",
    "welcome": "සාදරයෙන් පිළිගනිමු",
    "grand opening": "විශේෂ සමාරම්භය",

    # Hospitality & Travel
    "luxury": "සුඛෝපභෝගී",
    "relaxation": "විවේකය",
    "romance": "ආදරය",
    "adventure": "වීර චාරිකා",
    "family fun": "පවුලේ විනෝදය",
    "comfortable rooms": "සුවපහසු කාමර",
    "suites": "සුඛෝපභෝගී කාමර",
    "swimming pool": "පිහිනුම් තටාකය",
    "location": "ස්ථානය",
    "nearby attractions": "අවට ආකර්ෂණීය ස්ථාන",
}

# Curated Sri Lankan Names, Surnames, and Geographical Identifiers
COMMON_SRI_LANKAN_NAMES = {
    # First Names
    "kasun": "කසුන්",
    "nimal": "නිමල්",
    "kamal": "කමල්",
    "sunil": "සුනිල්",
    "saman": "සමන්",
    "ruwan": "රුවන්",
    "nuwan": "නුවන්",
    "amila": "අමිල",
    "sandun": "සඳුන්",
    "dinesh": "දිනේෂ්",
    "prasad": "ප්‍රසාද්",
    "chathura": "චතුර",
    "chaminda": "චමින්ද",
    "rohan": "රොහාන්",
    "malik": "මලික්",
    "anura": "අනුර",
    "damith": "දමිත්",
    "tharindu": "තරිඳු",
    "kumara": "කුමාර",
    "mahinda": "මහින්ද",
    "ranil": "රනිල්",
    "sajith": "සජිත්",
    "janaka": "ජනක",
    "nalaka": "නාලක",
    "suneth": "සුනෙත්",
    "malith": "මලිත්",
    "asanka": "අසංක",
    "thushara": "තුෂාර",
    "lakshan": "ලක්ෂාන්",
    "supun": "සුපුන්",
    "ravindu": "රවිඳු",
    "madusanka": "මධුසංක",
    "nipuna": "නිපුණ",
    "lahiru": "ළහිරු",
    "isuru": "ඉසුරු",
    "sithum": "සිතුම්",
    "indika": "ඉන්දික",
    "manoj": "මනෝජ්",
    "uditha": "උදිත",
    "kelum": "කැලුම්",
    "gayan": "ගයාන්",
    "dilshan": "දිල්ෂාන්",
    "mahela": "මහේල",
    "sangakkara": "සංගක්කාර",
    "sanath": "සනත්",
    "lasith": "ලසිත්",
    "kusal": "කුසල්",
    "pathum": "පැතුම්",
    "charith": "චරිත්",
    "wanindu": "වනිඳු",

    # Surnames & Family Brands
    "perera": "පෙරේරා",
    "silva": "සිල්වා",
    "fernando": "ප්‍රනාන්දු",
    "bandara": "බණ්ඩාර",
    "rathnayake": "රත්නායක",
    "senanayake": "සේනානායක",
    "jayasinghe": "ජයසිංහ",
    "wickramasinghe": "වික්‍රමසිංහ",
    "gunasekara": "ගුණසේකර",
    "mendis": "මෙන්ඩිස්",
    "fonseka": "ෆොන්සේකා",
    "dissanayake": "දිසානායක",
    "alwis": "අල්විස්",
    "peiris": "පීරිස්",
    "rodrigo": "රොද්‍රිගෝ",
    "gamage": "ගමගේ",
    "jayawardena": "ජයවර්ධන",
    "rajapaksa": "රාජපක්ෂ",
    "cooray": "කුරේ",
    "karunaratne": "කරුණාරත්න",
    "liyanage": "ලියනගේ",
    "weerasinghe": "වීරසිංහ",
    "abeyratne": "අබේරත්න",
    "hettiarachchi": "හෙට්ටිආරච්චි",
    "wijesinghe": "විජේසිංහ",

    # Locations & Geographies
    "lanka": "ලංකා",
    "sri lanka": "ශ්‍රී ලංකා",
    "ceylon": "සිලෝන්",
    "kandy": "නුවර",
    "colombo": "කොළඹ",
    "galle": "ගාල්ල",
    "matara": "මාතර",
    "jaffna": "යාපනය",
    "negombo": "මීගමුව",
    "kurunegala": "කුරුණෑගල",
    "gampaha": "ගම්පහ",
    "moratuwa": "මොරටුව",
    "kalutara": "කළුතර",
    "kegalle": "කෑගල්ල",
    "ratnapura": "රත්නපුර",
    "batticaloa": "මඩකලපුව",
    "trincomalee": "ත්‍රිකුණාමලය",
    "anuradhapura": "අනුරාධපුරය",
    "polonnaruwa": "පොළොන්නරුව",
    "badulla": "බදුල්ල",
    "nuwara eliya": "නුවරඑළිය"
}

# Phonetic Transliteration Engine Rules
CONSONANTS = [
    ("ch", "ච"), ("sh", "ශ"), ("th", "ත"), ("dh", "ධ"), ("kh", "ඛ"), ("gh", "ඝ"),
    ("ph", "ෆ"), ("bh", "භ"), ("jh", "ඣ"),
    ("k", "ක"), ("g", "ග"), ("j", "ජ"), ("t", "ට"), ("d", "ඩ"), ("n", "න"),
    ("p", "ප"), ("b", "බ"), ("m", "ම"), ("y", "ය"), ("r", "ර"), ("l", "ල"),
    ("v", "ව"), ("w", "ව"), ("s", "ස"), ("h", "හ"), ("f", "ෆ"), ("c", "ක"),
    ("z", "ස"), ("x", "ක්ස්")
]

VOWEL_INDEPENDENT = [
    ("aae", "ඈ"), ("ae", "ඇ"), ("aa", "ආ"), ("ai", "ඓ"), ("au", "ඖ"),
    ("ee", "ඊ"), ("ea", "ඊ"), ("ii", "ඊ"), ("oo", "ඕ"), ("uu", "ඌ"),
    ("a", "අ"), ("e", "එ"), ("i", "ඉ"), ("o", "ඔ"), ("u", "උ")
]

VOWEL_MODIFIERS = [
    ("aae", "ෑ"), ("ae", "ැ"), ("aa", "ා"), ("ai", "ෛ"), ("au", "ෞ"),
    ("ee", "ී"), ("ea", "ී"), ("ii", "ී"), ("oo", "ෝ"), ("uu", "ූ"),
    ("a", ""), ("e", "ෙ"), ("i", "ි"), ("o", "ො"), ("u", "ු")
]

VIRAMA = "්"

def contains_sinhala(text: str) -> bool:
    """Checks if text contains Sinhala Unicode characters (U+0D80 to U+0DFF)."""
    return bool(re.search(r'[\u0D80-\u0DFF]', text))

def transliterate_word_phonetic(word: str) -> str:
    """
    Phonetically transliterates an individual English word into Sinhala Unicode.
    Uses rule-based syllable decomposition (consonants, vowel modifiers, virama).
    """
    w = word.lower()
    if w in COMMON_SRI_LANKAN_NAMES:
        return COMMON_SRI_LANKAN_NAMES[w]
    if w in I18N_MAP:
        return I18N_MAP[w]

    i = 0
    n = len(w)
    res = []

    while i < n:
        # Check independent initial vowel
        matched_vowel = False
        if i == 0 or (len(res) > 0 and (res[-1] in [v[1] for v in VOWEL_INDEPENDENT] or res[-1] == ' ')):
            for v_str, v_char in VOWEL_INDEPENDENT:
                if w.startswith(v_str, i):
                    res.append(v_char)
                    i += len(v_str)
                    matched_vowel = True
                    break
            if matched_vowel:
                continue

        # Check consonant followed by optional vowel modifier
        matched_consonant = False
        for c_str, c_char in CONSONANTS:
            if w.startswith(c_str, i):
                c_len = len(c_str)
                v_matched = False
                for vm_str, vm_char in VOWEL_MODIFIERS:
                    if w.startswith(vm_str, i + c_len):
                        res.append(c_char + vm_char)
                        i += c_len + len(vm_str)
                        v_matched = True
                        break
                if not v_matched:
                    # Trailing consonant / cluster -> attach hal-lakuna (virama)
                    res.append(c_char + VIRAMA)
                    i += c_len
                matched_consonant = True
                break

        if not matched_consonant:
            res.append(w[i])
            i += 1

    return "".join(res)

def transliterate_english_to_sinhala(text: str) -> str:
    """
    Translates or transliterates an English brand name or multi-word headline into authentic Sinhala.
    1. Replaces known commercial phrases from I18N_MAP.
    2. Maps recognized Sri Lankan names and brands.
    3. Uses phonetic transliteration for novel proper nouns and words.
    """
    if not text:
        return ""

    result = text
    # 1. Multi-word phrase matches from I18N_MAP
    sorted_keys = sorted(I18N_MAP.keys(), key=len, reverse=True)
    for k in sorted_keys:
        pattern = rf'\b{re.escape(k)}\b'
        result = re.sub(pattern, I18N_MAP[k], result, flags=re.IGNORECASE)

    # 2. Transliterate remaining English alphabetic words
    def replace_token(match):
        token = match.group(0)
        tok_lower = token.lower()
        if tok_lower in COMMON_SRI_LANKAN_NAMES:
            return COMMON_SRI_LANKAN_NAMES[tok_lower]
        if tok_lower in I18N_MAP:
            return I18N_MAP[tok_lower]
        return transliterate_word_phonetic(token)

    result = re.sub(r'\b[a-zA-Z]+\b', replace_token, result)
    return result

def generate_sinhala_translation(english_text: str, role: str) -> str:
    """
    Dynamically maps English text to Sinhala.
    - If user provided text in Sinhala, preserves it directly.
    - Matches full phrases in i18n dictionary.
    - Matches key phrases for compound sentences.
    - For custom brand headers (e.g. 'Kasun Hardware'), converts English brand
      names into genuine Sinhala Unicode ('කසුන් හාඩ්වෙයාර්').
    - This allows both Unicode Sinhala fonts and Legacy FM fonts (via unicodeToLegacyFM)
      to render without broken glyphs or scrambled ASCII fragments.
    - Preserves default wireframe fallbacks when no custom text is provided.
    """
    if not english_text:
        return DEFAULT_SLOTS_SI[role]

    clean_text = english_text.strip()

    # 1. If text is already Sinhala, preserve it as-is (100% preservation)
    if contains_sinhala(clean_text):
        return clean_text

    # 2. If text is the default fallback, retain pristine wireframe
    if clean_text == DEFAULT_SLOTS_EN.get(role, ""):
        return DEFAULT_SLOTS_SI[role]

    lower_text = clean_text.lower()

    # 3. Direct exact phrase match (Headers, CTAs, Brands)
    if lower_text in I18N_MAP:
        return I18N_MAP[lower_text]

    # 4. Multi-phrase dictionary and phonetic transliteration for brand names & headlines
    translated = transliterate_english_to_sinhala(clean_text)

    # Clean any conversational wrapper artifacts if present
    cleaned = re.sub(r'the target experience:\s*', '', translated, flags=re.IGNORECASE)
    cleaned = re.sub(r'include\s*', '', cleaned, flags=re.IGNORECASE).strip()

    if contains_sinhala(cleaned):
        return cleaned

    # Default wireframe fallback
    return DEFAULT_SLOTS_SI[role]

def extract_content_slots(user_prompt: str) -> dict:
    """
    Generalized NLP Slot Filling parser.
    Extracts custom text for English typographic roles and dynamically generates Sinhala.
    Preserves default Sinhala wireframes when roles are not explicitly provided by the user.
    """
    if not user_prompt:
        return {"en": DEFAULT_SLOTS_EN.copy(), "si": DEFAULT_SLOTS_SI.copy()}

    text = user_prompt.strip()

    role_markers = [
        ("header", r'(?:(?:please\s+)?(?:for\s+)?(?:include\s+)?(?:with\s+)?)?\bheader(?:\s*(?:name|text))?\s*(?:as|is|:|include|-)?\s+'),
        ("subhead", r'(?:(?:and\s+)?(?:please\s+)?(?:for\s+)?(?:include\s+)?(?:with\s+)?)?\b(?:sub\s*header|subhead|sub-header)(?:\s*(?:name|text))?\s*(?:as|is|:|include|-)?\s+'),
        ("body", r'(?:(?:and\s+)?(?:please\s+)?(?:for\s+)?(?:include\s+)?(?:with\s+)?)?\bbody(?:\s*(?:text|description))?\s*(?:as|is|:|include|for|-)?\s+'),
        ("cta", r'(?:(?:and\s+)?(?:please\s+)?(?:for\s+)?(?:include\s+)?(?:with\s+)?)?\b(?:cta|call\s*to\s*action|button)(?:\s*(?:name|text))?\s*(?:as|is|:|include|-)?\s+')
    ]

    found_spans = []
    for role_name, pattern in role_markers:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            found_spans.append({
                "role": role_name,
                "start": match.start(),
                "content_start": match.end()
            })

    slots_en = {}
    if found_spans:
        found_spans.sort(key=lambda x: x["start"])
        for i in range(len(found_spans)):
            current = found_spans[i]
            role = current["role"]
            c_start = current["content_start"]
            next_start = found_spans[i + 1]["start"] if (i + 1 < len(found_spans)) else len(text)

            raw_chunk = text[c_start:next_start]
            cleaned = re.sub(r'^(?:["\'“‘:\-\s]+|\b(?:and|for|as|is|include)\s+)+', '', raw_chunk, flags=re.IGNORECASE)
            cleaned = re.sub(r'[\s"\'”’.,;]+$', '', cleaned)
            cleaned = re.sub(r'\s*\band\s*$', '', cleaned, flags=re.IGNORECASE).strip()

            lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
            val = "\n".join(lines) if len(lines) > 1 else cleaned
            if val:
                slots_en[role] = val

    # Build final English and Sinhala slots
    final_en = {}
    final_si = {}

    for role in ["header", "subhead", "body", "cta"]:
        if role in slots_en:
            # User explicitly provided this slot
            final_en[role] = slots_en[role]
            final_si[role] = generate_sinhala_translation(slots_en[role], role)
        else:
            # Role was not provided: use clean standard wireframe fallbacks
            final_en[role] = DEFAULT_SLOTS_EN[role]
            final_si[role] = DEFAULT_SLOTS_SI[role]

    return {"en": final_en, "si": final_si}