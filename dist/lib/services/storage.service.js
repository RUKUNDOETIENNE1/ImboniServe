"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const ffprobe_1 = __importDefault(require("@ffprobe-installer/ffprobe"));
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
fluent_ffmpeg_1.default.setFfprobePath(ffprobe_1.default.path);
const MAX_VIDEO_DURATION_SEC = parseInt(process.env.MAX_VIDEO_DURATION_SEC || '30', 10);
const MAX_VIDEO_SIZE_MB = parseInt(process.env.MAX_VIDEO_SIZE_MB || '50', 10);
const MAX_IMAGE_SIZE_MB = 10;
const MAX_FILE_SIZE_MB_GENERIC = 15;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
class StorageService {
    /**
     * Upload video to storage
     * Returns: { storageKey, width, height, durationSec, sizeBytes, mimeType, thumbnailKey }
     */
    static async uploadVideo(file, filename, mimeType, businessId) {
        // Validate file type
        if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
            throw new Error(`Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`);
        }
        // Validate file size
        const sizeMB = file.length / (1024 * 1024);
        if (sizeMB > MAX_VIDEO_SIZE_MB) {
            throw new Error(`Video too large. Maximum: ${MAX_VIDEO_SIZE_MB}MB`);
        }
        // Generate unique storage key
        const ext = path_1.default.extname(filename) || '.mp4';
        const hash = crypto_1.default.randomBytes(16).toString('hex');
        const storageKey = `videos/${businessId}/${Date.now()}-${hash}${ext}`;
        if (this.supabase) {
            // Upload to Supabase Storage
            const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads';
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(storageKey, file, {
                contentType: mimeType,
                upsert: false,
            });
            if (error) {
                throw new Error(`Storage upload failed: ${error.message}`);
            }
            return {
                storageKey: data.path,
                sizeBytes: file.length,
                mimeType,
            };
        }
        else {
            // Local storage fallback (for development)
            const fs = require('fs');
            const localPath = path_1.default.join(process.cwd(), 'public', 'uploads', storageKey);
            const dir = path_1.default.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(localPath, file);
            return {
                storageKey: `/uploads/${storageKey}`,
                sizeBytes: file.length,
                mimeType,
            };
        }
    }
    // Private document storage for DIE
    static async uploadPrivateDocument(file, filename, mimeType, businessId) {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(mimeType)) {
            throw new Error('Invalid document type');
        }
        const sizeMB = file.length / (1024 * 1024);
        const maxMB = parseInt(process.env.DIE_MAX_DOC_MB || '25', 10);
        if (sizeMB > maxMB) {
            throw new Error(`File too large. Maximum: ${maxMB}MB`);
        }
        const ext = path_1.default.extname(filename) || (mimeType === 'application/pdf' ? '.pdf' : '.bin');
        const hash = crypto_1.default.randomBytes(16).toString('hex');
        const storageKey = `die/${businessId}/${Date.now()}-${hash}${ext}`;
        if (this.supabase) {
            const { data, error } = await this.supabase.storage
                .from(this.privBucket)
                .upload(storageKey, file, { contentType: mimeType, upsert: false });
            if (error)
                throw new Error(`Storage upload failed: ${error.message}`);
            return { storageKey: data.path, sizeBytes: file.length, mimeType };
        }
        else {
            const localPath = path_1.default.join(process.cwd(), 'private_uploads', storageKey);
            const dir = path_1.default.dirname(localPath);
            if (!fs_1.default.existsSync(dir))
                fs_1.default.mkdirSync(dir, { recursive: true });
            fs_1.default.writeFileSync(localPath, file);
            return { storageKey: `private/${storageKey}`, sizeBytes: file.length, mimeType };
        }
    }
    static async getPrivateSignedUrl(storageKey, expiresInSeconds = 600) {
        if (!this.supabase)
            return '';
        const { data, error } = await this.supabase.storage
            .from(this.privBucket)
            .createSignedUrl(storageKey, expiresInSeconds);
        if (error)
            throw new Error(`Signed URL failed: ${error.message}`);
        return data.signedUrl;
    }
    static async downloadPrivate(storageKey) {
        if (this.supabase) {
            const { data, error } = await this.supabase.storage.from(this.privBucket).download(storageKey);
            if (error)
                throw new Error(`Download failed: ${error.message}`);
            const arr = await data.arrayBuffer();
            return Buffer.from(arr);
        }
        const rel = storageKey.startsWith('private/') ? storageKey.slice('private/'.length) : storageKey;
        const localPath = path_1.default.join(process.cwd(), 'private_uploads', rel);
        return fs_1.default.readFileSync(localPath);
    }
    /**
     * Upload image to storage
     */
    static async uploadImage(file, filename, mimeType, businessId) {
        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
            throw new Error(`Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
        }
        // Validate file size
        const sizeMB = file.length / (1024 * 1024);
        if (sizeMB > MAX_IMAGE_SIZE_MB) {
            throw new Error(`Image too large. Maximum: ${MAX_IMAGE_SIZE_MB}MB`);
        }
        // Generate unique storage key
        const ext = path_1.default.extname(filename) || '.jpg';
        const hash = crypto_1.default.randomBytes(16).toString('hex');
        const storageKey = `images/${businessId}/${Date.now()}-${hash}${ext}`;
        if (this.supabase) {
            // Upload to Supabase Storage
            const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads';
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(storageKey, file, {
                contentType: mimeType,
                upsert: false,
            });
            if (error) {
                throw new Error(`Storage upload failed: ${error.message}`);
            }
            return {
                storageKey: data.path,
                sizeBytes: file.length,
                mimeType,
            };
        }
        else {
            // Local storage fallback
            const fs = require('fs');
            const localPath = path_1.default.join(process.cwd(), 'public', 'uploads', storageKey);
            const dir = path_1.default.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(localPath, file);
            return {
                storageKey: `/uploads/${storageKey}`,
                sizeBytes: file.length,
                mimeType,
            };
        }
    }
    static async uploadFileGeneric(file, filename, mimeType, businessId) {
        const sizeMB = file.length / (1024 * 1024);
        if (sizeMB > MAX_FILE_SIZE_MB_GENERIC) {
            throw new Error(`File too large. Maximum: ${MAX_FILE_SIZE_MB_GENERIC}MB`);
        }
        const ext = path_1.default.extname(filename) || '';
        const hash = crypto_1.default.randomBytes(16).toString('hex');
        const storageKey = `files/${businessId}/${Date.now()}-${hash}${ext}`;
        if (this.supabase) {
            const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads';
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(storageKey, file, {
                contentType: mimeType,
                upsert: false,
            });
            if (error) {
                throw new Error(`Storage upload failed: ${error.message}`);
            }
            return {
                storageKey: data.path,
                sizeBytes: file.length,
                mimeType,
            };
        }
        else {
            const fs = require('fs');
            const localPath = path_1.default.join(process.cwd(), 'public', 'uploads', storageKey);
            const dir = path_1.default.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(localPath, file);
            return {
                storageKey: `/uploads/${storageKey}`,
                sizeBytes: file.length,
                mimeType,
            };
        }
    }
    /**
     * Get public URL for a storage key
     */
    static getPublicUrl(storageKey) {
        if (this.supabase && !storageKey.startsWith('/uploads/')) {
            const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads';
            const { data } = this.supabase.storage.from(bucket).getPublicUrl(storageKey);
            return data.publicUrl;
        }
        // Local storage - already has /uploads/ prefix
        return storageKey;
    }
    /**
     * Delete file from storage
     */
    static async deleteFile(storageKey) {
        if (this.supabase && !storageKey.startsWith('/uploads/')) {
            const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads';
            const { error } = await this.supabase.storage.from(bucket).remove([storageKey]);
            if (error) {
                throw new Error(`Storage delete failed: ${error.message}`);
            }
        }
        else {
            // Local storage
            const fs = require('fs');
            const localPath = path_1.default.join(process.cwd(), 'public', storageKey);
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
        }
    }
    /**
     * Probe video duration and dimensions using ffprobe.
     * Writes buffer to a temp file, probes it, then cleans up.
     */
    static async probeVideo(fileBuffer, ext = '.mp4') {
        const tmpPath = path_1.default.join(os_1.default.tmpdir(), `probe-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}${ext}`);
        fs_1.default.writeFileSync(tmpPath, fileBuffer);
        try {
            return await new Promise((resolve, reject) => {
                fluent_ffmpeg_1.default.ffprobe(tmpPath, (err, meta) => {
                    if (err)
                        return reject(err);
                    const duration = meta.format.duration ?? 0;
                    const videoStream = meta.streams.find((s) => s.codec_type === 'video');
                    resolve({
                        durationSec: Math.ceil(duration),
                        width: videoStream?.width,
                        height: videoStream?.height,
                    });
                });
            });
        }
        finally {
            fs_1.default.unlinkSync(tmpPath);
        }
    }
    /**
     * Generate a thumbnail from a video buffer at 1 second mark.
     * Returns the thumbnail as a Buffer (JPEG).
     */
    static async generateThumbnailBuffer(fileBuffer, ext = '.mp4') {
        const tmpInput = path_1.default.join(os_1.default.tmpdir(), `thumb-in-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}${ext}`);
        const tmpOutput = path_1.default.join(os_1.default.tmpdir(), `thumb-out-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}.jpg`);
        fs_1.default.writeFileSync(tmpInput, fileBuffer);
        try {
            await new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)(tmpInput)
                    .seekInput(1)
                    .frames(1)
                    .size('480x?')
                    .output(tmpOutput)
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err))
                    .run();
            });
            const thumbBuffer = fs_1.default.readFileSync(tmpOutput);
            return thumbBuffer;
        }
        catch {
            return null;
        }
        finally {
            if (fs_1.default.existsSync(tmpInput))
                fs_1.default.unlinkSync(tmpInput);
            if (fs_1.default.existsSync(tmpOutput))
                fs_1.default.unlinkSync(tmpOutput);
        }
    }
}
exports.StorageService = StorageService;
StorageService.supabase = process.env.SUPABASE_STORAGE_URL && process.env.SUPABASE_STORAGE_KEY
    ? (0, supabase_js_1.createClient)(process.env.SUPABASE_STORAGE_URL, process.env.SUPABASE_STORAGE_KEY)
    : null;
StorageService.privBucket = process.env.SUPABASE_STORAGE_PRIV_BUCKET || 'documents-priv';
