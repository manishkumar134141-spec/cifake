import torch
import torch.nn as nn

class PaperCNN(nn.Module):
    """
    PaperCNN compact baseline as defined in CIFAKE research.
    Exact parameter count: 141,345 trainable parameters.
    Input: 32x32 RGB images (3 channels).
    Output: Single logit for binary classification (REAL vs AI-GENERATED).
    """
    def __init__(self, num_classes: int = 1):
        super(PaperCNN, self).__init__()
        self.features = nn.Sequential(
            # Conv block 1: 3 -> 32
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),  # 32x32 -> 16x16

            # Conv block 2: 32 -> 32
            nn.Conv2d(32, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),  # 16x16 -> 8x8
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(32 * 8 * 8, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.5),
            nn.Linear(64, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.classifier(x)
        return x

def create_paper_cnn() -> PaperCNN:
    model = PaperCNN(num_classes=1)
    return model
