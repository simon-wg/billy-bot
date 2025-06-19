import type {
    AutocompleteInteraction,
    CommandInteraction,
    SharedSlashCommand,
} from "discord.js";

export interface Command {
    data: SharedSlashCommand;
    execute(interaction: CommandInteraction): Promise<void>;
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}

export interface Event {
    name: string;
    once?: boolean;
    execute(...args: unknown[]): void | Promise<void>;
}
