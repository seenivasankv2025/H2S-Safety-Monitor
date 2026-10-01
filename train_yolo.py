"""
YOLO11 Model Training Script for H2S Sensing Strip & Reference Scale Detection
--------------------------------------------------------------------------------
Trains a YOLO11 detection model using dataset/data.yaml with strict classes:
  0: test_strip
  1: reference_scale

Saves final trained weights to models/best.pt.
"""

import os
import shutil
from ultralytics import YOLO

def train_custom_yolo11(
    data_yaml: str = "dataset/data.yaml",
    epochs: int = 50,
    imgsz: int = 640,
    batch: int = 16,
    output_model_path: str = "models/best.pt"
):
    print("=" * 60)
    print("STARTING CUSTOM YOLO11 MODEL TRAINING")
    print(f"Dataset config: {os.path.abspath(data_yaml)}")
    print(f"Output model path: {os.path.abspath(output_model_path)}")
    print("=" * 60)

    if not os.path.exists(data_yaml):
        raise FileNotFoundError(f"Dataset configuration file not found at {data_yaml}")

    # Load base YOLO11 nano detection model
    model = YOLO("yolo11n.pt")

    # Train model on dataset
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project="runs/detect",
        name="h2s_strip_train",
        exist_ok=True
    )

    trained_best_path = os.path.join("runs", "detect", "h2s_strip_train", "weights", "best.pt")
    
    if os.path.exists(trained_best_path):
        os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
        shutil.copy(trained_best_path, output_model_path)
        print(f"SUCCESS: Trained weights copied to {output_model_path}")
    else:
        print(f"WARNING: Trained weights not found at {trained_best_path}")

if __name__ == "__main__":
    train_custom_yolo11()
