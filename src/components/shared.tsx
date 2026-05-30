"use client";

import type { ReactNode } from "react";

import type {
  UploaderController,
  UploadProgress,
  UploadState,
} from "../hooks/use-uploader.js";

export type UploaderRenderProps = {
  state: UploadState;
  isUploading: boolean;
  openFilePicker: () => void;
  reset: () => void;
  immediateUpload: boolean;
  pendingFiles: File[];
  hasPendingUpload: boolean;
  confirmUpload: () => Promise<void>;
  cancelPending: () => void;
  stageFiles: (files: FileList | File[]) => void;
};

export type PendingUploadRenderProps = {
  files: File[];
  confirmUpload: () => Promise<void>;
  cancelPending: () => void;
  disabled?: boolean;
  labels?: { confirm?: string; cancel?: string };
};

export type BaseUploaderProps = {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  hideStatus?: boolean;
  children?: (props: UploaderRenderProps) => ReactNode;
};

export function joinClass(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function acceptToInputAccept(accept?: string | string[]): string | undefined {
  if (!accept) return undefined;
  return Array.isArray(accept) ? accept.join(",") : accept;
}

export function getUploaderRenderProps(
  uploader: UploaderController,
): UploaderRenderProps {
  return {
    state: uploader.state,
    isUploading: uploader.isUploading,
    openFilePicker: uploader.openFilePicker,
    reset: uploader.reset,
    immediateUpload: uploader.immediateUpload,
    pendingFiles: uploader.pendingFiles,
    hasPendingUpload: uploader.hasPendingUpload,
    confirmUpload: uploader.confirmUpload,
    cancelPending: uploader.cancelPending,
    stageFiles: uploader.stageFiles,
  };
}

export type PendingUploadConfirmProps = PendingUploadRenderProps & {
  className?: string;
};

export function PendingUploadConfirm({
  files,
  onConfirm,
  onCancel,
  disabled = false,
  labels,
  className,
}: {
  files: File[];
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
  labels?: { confirm?: string; cancel?: string };
  className?: string;
}) {
  if (files.length === 0) return null;

  const confirmLabel = labels?.confirm ?? "Upload";
  const cancelLabel = labels?.cancel ?? "Cancel";
  const summary =
    files.length === 1
      ? files[0]!.name
      : `${files.length} files selected`;

  return (
    <div
      className={joinClass("reupload-pending-upload", className)}
      role="group"
      aria-label="Confirm upload"
    >
      <span className="reupload-pending-upload__summary">{summary}</span>
      <div className="reupload-pending-upload__actions">
        <button
          type="button"
          className="reupload-pending-upload__button reupload-pending-upload__button--confirm"
          disabled={disabled}
          onClick={() => {
            void onConfirm();
          }}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          className="reupload-pending-upload__button reupload-pending-upload__button--cancel"
          disabled={disabled}
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

export function renderPendingConfirmSlot(
  uploader: UploaderController,
  options: {
    disabled?: boolean;
    className?: string;
    renderPendingConfirm?: (props: PendingUploadRenderProps) => ReactNode;
  },
): ReactNode {
  if (!uploader.hasPendingUpload) return null;

  const props: PendingUploadRenderProps = {
    files: uploader.pendingFiles,
    confirmUpload: uploader.confirmUpload,
    cancelPending: uploader.cancelPending,
    ...(options.disabled !== undefined ? { disabled: options.disabled } : {}),
    ...(uploader.confirmLabels !== undefined
      ? { labels: uploader.confirmLabels }
      : {}),
  };

  if (options.renderPendingConfirm) {
    return options.renderPendingConfirm(props);
  }

  return (
    <PendingUploadConfirm
      files={props.files}
      onConfirm={uploader.confirmUpload}
      onCancel={uploader.cancelPending}
      {...(options.disabled !== undefined ? { disabled: options.disabled } : {})}
      {...(uploader.confirmLabels !== undefined
        ? { labels: uploader.confirmLabels }
        : {})}
      {...(options.className !== undefined ? { className: options.className } : {})}
    />
  );
}

export type HiddenFileInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputId: string;
  accept?: string | undefined;
  multiple?: boolean | undefined;
  disabled?: boolean | undefined;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string | undefined;
};

export function HiddenFileInput({
  inputRef,
  inputId,
  accept,
  multiple,
  disabled,
  onChange,
  className,
}: HiddenFileInputProps) {
  return (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      {...(accept !== undefined ? { accept } : {})}
      {...(multiple !== undefined ? { multiple } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
      onChange={onChange}
      className={joinClass("reupload-uploader__input", className)}
      aria-hidden
      tabIndex={-1}
    />
  );
}

export function UploadStatus({
  state,
  className,
}: {
  state: UploadState;
  className?: string | undefined;
}) {
  if (state.status === "idle") return null;

  if (state.status === "uploading") {
    const percent = state.progress?.percent;
    return (
      <div
        className={joinClass(
          "reupload-uploader__status",
          className ?? undefined,
        )}
        role="status"
        aria-live="polite"
      >
        <span className="reupload-uploader__status-label">
          Uploading
          {percent !== null && percent !== undefined ? `… ${percent}%` : "…"}
        </span>
        {percent !== null && percent !== undefined ? (
          <progress
            className="reupload-uploader__progress"
            max={100}
            value={percent}
          />
        ) : null}
      </div>
    );
  }

  if (state.status === "processing") {
    return (
      <div
        className={joinClass(
          "reupload-uploader__status",
          "reupload-uploader__status--processing",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        Processing upload…
      </div>
    );
  }

  if (state.status === "completed") {
    return (
      <div
        className={joinClass(
          "reupload-uploader__status",
          "reupload-uploader__status--success",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        Upload complete
      </div>
    );
  }

  return (
    <div
      className={joinClass(
        "reupload-uploader__status",
        "reupload-uploader__status--error",
        className,
      )}
      role="alert"
    >
      {state.message}
    </div>
  );
}

export function useDragAndDrop(
  onFiles: (files: FileList) => void,
  disabled?: boolean,
) {
  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      onFiles(files);
    }
  };

  return { onDragOver, onDrop };
}

export type { UploadProgress };
