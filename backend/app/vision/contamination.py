import cv2
import numpy as np
from typing import Dict, Any

def analyze_dust_contamination(sensing_crop: np.ndarray, ref_crop: np.ndarray) -> Dict[str, Any]:
    """
    Detects physical dust, spots, or surface obstructions over test_strip and reference_scale ROIs.
    Uses local Laplacian high-frequency spot noise density.
    """
    scores = []
    
    for name, crop in [("sensing", sensing_crop), ("reference", ref_crop)]:
        if crop is None or crop.size == 0:
            continue
            
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to get smooth reference
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        
        # Local high frequency difference (isolates small isolated dust specks/spots)
        diff = cv2.absdiff(gray, blurred)
        
        # Isolated dust spot threshold
        spot_pixels = (diff > 35).astype(np.uint8) * 255
        
        spot_ratio = float(np.sum(spot_pixels > 0)) / float(gray.size)
        scores.append(spot_ratio)
        
    max_spot_ratio = max(scores) if scores else 0.0
    
    if max_spot_ratio < 0.04:
        status = "CLEAN"
        usable = True
    elif max_spot_ratio < 0.15:
        status = "MINOR_CONTAMINATION"
        usable = True
    else:
        status = "SEVERE_CONTAMINATION"
        usable = False
        
    return {
        "status": status,
        "usable": usable,
        "spot_ratio_percent": round(max_spot_ratio * 100.0, 2),
        "details": f"Dust spot ratio: {round(max_spot_ratio * 100.0, 1)}%"
    }
