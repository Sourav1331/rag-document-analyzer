import AnalyzerShell from './AnalyzerShell'
export default function CsvAnalyzer() {
  return <AnalyzerShell type="csv" acceptedTypes={['.csv']} label="CSV" icon="📊" />
}