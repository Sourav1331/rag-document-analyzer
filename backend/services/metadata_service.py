from threading import RLock

from services.models import FileRecord, utc_now_iso


class MetadataService:
    def create_file(self, record: FileRecord) -> FileRecord:
        raise NotImplementedError

    def get_file(self, file_id: str) -> FileRecord | None:
        raise NotImplementedError

    def update_file(self, file_id: str, **values) -> FileRecord | None:
        raise NotImplementedError

    def mark_accessed(self, file_id: str) -> None:
        self.update_file(file_id, last_accessed_at=utc_now_iso())

    def ping(self) -> bool:
        raise NotImplementedError


class InMemoryMetadataService(MetadataService):
    def __init__(self) -> None:
        self._records: dict[str, FileRecord] = {}
        self._lock = RLock()

    def create_file(self, record: FileRecord) -> FileRecord:
        with self._lock:
            self._records[record.id] = record
        return record

    def get_file(self, file_id: str) -> FileRecord | None:
        with self._lock:
            return self._records.get(file_id)

    def update_file(self, file_id: str, **values) -> FileRecord | None:
        with self._lock:
            record = self._records.get(file_id)
            if record is None:
                return None
            for key, value in values.items():
                if hasattr(record, key):
                    setattr(record, key, value)
            record.updated_at = utc_now_iso()
            self._records[file_id] = record
            return record

    def ping(self) -> bool:
        return True
