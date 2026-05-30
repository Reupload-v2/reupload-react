"use client";

import { useEffect, useRef, useState } from "react";

import { useUploader } from "../hooks/use-uploader.js";
import {
  HiddenFileInput,
  PendingUploadConfirm,
  UploadStatus,
  joinClass,
  acceptToInputAccept,
} from "./shared.js";
import type { UploaderCommonProps } from "./types.js";

export type AvatarUploaderProps = UploaderCommonProps & {
  /** Initial preview URL (e.g. existing avatar). */
  src?: string | null;
  alt?: string;
  size?: number;
  changeLabel?: string;
};

/**
 * Circular image picker — ideal for profile avatars (`image/*` only).
 */
export function AvatarUploader({
  accept = "image/*",
  disabled = false,
  className,
  inputClassName,
  src = null,
  alt = "Avatar",
  size = 96,
  changeLabel = "Change photo",
  hideStatus = true,
  statusClassName,
  immediateUpload = true,
  renderPendingConfirm,
  ...options
}: AvatarUploaderProps) {
  const uploader = useUploader({
    ...options,
    immediateUpload,
    validation: options.validation ?? { accept: ["image/*"], maxBytes: 2_097_152 },
  });

  const [preview, setPreview] = useState<string | null>(src);
  const previewBeforePendingRef = useRef<string | null>(src);

  useEffect(() => {
    setPreview(src);
    previewBeforePendingRef.current = src;
  }, [src]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const inputDisabled = disabled || uploader.isUploading;

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
      setPreview(URL.createObjectURL(file));

      if (uploader.immediateUpload) {
        void uploader.uploadFile(file);
      } else {
        previewBeforePendingRef.current = src;
        uploader.stageFiles([file]);
      }
    }
    event.target.value = "";
  };

  const handleCancelPending = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(previewBeforePendingRef.current);
    uploader.cancelPending();
  };

  const handleConfirmUpload = async () => {
    await uploader.confirmUpload();
  };

  const pendingConfirm =
    uploader.hasPendingUpload &&
    (renderPendingConfirm ? (
      renderPendingConfirm({
        files: uploader.pendingFiles,
        confirmUpload: handleConfirmUpload,
        cancelPending: handleCancelPending,
        disabled: inputDisabled,
        ...(uploader.confirmLabels !== undefined
          ? { labels: uploader.confirmLabels }
          : {}),
      })
    ) : (
      <PendingUploadConfirm
        files={uploader.pendingFiles}
        onConfirm={handleConfirmUpload}
        onCancel={handleCancelPending}
        disabled={inputDisabled}
        {...(uploader.confirmLabels !== undefined
          ? { labels: uploader.confirmLabels }
          : {})}
      />
    ));

  const dimension = `${size}px`;

  return (
    <div
      className={joinClass(
        "reupload-uploader",
        "reupload-avatar-uploader",
        className,
      )}
    >
      <HiddenFileInput
        inputRef={uploader.inputRef}
        inputId={uploader.inputId}
        accept={acceptToInputAccept(accept)}
        disabled={inputDisabled}
        onChange={onChange}
        className={inputClassName}
      />

      <button
        type="button"
        className="reupload-avatar-uploader__trigger"
        style={{ width: dimension, height: dimension }}
        disabled={inputDisabled}
        onClick={uploader.openFilePicker}
        aria-label={changeLabel}
      >
        {preview ? (
          <img
            src={preview}
            alt={alt}
            className="reupload-avatar-uploader__image"
            style={{ width: dimension, height: dimension }}
          />
        ) : (
          <span
            className="reupload-avatar-uploader__placeholder"
            style={{ width: dimension, height: dimension }}
          >
            +
          </span>
        )}
        <span className="reupload-avatar-uploader__overlay">{changeLabel}</span>
      </button>

      {pendingConfirm}

      {!hideStatus ? (
        <UploadStatus state={uploader.state} className={statusClassName} />
      ) : null}
    </div>
  );
}
