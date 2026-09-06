from functools import lru_cache

from config import settings


@lru_cache(maxsize=1)
def get_chat_llm():
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is not set.")
    from langchain_groq import ChatGroq

    return ChatGroq(
        model=settings.groq_model,
        temperature=0,
        api_key=settings.groq_api_key,
        streaming=True,
    )
