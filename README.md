# @reupload/react

Ready-to-use React file uploaders for [Reupload](https://reupload.dev). Import a component, set your backend URL, and upload — no API key in the browser.

Built on [`@reupload/client`](../reupload-client) (CDN flow: prepare → signed URL PUT → complete).

## Install

```bash
npm install @reupload/react @reupload/client react react-dom
```

## Setup

```tsx
// app/layout.tsx or main entry
import "@reupload/react/styles.css";

// .env.local
// NEXT_PUBLIC_API_URL=http://localhost:3001
```

Wrap your app (optional — uploaders also work standalone with env vars):

```tsx
import { ReuploadProvider } from "@reupload/react";

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ReuploadProvider apiUrl={process.env.NEXT_PUBLIC_API_URL}>
      {children}
    </ReuploadProvider>
  );
}
```

Your Node API must expose the [backend file router](../reupload-client#backend-file-router) (`/uploads/prepare`, `/uploads/complete`, etc.). Use [`@reupload/sdk`](../reupload-sdk) on the server.

## Uploaders

### `FileUploader`

Standard labeled button with progress and status.

```tsx
import { FileUploader } from "@reupload/react";

export function UploadForm() {
  return (
    <FileUploader
      label="Choose document"
      accept="application/pdf,image/*"
      onUploadComplete={({ fileId }) => console.log("Done", fileId)}
    />
  );
}
```

### `ButtonUploader`

Minimal button only.

```tsx
import { ButtonUploader } from "@reupload/react";

<ButtonUploader buttonText="Upload" accept="image/*" />;
```

### `DropzoneUploader`

Drag-and-drop zone with click-to-browse.

```tsx
import { DropzoneUploader } from "@reupload/react";

<DropzoneUploader
  title="Drop images here"
  description="PNG or JPG, up to 50 MB"
  accept="image/*"
  multiple
/>;
```

### `AvatarUploader`

Circular profile photo picker (defaults to `image/*`, 2 MB).

```tsx
import { AvatarUploader } from "@reupload/react";

<AvatarUploader src={user.avatarUrl} onUploadComplete={({ fileId }) => saveAvatar(fileId)} />;
```

### `MultiFileUploader`

Queue multiple files with per-file status.

```tsx
import { MultiFileUploader } from "@reupload/react";

<MultiFileUploader
  maxFiles={10}
  accept="image/*"
  onFilesComplete={(results) => console.log(results.map((r) => r.fileId))}
/>;
```

## Confirm before upload

By default, uploaders start uploading as soon as the user selects or drops files (`immediateUpload={true}`). Set `immediateUpload={false}` to stage files and show a built-in **Confirm** / **Cancel** bar:

```tsx
import { FileUploader } from "@reupload/react";

<FileUploader
  label="Choose document"
  immediateUpload={false}
  onUploadComplete={({ fileId }) => console.log("Done", fileId)}
/>;
```

Optional async gate when the user confirms (shared type from `@reupload/client`):

```tsx
import type { BeforeUploadHandler } from "@reupload/client";

const onBeforeUpload: BeforeUploadHandler = async (files) =>
  window.confirm(`Upload ${files[0]?.name ?? "file"}?`);

<FileUploader immediateUpload={false} onBeforeUpload={onBeforeUpload} />;
```

`MultiFileUploader` with `immediateUpload={false}` adds files to the queue and shows an **Upload all (N)** button instead of uploading immediately.

### Custom confirm UI

Use `renderPendingConfirm` or the `children` render prop / `useUploader` hook:

```tsx
import { FileUploader } from "@reupload/react";

<FileUploader immediateUpload={false}>
  {({ openFilePicker, hasPendingUpload, pendingFiles, confirmUpload, cancelPending }) => (
    <div>
      <button type="button" onClick={openFilePicker}>Choose file</button>
      {hasPendingUpload ? (
        <div>
          <span>{pendingFiles[0]?.name}</span>
          <button type="button" onClick={() => void confirmUpload()}>Upload</button>
          <button type="button" onClick={cancelPending}>Cancel</button>
        </div>
      ) : null}
    </div>
  )}
</FileUploader>
```

## Custom UI

Use the `children` render prop or `useUploader` hook:

```tsx
import { DropzoneUploader, useUploader } from "@reupload/react";

<DropzoneUploader>
  {({ isUploading, openFilePicker, state }) => (
    <div onClick={openFilePicker}>
      {isUploading ? "Uploading…" : "Click me"}
      {state.status === "completed" ? "Done!" : null}
    </div>
  )}
</DropzoneUploader>
```

## Props (all uploaders)

| Prop | Description |
|------|-------------|
| `client` | Custom `ReuploadClient` instance |
| `apiUrl` | Backend base URL (if not using provider / env) |
| `validation` | `{ maxBytes, accept }` |
| `poll` | Poll until `COMPLETED` (default `false`; set `true` to wait for processing) |
| `accept` | MIME string or array |
| `multiple` | Allow multi-select (where supported) |
| `disabled` | Disable interaction |
| `onUploadComplete` | `(result) => void` |
| `onUploadError` | `(message) => void` |
| `onProgress` | CDN upload progress (only tracked when this callback is set) |
| `immediateUpload` | Upload on file select (default `true`; set `false` to confirm first) |
| `onBeforeUpload` | Async gate on confirm — return `false` to abort |
| `confirmLabels` | `{ confirm, cancel }` button labels for built-in confirm UI |
| `renderPendingConfirm` | Replace built-in confirm bar when `immediateUpload={false}` |
| `className` | Root class |
| `hideStatus` | Hide built-in status UI (default `true`; set `false` to show progress/status) |

## Styling

Import default styles and override CSS variables:

```css
.my-app {
  --reupload-primary: #7c3aed;
  --reupload-radius: 0.75rem;
}
```

Or pass `className` / `buttonClassName` / `dropzoneClassName` for full control.

## Development

```bash
cd node-packages/reupload-react
npm install
npm run typecheck
npm run build
```

## License

MIT
