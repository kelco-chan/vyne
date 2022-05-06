import { Message, MessageEmbed } from "discord.js";
import { Colors } from "./colors";

export const Embeds = {
    UNKNOWN_ERROR: new MessageEmbed()
        .setTitle("Something ran wrong ...")
        .setColor(Colors.error)
        .setDescription("An unexpected error occured and the command was terminated. Please try again, but if this issue persists please contact Silenced#8839."),
    UNKNOWN_COMMAND:new MessageEmbed()
        .setTitle("Unknown command")
        .setColor(Colors.error)
        .setDescription("Somehow you managed to send in an unknown command and vyne didn't know how to respond. Interesting."),
    EXPIRED_COMPONENT: new MessageEmbed()
        .setTitle("Expired interaction")
        .setColor(Colors.error)
        .setDescription("The interaction which you tried to complete has expired. Be faster next time."),
    INVALID_USER: new MessageEmbed()
        .setTitle("Invalid user")
        .setColor(Colors.error)
        .setDescription("This is not your interaction. Please run the appropriate command yourself."),
    SERVER_ONLY: new MessageEmbed()
        .setTitle("Server only command")
        .setColor(Colors.error)
        .setDescription("Sorry, but this command is only available in a server"),
    EXPIRED_SESSION: new MessageEmbed()
        .setTitle("Expired session")
        .setColor(Colors.error)
        .setDescription("The session which you tried to query has expired. Be faster next time."),
    INSUFFICIENT_PERMS: new MessageEmbed()
        .setTitle("Insufficient Permissions")
        .setColor(Colors.error)
        .setDescription("Sorry, we cannot send messages in this channel. To ensure `Vyne` features function properly, please **allow us to send messages** in this channel or use another text channel. Sorry for the inconvenience."),
    PRIVATE_TEXT_CHANNEL: (channelId:string) => new MessageEmbed()
        .setTitle("Private Channel")
        .setColor(Colors.error)
        .setDescription(`Sorry, we could not set up a pomodoro timer in this **text** channel since <#${channelId}> is a **private channel**. Please allow \`Vyne\` to access this channel for features to work properly.`),
    PRIVATE_Voice_CHANNEL: (channelId:string) => new MessageEmbed()
        .setTitle("Private Channel")
        .setColor(Colors.error)
        .setDescription(`Sorry, we could not set up a pomodoro timer in the **voice** channel <#${channelId}> since it is a **private channel**. Please allow \`Vyne\` to access this channel for features to work properly.`)
}