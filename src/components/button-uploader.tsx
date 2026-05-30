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

export type ButtonUploaderProps = UploaderCommonProps & {
  buttonText?: string;
  buttonClassName?: string;
};

/**
 * Minimal upload button — no visible file input chrome.
 */
export function ButtonUploader({
  accept,
  multiple = false,
  disabled = false,
  className,
  inputClassName,
  buttonText = "Upload file",
  buttonClassName,
  hideStatus = true,
  statusClassName,
  children,
  renderPendingConfirm,
  ...options
}: ButtonUploaderProps) {
  const uploader = useUploader(options);
  const acceptAttr = acceptToInputAccept(accept);
  const inputDisabled = disabled || uploader.isUploading;

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
        "reupload-button-uploader",
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
        className={joinClass("reupload-uploader__button", buttonClassName)}
        disabled={inputDisabled}
        onClick={uploader.openFilePicker}
      >
        {uploader.isUploading ? "Uploading…" : buttonText}
      </button>

      {pendingConfirm}

      {!hideStatus ? (
        <UploadStatus state={uploader.state} className={statusClassName} />
      ) : null}
    </div>
  );
}
