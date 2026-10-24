import React, { useState } from 'react';
import axios from 'axios';

export default function Feedback({ session, palette }) {
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [isHovering, setIsHovering] = useState(0);

    // Only show feedback for generative results, not fallback text
    if (!palette) return null;

    const handleSubmit = async () => {
        try {
            await axios.post('/api/evaluate', {
                session_id: session.id,
                user_prompt: palette.userPrompt || "N/A",
                palette_number: palette.palette_number || 1,
                rating: rating,
                comments: comments
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Evaluation submission failed", error);
        }
    };

    if (submitted) {
        return (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px', textAlign: 'center', border: '1px solid #bbf7d0', fontSize: '14px', fontWeight: 500 }}>
                ✨ Thank you! Your evaluation has been logged to the research dataset.
            </div>
        );
    }

    return (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '15px' }}>Rate this Typographic Match</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Your feedback directly evaluates the Siamese Network's structural alignment accuracy.</p>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <button 
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setIsHovering(star)}
                        onMouseLeave={() => setIsHovering(0)}
                        style={{
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontSize: '26px', 
                            padding: 0,
                            lineHeight: 1,
                            color: star <= (isHovering || rating) ? '#fbbf24' : '#cbd5e1',
                            transition: 'color 0.15s, transform 0.1s',
                            transform: star === isHovering ? 'scale(1.15)' : 'scale(1)'
                        }}
                    >
                        ★
                    </button>
                ))}
            </div>

            {rating > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s ease-in-out' }}>
                    <textarea 
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Any specific issues with baseline alignment, visual weight, or cultural context?"
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontFamily: 'inherit', resize: 'vertical', minHeight: '70px', outlineColor: '#0ea5e9' }}
                    />
                    <button 
                        onClick={handleSubmit}
                        style={{ alignSelf: 'flex-start', padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                        Submit Evaluation
                    </button>
                </div>
            )}
        </div>
    );
}