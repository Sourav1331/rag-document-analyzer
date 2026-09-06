"""Compatibility module for older imports.

The production RAG implementation now lives in backend/services and uses
persistent metadata plus an external vector store instead of process-global
Chroma collections.
"""

STORES: dict = {}
STORE_FILES: dict = {}
