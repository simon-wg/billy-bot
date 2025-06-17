import { cookie } from "@/config";
import {
    AudioPlayer,
    AudioPlayerError,
    AudioPlayerStatus,
    NoSubscriberBehavior,
} from "@discordjs/voice";
import type { Client } from "discord.js";
import { Readable } from "node:stream";
import { ClientType, Innertube, UniversalCache } from "youtubei.js";

// Extended AudioPlayer class
class MusicPlayer extends AudioPlayer {
    public guildId: string;
    public video?: string;
    private client: Client;

    constructor(guildId: string, client: Client) {
        super({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        this.guildId = guildId;
        this.client = client;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.on(AudioPlayerStatus.Playing, () => {
            console.debug(
                `Audio player is now playing: ${this.currentVideo()}`,
            );
        });

        this.on(AudioPlayerStatus.Idle, () => {
            console.debug(
                `Audio player is now idle in guild ${this.guildId}. Dispatching dequeue event.`,
            );
            this.client.emit("dequeue", {
                guildId: this.guildId,
                client: this.client,
            });
        });

        this.on("error", (error) => {
            if (error instanceof AudioPlayerError) {
                console.error(
                    `Audio player error in guild ${this.guildId}: ${error.message}`,
                );
            } else {
                console.error(
                    `Unexpected error in audio player for guild ${this.guildId}:`,
                    error,
                );
            }
            this.client.emit("dequeue", {
                guildId: this.guildId,
                client: this.client,
            });
        });
    }

    public isPlaying(): boolean {
        return this.state.status === AudioPlayerStatus.Playing;
    }

    public isIdle(): boolean {
        return this.state.status === AudioPlayerStatus.Idle;
    }

    public isPaused(): boolean {
        return this.state.status === AudioPlayerStatus.Paused;
    }

    public currentVideo(): string | null {
        return this.video || null;
    }

    public setCurrentVideo(videoTitle: string): void {
        this.video = videoTitle;
    }
}

// Singleton AudioPlayer Manager
class MusicManager {
    private static instance: MusicManager | null = null;
    private audioPlayers: Map<string, MusicPlayer> = new Map();
    private client: Client | null = null;
    private innertube: Innertube | null = null;

    private constructor() {
        // Private constructor prevents direct instantiation
    }

    public static getInstance(): MusicManager {
        if (!MusicManager.instance) {
            MusicManager.instance = new MusicManager();
        }
        return MusicManager.instance;
    }

    public async initialize(client: Client): Promise<void> {
        if (this.client) {
            console.warn("AudioPlayerManager already initialized");
            return;
        }

        this.client = client;
        await this.initializeInnertube();
        console.debug("AudioPlayerManager initialized");
    }

    private async initializeInnertube(): Promise<void> {
        this.innertube = await Innertube.create({
            client_type: ClientType.TV,
            cache: new UniversalCache(true, "./.cache"),
            cookie: cookie,
            fetch: Bun.fetch,
        });
    }

    public getMusicPlayer(guildId: string): MusicPlayer {
        if (!this.client) {
            throw new Error(
                "AudioPlayerManager not initialized. Call initialize() first.",
            );
        }

        if (!this.audioPlayers.has(guildId)) {
            const audioPlayer = new MusicPlayer(guildId, this.client);
            this.audioPlayers.set(guildId, audioPlayer);
        }
        return this.audioPlayers.get(guildId)!;
    }

    public removeAudioPlayer(guildId: string): boolean {
        const audioPlayer = this.audioPlayers.get(guildId);
        if (audioPlayer) {
            audioPlayer.removeAllListeners();
            return this.audioPlayers.delete(guildId);
        }
        return false;
    }

    public async getYoutubeStream(videoId: string): Promise<Readable> {
        if (!this.innertube) {
            throw new Error("Innertube is not initialized");
        }

        const video = await this.innertube.download(videoId);
        const videoStream = Readable.fromWeb(video, {
            highWaterMark: 1024 * 1024, // 1MB buffer size
        });

        return videoStream;
    }

    public getAllMusicPlayers(): Map<string, MusicPlayer> {
        return new Map(this.audioPlayers);
    }

    public getActiveGuilds(): string[] {
        return Array.from(this.audioPlayers.keys()).filter((guildId) => {
            const player = this.audioPlayers.get(guildId);
            return player && !player.isIdle();
        });
    }

    public isInitialized(): boolean {
        return this.client !== null;
    }
}

// Export singleton instance getter
export const getMusicManager = () => MusicManager.getInstance();
export { MusicPlayer };
