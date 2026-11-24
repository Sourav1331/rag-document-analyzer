"""Compatibility module for older imports.

The production RAG implementation now lives in backend/services and uses
persistent SQLite storage instead of process-global
Chroma collections.
"""

STORES: dict = {}
STORE_FILES: dict = {}
