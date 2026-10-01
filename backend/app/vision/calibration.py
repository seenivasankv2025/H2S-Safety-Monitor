import cv2
import numpy as np
from typing import Dict, Any, Tuple

def calibrate_and_normalize_strip(strip_crop: np.ndarray, ref_white_rgb: np.ndarray = None) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Performs white-balance normalization and illumination gain adjustment on strip crop.
    """
    if strip_crop is None or strip_crop.size == 0:
        return strip_crop, {"calibrated": False}
        
    # Convert BGR to LAB for lighting normalization
    lab = cv2.cvtColor(strip_crop, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) on L channel softly
    clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(4, 4))
    cl = clahe.apply(l)
    
    calibrated_lab = cv2.merge((cl, a, b))
    calibrated_bgr = cv2.cvtColor(calibrated_lab, cv2.COLOR_LAB2BGR)
    
    # White-reference gain adjustment if reference white area is sampled
    if ref_white_rgb is not None and len(ref_white_rgb) == 3:
        target_w = 245.0
        r_gain = target_w / max(ref_white_rgb[0], 1.0)
        g_gain = target_w / max(ref_white_rgb[1], 1.0)
        b_gain = target_w / max(ref_white_rgb[2], 1.0)
        
        bgr_float = calibrated_bgr.astype(np.float32)
        bgr_float[:, :, 0] = np.clip(bgr_float[:, :, 0] * b_gain, 0, 255)
        bgr_float[:, :, 1] = np.clip(bgr_float[:, :, 1] * g_gain, 0, 255)
        bgr_float[:, :, 2] = np.clip(bgr_float[:, :, 2] * r_gain, 0, 255)
        calibrated_bgr = bgr_float.astype(np.uint8)
        
    return calibrated_bgr, {
        "calibrated": True,
        "method": "CLAHE_LAB_WHITE_BALANCED",
        "illumination_corrected": True
    }
