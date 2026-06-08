import AnalyzerShell from './AnalyzerShell'
export default function AllDocsAnalyzer() {
  return (
    <AnalyzerShell
      type="all"
      acceptedTypes={['.pdf', '.csv', '.docx', '.doc', '.txt', '.xlsx', '.xls']}
      label="Document"
      icon="📁"
    />
  )
}
