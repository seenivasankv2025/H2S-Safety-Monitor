import os
from app.vision.pipeline import vision_pipeline

DEFAULT_REFERENCE_COLORS = []
DEFAULT_SAFETY_MAPPING = {
    "WHITE": "VERY LOW",
    "PALE YELLOW": "LOW",
    "YELLOW": "MODERATE",
    "LIGHT BROWN": "RISK",
    "BROWN": "HIGH RISK",
    "BLACK": "HIGH RISK"
}

def run_diagnostic_test():
    """
    Executes diagnostic test across the six physical color stage sample strip images:
      - WHITE
      - PALE YELLOW
      - YELLOW
      - LIGHT BROWN
      - BROWN
      - BLACK
    Verifies that measured RGB/LAB vectors differ across images and that each
    test strip correctly matches its nearest measured reference stage.
    """
    samples = [
        ("White", "sample_data/images/strip_stage_1_white.png", "WHITE"),
        ("Pale Yellow", "sample_data/images/strip_stage_2_pale_yellow.png", "PALE YELLOW"),
        ("Yellow", "sample_data/images/strip_stage_3_dark_yellow.png", "YELLOW"),
        ("Light Brown", "sample_data/images/strip_stage_4_light_brown.png", "LIGHT BROWN"),
        ("Brown", "sample_data/images/strip_stage_5_dark_brown.png", "BROWN"),
        ("Black", "sample_data/images/strip_stage_6_black.png", "BLACK"),
    ]
    
    print("\n" + "=" * 95)
    print("DIAGNOSTIC TEST — PHYSICAL COLOUR STAGE EXTRACTION & MATCHING TABLE")
    print("=" * 95)
    print(f"| {'Image Label':<12} | {'Measured RGB':<15} | {'Measured LAB':<18} | {'Best Match':<12} | {'Expected':<12} | {'Dist':<6} |")
    print("|" + "-" * 14 + "|" + "-" * 17 + "|" + "-" * 20 + "|" + "-" * 14 + "|" + "-" * 14 + "|" + "-" * 8 + "|")
    
    diagnostic_rows = []
    
    for label, file_path, expected in samples:
        rel_path = os.path.join(os.path.dirname(__file__), "..", file_path) if not os.path.exists(file_path) else file_path
        
        if not os.path.exists(rel_path):
            print(f"File not found: {rel_path}")
            continue
            
        with open(rel_path, "rb") as f:
            image_bytes = f.read()
            
        res = vision_pipeline.process_image(
            image_bytes=image_bytes,
            reference_colors=DEFAULT_REFERENCE_COLORS,
            safety_mapping=DEFAULT_SAFETY_MAPPING,
            input_type="UPLOAD"
        )
        
        rgb_str = str(tuple(res.get("sensing_rgb", [0, 0, 0])))
        lab_str = str(tuple(res.get("sensing_lab", [0, 0, 0])))
        best_match = res.get("physical_color_stage", "UNKNOWN")
        dist = str(res.get("color_distance", 0))
        
        diagnostic_rows.append({
            "label": label,
            "rgb": rgb_str,
            "lab": lab_str,
            "match": best_match,
            "expected": expected,
            "dist": dist
        })
        
        print(f"| {label:<12} | {rgb_str:<15} | {lab_str:<18} | {best_match:<12} | {expected:<12} | {dist:<6} |")

    print("=" * 95 + "\n")
    return diagnostic_rows

if __name__ == "__main__":
    run_diagnostic_test()
