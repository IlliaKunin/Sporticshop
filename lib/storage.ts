import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "./env";

const MAX_BYTES = 6 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Product photos. The uploaded file is NEVER stored as-is: it is decoded and re-encoded as WebP, which
 * removes hidden metadata (GPS, camera) and anything that is not a real image (scripts, polyglot files).
 */
export async function savePhoto(file: File): Promise<string> {
  if (file.size === 0) throw new Error("Empty file");
  if (file.size > MAX_BYTES) throw new Error("Photo is larger than 6 MB");
  const input = Buffer.from(await file.arrayBuffer());
  let meta;
  try { meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata(); } catch { throw new Error("This is not a valid image"); }
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) throw new Error("Only JPEG, PNG or WebP photos are allowed");
  const out = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate() // apply camera orientation, then drop metadata
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const name = `${randomBytes(12).toString("hex")}.webp`; // random name, the uploader chooses nothing

  if (env().STORAGE_DRIVER === "s3") {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const e = env();
    const s3 = new S3Client({ region: e.S3_REGION, endpoint: e.S3_ENDPOINT, credentials: { accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY } });
    await s3.send(new PutObjectCommand({ Bucket: e.S3_BUCKET, Key: `p/${name}`, Body: out, ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }));
    return `${e.S3_PUBLIC_URL.replace(/\/$/, "")}/p/${name}`;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), out);
  return `/uploads/${name}`;
}

/** Local driver only: read a stored photo. The name is validated so it cannot point outside the folder. */
export async function readLocalPhoto(name: string): Promise<Buffer | null> {
  if (!/^[a-f0-9]{24}\.webp$/.test(name)) return null;
  try { return await readFile(path.join(UPLOAD_DIR, name)); } catch { return null; }
}
