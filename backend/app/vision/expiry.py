import cv2
import numpy as np
import math
from typing import Dict, Any, List, Optional

def color_distance_hsv_rgb(rgb1: List[int], hsv1: List[int], rgb2: List[int], hsv2: List[int]) -> float:
    """Computes weighted RGB + HSV distance."""
    dr = (rgb1[0] - rgb2[0]) ** 2
    dg = (rgb1[1] - rgb2[1]) ** 2
    db = (rgb1[2] - rgb2[2]) ** 2
    rgb_dist = math.sqrt(dr + dg + db)
    
    dh = min(abs(hsv1[0] - hsv2[0]), 180 - abs(hsv1[0] - hsv2[0]))
    ds = abs(hsv1[1] - hsv2[1])
    dv = abs(hsv1[2] - hsv2[2])
    hsv_dist = math.sqrt((dh * 2.0)**2 + (ds * 0.8)**2 + (dv * 0.5)**2)
    
    return 0.6 * rgb_dist + 0.4 * hsv_dist

def analyze_expiry_patch(patch_crop: np.ndarray, calibration_targets: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes the chemical stability / expiry indicator patch on the strip.
    Compares against experimentally stored MongoDB reference calibration values.
    """
    if patch_crop is None or patch_crop.size == 0:
        return {
            "status": "NOT_VISIBLE",
            "is_valid": False,
            "patch_visible": False,
            "rgb": [0, 0, 0],
            "hsv": [0, 0, 0],
            "message": "Expiry/stability patch not visible on strip."
        }
        
    # Extract robust median RGB and HSV (ignore outer 10% margin to prevent edge artifacts)
    h, w = patch_crop.shape[:2]
    margin_y = int(h * 0.15)
    margin_x = int(w * 0.15)
    inner = patch_crop[margin_y:h-margin_y, margin_x:w-margin_x]
    if inner.size == 0:
        inner = patch_crop
        
    b_med = float(np.median(inner[:, :, 0]))
    g_med = float(np.median(inner[:, :, 1]))
    r_med = float(np.median(inner[:, :, 2]))
    rgb = [int(r_med), int(g_med), int(b_med)]
    
    hsv_crop = cv2.cvtColor(inner, cv2.COLOR_BGR2HSV)
    h_med = float(np.median(hsv_crop[:, :, 0]))
    s_med = float(np.median(hsv_crop[:, :, 1]))
    v_med = float(np.median(hsv_crop[:, :, 2]))
    hsv = [int(h_med), int(s_med), int(v_med)]
    
    if not calibration_targets:
        # Fallback default calibration targets if DB empty
        calibration_targets = [
            {"state": "VALID", "rgb": [50, 180, 80], "hsv": [134, 72, 70]},
            {"state": "WARNING", "rgb": [220, 190, 50], "hsv": [49, 77, 86]},
            {"state": "EXPIRED", "rgb": [200, 60, 50], "hsv": [4, 75, 78]}
        ]
        
    best_state = "VALID"
    min_dist = float('inf')
    
    for target in calibration_targets:
        t_state = target.get("state", "VALID")
        t_rgb = target.get("rgb", [0, 0, 0])
        t_hsv = target.get("hsv", [0, 0, 0])
        
        dist = color_distance_hsv_rgb(rgb, hsv, t_rgb, t_hsv)
        if dist < min_dist:
            min_dist = dist
            best_state = t_state
            
    is_valid = (best_state in ["VALID", "WARNING"])
    
    return {
        "status": best_state,
        "is_valid": is_valid,
        "patch_visible": True,
        "rgb": rgb,
        "hsv": hsv,
        "distance": round(min_dist, 2),
        "message": f"Expiry Patch status: {best_state}" if is_valid else "INVALID STRIP — REPLACE STRIP"
    }
