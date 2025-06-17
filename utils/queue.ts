import type { YT } from "youtubei.js";

interface QueueEntry {
    video: YT.VideoInfo;
    timestamp: number;
}

class VideoQueue {
    private static queues: Map<string, VideoQueue> = new Map();
    private queue: QueueEntry[] = [];
    private constructor(private guildId: string) {}

    static getQueue(guildId: string): VideoQueue {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, new VideoQueue(guildId));
        }
        return this.queues.get(guildId)!;
    }

    add(video: YT.VideoInfo, timestamp: number): void {
        this.queue.push({ video, timestamp });
    }

    dequeue(): QueueEntry | undefined {
        return this.queue.shift();
    }

    length(): number {
        return this.queue.length;
    }

    clear(): void {
        this.queue = [];
    }
}

export default VideoQueue;
