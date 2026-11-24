export function groupSourceFiles(passages = []) {
  const files = new Map()
  for (const passage of passages) {
    const name = passage.filename || 'Selected document'
    const id = passage.file_id || name
    if (!files.has(id)) files.set(id, { id, name, passages: [] })
    files.get(id).passages.push(passage)
  }
  return Array.from(files.values())
}

export function passageLocation(passage) {
  const parts = []
  if (passage.page_number != null) parts.push('p. ' + passage.page_number)
  if (passage.chunk_index != null) parts.push('Passage ' + (passage.chunk_index + 1))
  return parts.join(' · ') || 'Retrieved passage'
}
