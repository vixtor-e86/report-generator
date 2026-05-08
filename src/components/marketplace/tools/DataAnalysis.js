import { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, Sparkles, RefreshCw, Upload, 
  FileSpreadsheet, Table, FileText, Download,
  Check, Zap, Info, ArrowRight, AlertCircle,
  TrendingUp, Calculator, Search, Copy, FileDown
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function DataAnalysis({ 
  isProcessing, 
  setIsProcessing,
  hasPaid,
  setHasPaid,
  setShowPaymentDialog
}) {
  const [file, setFile] = useState(null);
  const [dataPreview, setDataPreview] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [query, setQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const resultsRef = useRef(null);

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && dataPreview.length > 0) {
      handleAnalyze(true);
    }
  }, [hasPaid]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
      return toast.error("Please upload a CSV or Excel file.");
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file) => {
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const fileExt = file.name.split('.').pop().toLowerCase();
        let parsedData = [];

        if (fileExt === 'csv') {
          const text = e.target.result;
          const results = Papa.parse(text, { header: true, skipEmptyLines: true });
          parsedData = results.data;
        } else {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
        }

        if (parsedData.length === 0) throw new Error("File appears to be empty.");
        
        setDataPreview(parsedData);
        toast.success(`Successfully loaded ${parsedData.length} rows.`);
      } catch (err) {
        console.error("Parsing Error:", err);
        toast.error("Failed to parse file. Ensure it's a valid dataset.");
      } finally {
        setIsParsing(false);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleAnalyze = async (skipPaymentCheck = false) => {
    if (dataPreview.length === 0) return toast.error("Please upload and load a dataset first.");
    
    if (!hasPaid && !skipPaymentCheck) {
      setShowPaymentDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/marketplace/tools/data-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: dataPreview, 
          filename: file.name,
          query: query 
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      toast.success('Data analysis complete!');
      setHasPaid(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Analysis report copied!');
  };

  const handleDownloadPDF = async () => {
    if (!analysis || !resultsRef.current) return;
    setIsDownloading(true);
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin: [20, 20, 20, 20],
        filename: `Analysis_Report_${file?.name?.split('.')[0] || 'Dataset'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          // CRITICAL: Clean the cloned document before rendering
          onclone: (clonedDoc) => {
            // 1. Remove all existing site styles to prevent 'lab' color errors
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach(s => s.remove());

            // 2. Inject professional, hex-only styles for the PDF
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              body { 
                background: white !important; 
                font-family: Arial, sans-serif !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              /* Target the specific results container in the clone */
              div { 
                color: #374151 !important; 
                background: white !important;
                display: block !important;
                width: 100% !important;
              }
              h1, h2, h3, h4 { 
                color: #111827 !important; 
                font-weight: bold !important;
                text-transform: uppercase !important;
                margin-top: 20px !important;
                margin-bottom: 10px !important;
                border-bottom: 1px solid #e5e7eb !important;
                padding-bottom: 5px !important;
                display: block !important;
              }
              h1 { font-size: 22px !important; }
              h2 { font-size: 18px !important; }
              h3 { font-size: 16px !important; }
              p { 
                font-size: 12px !important; 
                line-height: 1.6 !important; 
                margin-bottom: 12px !important;
                display: block !important;
              }
              table { 
                width: 100% !important; 
                border-collapse: collapse !important; 
                margin: 15px 0 !important;
                display: table !important;
              }
              th, td { 
                border: 1px solid #e5e7eb !important; 
                padding: 8px !important; 
                text-align: left !important;
                font-size: 10px !important;
                display: table-cell !important;
              }
              th { background-color: #f9fafb !important; font-weight: bold !important; }
              strong { font-weight: bold !important; color: #111827 !important; }
              code { background: #f3f4f6 !important; padding: 2px 4px !important; border-radius: 3px !important; }
            `;
            clonedDoc.head.appendChild(style);
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Capture the actual results element
      await html2pdf().set(opt).from(resultsRef.current).save();
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF Error:', err);
      toast.error('PDF generation failed. Please copy the text instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
      {/* Settings Bar */}
      <div className="bg-white border border-[#e5e7eb] rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center text-blue-600">
            <Calculator className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-zinc-900 uppercase tracking-tight">Focus Area</h3>
          </div>
        </div>
        <input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Peak sales periods..."
          className="flex-1 min-w-[200px] bg-slate-50 border-slate-100 rounded-lg md:rounded-xl px-4 md:px-6 py-2 md:py-2.5 font-bold text-[10px] md:text-xs text-zinc-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
        />
      </div>

      <div className="grid lg:grid-cols-1 gap-8 md:gap-12">
        {/* Input Pane */}
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col min-h-[500px] md:min-h-[600px]">
          <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                <Upload className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Data Core</h2>
                <p className="text-[10px] md:text-sm text-slate-500 font-medium">CSV or Excel files</p>
              </div>
            </div>
            {file && (
              <button 
                onClick={() => { setFile(null); setDataPreview([]); }}
                className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-red-500 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <label className="block cursor-pointer group shrink-0">
              <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="hidden" />
              <div className={`border-4 border-dashed rounded-[24px] md:rounded-[32px] p-6 md:p-12 text-center transition-all ${file ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50 group-hover:border-blue-200 group-hover:bg-blue-50/50'}`}>
                {isParsing ? (
                  <RefreshCw className="w-8 h-8 md:w-12 md:h-12 text-blue-600 animate-spin mx-auto" />
                ) : file ? (
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-sm text-blue-600">
                      <FileSpreadsheet className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-base md:text-lg font-black text-zinc-900 truncate max-w-[200px] md:max-w-[300px]">{file.name}</p>
                      <p className="text-[9px] md:text-xs font-bold text-slate-600 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • {dataPreview.length} Rows</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                    <Table className="w-8 h-8 md:w-10 md:h-10 text-slate-300" />
                    <p className="text-[10px] md:text-sm font-black text-slate-600 uppercase tracking-[0.2em]">Click to upload dataset</p>
                  </div>
                )}
              </div>
            </label>

            <div className="flex-1 bg-slate-50/50 border border-[#e5e7eb] rounded-[24px] md:rounded-[40px] overflow-hidden flex flex-col min-h-[250px]">
              <div className="p-4 md:p-6 border-b border-[#e5e7eb] bg-white/50 flex justify-between items-center">
                <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 md:w-4 md:h-4" /> Data Preview
                </span>
                {dataPreview.length > 0 && <Badge className="bg-blue-100 text-blue-600 border-none px-2.5 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase">{dataPreview.length} Rows</Badge>}
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar p-4 md:p-6">
                {dataPreview.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[400px]">
                      <thead>
                        <tr>
                          {Object.keys(dataPreview[0]).map(header => (
                            <th key={header} className="p-2 md:p-3 bg-slate-100/50 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dataPreview.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/50 transition-colors">
                            {Object.values(row).map((val, vIdx) => (
                              <td key={vIdx} className="p-2 md:p-3 text-[10px] md:text-[11px] font-bold text-slate-600 border-b border-slate-50/50 truncate max-w-[120px] md:max-w-[200px]">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-full py-12 md:py-20 flex flex-col items-center justify-center text-slate-300 italic text-xs md:text-sm text-center px-4">
                    No data loaded yet
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={() => handleAnalyze()}
            disabled={isProcessing || isParsing || dataPreview.length === 0}
            className="w-full bg-black hover:bg-zinc-800 text-white rounded-[20px] md:rounded-[24px] py-6 md:py-10 font-black uppercase text-[10px] md:text-sm tracking-[0.2em] shadow-xl mt-6 md:mt-8 flex items-center justify-center gap-3 md:gap-4 shrink-0"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />}
            {isProcessing ? 'Analyzing...' : `Execute Analyst (₦1,200)`}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {analysis && (
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 pb-6 border-b border-slate-50 gap-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-zinc-900 uppercase tracking-tight">Statistical Insights</h3>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-1 md:flex-none rounded-full px-4 md:px-6 border-[#e5e7eb] text-zinc-900 font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-black hover:text-white transition-all gap-1.5 md:gap-2 h-10 md:h-11"
              >
                {isDownloading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3 text-blue-600" />}
                {isDownloading ? '...' : 'PDF'}
              </Button>
              <Button 
                onClick={handleCopy} 
                variant="outline" 
                size="sm" 
                className="flex-1 md:flex-none rounded-full px-4 md:px-6 border-[#e5e7eb] text-zinc-900 font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-black hover:text-white transition-all h-10 md:h-11"
              >
                {copied ? <Check className="w-3 h-3 text-green-400 mr-1.5 md:mr-2" /> : <Copy className="w-3 h-3 mr-1.5 md:mr-2" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div ref={resultsRef} className="prose prose-slate max-w-none text-sm md:text-base
            prose-headings:text-zinc-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
            prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed
            prose-strong:text-zinc-900 prose-strong:font-black
            prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-blue-700 prose-code:font-bold
            prose-pre:bg-zinc-900 prose-pre:rounded-[20px] md:prose-pre:rounded-[24px] prose-pre:p-4 md:prose-pre:p-6 prose-pre:shadow-xl
            prose-table:border prose-table:border-slate-100 prose-table:rounded-2xl prose-table:overflow-hidden
            prose-th:bg-slate-50 prose-th:p-3 md:prose-th:p-4 prose-th:text-[9px] md:prose-th:text-[10px] prose-th:font-black prose-th:uppercase prose-th:tracking-widest
            prose-td:p-3 md:prose-td:p-4 prose-td:text-xs md:prose-td:text-sm prose-td:border-t prose-td:border-slate-50
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {!analysis && !isProcessing && (
        <div className="py-16 md:py-32 text-center bg-white border border-dashed border-slate-200 rounded-[48px] md:rounded-[64px] px-6">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 rounded-[32px] md:rounded-[40px] flex items-center justify-center mx-auto mb-6 md:mb-8 text-slate-200">
            <BarChart3 className="w-8 h-8 md:w-12 md:h-12" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Statistical Engine</h2>
          <p className="text-slate-600 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.2em] max-w-sm mx-auto">
            Upload your data and specify your research questions to generate a professional analysis report
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="py-16 md:py-32 text-center bg-white border border-[#e5e7eb] rounded-[48px] md:rounded-[64px] animate-pulse px-6">
          <div className="relative w-16 h-16 md:w-24 md:h-24 mx-auto mb-6 md:mb-8">
            <div className="absolute inset-0 bg-blue-100 rounded-[32px] md:rounded-[40px] animate-ping opacity-25" />
            <div className="relative w-16 h-16 md:w-24 md:h-24 bg-blue-50 rounded-[32px] md:rounded-[40px] flex items-center justify-center text-blue-600">
              <RefreshCw className="w-8 h-8 md:w-12 md:h-12 animate-spin" />
            </div>
          </div>
          <p className="text-blue-600 font-black uppercase text-[8px] md:text-[10px] tracking-[0.3em] animate-bounce">
            Analyzing patterns & identifying trends...
          </p>
        </div>
      )}

      {/* Preview Section (Optional) */}
      {!analysis && dataPreview.length > 0 && (
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-50 rounded-lg md:rounded-xl flex items-center justify-center text-slate-600">
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h3 className="text-xs md:text-sm font-black text-zinc-900 uppercase tracking-widest">Dataset Preview (Top 5)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr>
                  {Object.keys(dataPreview[0]).map(header => (
                    <th key={header} className="p-3 md:p-4 bg-slate-50 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataPreview.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    {Object.values(row).map((val, vIdx) => (
                      <td key={vIdx} className="p-3 md:p-4 text-[10px] md:text-xs font-medium text-slate-600 border-b border-slate-50 truncate max-w-[100px] md:max-w-[150px]">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
