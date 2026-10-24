# Typographic AI Engine — Developer & Agent Context

## Architectural Directives
1. **Model Independence**: The custom AI models (`DualStreamSiameseNet` and SBERT) execute 100% locally and offline without external API dependencies. External LLMs (Gemini/Groq/Cohere) are strictly fallback utilities for educational small talk and typography queries; they never interfere with palette ranking or layout math.
2. **Deterministic Rules & Dynamic NLP**: Do not hardcode font family names in user-facing endpoints. Slot parsing must remain dynamic via `slot_extractor.py`.
3. **State Integrity**: `localStorage` in `App.jsx` stores multi-session conversation history and `latestPalette` state, which is preserved across follow-up requests.
4. **Offline Resilience**: Sentence-Transformers router loads with `local_files_only=True` first to prevent hanging in sandboxed or offline environments.
5. **Evaluation Telemetry**: User ratings are written to `evaluation_feedback` table in `backend/artifacts/fonts.db` and exported via `backend/export_evaluations.py`.

