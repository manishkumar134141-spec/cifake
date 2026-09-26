import React, { useRef, useState, DragEvent } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload image"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'w-full max-w-xl mx-auto rounded-2xl border border-dashed transition-all duration-200 cursor-pointer py-20 px-10 text-center select-none outline-none',
        isDragging
          ? 'border-foreground bg-surface-subtle scale-[1.01]'
          : 'border-border/90 bg-surface/30 hover:border-foreground/30 hover:bg-surface/70',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.bmp,.tiff,.tif,.gif,.ico,.heic,.heif,.svg"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-7">
        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold tracking-tight font-mono text-foreground">
            CIFAKE
          </h2>
          <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
            IMAGE SCAN
          </p>
        </div>

        {/* Plus Action Button */}
        <div className="w-16 h-16 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-surface shadow-xs transition-transform active:scale-95">
          <Plus size={28} strokeWidth={1.75} />
        </div>

        {/* Formats Chip */}
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider text-center max-w-sm">
          ALL FORMATS · JPG · PNG · WEBP · AVIF · TIFF · BMP · HEIC · GIF
        </span>
      </div>
    </div>
  );
};
