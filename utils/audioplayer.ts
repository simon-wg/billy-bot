import {
    AudioPlayer,
    createAudioPlayer,
    NoSubscriberBehavior,
} from "@discordjs/voice";
import { Readable } from "node:stream";
import { Innertube, UniversalCache } from "youtubei.js";

let innertubeInstance: Innertube | null = null;

const getYoutubeStream = async (videoId: string): Promise<Readable> => {
    if (!innertubeInstance) {
        innertubeInstance = await Innertube.create({
            cache: new UniversalCache(true, "./.cache"),
        });
    }

    const video = await innertubeInstance.download(videoId);

    const videoStream = Readable.fromWeb(video, {
        highWaterMark: 1024 * 512, // 1MB buffer size
    });

    return videoStream;
};

const audioPlayer: AudioPlayer = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
    },
});

export { audioPlayer, getYoutubeStream };
