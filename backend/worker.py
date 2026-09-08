from config import settings
from services.embedding_service import get_embedding_model
from services.factory import build_services


# Load FastEmbed once when the worker starts. This moves model download and
# ONNX initialization out of the first document job.
if settings.embedding_model:
    get_embedding_model()

services = build_services()


def ingest_file_job(file_id: str) -> str:
    services["ingestion"].ingest_file(file_id)
    return file_id
