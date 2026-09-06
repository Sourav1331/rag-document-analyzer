from config import settings
from services.factory import build_services


services = build_services()


def ingest_file_job(file_id: str) -> str:
    services["ingestion"].ingest_file(file_id)
    return file_id
