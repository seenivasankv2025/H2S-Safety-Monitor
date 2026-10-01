import cv2
import numpy as np
import os

# Prototype reference BGR colors (OpenCV uses BGR)
PROTOTYPE_REF_BGR = [
    (255, 255, 255), # 1. WHITE (#FFFFFF)
    (196, 249, 255), # 2. PALE YELLOW (#FFF9C4)
    (0, 215, 255),   # 3. YELLOW (#FFD700)
    (140, 180, 210), # 4. LIGHT BROWN (#D2B48C)
    (43, 90, 139),   # 5. BROWN (#8B5A2B)
    (0, 0, 0)        # 6. BLACK (#000000)
]

def create_sample_strip_image(
    filename: str,
    sensing_color_bgr: tuple,
    add_blur: bool = False,
    add_dust: bool = False,
    layout: str = "STANDARD" # STANDARD, SWAPPED, VERTICAL
):
    img = np.zeros((400, 800, 3), dtype=np.uint8)
    img[:] = (235, 235, 235) # Background
    
    # Dark wristband pad
    cv2.rectangle(img, (50, 60), (750, 340), (45, 45, 45), -1)
    
    # Strip base (central white paper)
    sx, sy, sw, sh = 120, 100, 560, 200
    cv2.rectangle(img, (sx, sy), (sx+sw, sy+sh), (245, 245, 242), -1)
    cv2.rectangle(img, (sx, sy), (sx+sw, sy+sh), (180, 180, 180), 2)
    
    if layout == "STANDARD":
        # Left Test Strip (Sensing Zone), Right Reference Scale (Horizontal)
        cv2.rectangle(img, (140, 140), (330, 260), sensing_color_bgr, -1)
        cv2.rectangle(img, (140, 140), (330, 260), (160, 160, 160), 1)
        
        block_w = 38
        for i, color in enumerate(PROTOTYPE_REF_BGR):
            rx1 = 400 + i * block_w
            cv2.rectangle(img, (rx1, 140), (rx1 + block_w - 2, 260), color, -1)
            cv2.rectangle(img, (rx1, 140), (rx1 + block_w - 2, 260), (100, 100, 100), 1)

    elif layout == "SWAPPED":
        # Left Reference Scale (Horizontal), Right Test Strip
        block_w = 38
        for i, color in enumerate(PROTOTYPE_REF_BGR):
            rx1 = 140 + i * block_w
            cv2.rectangle(img, (rx1, 140), (rx1 + block_w - 2, 260), color, -1)
            cv2.rectangle(img, (rx1, 140), (rx1 + block_w - 2, 260), (100, 100, 100), 1)
            
        cv2.rectangle(img, (420, 140), (610, 260), sensing_color_bgr, -1)
        cv2.rectangle(img, (420, 140), (610, 260), (160, 160, 160), 1)

    elif layout == "VERTICAL":
        # Left Test Strip, Right Vertical Reference Scale
        cv2.rectangle(img, (140, 130), (380, 270), sensing_color_bgr, -1)
        cv2.rectangle(img, (140, 130), (380, 270), (160, 160, 160), 1)
        
        block_h = 24
        for i, color in enumerate(PROTOTYPE_REF_BGR):
            ry1 = 125 + i * block_h
            cv2.rectangle(img, (480, ry1), (620, ry1 + block_h - 2), color, -1)
            cv2.rectangle(img, (480, ry1), (620, ry1 + block_h - 2), (100, 100, 100), 1)

    # Add Dust Contamination if requested
    if add_dust:
        for _ in range(40):
            dx = np.random.randint(140, 330)
            dy = np.random.randint(140, 260)
            cv2.circle(img, (dx, dy), np.random.randint(4, 9), (20, 20, 20), -1)
            
    # Add Blur if requested
    if add_blur:
        img = cv2.GaussianBlur(img, (25, 25), 0)
        
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    cv2.imwrite(filename, img)
    print(f"Generated sample image: {filename}")

def generate_all_samples():
    out_dir = "sample_data/images"
    
    samples = [
        ("strip_stage_1_white.png", PROTOTYPE_REF_BGR[0], False, False, "STANDARD"),
        ("strip_stage_2_pale_yellow.png", PROTOTYPE_REF_BGR[1], False, False, "STANDARD"),
        ("strip_stage_3_dark_yellow.png", PROTOTYPE_REF_BGR[2], False, False, "STANDARD"),
        ("strip_stage_4_light_brown.png", PROTOTYPE_REF_BGR[3], False, False, "STANDARD"),
        ("strip_stage_5_dark_brown.png", PROTOTYPE_REF_BGR[4], False, False, "STANDARD"),
        ("strip_stage_6_black.png", PROTOTYPE_REF_BGR[5], False, False, "STANDARD"),
        ("strip_swapped_layout.png", PROTOTYPE_REF_BGR[3], False, False, "SWAPPED"),
        ("strip_vertical_scale.png", PROTOTYPE_REF_BGR[3], False, False, "VERTICAL"),
        ("strip_blurry.png", PROTOTYPE_REF_BGR[2], True, False, "STANDARD"),
        ("strip_contaminated.png", PROTOTYPE_REF_BGR[2], False, True, "STANDARD")
    ]
    
    for item in samples:
        fname = os.path.join(out_dir, item[0])
        create_sample_strip_image(fname, item[1], item[2], item[3], item[4])

if __name__ == "__main__":
    generate_all_samples()
