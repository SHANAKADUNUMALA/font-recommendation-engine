import os
import torch
import torch.nn as nn
from sentence_transformers import SentenceTransformer

# 1. Exact Dual-Stream Siamese Architecture
class DualStreamSiameseNet(nn.Module):
    def __init__(self, visual_dim=512, semantic_dim=384, hidden_dim=256, output_dim=128):
        super(DualStreamSiameseNet, self).__init__()
        input_dim = visual_dim + semantic_dim
        
        # Matches your Colab saved weights exactly
        self.projection_network = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, output_dim)
        )

    def forward_one(self, x):
        # x is the concatenated vector [visual; semantic]
        out = self.projection_network(x)
        return nn.functional.normalize(out, p=2, dim=1)

    def forward(self, x1, x2):
        out1 = self.forward_one(x1)
        out2 = self.forward_one(x2)
        return out1, out2

# Global in-memory model instances
siamese_model = None
sbert_model = None

def load_ai_models():
    """Loads the neural networks into RAM when the server starts (idempotent)."""
    global siamese_model, sbert_model
    
    if siamese_model is not None and sbert_model is not None:
        return siamese_model, sbert_model

    print("Loading AI Models into memory...")
    
    # 2. Load the SBERT router (offline-first to prevent startup hanging)
    try:
        sbert_model = SentenceTransformer('all-MiniLM-L6-v2', local_files_only=True)
    except Exception:
        sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # 3. Load trained PyTorch Siamese weights
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    siamese_model = DualStreamSiameseNet().to(device)
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    artifacts_dir = os.path.abspath(os.path.join(current_dir, "../../artifacts"))
    weights_path = os.path.join(artifacts_dir, "siamese_font_matcher.pth")
    
    if os.path.exists(weights_path):
        checkpoint = torch.load(weights_path, map_location=device)
        if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
            siamese_model.load_state_dict(checkpoint['model_state_dict'])
        else:
            siamese_model.load_state_dict(checkpoint)
            
        siamese_model.eval()  # Set to evaluation mode
        print("Siamese Network loaded successfully.")
    else:
        print(f"CRITICAL ERROR: Could not find weights at {weights_path}")
        
    return siamese_model, sbert_model