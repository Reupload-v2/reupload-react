"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";

import {
  createReuploadClientFromEnv,
  type BeforeUploadHandler,
  type FileValidationRules,
  type UploadFileOptions,
  type UploadFileResult,
  type UploadProgress,
} from "@reupload/client";
import {
  useReuploadUpload,
  type UploadState,
  type UseReuploadUploadOptions,
} from "@reupload/client/react";

import { useReuploadContext } from "../context.js";

export type UseUploaderOptions = {
  client?: UseReuploadUploadOptions["client"];
  validation?: FileValidationRules;
  poll?: boolean;
  pollOptions?: UseReuploadUploadOptions["pollOptions"];
  filename?: string;
  projectId?: string;
  isPublic?: boolean;
  /** When `false`, files are staged until the user confirms. Default `true`. */
  immediateUpload?: boolean;
  /** Optional gate when the user confirms a staged upload. Return `false` to abort. */
  onBeforeUpload?: BeforeUploadHandler;
  confirmLabels?: { confirm?: string; cancel?: string };
  onUploadComplete?: (result: UploadFileResult) => void;
  onUploadError?: (message: string) => void;
  onProgress?: (progress: UploadProgress) => void;
};

export function useUploader(options: UseUploaderOptions = {}) {
  const immediateUpload = options.immediateUpload ?? true;

  const context = useReuploadContext();
  const client =
    options.client ?? context?.client ?? createReuploadClientFromEnv();

  const validation = options.validation ?? context?.validation;

  const uploadHook = useReuploadUpload({
    client,
    poll: options.poll ?? context?.poll ?? false,
    ...(validation !== undefined ? { validation } : {}),
    ...(options.pollOptions !== undefined
      ? { pollOptions: options.pollOptions }
      : {}),
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return [];

      const results: UploadFileResult[] = [];

      for (const file of list) {
        const uploadOptions: UploadFileOptions = {
          ...(options.filename !== undefined
            ? { filename: options.filename }
            : {}),
          ...(options.projectId !== undefined
            ? { projectId: options.projectId }
            : {}),
          ...(options.isPublic !== undefined
            ? { isPublic: options.isPublic }
            : {}),
          ...(options.onProgress !== undefined
            ? { onProgress: options.onProgress }
            : {}),
        };

        const result = await uploadHook.upload(file, uploadOptions);
        if (result) {
          results.push(result);
          options.onUploadComplete?.(result);
        } else if (uploadHook.state.status === "error") {
          options.onUploadError?.(uploadHook.state.message);
          break;
        }
      }

      return results;
    },
    [options, uploadHook],
  );

  const uploadFile = useCallback(
    async (file: File, callOptions: UploadFileOptions = {}) => {
      const onProgress =
        callOptions.onProgress ?? options.onProgress;
      const result = await uploadHook.upload(file, {
        ...(options.filename !== undefined
          ? { filename: options.filename }
          : {}),
        ...(options.projectId !== undefined
          ? { projectId: options.projectId }
          : {}),
        ...(options.isPublic !== undefined
          ? { isPublic: options.isPublic }
          : {}),
        ...callOptions,
        ...(onProgress !== undefined
          ? {
              onProgress: (progress: UploadProgress) => {
                onProgress(progress);
              },
            }
          : {}),
      });

      if (result) {
        options.onUploadComplete?.(result);
      } else if (uploadHook.state.status === "error") {
        options.onUploadError?.(uploadHook.state.message);
      }

      return result;
    },
    [options, uploadHook],
  );

  const stageFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setPendingFiles(list);
  }, []);

  const cancelPending = useCallback(() => {
    setPendingFiles([]);
  }, []);

  const confirmUpload = useCallback(async () => {
    if (pendingFiles.length === 0) return;

    if (options.onBeforeUpload) {
      const allowed = await options.onBeforeUpload(pendingFiles);
      if (!allowed) return;
    }

    const files = pendingFiles;
    setPendingFiles([]);
    await uploadFiles(files);
  }, [options, pendingFiles, uploadFiles]);

  const handleFilesSelected = useCallback(
    (files: FileList | File[]) => {
      if (immediateUpload) {
        void uploadFiles(files);
      } else {
        stageFiles(files);
      }
    },
    [immediateUpload, stageFiles, uploadFiles],
  );

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files?.length) {
        handleFilesSelected(files);
      }
      event.target.value = "";
    },
    [handleFilesSelected],
  );

  const hasPendingUpload = pendingFiles.length > 0;

  return useMemo(
    () => ({
      ...uploadHook,
      immediateUpload,
      inputRef,
      inputId,
      openFilePicker,
      uploadFile,
      uploadFiles,
      stageFiles,
      handleFilesSelected,
      pendingFiles,
      hasPendingUpload,
      confirmUpload,
      cancelPending,
      onInputChange,
      confirmLabels: options.confirmLabels,
    }),
    [
      uploadHook,
      immediateUpload,
      inputId,
      openFilePicker,
      uploadFile,
      uploadFiles,
      stageFiles,
      handleFilesSelected,
      pendingFiles,
      hasPendingUpload,
      confirmUpload,
      cancelPending,
      onInputChange,
      options.confirmLabels,
    ],
  );
}

export type UploaderController = ReturnType<typeof useUploader>;
export type { UploadState, UploadFileResult, UploadProgress, BeforeUploadHandler };
