import AnalyzerShell from './AnalyzerShell'
export default function PdfAnalyzer() {
  return <AnalyzerShell type="pdf" acceptedTypes={['.pdf']} label="PDF" icon="📄" />
}