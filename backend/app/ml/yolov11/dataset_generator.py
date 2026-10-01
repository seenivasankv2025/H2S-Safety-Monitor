"""
Dataset Generator & Training helper for Ultralytics YOLO11 H2S Sensing Strip localization.
Supports custom project dataset collected from actual Bi+ sensing strips.
Classes:
  0: test_strip
  1: reference_scale
"""
import os
import yaml

def generate_dataset_structure(base_dir="./dataset"):
    os.makedirs(f"{base_dir}/images/train", exist_ok=True)
    os.makedirs(f"{base_dir}/images/val", exist_ok=True)
    os.makedirs(f"{base_dir}/labels/train", exist_ok=True)
    os.makedirs(f"{base_dir}/labels/val", exist_ok=True)
    
    dataset_yaml = {
        'path': os.path.abspath(base_dir),
        'train': 'images/train',
        'val': 'images/val',
        'names': {
            0: 'test_strip',
            1: 'reference_scale'
        }
    }
    
    with open(f"{base_dir}/data.yaml", "w") as f:
        yaml.dump(dataset_yaml, f, default_flow_style=False)
        
    print(f"Generated dataset structure at {base_dir}")

if __name__ == "__main__":
    generate_dataset_structure()
