import cv2
import numpy as np
import math
from typing import Dict, Any, List, Tuple, Optional

STAGE_NAMES = ["WHITE", "PALE YELLOW", "YELLOW", "LIGHT BROWN", "BROWN", "BLACK"]

def bgr_to_cielab(bgr_pixel: np.ndarray) -> Tuple[float, float, float]:
    """Converts 1x1 BGR pixel array to standard CIELAB (L, a, b) color space."""
    pixel_img = np.uint8([[bgr_pixel]])
    lab_img = cv2.cvtColor(pixel_img, cv2.COLOR_BGR2LAB)
    l, a, b = lab_img[0, 0]
    # Scale OpenCV 8-bit LAB values to standard CIELAB ranges (L: 0..100, a: -128..127, b: -128..127)
    standard_l = float(l) * (100.0 / 255.0)
    standard_a = float(a) - 128.0
    standard_b = float(b) - 128.0
    return (standard_l, standard_a, standard_b)

def extract_reference_scale_features(ref_roi: np.ndarray) -> Tuple[List[Dict[str, Any]], bool]:
    """
    Crops ONLY detected reference_scale ROI and dynamically locates the 6 rectangular colour patches.
    Removes outer white paper margin & dark holder frame, determines orientation (horizontal vs vertical),
    automatically detects patch gradient direction (brightest to darkest), and computes BGR, HSV, CIELAB.
    """
    if ref_roi is None or ref_roi.size == 0:
        return [], False
        
    rh, rw = ref_roi.shape[:2]
    
    # Filter out outer white card margin (gray > 240 with low saturation) AND dark background (gray < 20)
    hsv_roi = cv2.cvtColor(ref_roi, cv2.COLOR_BGR2HSV)
    gray_roi = cv2.cvtColor(ref_roi, cv2.COLOR_BGR2GRAY)
    
    sat = hsv_roi[:, :, 1]
    val = hsv_roi[:, :, 2]
    
    # True reference color patch mask: non-dark AND (colored OR dark patch)
    patch_mask = (val >= 20) & ((sat >= 12) | (gray_roi <= 60) | (gray_roi <= 235))
    
    if np.any(patch_mask):
        coords = np.argwhere(patch_mask)
        ymin, xmin = coords.min(axis=0)
        ymax, xmax = coords.max(axis=0)
        off_x, off_y = int(xmin), int(ymin)
        scale_w = max(10, int(xmax - xmin + 1))
        scale_h = max(10, int(ymax - ymin + 1))
    else:
        off_x, off_y = 0, 0
        scale_w, scale_h = rw, rh

    # 2. Determine Orientation (Horizontal vs Vertical)
    is_horizontal = (scale_w >= scale_h)
    num_stages = 6
    sub_crops = []
    
    for i in range(num_stages):
        if is_horizontal:
            seg_len = scale_w / float(num_stages)
            x1 = int(i * seg_len + seg_len * 0.10)
            x2 = int((i + 1) * seg_len - seg_len * 0.10)
            y1 = int(scale_h * 0.10)
            y2 = int(scale_h * 0.90)
            
            bx = off_x + x1
            by = off_y + y1
            bw = max(1, x2 - x1)
            bh = max(1, y2 - y1)
        else:
            seg_len = scale_h / float(num_stages)
            y1 = int(i * seg_len + seg_len * 0.10)
            y2 = int((i + 1) * seg_len - seg_len * 0.10)
            x1 = int(scale_w * 0.10)
            x2 = int(scale_w * 0.90)
            
            bx = off_x + x1
            by = off_y + y1
            bw = max(1, x2 - x1)
            bh = max(1, y2 - y1)
            
        crop = ref_roi[max(0, by):min(rh, by+bh), max(0, bx):min(rw, bx+bw)]
        if crop.size == 0:
            crop = ref_roi

        c_gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        c_mask = (c_gray > 5) & (c_gray < 254)
        if not np.any(c_mask):
            c_mask = np.ones_like(c_gray, dtype=bool)
            
        b_med = float(np.median(crop[:, :, 0][c_mask]))
        g_med = float(np.median(crop[:, :, 1][c_mask]))
        r_med = float(np.median(crop[:, :, 2][c_mask]))
        
        c_hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        h_med = int(np.median(c_hsv[:, :, 0][c_mask]))
        s_med = int(np.median(c_hsv[:, :, 1][c_mask]))
        v_med = int(np.median(c_hsv[:, :, 2][c_mask]))

        lab_med = bgr_to_cielab(np.uint8([int(b_med), int(g_med), int(r_med)]))

        sub_crops.append({
            "rgb": [int(r_med), int(g_med), int(b_med)],
            "hsv": [h_med, s_med, v_med],
            "lab": [round(lab_med[0], 2), round(lab_med[1], 2), round(lab_med[2], 2)],
            "sub_bbox": [bx, by, bw, bh],
            "luminance": lab_med[0]
        })

    # 3. Orient Patches from Brightest (WHITE) to Darkest (BLACK)
    if len(sub_crops) == 6 and sub_crops[0]["luminance"] < sub_crops[-1]["luminance"]:
        sub_crops.reverse()

    patches = []
    for i, item in enumerate(sub_crops):
        stage_name = STAGE_NAMES[i]
        patches.append({
            "index": i,
            "stage": stage_name,
            "rgb": item["rgb"],
            "hsv": item["hsv"],
            "lab": item["lab"],
            "sub_bbox": item["sub_bbox"]
        })

    success = (len(patches) == 6)
    return patches, success

def extract_region_color_stats(crop: np.ndarray) -> Dict[str, Any]:
    """
    Extracts robust median RGB, HSV, and CIELAB features from valid central test strip ROI pixels.
    Retains all valid chemical sensing colors (from WHITE to BLACK) while masking extreme glare (>254).
    """
    if crop is None or crop.size == 0:
        return {
            "rgb_median": [200, 200, 200],
            "hsv_median": [0, 0, 80],
            "lab_median": [80.0, 0.0, 0.0],
            "valid_pixel_count": 0,
            "variance": 0.0
        }
        
    h, w = crop.shape[:2]
    my, mx = int(h * 0.15), int(w * 0.15)
    inner = crop[my:h-my, mx:w-mx] if h > 2*my and w > 2*mx else crop
    
    gray = cv2.cvtColor(inner, cv2.COLOR_BGR2GRAY)
    
    # Filter out extreme specular glare highlights (>254) and total black void (<5)
    valid_mask = (gray >= 5) & (gray <= 254)
    
    if not np.any(valid_mask):
        valid_mask = np.ones_like(gray, dtype=bool)
        
    b_vals = inner[:, :, 0][valid_mask]
    g_vals = inner[:, :, 1][valid_mask]
    r_vals = inner[:, :, 2][valid_mask]
    
    b_med = float(np.median(b_vals))
    g_med = float(np.median(g_vals))
    r_med = float(np.median(r_vals))
    
    rgb_med = [int(r_med), int(g_med), int(b_med)]
    
    hsv_inner = cv2.cvtColor(inner, cv2.COLOR_BGR2HSV)
    h_vals = hsv_inner[:, :, 0][valid_mask]
    s_vals = hsv_inner[:, :, 1][valid_mask]
    v_vals = hsv_inner[:, :, 2][valid_mask]
    hsv_med = [int(np.median(h_vals)), int(np.median(s_vals)), int(np.median(v_vals))]
    
    lab_med = bgr_to_cielab(np.uint8([int(b_med), int(g_med), int(r_med)]))
    variance = float(np.var(r_vals) + np.var(g_vals) + np.var(b_vals)) / 3.0
    valid_count = int(np.sum(valid_mask))
    
    return {
        "rgb_median": rgb_med,
        "hsv_median": hsv_med,
        "lab_median": [round(lab_med[0], 2), round(lab_med[1], 2), round(lab_med[2], 2)],
        "valid_pixel_count": valid_count,
        "variance": round(variance, 2)
    }

def normalize_color_with_reference(
    strip_stats: Dict[str, Any],
    measured_patches: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Applies lighting & white-balance correction using measured reference patches from the SAME uploaded image.
    """
    strip_rgb = strip_stats["rgb_median"]
    
    white_patch = next((p for p in measured_patches if p["stage"] == "WHITE"), measured_patches[0] if measured_patches else None)
    
    if white_patch and "rgb" in white_patch:
        w_rgb = white_patch["rgb"]
        r_gain = 255.0 / max(w_rgb[0], 15.0)
        g_gain = 255.0 / max(w_rgb[1], 15.0)
        b_gain = 255.0 / max(w_rgb[2], 15.0)
        
        norm_r = min(255, max(0, int(strip_rgb[0] * r_gain)))
        norm_g = min(255, max(0, int(strip_rgb[1] * g_gain)))
        norm_b = min(255, max(0, int(strip_rgb[2] * b_gain)))
        norm_strip_rgb = [norm_r, norm_g, norm_b]
        
        normalized_patches = []
        for patch in measured_patches:
            pr, pg, pb = patch["rgb"]
            npr = min(255, max(0, int(pr * r_gain)))
            npg = min(255, max(0, int(pg * g_gain)))
            npb = min(255, max(0, int(pb * b_gain)))
            np_lab = bgr_to_cielab(np.uint8([npb, npg, npr]))
            
            p_copy = patch.copy()
            p_copy["normalized_rgb"] = [npr, npg, npb]
            p_copy["normalized_lab"] = [round(np_lab[0], 2), round(np_lab[1], 2), round(np_lab[2], 2)]
            normalized_patches.append(p_copy)
    else:
        norm_strip_rgb = strip_rgb
        normalized_patches = measured_patches
        
    norm_strip_lab = bgr_to_cielab(np.uint8([norm_strip_rgb[2], norm_strip_rgb[1], norm_strip_rgb[0]]))
    
    return {
        "raw_rgb": strip_rgb,
        "normalized_strip_rgb": norm_strip_rgb,
        "normalized_strip_lab": [round(norm_strip_lab[0], 2), round(norm_strip_lab[1], 2), round(norm_strip_lab[2], 2)],
        "normalized_patches": normalized_patches
    }

def compute_lab_delta_e(lab1: Tuple[float, float, float], lab2: Tuple[float, float, float]) -> float:
    """Calculates standard CIELAB Euclidean Delta-E distance between two LAB color vectors."""
    dl = lab1[0] - lab2[0]
    da = lab1[1] - lab2[1]
    db = lab1[2] - lab2[2]
    return math.sqrt(dl**2 + da**2 + db**2)

def compute_color_stage_match(
    strip_stats: Dict[str, Any],
    measured_patches: List[Dict[str, Any]],
    safety_mapping: Dict[str, str]
) -> Dict[str, Any]:
    """
    Compares normalized test-strip LAB color against ALL SIX measured reference patch colours from uploaded image!
    DOES NOT match by position. Calculates CIELAB Delta-E distance to each patch and selects the minimum distance match.
    """
    norm_data = normalize_color_with_reference(strip_stats, measured_patches)
    strip_lab = norm_data["normalized_strip_lab"]
    norm_patches = norm_data["normalized_patches"]
    
    stage_distances = {}
    best_stage = "WHITE"
    min_dist = float("inf")
    
    sorted_matches = []
    
    for patch in norm_patches:
        stage = patch["stage"]
        patch_lab = patch.get("normalized_lab", patch["lab"])
        dist = compute_lab_delta_e(strip_lab, patch_lab)
        stage_distances[stage] = round(dist, 2)
        sorted_matches.append((dist, stage))
        
        if dist < min_dist:
            min_dist = dist
            best_stage = stage
            
    sorted_matches.sort(key=lambda x: x[0])
    second_min_dist = sorted_matches[1][0] if len(sorted_matches) > 1 else min_dist + 50.0
    
    confidence = max(60.0, min(99.4, round(100.0 - min_dist * 0.75, 1)))
    low_confidence = (min_dist > 50.0) or (min_dist > 30.0 and (second_min_dist - min_dist) < 2.0)
    
    safety_level = safety_mapping.get(best_stage, "MODERATE")
    
    return {
        "physical_color_stage": best_stage,
        "safety_level": safety_level,
        "confidence": confidence,
        "color_distance": round(min_dist, 2),
        "matched_via": "Dynamic Reference Scale + LAB Colour Distance",
        "low_confidence": low_confidence,
        "sensing_rgb": norm_data["normalized_strip_rgb"],
        "sensing_hsv": strip_stats["hsv_median"],
        "sensing_lab": strip_lab,
        "stage_distances": stage_distances,
        "measured_reference_patches": measured_patches
    }
