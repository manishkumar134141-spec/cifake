import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import numpy as np
from PIL import Image
from scipy import ndimage
import torch
import torchvision.models as tvm
from app.models.resnet18 import ModifiedResNet18

# Setup model
tv = tvm.resnet18(weights=tvm.ResNet18_Weights.DEFAULT)
mod = ModifiedResNet18()
tv_sd = tv.state_dict()
mod_sd = mod.state_dict()
mod_sd['conv1.weight'] = tv_sd['conv1.weight'][:, :, 2:5, 2:5] * (7.0 / 3.0)
mod_sd['bn1.weight'] = tv_sd['bn1.weight']
mod_sd['bn1.bias'] = tv_sd['bn1.bias']
mod_sd['bn1.running_mean'] = tv_sd['bn1.running_mean']
mod_sd['bn1.running_var'] = tv_sd['bn1.running_var']
for k in tv_sd:
    target_k = k.replace('downsample', 'shortcut')
    if target_k in mod_sd and tv_sd[k].shape == mod_sd[target_k].shape:
        mod_sd[target_k] = tv_sd[k]
mod.load_state_dict(mod_sd)
mod.eval()

CIFAR_MEAN = np.array([0.4914, 0.4822, 0.4465], dtype=np.float32)
CIFAR_STD = np.array([0.2023, 0.1994, 0.2010], dtype=np.float32)

def analyze(path):
    img = Image.open(path).convert('RGB')
    orig_w, orig_h = img.size
    scale = min(1.0, 512.0 / max(orig_w, orig_h))
    proc = img.resize((int(orig_w * scale), int(orig_h * scale)), Image.Resampling.BILINEAR) if scale < 1.0 else img
    gray = np.array(proc.convert('L'), dtype=np.float64)
    h, w = gray.shape
    
    # 1. 2D FFT
    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    mag = np.abs(fshift)
    cy, cx = h // 2, w // 2
    y, x = np.ogrid[:h, :w]
    r = np.sqrt((x - cx)**2 + (y - cy)**2).astype(int)
    max_r = min(cy, cx)
    c_rad = max(4, max_r // 6)
    mag_hf = mag.copy()
    mag_hf[cy-c_rad:cy+c_rad, cx-c_rad:cx+c_rad] = 0
    hf_energy = float(np.sum(mag_hf**2) / (np.sum(mag**2) + 1e-8))
    
    radial_mean = [np.mean(mag[r == i]) for i in range(1, max_r)]
    freqs = np.arange(1, max_r)
    log_f = np.log(freqs[c_rad:max_r//2])
    log_p = np.log(np.array(radial_mean)[c_rad:max_r//2] + 1e-8)
    slope, _ = np.polyfit(log_f, log_p, 1)
    
    # 2. Gradient Kurtosis
    gx = ndimage.sobel(gray, axis=1)
    gy = ndimage.sobel(gray, axis=0)
    gmag = np.hypot(gx, gy)
    g_kurt = float(np.mean((gmag - np.mean(gmag))**4) / (np.var(gmag)**2 + 1e-8))
    
    # 3. Noise Residual in flat vs text
    med = ndimage.median_filter(gray, size=3)
    res = gray - med
    res_var = float(np.var(res))
    flat_mask = gmag < np.percentile(gmag, 25)
    flat_noise = float(np.var(res[flat_mask])) if np.sum(flat_mask) > 50 else res_var
    flat_ratio = flat_noise / (res_var + 1e-8)
    
    # 4. Deep feature norm
    t_img = img.resize((32, 32), Image.Resampling.BILINEAR)
    norm_arr = (np.array(t_img, dtype=np.float32) / 255.0 - CIFAR_MEAN) / CIFAR_STD
    t = torch.from_numpy(np.transpose(norm_arr, (2, 0, 1))).unsqueeze(0).float()
    with torch.no_grad():
        f4 = mod.layer4(mod.layer3(mod.layer2(mod.layer1(mod.relu(mod.bn1(mod.conv1(t)))))))
        feat = mod.avgpool(f4).flatten().numpy()
        fnorm = float(np.linalg.norm(feat))
        
    return -slope, hf_energy*100, g_kurt, flat_ratio, fnorm

print("%-20s | %-6s | %-7s | %-8s | %-10s | %-6s" % ("IMAGE", "SLOPE", "HF_EN%", "G_KURT", "FLAT_RATIO", "FNORM"))
print("-" * 72)
print("--- REAL PHOTOS ---")
for p in ['real_dog.jpg', 'photo_bird.jpg', 'photo_car.jpg', 'photo_portrait.jpg']:
    s, hf, gk, fr, fn = analyze(p)
    print("%-20s | %6.2f | %7.3f | %8.2f | %10.3f | %6.2f" % (p, s, hf, gk, fr, fn))

print("--- AI GENERATED ---")
for p in ['ai_cat.jpg', 'ai_mountain.jpg', 'ai_car.jpg', 'ai_portrait.jpg']:
    s, hf, gk, fr, fn = analyze(p)
    print("%-20s | %6.2f | %7.3f | %8.2f | %10.3f | %6.2f" % (p, s, hf, gk, fr, fn))
