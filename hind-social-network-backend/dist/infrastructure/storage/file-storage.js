"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const mutex_1 = require("../../shared/utils/mutex");
class FileStorage {
    constructor(baseDir = path_1.default.join(__dirname, '../../../../data')) {
        this.baseDir = baseDir;
        this.mutex = new mutex_1.Mutex(); // Global lock for simplicity in this demo, ideally per-file
        this.ensureDir();
    }
    async ensureDir() {
        try {
            await promises_1.default.access(this.baseDir);
        }
        catch {
            await promises_1.default.mkdir(this.baseDir, { recursive: true });
        }
    }
    async read(filename) {
        const filePath = path_1.default.join(this.baseDir, filename);
        try {
            await promises_1.default.access(filePath);
            const data = await promises_1.default.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            const err = error;
            if (err.code === 'ENOENT') {
                return []; // Default to empty array if file doesn't exist
            }
            throw error;
        }
    }
    async write(filename, data) {
        // Acquire lock to prevent race conditions during write
        const release = await this.mutex.acquire();
        try {
            const filePath = path_1.default.join(this.baseDir, filename);
            // Atomic write: write to temp file then rename
            const tempPath = `${filePath}.tmp`;
            await promises_1.default.writeFile(tempPath, JSON.stringify(data, null, 2));
            await promises_1.default.rename(tempPath, filePath);
        }
        finally {
            release();
        }
    }
}
exports.FileStorage = FileStorage;
