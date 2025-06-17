import { Innertube, YT, YTNodes } from "youtubei.js";

const innertube = await Innertube.create();

export const searchYouTube = async (
    query: string,
): Promise<YT.VideoInfo | undefined | null> => {
    try {
        const searchResult = await innertube.search(query, { type: "video" });
        const firstVideo = searchResult.videos.firstOfType(YTNodes.Video);
        const videoId = firstVideo?.video_id;
        if (!videoId) {
            console.debug("No video found for the given query.");
            return null;
        }
        const videoInfo = innertube.getBasicInfo(videoId);
        return videoInfo;
    } catch (error) {
        console.error("Error searching YouTube:", error);
        return null;
    }
};

export const videoFromUrl = async (
    query: string,
): Promise<YT.VideoInfo | null | undefined> => {
    const url = new URL(query)!;
    const videoId = url.searchParams.get("v")!;
    try {
        const videoInfo = innertube.getBasicInfo(videoId);
        return videoInfo;
    } catch (error) {
        console.error("Error fetching video from URL:", error);
        return null;
    }
};

export const validYoutubeUrl = (query: string): boolean => {
    try {
        const url = new URL(query);
        if (
            url.hostname !== "www.youtube.com" &&
            url.hostname !== "youtube.com" &&
            url.hostname !== "youtu.be"
        ) {
            return false;
        }
        if (
            !url.pathname.startsWith("/watch") &&
            !url.pathname.startsWith("/shorts") &&
            !url.pathname.startsWith("/playlist")
        ) {
            return false;
        }
        if (url.searchParams.get("v") === null) {
            return false;
        }
    } catch {
        return false;
    }
    return true;
};
