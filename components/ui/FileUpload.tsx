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
    const [isFocused, setIsFocused] = useState(false);
    const [skippedNote, setSkippedNote] = useState<string | null>(null);
    const generatedId = React.useId();
    const inputId = id || `file-upload-${generatedId}`;

    const handleFiles = (newFiles: FileList | null) => {
      if (!newFiles) return;

      const incoming = Array.from(newFiles);
      const wrongType: string[] = [];
      const tooBig: string[] = [];
      const validFiles = incoming.filter((file) => {
        if (accept && !file.type.match(accept.replace("*", ".*"))) {
          wrongType.push(file.name);
          return false;
        }
        if (file.size > maxSize) {
          tooBig.push(file.name);
          return false;
        }
        return true;
      });

      const updatedFiles = multiple
        ? [...files, ...validFiles].slice(0, maxFiles)
        : validFiles.slice(0, 1);

      // Never drop a file silently — say which were skipped and why.
      const overLimit = files.length + validFiles.length - updatedFiles.length;
      const notes: string[] = [];
      if (wrongType.length)
        notes.push(`Skipped ${wrongType.join(", ")}: not an accepted file type.`);
      if (tooBig.length)
        notes.push(
          `Skipped ${tooBig.join(", ")}: over the ${(maxSize / 1024 / 1024).toFixed(0)}MB limit.`,
        );
      if (overLimit > 0 && multiple)
        notes.push(`Only the first ${maxFiles} files were kept.`);
      setSkippedNote(notes.length ? notes.join(" ") : null);
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
          <label
            htmlFor={inputId}
            className="block font-mono text-xs uppercase tracking-widest text-text-tertiary"
          >
            {label}
            {required && <span className="text-text-accent ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div
          className={`relative rounded-input border-2 border-dashed transition-colors ${
            dragActive
              ? "border-input-border-focus bg-bg-subtle"
              : error
                ? "border-color-error"
                : isFocused
                  ? "ring-2 ring-input-ring-focus ring-offset-2 ring-offset-background border-input-border-focus"
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
            aria-describedby={error ? `${inputId}-error` : undefined}
            aria-required={required}
            aria-invalid={error ? true : undefined}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <div className="p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">
              {dragActive ? "Drop files here" : "Drag & drop or click to browse"}
            </p>
            <p className="font-mono text-3xs uppercase tracking-widest text-text-tertiary mt-2">
              {accept && `${accept.replace(/\./g, "").replace(/,/g, " · ").toUpperCase()}`}
              {maxSize && ` · Max ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
              {maxFiles > 1 && ` · Up to ${maxFiles} files`}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-bg-subtle rounded-input text-sm"
              >
                <span className="text-text-secondary truncate">
                  {file.name} ({(file.size / 1024).toFixed(1)}KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                  className="tap-target text-text-muted hover:text-text-primary ml-2 px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {skippedNote && (
          <p role="status" className="text-xs text-text-error">
            {skippedNote}
          </p>
        )}

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-text-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
