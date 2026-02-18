import fs from 'fs/promises';
import path from 'path';
import { Mutex } from '../../shared/utils/mutex';

export interface StorageAdapter {
    read<T>(filename: string): Promise<T>;
    write<T>(filename: string, data: T): Promise<void>;
}

export class FileStorage implements StorageAdapter {
    private baseDir: string;
    private mutex: Mutex;

    constructor(baseDir: string = path.join(__dirname, '../../../../data')) {
        this.baseDir = baseDir;
        this.mutex = new Mutex(); // Global lock for simplicity in this demo, ideally per-file
        this.ensureDir();
    }

    private async ensureDir() {
        try {
            await fs.access(this.baseDir);
        } catch {
            await fs.mkdir(this.baseDir, { recursive: true });
        }
    }

    async read<T>(filename: string): Promise<T> {
        const filePath = path.join(this.baseDir, filename);
        try {
            await fs.access(filePath);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return [] as unknown as T; // Default to empty array if file doesn't exist
            }
            throw error;
        }
    }

    async write<T>(filename: string, data: T): Promise<void> {
        // Acquire lock to prevent race conditions during write
        const release = await this.mutex.acquire();
        try {
            const filePath = path.join(this.baseDir, filename);
            // Atomic write: write to temp file then rename
            const tempPath = `${filePath}.tmp`;
            await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
            await fs.rename(tempPath, filePath);
        } finally {
            release();
        }
    }
}
