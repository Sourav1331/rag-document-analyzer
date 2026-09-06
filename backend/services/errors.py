from fastapi import HTTPException


class AppError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str, *, status_code: int | None = None) -> None:
        super().__init__(message)
        if status_code is not None:
            self.status_code = status_code
        self.message = message


class FileTooLargeError(AppError):
    status_code = 413
    code = "file_too_large"


class ProcessingError(AppError):
    status_code = 422
    code = "processing_failed"


class NotReadyError(AppError):
    status_code = 409
    code = "file_not_ready"


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


def to_http_error(error: AppError) -> HTTPException:
    return HTTPException(
        status_code=error.status_code,
        detail={"code": error.code, "message": error.message},
    )
