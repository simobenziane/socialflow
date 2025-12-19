import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image, Film, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  uploadedFiles: FileWithPreview[];
  onRemoveFile: (id: string) => void;
  isUploading: boolean;
  uploadProgress: { uploaded: number; total: number };
  maxFiles?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const DEFAULT_ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function FileUploader({
  onFilesSelected,
  uploadedFiles,
  onRemoveFile,
  isUploading,
  uploadProgress,
  maxFiles = 50,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `File type ${file.type} is not supported`;
      }
      if (file.size > MAX_FILE_SIZE) {
        return `File size exceeds 100MB limit`;
      }
      return null;
    },
    [acceptedTypes]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - uploadedFiles.length;

      if (fileArray.length > remainingSlots) {
        setDragError(`Can only add ${remainingSlots} more files (max ${maxFiles})`);
        return;
      }

      const validFiles: File[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setDragError(errors.slice(0, 3).join('\n'));
        setTimeout(() => setDragError(null), 5000);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [maxFiles, uploadedFiles.length, validateFile, onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragError(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const { files } = e.dataTransfer;
      handleFiles(files);
    },
    [disabled, isUploading, handleFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFiles]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const isImage = (file: FileWithPreview) =>
    ACCEPTED_IMAGE_TYPES.includes(file.type);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          isDragging && !disabled
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !isUploading && 'cursor-pointer'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled && !isUploading ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <div className="flex flex-col items-center text-center">
          <Upload
            className={cn(
              'h-10 w-10 mb-4',
              isDragging ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <p className="text-lg font-medium">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Photos (JPG, PNG, WebP) and Videos (MP4, MOV, WebM) up to 100MB
          </p>
          <p className="text-xs text-muted-foreground">
            {uploadedFiles.length} / {maxFiles} files added
          </p>
        </div>

        {/* Error Message */}
        {dragError && (
          <div className="absolute inset-x-4 bottom-4 bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <pre className="whitespace-pre-wrap font-sans">{dragError}</pre>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading files...</span>
            <span>
              {uploadProgress.uploaded} / {uploadProgress.total}
            </span>
          </div>
          <Progress
            value={(uploadProgress.uploaded / uploadProgress.total) * 100}
          />
        </div>
      )}

      {/* File Preview Grid */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted border"
            >
              {/* Preview */}
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {isImage(file) ? (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Film className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* File Type Badge */}
              <div className="absolute top-2 left-2">
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-xs font-medium rounded',
                    isImage(file)
                      ? 'bg-blue-500/80 text-white'
                      : 'bg-purple-500/80 text-white'
                  )}
                >
                  {isImage(file) ? 'Photo' : 'Video'}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="absolute top-2 right-2">
                {file.status === 'uploading' && (
                  <div className="w-5 h-5 rounded-full bg-yellow-500/80 flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {file.status === 'success' && (
                  <div className="w-5 h-5 rounded-full bg-green-500/80 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                {file.status === 'error' && (
                  <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
                    <AlertCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Remove Button */}
              {!isUploading && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute bottom-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}

              {/* File Name */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs text-white truncate">{file.name}</p>
              </div>

              {/* Error Tooltip */}
              {file.error && (
                <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                  <p className="text-xs text-destructive-foreground bg-destructive/80 px-2 py-1 rounded">
                    {file.error}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUploader;
