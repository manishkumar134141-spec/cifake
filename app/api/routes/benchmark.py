from fastapi import APIRouter
from app.schemas.analysis import BenchmarkMetrics
from app.core.config import settings

router = APIRouter()

@router.get("/benchmark", response_model=BenchmarkMetrics)
async def get_benchmark_data():
    """
    Retrieve CIFAKE benchmark dataset statistics and verified research validation metrics.
    """
    stats = settings.BENCHMARK_STATS
    val_cnn = stats["validation_metrics"]["paper_cnn"]
    val_resnet = stats["validation_metrics"]["resnet18"]

    return BenchmarkMetrics(
        total_images=stats["total_images"],
        real_images=stats["real_images"],
        fake_images=stats["fake_images"],
        classes_count=stats["num_classes"],
        classes=stats["classes"],
        paper_cnn_accuracy=val_cnn["accuracy"],
        paper_cnn_precision=val_cnn["precision"],
        paper_cnn_recall=val_cnn["recall"],
        paper_cnn_f1=val_cnn["f1_score"],
        paper_cnn_roc_auc=val_cnn["roc_auc"],
        resnet18_peak_accuracy=val_resnet["peak_validation_accuracy"],
        real_source=stats["real_source"],
        fake_source=stats["fake_source"],
        disclaimer="Metrics represent controlled validation results on the CIFAKE 32x32 benchmark. They do not claim universal real-world detector accuracy across arbitrary resolutions or generative pipelines."
    )
