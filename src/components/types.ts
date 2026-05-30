import type { ReactNode } from "react";

import type { FileValidationRules, UploadFileResult } from "@reupload/client";
import type { ReuploadClient } from "@reupload/client";
import type { UploadProgress } from "@reupload/client";

import type { BaseUploaderProps, UploaderRenderProps } from "./shared.js";
import type { PendingUploadRenderProps } from "./shared.js";

export type { UploaderRenderProps, PendingUploadRenderProps };
import type { UseUploaderOptions } from "../hooks/use-uploader.js";

export type UploaderCommonProps = Omit<BaseUploaderProps, "accept"> &
  UseUploaderOptions & {
    accept?: string | string[];
    client?: ReuploadClient;
    validation?: FileValidationRules;
    label?: string;
    statusClassName?: string;
    onUploadComplete?: (result: UploadFileResult) => void;
    onUploadError?: (message: string) => void;
    onProgress?: (progress: UploadProgress) => void;
    /** Custom status slot; receives error message when failed. */
    renderStatus?: (state: {
      isUploading: boolean;
      error: string | null;
      fileId: string | null;
    }) => ReactNode;
    /** Replace built-in confirm UI when `immediateUpload={false}`. */
    renderPendingConfirm?: (props: PendingUploadRenderProps) => ReactNode;
  };
