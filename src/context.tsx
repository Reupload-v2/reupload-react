"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  ReuploadClient,
  createReuploadClientFromEnv,
} from "@reupload/client";
import type { FileValidationRules } from "@reupload/client";

export type ReuploadProviderProps = {
  children: ReactNode;
  /** Pre-configured client (overrides `apiUrl`). */
  client?: ReuploadClient;
  /** Backend API base URL (e.g. `http://localhost:3001`). */
  apiUrl?: string;
  /** Default validation for all uploaders in the tree. */
  validation?: FileValidationRules;
  /** Default poll after upload. Default `false`. */
  poll?: boolean;
};

export type ReuploadContextValue = {
  client: ReuploadClient;
  validation?: FileValidationRules;
  poll: boolean;
};

const ReuploadContext = createContext<ReuploadContextValue | null>(null);

export function ReuploadProvider({
  children,
  client: clientProp,
  apiUrl,
  validation,
  poll = false,
}: ReuploadProviderProps) {
  const client = useMemo(() => {
    if (clientProp) return clientProp;
    if (apiUrl) return new ReuploadClient({ apiUrl });
    return createReuploadClientFromEnv();
  }, [clientProp, apiUrl]);

  const value = useMemo<ReuploadContextValue>(
    () => ({
      client,
      ...(validation !== undefined ? { validation } : {}),
      poll,
    }),
    [client, validation, poll],
  );

  return (
    <ReuploadContext.Provider value={value}>{children}</ReuploadContext.Provider>
  );
}

export function useReuploadContext(): ReuploadContextValue | null {
  return useContext(ReuploadContext);
}
