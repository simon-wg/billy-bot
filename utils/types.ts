import type { CommandInteraction, SharedSlashCommand } from "discord.js";

export interface Command {
    data: SharedSlashCommand;
    execute(interaction: CommandInteraction): Promise<void>;
}

export interface Event {
    name: string;
    once?: boolean;
    execute(...args: unknown[]): void | Promise<void>;
}
