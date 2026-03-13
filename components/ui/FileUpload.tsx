"use client";

import React, { useState } from "react";

export interface FileUploadProps {
  label?: string;
  error?: string;
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onChange?: (files: File[]) => void;
  className?: string;
  id?: string;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      label,
      error,
      required,
      accept,
      multiple = false,
      maxSize = 10 * 1024 * 1024, // 10MB default
      maxFiles = 1,
      onChange,
      className = "",
      id,
    },
    ref,
  ) => {
    const [files, setFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const inputId = id || `file-upload-${React.useId()}`;

    const handleFiles = (newFiles: FileList | null) => {
      if (!newFiles) return;

      const validFiles = Array.from(newFiles).filter((file) => {
        if (accept && !file.type.match(accept.replace("*", ".*"))) {
          return false;
        }
        if (file.size > maxSize) {
          return false;
        }
        return true;
      });

      const updatedFiles = multiple
        ? [...files, ...validFiles].slice(0, maxFiles)
        : validFiles.slice(0, 1);
      setFiles(updatedFiles);
      onChange?.(updatedFiles);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    };

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
      handleFiles(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      onChange?.(updatedFiles);
    };

    return (
      <div className="space-y-1.5" ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-label-text">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div
          className={`relative rounded-input border-2 border-dashed transition-colors ${
            dragActive
              ? "border-input-border-focus bg-bg-subtle"
              : error
                ? "border-red-400"
                : "border-input-border hover:border-input-border-hover"
          } ${className}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id={inputId}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
          />

          <div className="p-6 text-center">
            <div className="text-text-secondary">
              <p className="text-sm">
                {dragActive
                  ? "Drop files here"
                  : "Drag & drop files here or click to browse"}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {accept && `Accepted: ${accept.replace("*", "")}`}
                {maxSize && ` • Max ${(maxSize / 1024 / 1024).toFixed(1)}MB`}
                {maxFiles > 1 && ` • Max ${maxFiles} files`}
              </p>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-bg-subtle rounded-md text-sm"
              >
                <span className="text-text-secondary truncate">
                  {file.name} ({(file.size / 1024).toFixed(1)}KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-text-muted hover:text-text-primary ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
