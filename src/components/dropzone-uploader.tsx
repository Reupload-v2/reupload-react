"use client";

import { useUploader } from "../hooks/use-uploader.js";
import {
  HiddenFileInput,
  UploadStatus,
  getUploaderRenderProps,
  joinClass,
  acceptToInputAccept,
  useDragAndDrop,
  renderPendingConfirmSlot,
} from "./shared.js";
import type { UploaderCommonProps } from "./types.js";

export type DropzoneUploaderProps = UploaderCommonProps & {
  title?: string;
  description?: string;
  dropzoneClassName?: string;
};

/**
 * Drag-and-drop upload zone with click-to-browse.
 */
export function DropzoneUploader({
  accept,
  multiple = false,
  disabled = false,
  className,
  inputClassName,
  dropzoneClassName,
  title = "Drop files here",
  description = "or click to browse",
  hideStatus = true,
  statusClassName,
  children,
  renderPendingConfirm,
  ...options
}: DropzoneUploaderProps) {
  const uploader = useUploader(options);
  const acceptAttr = acceptToInputAccept(accept);
  const inputDisabled = disabled || uploader.isUploading;

  const drag = useDragAndDrop(
    (files) => {
      uploader.handleFilesSelected(files);
    },
    inputDisabled,
  );

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
        "reupload-dropzone-uploader",
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

      <div
        role="button"
        tabIndex={inputDisabled ? -1 : 0}
        className={joinClass(
          "reupload-dropzone",
          inputDisabled && "reupload-dropzone--disabled",
          dropzoneClassName,
        )}
        onClick={() => {
          if (!inputDisabled) uploader.openFilePicker();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!inputDisabled) uploader.openFilePicker();
          }
        }}
        onDragOver={drag.onDragOver}
        onDrop={drag.onDrop}
        aria-disabled={inputDisabled}
      >
        <p className="reupload-dropzone__title">{title}</p>
        <p className="reupload-dropzone__description">{description}</p>
      </div>

      {pendingConfirm}

      {!hideStatus ? (
        <UploadStatus state={uploader.state} className={statusClassName} />
      ) : null}
    </div>
  );
}
