import type { YTNodes } from "youtubei.js";

interface QueueEntry {
    video: YTNodes.Video;
    timestamp: number;
}

class VideoQueue {
    static #instances: Map<string, VideoQueue> = new Map();

    queue: QueueEntry[] = [];
    private constructor() {}
    public static getQueue(guildId: string): VideoQueue {
        if (this.#instances.get(guildId)) {
            this.#instances.set(guildId, new VideoQueue());
        }
        return this.#instances.get(guildId) as VideoQueue;
    }
    public add(video: YTNodes.Video, timestamp: number): void {
        this.queue.push({ video, timestamp });
    }
    public clear(): void {
        this.queue = [];
    }
    public length(): number {
        return this.queue.length;
    }
}

export default VideoQueue;
