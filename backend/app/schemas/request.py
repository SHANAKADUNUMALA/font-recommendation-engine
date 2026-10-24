from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class PromptRequest(BaseModel):
    prompt: str = Field(..., description="The user design brief or search query")
    context: Optional[Dict[str, Any]] = Field(None, description="Previous session context including active palette and design brief")
    history: Optional[List[Dict[str, Any]]] = Field(None, description="Recent conversation messages")

class LanguageRequest(BaseModel):
    follow_up_prompt: str = Field(..., description="User request indicating language preference")
    selected_palette: Dict[str, Any] = Field(..., description="The currently selected typographic palette")
    design_context: Optional[str] = Field(None, description="Original design prompt or brief from previous session memory")

class FeedbackRequest(BaseModel):
    session_id: str = Field(..., description="Unique session ID")
    user_prompt: str = Field(..., description="User input prompt that generated the palette")
    palette_number: int = Field(..., description="Index of the rated palette (1, 2, or 3)")
    rating: int = Field(..., ge=1, le=5, description="1 to 5 star rating")
    comments: Optional[str] = Field("", description="Qualitative feedback comments")

class FontAnalyzeRequest(BaseModel):
    filename: str = Field(..., description="Name of the font file, e.g. MyFont.ttf")
    file_base64: str = Field(..., description="Base64 encoded font file bytes")

class FontIngestRequest(BaseModel):
    filename: str = Field(..., description="Name of the font file, e.g. MyFont.ttf")
    file_base64: str = Field(..., description="Base64 encoded font file bytes")
    script_type: str = Field(..., description="'ENGLISH' or 'SINHALA'")
    encoding_type: str = Field(..., description="'LEGACY', 'UNICODE', or 'NA'")
    typographic_style: str = Field("Sans-Serif", description="'Sans-Serif' or 'Serif'")
    stroke_weight: float = Field(400.0, description="Stroke weight (100 to 900)")
    x_height: float = Field(520.0, description="x-height in font units")
    cap_height: float = Field(720.0, description="Cap height in font units")
    bounding_box_ratio: float = Field(1.45, description="Bounding box aspect ratio")
    tags: Optional[str] = Field("", description="Stylistic and semantic descriptive tags")

