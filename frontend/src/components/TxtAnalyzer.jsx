import AnalyzerShell from './AnalyzerShell'
export default function TxtAnalyzer() {
  return <AnalyzerShell type="txt" acceptedTypes={['.txt', '.docx', '.doc']} label="Text / DOCX" icon="📃" />
}