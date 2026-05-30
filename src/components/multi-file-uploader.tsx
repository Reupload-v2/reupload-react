"use client";

import { useCallback, useState } from "react";

import type { UploadFileResult, UploadProgress } from "@reupload/client";
import { formatBytes } from "@reupload/client";

import { useUploader } from "../hooks/use-uploader.js";
import {
  HiddenFileInput,
  joinClass,
  acceptToInputAccept,
  useDragAndDrop,
} from "./shared.js";
import type { UploaderCommonProps } from "./types.js";

export type MultiFileItem = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "completed" | "error";
  progress?: number | null;
  result?: UploadFileResult;
  error?: string;
};

export type MultiFileUploaderProps = Omit<UploaderCommonProps, "multiple"> & {
  title?: string;
  /** Max files per batch. */
  maxFiles?: number;
  onFilesComplete?: (results: UploadFileResult[]) => void;
};

/**
 * Upload multiple files with a per-file queue and status list.
 */
export function MultiFileUploader({
  accept,
  disabled = false,
  className,
  inputClassName,
  title = "Upload files",
  maxFiles,
  hideStatus: _hideStatus = true,
  immediateUpload = true,
  onFilesComplete,
  onUploadComplete,
  ...options
}: MultiFileUploaderProps) {
  const [items, setItems] = useState<MultiFileItem[]>([]);

  const uploader = useUploader({
    ...options,
    immediateUpload,
    poll: options.poll ?? false,
    onUploadComplete: (result) => {
      onUploadComplete?.(result);
    },
  });

  const uploadBatch = useCallback(
    async (batch: MultiFileItem[]) => {
      const results: UploadFileResult[] = [];

      for (const item of batch) {
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, status: "uploading" } : row,
          ),
        );

        const result = await uploader.uploadFile(item.file, {
          ...(options.filename !== undefined
            ? { filename: options.filename }
            : {}),
          ...(options.projectId !== undefined
            ? { projectId: options.projectId }
            : {}),
          onProgress: (progress: UploadProgress) => {
            setItems((prev) =>
              prev.map((row) =>
                row.id === item.id
                  ? { ...row, progress: progress.percent }
                  : row,
              ),
            );
            options.onProgress?.(progress);
          },
        });

        if (result) {
          results.push(result);
          setItems((prev) =>
            prev.map((row) =>
              row.id === item.id
                ? { ...row, status: "completed", result }
                : row,
            ),
          );
          onUploadComplete?.(result);
        } else {
          const message =
            uploader.state.status === "error"
              ? uploader.state.message
              : "Upload failed";
          setItems((prev) =>
            prev.map((row) =>
              row.id === item.id
                ? { ...row, status: "error", error: message }
                : row,
            ),
          );
          options.onUploadError?.(message);
        }
      }

      if (results.length > 0) {
        onFilesComplete?.(results);
      }

      uploader.reset();
    },
    [onFilesComplete, onUploadComplete, options, uploader],
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      let list = Array.from(files);
      if (maxFiles !== undefined) {
        list = list.slice(0, maxFiles);
      }

      const batch: MultiFileItem[] = list.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`,
        file,
        status: "pending" as const,
      }));

      setItems((prev) => [...prev, ...batch]);

      if (immediateUpload) {
        await uploadBatch(batch);
      }
    },
    [immediateUpload, maxFiles, uploadBatch],
  );

  const pendingCount = items.filter((item) => item.status === "pending").length;

  const uploadPending = useCallback(async () => {
    const pending = items.filter((item) => item.status === "pending");
    if (pending.length === 0) return;

    if (options.onBeforeUpload) {
      const allowed = await options.onBeforeUpload(
        pending.map((item) => item.file),
      );
      if (!allowed) return;
    }

    await uploadBatch(pending);
  }, [items, options, uploadBatch]);

  const drag = useDragAndDrop(
    (files) => {
      void processFiles(files);
    },
    disabled,
  );

  const acceptAttr = acceptToInputAccept(accept);

  return (
    <div
      className={joinClass(
        "reupload-uploader",
        "reupload-multi-file-uploader",
        className,
      )}
    >
      <HiddenFileInput
        inputRef={uploader.inputRef}
        inputId={uploader.inputId}
        accept={acceptAttr}
        multiple
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files?.length) {
            void processFiles(event.target.files);
          }
          event.target.value = "";
        }}
        className={inputClassName}
      />

      <div
        className="reupload-multi-file-uploader__header"
        onDragOver={drag.onDragOver}
        onDrop={drag.onDrop}
      >
        <p className="reupload-multi-file-uploader__title">{title}</p>
        <div className="reupload-multi-file-uploader__header-actions">
          {!immediateUpload && pendingCount > 0 ? (
            <button
              type="button"
              className="reupload-uploader__button"
              disabled={disabled || uploader.isUploading}
              onClick={() => {
                void uploadPending();
              }}
            >
              Upload all ({pendingCount})
            </button>
          ) : null}
          <button
            type="button"
            className="reupload-uploader__button"
            disabled={disabled}
            onClick={uploader.openFilePicker}
          >
            Add files
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="reupload-multi-file-uploader__list">
          {items.map((item) => (
            <li key={item.id} className="reupload-multi-file-uploader__item">
              <span className="reupload-multi-file-uploader__name">
                {item.file.name}
              </span>
              <span className="reupload-multi-file-uploader__meta">
                {formatBytes(item.file.size)}
              </span>
              <span
                className={joinClass(
                  "reupload-multi-file-uploader__badge",
                  `reupload-multi-file-uploader__badge--${item.status}`,
                )}
              >
                {item.status === "uploading" && item.progress != null
                  ? `${item.progress}%`
                  : item.status}
              </span>
              {item.error ? (
                <span className="reupload-multi-file-uploader__error">
                  {item.error}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
