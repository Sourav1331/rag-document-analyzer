import AnalyzerShell from './AnalyzerShell'
export default function ExcelAnalyzer() {
  return <AnalyzerShell type="excel" acceptedTypes={['.xlsx', '.xls']} label="Excel" icon="📑" />
}