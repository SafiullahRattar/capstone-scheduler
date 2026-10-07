import { useRef, useState } from 'react';
import { UploadCloud, FileCheck2, ArrowRight, FileText, CalendarDays, Check, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';

const AUDIT_GUIDE_STEPS: { text: React.ReactNode; note?: React.ReactNode; image: string; alt: string }[] = [
  {
    text: <>Sign in to <a href="https://central.carleton.ca" target="_blank" rel="noopener noreferrer">Carleton Central</a>. Under <strong>Academic Progress</strong>, click <strong>myAudit</strong>.</>,
    image: '1-my-audit.png',
    alt: 'The myAudit link under Academic Progress in Carleton Central',
  },
  {
    text: <>Click <strong>Submit an Audit</strong>.</>,
    image: '2-submit-audit.png',
    alt: 'The Submit an Audit link',
  },
  {
    text: <>Next to Advanced Settings, click <strong>Click to view available options</strong>.</>,
    image: '3-view-options.png',
    alt: 'The Click to view available options link next to Advanced Settings',
  },
  {
    text: <>Check <strong>Include In Progress Courses</strong> and set Format to <strong>HTML AUDIT</strong>. Then click <strong>Run Declared Programs</strong>.</>,
    note: 'The audit usually takes 10 to 30 seconds to run.',
    image: '4-audit-settings.png',
    alt: 'Advanced Settings with Include In Progress Courses checked and Format set to HTML AUDIT',
  },
  {
    text: <>When it finishes, click <strong>View Audit</strong>.</>,
    image: '5-view-audit.png',
    alt: 'The View Audit link',
  },
  {
    text: <>Right-click anywhere on the audit page.</>,
    image: '6-right-click.png',
    alt: 'An opened academic audit page',
  },
  {
    text: <>Choose <strong>Save as…</strong> (or press Ctrl+S, ⌘+S on a Mac) and save the page to your computer.</>,
    note: 'Then come back here and click Import audit, or drag the saved file onto the import box.',
    image: '7-save-as.png',
    alt: 'The browser right-click menu with Save as highlighted',
  },
];

interface AcademicHistoryImportProps {
  onManualEntry: () => void;
  onUploadComplete: (file: File) => Promise<void>;
}

export function AcademicHistoryImport({ onManualEntry, onUploadComplete }: AcademicHistoryImportProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (isUploading) return;
    
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
      setUploadError('That file is not an HTML or PDF audit. Choose another file, or continue without importing.');
    }
  };

  const handleUpload = async () => {
    if (selectedFile && !isUploading) {
      setIsUploading(true);
      setUploadError(null);
      try {
        await onUploadComplete(selectedFile);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'We could not read this audit. Try another file, or continue without importing.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <main className="scheduler-page audit-welcome">
      <section className="glass-panel audit-welcome-card" aria-labelledby="welcome-heading" aria-busy={isUploading}>
        <div className="welcome-emblem" aria-hidden="true">
          <CalendarDays size={32} />
          <span><Check size={13} /></span>
        </div>
        <div className="welcome-heading">
          <h1 id="welcome-heading">Your next term, made simpler.</h1>
          <p>Bring your audit for a head start.<br />Or start fresh and explore your options.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          id="file-upload"
          aria-label="Choose an Academic Audit in HTML or PDF format"
          onChange={handleChange}
          accept=".html,.htm,.pdf"
          disabled={isUploading}
          hidden
        />
        <div
          className={`welcome-import${dragActive ? ' is-dragging' : ''}${selectedFile ? ' has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <>
              <div className="audit-file-summary">
                <div className="audit-file-icon"><FileCheck2 size={24} /></div>
                <div className="audit-file-details">
                  <span className="audit-ready-label"><Check size={12} /> Audit selected</span>
                  <strong title={selectedFile.name}>{selectedFile.name}</strong>
                  <span>{selectedFile.size >= 1024 * 1024 ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : `${(selectedFile.size / 1024).toFixed(1)} KB`}</span>
                </div>
                <Button variant="ghost" size="icon" disabled={isUploading} aria-label="Remove audit file" onClick={() => {
                  setSelectedFile(null);
                  setUploadError(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}><X size={16} /></Button>
              </div>
              <Button onClick={handleUpload} disabled={isUploading} className="welcome-primary">
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {isUploading ? 'Getting your courses ready…' : 'Continue with this audit'}
              </Button>
              {!isUploading && <button className="choose-another-audit" onClick={() => fileInputRef.current?.click()}>Choose a different file</button>}
              {isUploading && <div className="audit-import-progress" role="status"><span /><p>Reading your completed courses and degree requirements.</p></div>}
            </>
          ) : (
            <>
              <div className="welcome-import-copy"><FileText size={20} /><div><h2>Import your academic audit</h2><p>Your completed courses and degree requirements, in one place.</p></div></div>
              <Button onClick={() => fileInputRef.current?.click()} className="welcome-primary"><UploadCloud size={18} /> Import audit</Button>
              <p className="welcome-file-hint">HTML or PDF<span> · You can also drop your file here</span></p>
            </>
          )}
        </div>
        {uploadError && <p role="alert" className="inline-error welcome-error">{uploadError}</p>}
        <div className="welcome-divider"><span>or</span></div>
        <Button variant="outline" onClick={onManualEntry} disabled={isUploading} className="welcome-skip">
          Continue without importing audit<ArrowRight size={16} />
        </Button>
        <p className="welcome-skip-hint">You can still search courses and find a timetable.</p>
        <details className="audit-help">
          <summary>Where can I find my audit?</summary>
          <ol className="audit-guide">
            {AUDIT_GUIDE_STEPS.map((step, index) => (
              <li key={step.image}>
                <span className="audit-guide-number">{index + 1}</span>
                <div>
                  <p>{step.text}</p>
                  {step.note && <p className="audit-guide-note">{step.note}</p>}
                  <img src={`/images/audit-guide/${step.image}`} alt={step.alt} loading="lazy" />
                </div>
              </li>
            ))}
          </ol>
        </details>
      </section>
    </main>
  );
}
