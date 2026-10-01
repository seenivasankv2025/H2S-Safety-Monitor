import cv2
import numpy as np
from typing import Dict, Any

def analyze_image_quality(image: np.ndarray) -> Dict[str, Any]:
    """
    Evaluates image quality:
    - Blur: Laplacian variance (Threshold < 60 -> Blurry)
    - Brightness: Mean luminance (Threshold < 50 -> Too dark, > 235 -> Too bright)
    - Contrast: RMS Contrast / Std Dev (Threshold < 20 -> Low contrast)
    - Glare: Saturated highlight pixel fraction (Threshold > 0.08 -> Overexposed)
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 1. Blur Detection
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = laplacian_var < 55.0
    
    # 2. Brightness
    mean_brightness = float(np.mean(gray))
    is_too_dark = mean_brightness < 45.0
    is_too_bright = mean_brightness > 238.0
    
    # 3. Contrast
    contrast_std = float(np.std(gray))
    is_low_contrast = contrast_std < 18.0
    
    # 4. Glare / Overexposure
    glare_mask = (gray > 248)
    glare_fraction = float(np.sum(glare_mask)) / float(gray.size)
    is_glare_severe = glare_fraction > 0.07
    
    # Overall Status Determination
    issues = []
    if is_blurry:
        issues.append("Image too blurry")
    if is_too_dark:
        issues.append("Lighting too dark")
    if is_too_bright:
        issues.append("Lighting too bright / overexposed")
    if is_low_contrast:
        issues.append("Low image contrast")
    if is_glare_severe:
        issues.append("Excessive surface glare/reflections")
        
    if not issues:
        status = "GOOD"
        quality_valid = True
    elif len(issues) == 1 and not (is_blurry and laplacian_var < 25.0):
        status = "ACCEPTABLE"
        quality_valid = True
    else:
        status = "INVALID"
        quality_valid = False
        
    return {
        "status": status,
        "quality_valid": quality_valid,
        "laplacian_variance": round(laplacian_var, 2),
        "mean_brightness": round(mean_brightness, 2),
        "contrast_std": round(contrast_std, 2),
        "glare_fraction": round(glare_fraction * 100.0, 2),
        "issues": issues,
        "recapture_instruction": "Ensure stable lighting, steady camera hold, and avoid shiny reflections." if not quality_valid else "Quality verified."
    }
