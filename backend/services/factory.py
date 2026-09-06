from config import settings
from services.embedding_service import EmbeddingService
from services.ingestion_service import IngestionService
from services.job_service import JobService
from services.metadata_service import InMemoryMetadataService, SupabaseMetadataService
from services.rag_service import RagService
from services.storage_service import LocalStorageService, SupabaseStorageService
from services.vector_store_service import InMemoryVectorStoreService, QdrantVectorStoreService


def build_services():
    if settings.supabase_url and settings.supabase_service_role_key:
        metadata = SupabaseMetadataService(
            settings.supabase_url, settings.supabase_service_role_key
        )
        storage = SupabaseStorageService(
            settings.supabase_url,
            settings.supabase_service_role_key,
            settings.supabase_storage_bucket or "documents",
        )
    else:
        metadata = InMemoryMetadataService()
        storage = LocalStorageService(settings.local_storage_dir)

    if settings.qdrant_url and settings.qdrant_api_key:
        vector_store = QdrantVectorStoreService(
            settings.qdrant_url,
            settings.qdrant_api_key,
            settings.qdrant_collection_name,
        )
    else:
        vector_store = InMemoryVectorStoreService()

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
