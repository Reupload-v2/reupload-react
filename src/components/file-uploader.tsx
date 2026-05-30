"use client";

import { useUploader } from "../hooks/use-uploader.js";
import {
  HiddenFileInput,
  UploadStatus,
  getUploaderRenderProps,
  joinClass,
  acceptToInputAccept,
  renderPendingConfirmSlot,
} from "./shared.js";
import type { UploaderCommonProps } from "./types.js";

export type FileUploaderProps = UploaderCommonProps;

/**
 * Standard file input with label, optional progress, and status messages.
 */
export function FileUploader({
  accept,
  multiple = false,
  disabled = false,
  className,
  inputClassName,
  label = "Choose file",
  hideStatus = true,
  statusClassName,
  children,
  renderStatus,
  renderPendingConfirm,
  ...options
}: FileUploaderProps) {
  const uploader = useUploader(options);
  const acceptAttr = acceptToInputAccept(accept);
  const inputDisabled = disabled || uploader.isUploading;

  const error =
    uploader.state.status === "error" ? uploader.state.message : null;
  const fileId =
    uploader.state.status === "completed" ||
    uploader.state.status === "processing"
      ? uploader.state.fileId
      : null;

  const pendingConfirm = renderPendingConfirmSlot(uploader, {
    disabled: inputDisabled,
    ...(renderPendingConfirm !== undefined ? { renderPendingConfirm } : {}),
  });

  if (children) {
    return (
      <>
        <HiddenFileInput
          inputRef={uploader.inputRef}
          inputId={uploader.inputId}
          accept={acceptAttr}
          multiple={multiple}
          disabled={inputDisabled}
          onChange={uploader.onInputChange}
          className={inputClassName}
        />
        {children(getUploaderRenderProps(uploader))}
        {pendingConfirm}
      </>
    );
  }

  return (
    <div
      className={joinClass(
        "reupload-uploader",
        "reupload-file-uploader",
        disabled && "reupload-uploader--disabled",
        className,
      )}
    >
      <HiddenFileInput
        inputRef={uploader.inputRef}
        inputId={uploader.inputId}
        accept={acceptAttr}
        multiple={multiple}
        disabled={inputDisabled}
        onChange={uploader.onInputChange}
        className={inputClassName}
      />

      <button
        type="button"
        className="reupload-uploader__button reupload-file-uploader__button"
        disabled={inputDisabled}
        onClick={uploader.openFilePicker}
      >
        {label}
      </button>

      {pendingConfirm}

      {!hideStatus &&
        (renderStatus ? (
          renderStatus({
            isUploading: uploader.isUploading,
            error,
            fileId,
          })
        ) : (
          <UploadStatus state={uploader.state} className={statusClassName} />
        ))}
    </div>
  );
}
