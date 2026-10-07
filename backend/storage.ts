import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function storageRoot(): string {
  return process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'backend', 'uploads');
}

function safeRoomId(roomId: string): string {
  return roomId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function uploadChatImage(base64: string, roomId: string): Promise<string> {
  const match = base64.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/s);
  const encoded = match ? match[2] : base64;
  const buffer = Buffer.from(encoded, 'base64');

  if (!buffer.length) throw new Error('الصورة فارغة أو غير صالحة');
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error('الصورة أكبر من 10MB');

  const extension = match?.[1]?.toLowerCase() === 'png' ? 'png' : 'jpg';
  const filename = `chat-image-${safeRoomId(roomId)}-${randomUUID()}.${extension}`;
  const root = storageRoot();
  const filepath = path.join(root, filename);

  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(filepath, buffer);

  return `/api/chat/uploads/${encodeURIComponent(filename)}`;
}

export function getChatUploadPath(filename: string): string {
  const safeFilename = path.basename(decodeURIComponent(filename));
  return path.join(storageRoot(), safeFilename);
}
