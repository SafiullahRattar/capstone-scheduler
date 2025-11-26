import { useState } from 'react';
import { Button } from './ui/button';
import { Upload, FileText, Edit3, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-slate-900 mb-2">Import Academic History</h1>
          <p className="text-slate-600">
            Upload your Academic Audit to help us provide personalized course recommendations
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-slate-900 mb-6">Automated Audit Parsing</h2>
          
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
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
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleChange}
                accept=".html,.htm,.pdf"
              />
            )}
            
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-slate-900">{selectedFile.name}</p>
                <p className="text-sm text-slate-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                {uploadError && (
                  <p className="text-sm text-red-600 mt-2">{uploadError}</p>
                )}
                <Button 
                  onClick={handleUpload} 
                  className="mt-4 relative z-10"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-slate-700 mb-2">
                  Drag and drop your Academic Audit file here, or click to browse
                </p>
                <p className="text-sm text-slate-500">
                  Maximum file size: 10MB
                </p>
              </>
            )}
          </div>

          {/* Supported File Types */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-slate-700">
              <span className="text-slate-900">Supported File Types:</span> HTML (preferred), PDF
            </p>
            <p className="text-sm text-slate-600 mt-1">
              💡 HTML files provide the most accurate parsing results
            </p>
          </div>
        </div>

        {/* Alternative Options */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Manual Entry Option */}
          <button
            onClick={onManualEntry}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-slate-900 mb-1">Manual Entry</h3>
                <p className="text-sm text-slate-600">
                  Enter your course history manually if you prefer not to upload a file
                </p>
              </div>
            </div>
          </button>

          {/* Skip Option */}
          <button
            onClick={onSkip}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow border-2 border-transparent hover:border-slate-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-6 h-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-slate-900 mb-1">Skip for Now</h3>
                <p className="text-sm text-slate-600">
                  Continue to course selection. You can provide your history at any time
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-slate-600">
            Need help finding your Academic Audit?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              View Instructions
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
