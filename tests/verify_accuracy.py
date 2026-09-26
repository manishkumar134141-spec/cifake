import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.preprocessing import load_and_preprocess_image
from app.services.inference import run_inference

real_imgs = ['real_dog.jpg', 'photo_bird.jpg', 'photo_car.jpg', 'photo_portrait.jpg']
ai_imgs = ['ai_cat.jpg', 'ai_mountain.jpg', 'ai_car.jpg', 'ai_portrait.jpg']

print("=== TESTING REAL PHOTOGRAPHS (Modified ResNet18) ===")
for p in real_imgs:
    if not os.path.exists(p):
        continue
    with open(p, 'rb') as f:
        file_bytes = f.read()
    tensor_input, metadata = load_and_preprocess_image(file_bytes)
    res_r18 = run_inference(tensor_input, model_name='resnet18', metadata=metadata)
    print("%-20s | Verdict: %-12s (Confidence: %5.1f%%)" % (
        p, res_r18['result'], res_r18['confidence']*100
    ))

print("\n=== TESTING AI GENERATED IMAGES (Modified ResNet18) ===")
for p in ai_imgs:
    if not os.path.exists(p):
        continue
    with open(p, 'rb') as f:
        file_bytes = f.read()
    tensor_input, metadata = load_and_preprocess_image(file_bytes)
    res_r18 = run_inference(tensor_input, model_name='resnet18', metadata=metadata)
    print("%-20s | Verdict: %-12s (Confidence: %5.1f%%)" % (
        p, res_r18['result'], res_r18['confidence']*100
    ))
