from services.ingestion_service import IngestionService


class JobService:
    def __init__(self, ingestion: IngestionService, redis_url: str | None = None) -> None:
        self.ingestion = ingestion
        self.redis_url = redis_url

    def enqueue_or_run(self, file_id: str, local_path: str | None, mode: str):
        if mode == "redis":
            if not self.redis_url:
                raise ValueError("REDIS_URL is required when INGESTION_MODE=redis.")
            from redis import Redis
            from rq import Queue

            queue = Queue("ingestion", connection=Redis.from_url(self.redis_url))
            return queue.enqueue("worker.ingest_file_job", file_id)
        return self.ingestion.ingest_file(file_id, local_path)
