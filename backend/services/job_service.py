from services.ingestion_service import IngestionService


class JobService:
    def __init__(self, ingestion: IngestionService, redis_url: str | None = None) -> None:
        self.ingestion = ingestion
        self.redis_url = redis_url

    def enqueue_or_run(self, file_id: str, local_path: str | None, mode: str):
        if mode == "redis":
            return self.enqueue(file_id)
        return self.ingestion.ingest_file(file_id, local_path)

    def _queue(self):
        if not self.redis_url:
            raise ValueError("REDIS_URL is required when INGESTION_MODE=redis.")
        from redis import Redis
        from rq import Queue

        return Queue("ingestion", connection=Redis.from_url(self.redis_url))

    def enqueue(self, file_id: str):
        """Enqueue one stable job per file so status polling cannot duplicate it."""
        queue = self._queue()
        job_id = f"ingest:{file_id}"
        existing = queue.fetch_job(job_id)
        if existing is not None and existing.get_status() in {
            "queued", "started", "deferred", "scheduled"
        }:
            return existing
        return queue.enqueue(
            "worker.ingest_file_job",
            file_id,
            job_id=job_id,
            job_timeout="2h",
            result_ttl=86400,
            failure_ttl=86400,
        )

    def is_pending(self, file_id: str) -> bool:
        queue = self._queue()
        job = queue.fetch_job(f"ingest:{file_id}")
        return job is not None and job.get_status() in {
            "queued", "started", "deferred", "scheduled"
        }
