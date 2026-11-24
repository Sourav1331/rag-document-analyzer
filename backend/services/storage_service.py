from pathlib import Path


class StorageService:
    def upload(self, path: str, data: bytes, content_type: str | None = None) -> str:
        raise NotImplementedError

    def download(self, path: str) -> bytes:
        raise NotImplementedError

    def delete(self, path: str) -> None:
        raise NotImplementedError

    def ping(self) -> bool:
        raise NotImplementedError


class LocalStorageService(StorageService):
    def __init__(self, root: str) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _full_path(self, path: str) -> Path:
        full = (self.root / path).resolve()
        if self.root.resolve() not in full.parents and full != self.root.resolve():
            raise ValueError("Invalid storage path.")
        return full

    def upload(self, path: str, data: bytes, content_type: str | None = None) -> str:
        full = self._full_path(path)
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(data)
        return path

    def download(self, path: str) -> bytes:
        return self._full_path(path).read_bytes()

    def delete(self, path: str) -> None:
        self._full_path(path).unlink(missing_ok=True)

    def ping(self) -> bool:
        return self.root.exists()
