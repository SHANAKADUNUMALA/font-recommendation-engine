import sqlite3
import os
import numpy as np

def get_db_connection():
    """Locates the fonts.db file in the artifacts folder and establishes a connection."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Route from app/db/repository.py up to backend/artifacts/fonts.db
    db_path = os.path.abspath(os.path.join(current_dir, "../../artifacts/fonts.db"))
    
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at {db_path}")
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Returns rows as dictionaries instead of tuples
    return conn

def fetch_fonts_by_script(script_type: str):
    """Fetches all fonts for a specific language (ENGLISH or SINHALA) and decodes vectors."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT font_name, script_type, encoding_type, typographic_style, 
               visual_feature_vector, sbert_feature_vector, 
               x_height, cap_height, stroke_weight, bounding_box_ratio 
        FROM font_metadata 
        WHERE script_type = ?
    """, (script_type.upper(),))
    
    rows = cursor.fetchall()
    conn.close()
    
    fonts = []
    for row in rows:
        font_data = dict(row)
        
        # Convert binary BLOBs back to float32 NumPy arrays
        if font_data.get('visual_feature_vector'):
            font_data['visual_feature_vector'] = np.frombuffer(font_data['visual_feature_vector'], dtype=np.float32)
            
        if font_data.get('sbert_feature_vector'):
            font_data['sbert_feature_vector'] = np.frombuffer(font_data['sbert_feature_vector'], dtype=np.float32)
            
        fonts.append(font_data)
        
    return fonts