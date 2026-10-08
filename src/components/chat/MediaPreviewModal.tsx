import React, { useEffect } from 'react';
import { Download, FileText, X } from 'lucide-react';

export interface MediaPreviewModalProps {
  open: boolean;
  type: 'image' | 'video' | 'pdf' | 'file';
  url: string;
  fileName?: string;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  open,
  type,
  url,
  fileName = 'file',
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleDownload = () => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={fileName}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="إغلاق"
        className="absolute top-4 end-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full text-white flex items-center justify-center z-10"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full h-[calc(100%-96px)] flex items-center justify-center pb-4">
        {type === 'image' && (
          <img
            src={url}
            alt={fileName}
            className="max-w-[92vw] max-h-[78vh] object-contain rounded-xl shadow-2xl"
          />
        )}

        {type === 'video' && (
          <video
            src={url}
            controls
            autoPlay
            playsInline
            className="max-w-[92vw] max-h-[78vh] rounded-xl"
          />
        )}

        {type === 'pdf' && (
          <iframe
            src={url}
            className="w-[92vw] h-[78vh] bg-white rounded-xl"
            title={fileName}
          />
        )}

        {type === 'file' && (
          <div className="w-full max-w-md bg-white text-slate-900 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <p className="font-bold break-all">{fileName}</p>
                <p className="text-sm text-slate-500">ملف</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold"
            >
              <Download className="w-4 h-4" />
              تحميل
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 flex gap-2 justify-center pb-4 px-4">
        <button
          type="button"
          onClick={handleDownload}
          className="bg-white text-black px-6 py-2 rounded-full font-bold"
        >
          تحميل
        </button>
        <button
          type="button"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          className="bg-white/20 text-white px-6 py-2 rounded-full font-bold"
        >
          فتح في تبويب جديد
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-white/20 text-white px-6 py-2 rounded-full font-bold"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

export default MediaPreviewModal;
