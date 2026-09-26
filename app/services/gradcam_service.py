import io
import base64
import numpy as np
import torch
from PIL import Image
from app.services.model_loader import get_model
from typing import Dict, Any

def generate_gradcam(tensor_input: np.ndarray, model_name: str = "paper_cnn") -> Dict[str, Any]:
    """
    Generate genuine Gradient-weighted Class Activation Mapping (Grad-CAM)
    from the actual PyTorch convolutional layers. Never fabricates heatmaps.
    """
    model = get_model(model_name)
    model.eval()

    # Determine target layer
    if model_name == "paper_cnn":
        target_layer = model.features[2]  # second Conv2d
        layer_name = "features.2 (Conv2d)"
    else:
        target_layer = model.layer4[-1].conv2  # last residual conv
        layer_name = "layer4.conv2 (Conv2d)"

    activations = []
    gradients = []

    def forward_hook(module, input, output):
        activations.append(output)

    def backward_hook(module, grad_in, grad_out):
        gradients.append(grad_out[0])

    h1 = target_layer.register_forward_hook(forward_hook)
    h2 = target_layer.register_full_backward_hook(backward_hook)

    try:
        x = torch.from_numpy(tensor_input).float()
        x.requires_grad = True

        out = model(x)
        logit = out.squeeze()

        # Backward for predicted class
        model.zero_grad()
        logit.backward(retain_graph=False)

        act = activations[0].detach().cpu().numpy()[0]   # (C, H, W)
        grad = gradients[0].detach().cpu().numpy()[0]    # (C, H, W)

        # Global average pool of gradients
        weights = np.mean(grad, axis=(1, 2))  # (C,)

        cam = np.zeros(act.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * act[i]

        # ReLU
        cam = np.maximum(cam, 0)
        if np.max(cam) > 0:
            cam = cam / np.max(cam)

        prob = torch.sigmoid(logit).item()
        classification = "AI-GENERATED" if prob >= 0.5 else "REAL"
        confidence = prob if prob >= 0.5 else (1.0 - prob)

        # Render heatmap to 256x256 image
        cam_uint8 = (cam * 255).astype(np.uint8)
        cam_img = Image.fromarray(cam_uint8, mode="L").resize((256, 256), resample=Image.Resampling.BILINEAR)

        # Colormap mapping (blue -> yellow -> red)
        cam_arr = np.array(cam_img, dtype=np.float32) / 255.0
        r = np.clip(1.5 * cam_arr, 0, 1)
        g = np.clip(1.5 * (1 - np.abs(cam_arr - 0.5) * 2), 0, 1)
        b = np.clip(1.5 * (1 - cam_arr), 0, 1)
        rgb_heatmap = (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)
        heatmap_pil = Image.fromarray(rgb_heatmap, mode="RGB")

        # Encode heatmap base64
        buf_hm = io.BytesIO()
        heatmap_pil.save(buf_hm, format="PNG")
        hm_b64 = "data:image/png;base64," + base64.b64encode(buf_hm.getvalue()).decode("ascii")

        # Create overlay
        overlay_pil = Image.blend(heatmap_pil, Image.new("RGB", (256, 256), (240, 240, 240)), alpha=0.3)
        buf_ov = io.BytesIO()
        overlay_pil.save(buf_ov, format="PNG")
        ov_b64 = "data:image/png;base64," + base64.b64encode(buf_ov.getvalue()).decode("ascii")

        return {
            "model": model_name,
            "target_layer": layer_name,
            "heatmap_base64": hm_b64,
            "overlay_base64": ov_b64,
            "classification": classification,
            "confidence": round(confidence, 4)
        }
    finally:
        h1.remove()
        h2.remove()
