import { useState } from 'react';
import { Button } from './ui/button';
import { Upload, FileText, Edit3, ArrowRight, Info } from 'lucide-react';

interface AcademicHistoryImportProps {
  onManualEntry: () => void;
  onSkip: () => void;
  onUploadComplete: (file: File) => void;
}

export function AcademicHistoryImport({ onManualEntry, onSkip, onUploadComplete }: AcademicHistoryImportProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['text/html', 'application/pdf'];
    const validExtensions = ['.html', '.htm', '.pdf'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
      setSelectedFile(file);
      setUploadError(null);
    } else {
      alert('Please upload a valid HTML or PDF file.');
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      setIsUploading(true);
      setUploadError(null);
      try {
        await onUploadComplete(selectedFile);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Bar */}
      <header className="bg-[#bf112b] shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-white text-lg font-semibold tracking-tight">Carleton Course Scheduler</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-3">Import Academic History</h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Upload your Academic Audit to receive personalized course recommendations and prerequisite validation.
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload Audit File</h3>
          
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              dragActive
                ? 'border-[#bf112b] bg-red-50 scale-[1.01]'
                : selectedFile
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!selectedFile && (
              <input
                type="file"
                id="file-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleChange}
                accept=".html,.htm,.pdf"
              />
            )}
            
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              selectedFile ? 'bg-green-100' : dragActive ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 ${
                selectedFile ? 'text-green-600' : dragActive ? 'text-[#bf112b]' : 'text-gray-400'
              }`} />
            </div>
            
            {selectedFile ? (
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                  <FileText className="w-5 h-5 text-[#bf112b]" />
                  <span className="text-gray-900 font-medium">{selectedFile.name}</span>
                  <span className="text-gray-500 text-sm">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                {uploadError && (
                  <p className="text-sm text-red-600">{uploadError}</p>
                )}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? 'Processing...' : 'Upload and Continue'}
                  </Button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-gray-500 hover:text-[#bf112b] transition-colors"
                  >
                    Choose different file
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-700 font-medium mb-1">
                  Drag and drop your Academic Audit file here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse (HTML or PDF, max 10MB)
                </p>
              </>
            )}
          </div>

          {/* Info Note */}
          <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-blue-800">HTML files provide the most accurate parsing. Save your audit webpage as HTML from Carleton Central.</span>
          </div>
        </div>

        {/* Alternative Options */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <button
            onClick={onManualEntry}
            className="group bg-white border border-gray-200 rounded-xl p-6 text-left hover:border-[#bf112b] hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                <Edit3 className="w-5 h-5 text-gray-600 group-hover:text-[#bf112b] transition-colors" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Manual Entry</h4>
                <p className="text-sm text-gray-600">
                  Enter completed courses manually
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onSkip}
            className="group bg-white border border-gray-200 rounded-xl p-6 text-left hover:border-[#bf112b] hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-[#bf112b] transition-colors" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Skip for Now</h4>
                <p className="text-sm text-gray-600">
                  Continue without academic history
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Help Link */}
        <p className="text-center text-sm text-gray-500">
          Need help finding your Academic Audit?{' '}
          <a href="#" className="text-[#bf112b] hover:underline font-medium">
            View instructions
          </a>
        </p>
      </main>
    </div>
  );
}
