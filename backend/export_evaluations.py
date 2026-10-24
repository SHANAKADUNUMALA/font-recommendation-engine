import csv
import math
import os
import sqlite3

def run_evaluation_export_and_metrics():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(backend_dir, "artifacts", "fonts.db")
    output_csv = os.path.join(backend_dir, "evaluation_results.csv")

    if not os.path.exists(db_path):
        print(f"[-] Database not found at: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='evaluation_feedback'")
        if not cursor.fetchone():
            print("[-] Table 'evaluation_feedback' does not exist yet.")
            return

        cursor.execute("""
            SELECT id, session_id, user_prompt, palette_number, rating, comments, timestamp 
            FROM evaluation_feedback 
            ORDER BY id ASC
        """)
        rows = cursor.fetchall()

        if not rows:
            print("[-] No evaluation records found to export.")
            return

        # 1. Export records to CSV
        headers = [
            "Evaluation_ID", 
            "Session_ID", 
            "User_Prompt", 
            "Palette_Number", 
            "Rating", 
            "Comments", 
            "Timestamp"
        ]

        with open(output_csv, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)

        print(f"[+] Successfully exported {len(rows)} evaluations to: {output_csv}")

        # 2. Compute Research Thesis Descriptive Statistics
        ratings = [r[4] for r in rows if r[4] is not None]
        n = len(ratings)
        mos = sum(ratings) / n
        variance = sum((x - mos) ** 2 for x in ratings) / (n - 1) if n > 1 else 0.0
        std_dev = math.sqrt(variance)

        print("\n" + "=" * 48)
        print("        THESIS EVALUATION METRICS REPORT        ")
        print("=" * 48)
        print(f"Total Evaluated Sample Size (N) : {n}")
        print(f"Mean Opinion Score (MOS)        : {mos:.2f} / 5.00")
        print(f"Sample Standard Deviation (SD)  : {std_dev:.2f}")
        print(f"Sample Variance                 : {variance:.2f}")
        print("-" * 48)

        # Rating Distribution Breakdown
        print("Rating Breakdown:")
        for star in range(5, 0, -1):
            count = ratings.count(star)
            pct = (count / n) * 100
            bar = "★" * star + " " + "■" * count
            print(f" {star}-Star: {count:2d} ({pct:5.1f}%) | {bar}")
        print("=" * 48 + "\n")

    except sqlite3.OperationalError as e:
        print(f"[-] Database error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_evaluation_export_and_metrics()