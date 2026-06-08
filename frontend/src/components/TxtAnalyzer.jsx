import AnalyzerShell from './AnalyzerShell'
export default function TxtAnalyzer() {
  return <AnalyzerShell type="txt" acceptedTypes={['.txt']} label="Text" icon="📃" />
}
