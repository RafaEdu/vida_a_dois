import { base64ToUint8Array } from "../../utils/base64";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarMimeType = (typeof AVATAR_ALLOWED_MIME_TYPES)[number];

const MIME_EXTENSIONS: Record<AvatarMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface AvatarPickerAsset {
  uri?: string | null;
  base64?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
}

export interface ValidAvatarAsset {
  base64: string;
  mimeType: AvatarMimeType;
}

function isAllowedMimeType(value: string): value is AvatarMimeType {
  return (AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

function inferMimeTypeFromName(
  name: string | null | undefined,
): AvatarMimeType | null {
  if (!name) return null;
  const extension = name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return null;
  }
}

export function resolveAvatarMimeType(
  asset: AvatarPickerAsset,
): AvatarMimeType | null {
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType && isAllowedMimeType(mimeType)) return mimeType;
  return (
    inferMimeTypeFromName(asset.fileName) ?? inferMimeTypeFromName(asset.uri)
  );
}

export function estimateBase64Bytes(base64: string): number {
  const sanitized = base64.replace(/[^A-Za-z0-9+/]/g, "");
  return Math.floor((sanitized.length * 3) / 4);
}

/**
 * Valida formato e tamanho antes do upload. Rejeita formatos/tamanhos absurdos
 * e garante que o binário chegou como base64 (nunca é gravado no Postgres).
 */
export function validateAvatarAsset(asset: AvatarPickerAsset): {
  error?: string;
  value?: ValidAvatarAsset;
} {
  const mimeType = resolveAvatarMimeType(asset);
  if (!mimeType) {
    return { error: "Formato não suportado. Use uma imagem JPG, PNG ou WEBP." };
  }

  const base64 = asset.base64;
  if (!base64) {
    return { error: "Não foi possível ler a imagem selecionada." };
  }

  const bytes = asset.fileSize ?? estimateBase64Bytes(base64);
  if (bytes <= 0) {
    return { error: "Não foi possível ler a imagem selecionada." };
  }
  if (bytes > AVATAR_MAX_BYTES) {
    return { error: "A imagem é muito grande. Escolha uma foto de até 5 MB." };
  }

  return { value: { base64, mimeType } };
}

export function buildAvatarObjectPath(
  userId: string,
  mimeType: AvatarMimeType,
  timestamp: number,
): string {
  return `${userId}/avatar-${timestamp}.${MIME_EXTENSIONS[mimeType]}`;
}

/**
 * Converte o base64 validado para `ArrayBuffer`, formato aceito pelo upload do
 * Supabase Storage.
 */
export function decodeAvatarBase64(base64: string): ArrayBuffer {
  const bytes = base64ToUint8Array(base64);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
