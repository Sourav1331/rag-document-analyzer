import json
from pathlib import Path

from services.factory import build_services


def main() -> None:
    cases = json.loads(Path("eval_cases.json").read_text(encoding="utf-8"))
    services = build_services()
    rag = services["rag"]

    for index, case in enumerate(cases, start=1):
        results = rag.retrieve(
            session_id=case["session_id"],
            analyzer_type=case["analyzer_type"],
            file_id=case["file_id"],
            question=case["question"],
        )
        joined = "\n".join(result.text.lower() for result in results)
        keywords = [keyword.lower() for keyword in case.get("expected_keywords", [])]
        found_keywords = all(keyword in joined for keyword in keywords)
        source_ok = any(
            result.metadata.get("filename") == case["expected_source_file"]
            for result in results
        )
        expected_found = case.get("should_be_found", True)
        passed = (found_keywords and source_ok) if expected_found else not found_keywords
        print(
            f"case={index} passed={passed} results={len(results)} "
            f"source_ok={source_ok} keywords_ok={found_keywords}"
        )


if __name__ == "__main__":
    main()
