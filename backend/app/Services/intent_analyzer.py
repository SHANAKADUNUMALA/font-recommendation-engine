import torch
from sentence_transformers import util
from app.Models import loader 
# Import the industry-standard configuration
from app.Core.config import DESIGN_RULES 

CALIBRATION_OFFSET = 0.045

def analyze_intent(user_prompt: str):
    if loader.sbert_model is None:
        raise RuntimeError("SBERT model is not loaded. Ensure loader.py ran successfully.")
    
    lower_prompt = user_prompt.lower()
    
    # Pull keywords dynamically from the YAML file
    mod_keywords = DESIGN_RULES['intent_keywords']['modern']
    trad_keywords = DESIGN_RULES['intent_keywords']['traditional']
    
    is_explicit_modern = any(word in lower_prompt for word in mod_keywords)
    is_explicit_trad = any(word in lower_prompt for word in trad_keywords)
    
    score_mod_calibrated = 0.0
    score_trad = 0.0
    
    if is_explicit_modern and not is_explicit_trad:
        score_mod_calibrated = 1.0
        score_trad = 0.0
    elif is_explicit_trad and not is_explicit_modern:
        score_mod_calibrated = 0.0
        score_trad = 1.0
    else:
        prompt_emb = loader.sbert_model.encode(user_prompt, convert_to_tensor=True)
        # We leave the raw SBERT concepts as strings because they represent a single semantic anchor, not a list of trigger rules
        concept_modern = loader.sbert_model.encode("modern tech clean future minimal contemporary bold", convert_to_tensor=True)
        concept_trad = loader.sbert_model.encode("traditional classic vintage heritage elegant history", convert_to_tensor=True)
        
        score_mod_raw = util.cos_sim(prompt_emb, concept_modern).item()
        score_trad = util.cos_sim(prompt_emb, concept_trad).item()
        score_mod_calibrated = score_mod_raw + CALIBRATION_OFFSET
    
    if score_mod_calibrated > score_trad:
        header_style = "Sans-Serif"
        body_style = "Serif"
        intent = "Modern/Contemporary"
    else:
        header_style = "Serif"
        body_style = "Sans-Serif"
        intent = "Traditional/Classic"
        
    return {
        "intent": intent,
        "header_target": header_style,
        "body_target": body_style,
        "scores": {
            "modern_calibrated": round(score_mod_calibrated, 4),
            "traditional": round(score_trad, 4)
        }
    }