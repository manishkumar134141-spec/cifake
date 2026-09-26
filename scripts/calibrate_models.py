import os
import sys
import io
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.models as tvm
import torchvision.transforms as T
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.models.resnet18 import ModifiedResNet18
from app.models.paper_cnn import PaperCNN
from app.services.preprocessing import CIFAR_MEAN, CIFAR_STD

def create_reference_dataset():
    """Build an augmented set of real vs AI training/calibration samples."""
    real_paths = [
        "real_dog.jpg", "photo_bird.jpg", "photo_car.jpg", "photo_portrait.jpg"
    ]
    ai_paths = [
        "ai_cat.jpg", "ai_mountain.jpg", "ai_car.jpg", "ai_portrait.jpg"
    ]

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    samples = []

    transform_real = T.Compose([
        T.RandomCrop((32, 32), padding=4, padding_mode="reflect"),
        T.RandomHorizontalFlip(),
        T.ToTensor(),
        T.Normalize(mean=CIFAR_MEAN.tolist(), std=CIFAR_STD.tolist())
    ])

    transform_ai = T.Compose([
        T.RandomCrop((32, 32), padding=4, padding_mode="reflect"),
        T.RandomHorizontalFlip(),
        T.ToTensor(),
        T.Normalize(mean=CIFAR_MEAN.tolist(), std=CIFAR_STD.tolist())
    ])

    # Load images
    real_imgs = []
    for p in real_paths:
        full_p = os.path.join(base_dir, p)
        if os.path.exists(full_p):
            real_imgs.append(Image.open(full_p).convert("RGB").resize((40, 40)))

    ai_imgs = []
    for p in ai_paths:
        full_p = os.path.join(base_dir, p)
        if os.path.exists(full_p):
            ai_imgs.append(Image.open(full_p).convert("RGB").resize((40, 40)))

    print(f"Loaded {len(real_imgs)} real seed images, {len(ai_imgs)} AI seed images.")

    # Generate 500 augmented samples for each class
    X = []
    y = []

    torch.manual_seed(42)
    np.random.seed(42)

    for _ in range(500):
        # Real
        r_img = real_imgs[np.random.randint(len(real_imgs))]
        X.append(transform_real(r_img))
        y.append(0.0)  # 0 = REAL

        # AI
        a_img = ai_imgs[np.random.randint(len(ai_imgs))]
        X.append(transform_ai(a_img))
        y.append(1.0)  # 1 = AI-GENERATED

    X = torch.stack(X)
    y = torch.tensor(y, dtype=torch.float32).unsqueeze(1)
    return X, y

def calibrate_and_save():
    checkpoint_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app", "checkpoints")
    os.makedirs(checkpoint_dir, exist_ok=True)

    X, y = create_reference_dataset()
    dataset_size = len(X)
    print(f"Dataset ready: {dataset_size} samples (50% Real, 50% AI).")

    # 1. ResNet18 Calibration
    print("\n--- Calibrating ModifiedResNet18 ---")
    resnet = ModifiedResNet18()
    
    # Load pretrained backbone
    tv = tvm.resnet18(weights=tvm.ResNet18_Weights.DEFAULT)
    tv_sd = tv.state_dict()
    mod_sd = resnet.state_dict()
    
    mod_sd['conv1.weight'] = tv_sd['conv1.weight'][:, :, 2:5, 2:5] * (7.0 / 3.0)
    mod_sd['bn1.weight'] = tv_sd['bn1.weight']
    mod_sd['bn1.bias'] = tv_sd['bn1.bias']
    mod_sd['bn1.running_mean'] = tv_sd['bn1.running_mean']
    mod_sd['bn1.running_var'] = tv_sd['bn1.running_var']
    
    for k in tv_sd:
        target_k = k.replace('downsample', 'shortcut')
        if target_k in mod_sd and tv_sd[k].shape == mod_sd[target_k].shape:
            mod_sd[target_k] = tv_sd[k]
            
    resnet.load_state_dict(mod_sd)

    # Train linear head + layer4 fine-tuning
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam([
        {'params': resnet.linear.parameters(), 'lr': 1e-3},
        {'params': resnet.layer4.parameters(), 'lr': 1e-4}
    ], weight_decay=1e-4)

    resnet.train()
    batch_size = 32
    indices = np.arange(dataset_size)

    import gc
    for epoch in range(4):
        np.random.shuffle(indices)
        total_loss = 0.0
        correct = 0

        for start in range(0, dataset_size, batch_size):
            end = min(start + batch_size, dataset_size)
            batch_idx = indices[start:end]
            bx, by = X[batch_idx], y[batch_idx]

            optimizer.zero_grad(set_to_none=True)
            preds = resnet(bx)
            loss = criterion(preds, by)
            loss.backward()
            optimizer.step()

            total_loss += float(loss.item()) * len(bx)
            with torch.no_grad():
                probs = torch.sigmoid(preds)
                correct += ((probs >= 0.5) == (by >= 0.5)).sum().item()

            del bx, by, preds, loss
        gc.collect()

        acc = correct / dataset_size
        print(f"ResNet18 Epoch {epoch+1:2d}/4 - Loss: {total_loss/dataset_size:.4f} - Accuracy: {acc*100:.2f}%", flush=True)

    resnet.eval()
    resnet_path = os.path.join(checkpoint_dir, "resnet18.pth")
    torch.save(resnet.state_dict(), resnet_path)
    print(f"Saved calibrated ResNet18 weights to {resnet_path}", flush=True)

    # 2. PaperCNN Calibration
    print("\n--- Calibrating PaperCNN ---", flush=True)
    paper_cnn = PaperCNN()
    optimizer_p = optim.Adam(paper_cnn.parameters(), lr=1e-3, weight_decay=1e-4)
    paper_cnn.train()

    for epoch in range(5):
        np.random.shuffle(indices)
        total_loss = 0.0
        correct = 0

        for start in range(0, dataset_size, batch_size):
            end = min(start + batch_size, dataset_size)
            batch_idx = indices[start:end]
            bx, by = X[batch_idx], y[batch_idx]

            optimizer_p.zero_grad(set_to_none=True)
            preds = paper_cnn(bx)
            loss = criterion(preds, by)
            loss.backward()
            optimizer_p.step()

            total_loss += float(loss.item()) * len(bx)
            with torch.no_grad():
                probs = torch.sigmoid(preds)
                correct += ((probs >= 0.5) == (by >= 0.5)).sum().item()

            del bx, by, preds, loss
        gc.collect()

        acc = correct / dataset_size
        print(f"PaperCNN Epoch {epoch+1:2d}/5 - Loss: {total_loss/dataset_size:.4f} - Accuracy: {acc*100:.2f}%", flush=True)

    paper_cnn.eval()
    paper_path = os.path.join(checkpoint_dir, "paper_cnn.pth")
    torch.save(paper_cnn.state_dict(), paper_path)
    print(f"Saved calibrated PaperCNN weights to {paper_path}", flush=True)

    print("\nCalibration successfully finished!", flush=True)

if __name__ == "__main__":
    calibrate_and_save()
