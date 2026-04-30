"use client";
import { useState, useEffect } from 'react';
import { 
  BarChart3, Sparkles, RefreshCw, Upload, 
  FileSpreadsheet, Table, FileText, Download,
  Check, Zap, Info, ArrowRight, AlertCircle,
  TrendingUp, Calculator, Search
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

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Upload & Config Section */}
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
          
          <div className="relative space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Upload Dataset</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CSV, XLSX, or XLS files up to 5MB</p>
              </div>
            </div>

            <label className={`block w-full cursor-pointer group transition-all`}>
              <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="hidden" />
              <div className={`border-4 border-dashed rounded-[32px] p-12 text-center transition-all ${file ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50 group-hover:border-blue-200 group-hover:bg-blue-50/50'}`}>
                {isParsing ? (
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-sm font-black text-blue-600 uppercase tracking-widest">Extracting Data...</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-zinc-900 truncate max-w-xs">{file.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • {dataPreview.length} Rows</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-300">
                      <Table className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Click or drag file to upload</p>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="lg:col-span-2 bg-zinc-900 rounded-[48px] p-10 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full -mr-20 -mt-20" />
          
          <div className="relative space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
              <Calculator className="w-5 h-5 text-blue-400" /> Analysis Focus
            </h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              Tell the Analyst what to look for. (e.g., "Look for correlations between age and score" or "Identify the peak sales periods").
            </p>
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your research questions or focus area (Optional)..."
              className="w-full h-32 p-6 bg-white/5 border border-white/10 rounded-3xl text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-all resize-none placeholder:text-white/20"
            />
          </div>

          <Button 
            onClick={() => handleAnalyze()}
            disabled={isProcessing || isParsing || dataPreview.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-8 font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-8"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Crunching Numbers...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze Dataset
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {analysis && (
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Statistical Insights</h3>
            </div>
            <Badge className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-black uppercase text-[10px] tracking-widest">
              Report Generated
            </Badge>
          </div>

          <div className="prose prose-slate max-w-none 
            prose-headings:text-zinc-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
            prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed
            prose-strong:text-zinc-900 prose-strong:font-black
            prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-blue-700 prose-code:font-bold
            prose-pre:bg-zinc-900 prose-pre:rounded-[24px] prose-pre:p-6 prose-pre:shadow-xl
            prose-table:border prose-table:border-slate-100 prose-table:rounded-2xl prose-table:overflow-hidden
            prose-th:bg-slate-50 prose-th:p-4 prose-th:text-[10px] prose-th:font-black prose-th:uppercase prose-th:tracking-widest
            prose-td:p-4 prose-td:text-sm prose-td:border-t prose-td:border-slate-50
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {!analysis && !isProcessing && (
        <div className="py-32 text-center bg-white border border-dashed border-slate-200 rounded-[64px]">
          <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-slate-200">
            <BarChart3 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Statistical Engine</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] max-w-sm mx-auto">
            Upload your data and specify your research questions to generate a professional analysis report
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="py-32 text-center bg-white border border-[#e5e7eb] rounded-[64px] animate-pulse">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-blue-100 rounded-[40px] animate-ping opacity-25" />
            <div className="relative w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center text-blue-600">
              <RefreshCw className="w-12 h-12 animate-spin" />
            </div>
          </div>
          <p className="text-blue-600 font-black uppercase text-[10px] tracking-[0.3em] animate-bounce">
            Analyzing patterns & identifying trends...
          </p>
        </div>
      )}

      {/* Preview Section (Optional) */}
      {!analysis && dataPreview.length > 0 && (
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Dataset Preview (First 5 Rows)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {Object.keys(dataPreview[0]).map(header => (
                    <th key={header} className="p-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataPreview.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    {Object.values(row).map((val, vIdx) => (
                      <td key={vIdx} className="p-4 text-xs font-medium text-slate-600 border-b border-slate-50 truncate max-w-[150px]">{String(val)}</td>
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
