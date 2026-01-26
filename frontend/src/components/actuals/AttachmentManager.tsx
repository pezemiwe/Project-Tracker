import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadAttachment, useDownloadAttachment, useDeleteAttachment, type Attachment } from '../../hooks/useActuals';
import { Button } from '../ui/button';

interface AttachmentManagerProps {
  actualId: string;
  attachments: Attachment[];
}

export function AttachmentManager({ actualId, attachments }: AttachmentManagerProps) {
  const uploadMutation = useUploadAttachment();
  const downloadMutation = useDownloadAttachment();
  const deleteMutation = useDeleteAttachment();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        await uploadMutation.mutateAsync({ actualId, file });
      } catch (error) {
        console.error('Failed to upload file:', error);
        alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [actualId, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  const handleDownload = async (attachment: Attachment) => {
    try {
      const url = await downloadMutation.mutateAsync(attachment.id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to download attachment:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        await deleteMutation.mutateAsync(attachmentId);
      } catch (error) {
        console.error('Failed to delete attachment:', error);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getVirusScanBadge = (status: string) => {
    switch (status) {
      case 'Clean':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide bg-green-100 text-green-800">✓ Clean</span>;
      case 'Pending':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide bg-yellow-100 text-yellow-800">⏳ Scanning...</span>;
      case 'Infected':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide bg-red-100 text-red-800">⚠️ Infected</span>;
      case 'Error':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide bg-slate-200 text-slate-700">❌ Error</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide bg-slate-200 text-slate-600">? Unknown</span>;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl py-10 px-5 bg-gradient-to-br from-slate-50 to-white cursor-pointer transition-all ${
          isDragActive 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 scale-[1.02]' 
            : 'border-slate-300 hover:border-blue-500 hover:from-blue-50 hover:to-white'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl opacity-60">📎</div>
          {isDragActive ? (
            <p className="text-base font-semibold text-slate-800">Drop files here...</p>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-800">Drag & drop files here, or click to select</p>
              <p className="text-sm text-slate-600">Supports all file types, max 50MB per file</p>
            </>
          )}
          {uploadMutation.isPending && (
            <div className="flex items-center gap-3 mt-2 text-blue-700 font-semibold">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin"></div>
              <span>Uploading & scanning...</span>
            </div>
          )}
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-4">
            Attachments ({attachments.length})
          </h4>
          <div className="flex flex-col gap-3">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id} 
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all hover:translate-x-1"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-3xl flex-shrink-0">📄</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 truncate">{attachment.originalFileName}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getVirusScanBadge(attachment.virusScanStatus)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    disabled={attachment.virusScanStatus !== 'Clean' || downloadMutation.isPending}
                  >
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
