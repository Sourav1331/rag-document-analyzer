from config import settings
from services.embedding_service import EmbeddingService
from services.ingestion_service import IngestionService
from services.job_service import JobService
from services.rag_service import RagService
from services.sqlite_store import LocalDatabase, SQLiteMetadataService, SQLiteVectorStoreService
from services.storage_service import LocalStorageService


def build_services():
    storage = LocalStorageService(settings.local_storage_dir)
    database = LocalDatabase(storage.root / "docrag.sqlite3")
    metadata = SQLiteMetadataService(database)
    vector_store = SQLiteVectorStoreService(database, settings.embedding_model)

    embeddings = EmbeddingService()
    ingestion = IngestionService(
        metadata=metadata,
        storage=storage,
        vector_store=vector_store,
        embeddings=embeddings,
    )
    rag = RagService(metadata=metadata, vector_store=vector_store, embeddings=embeddings)
    jobs = JobService(ingestion=ingestion, redis_url=settings.redis_url)
    return {
        "metadata": metadata,
        "storage": storage,
        "vector_store": vector_store,
        "embeddings": embeddings,
        "ingestion": ingestion,
        "rag": rag,
        "jobs": jobs,
    }
