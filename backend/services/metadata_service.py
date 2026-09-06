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


class SupabaseMetadataService(MetadataService):
    table_name = "document_files"

    def __init__(self, url: str, service_role_key: str) -> None:
        from supabase import create_client

        self.client = create_client(url, service_role_key)

    def create_file(self, record: FileRecord) -> FileRecord:
        data = self.client.table(self.table_name).insert(record.to_dict()).execute()
        return FileRecord.from_dict(data.data[0])

    def get_file(self, file_id: str) -> FileRecord | None:
        data = (
            self.client.table(self.table_name)
            .select("*")
            .eq("id", file_id)
            .limit(1)
            .execute()
        )
        if not data.data:
            return None
        return FileRecord.from_dict(data.data[0])

    def update_file(self, file_id: str, **values) -> FileRecord | None:
        values["updated_at"] = utc_now_iso()
        data = (
            self.client.table(self.table_name)
            .update(values)
            .eq("id", file_id)
            .execute()
        )
        if not data.data:
            return None
        return FileRecord.from_dict(data.data[0])

    def ping(self) -> bool:
        self.client.table(self.table_name).select("id").limit(1).execute()
        return True
