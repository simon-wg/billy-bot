import type { Command } from "@/utils/types";
import "discord.js";

declare module "discord.js" {
    export interface Client extends Client {
        commands: Collection<string, Command>;
    }
}
