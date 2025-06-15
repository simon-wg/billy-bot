import { setMessage } from "@/utils/messages";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

const serverOnlyGuard = async (
    interaction: ChatInputCommandInteraction,
): Promise<boolean> => {
    if (!interaction.guild || !interaction.guildId || !interaction.member) {
        const interactionReply = await interaction.reply({
            content: "This command can only be used in a server.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        setMessage(interaction.user.id, interactionReply);
        return false;
    }
    return true;
};

export { serverOnlyGuard };
