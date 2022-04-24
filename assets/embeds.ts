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
}