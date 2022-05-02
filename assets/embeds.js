"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Embeds = void 0;
const discord_js_1 = require("discord.js");
const colors_1 = require("./colors");
exports.Embeds = {
    UNKNOWN_ERROR: new discord_js_1.MessageEmbed()
        .setTitle("Something ran wrong ...")
        .setColor(colors_1.Colors.error)
        .setDescription("An unexpected error occured and the command was terminated. Please try again, but if this issue persists please contact Silenced#8839."),
    UNKNOWN_COMMAND: new discord_js_1.MessageEmbed()
        .setTitle("Unknown command")
        .setColor(colors_1.Colors.error)
        .setDescription("Somehow you managed to send in an unknown command and vyne didn't know how to respond. Interesting."),
    EXPIRED_COMPONENT: new discord_js_1.MessageEmbed()
        .setTitle("Expired interaction")
        .setColor(colors_1.Colors.error)
        .setDescription("The interaction which you tried to complete has expired. Be faster next time."),
    INVALID_USER: new discord_js_1.MessageEmbed()
        .setTitle("Invalid user")
        .setColor(colors_1.Colors.error)
        .setDescription("This is not your interaction. Please run the appropriate command yourself."),
    SERVER_ONLY: new discord_js_1.MessageEmbed()
        .setTitle("Server only command")
        .setColor(colors_1.Colors.error)
        .setDescription("Sorry, but this command is only available in a server"),
    EXPIRED_SESSION: new discord_js_1.MessageEmbed()
        .setTitle("Expired session")
        .setColor(colors_1.Colors.error)
        .setDescription("The session which you tried to query has expired. Be faster next time."),
    INSUFFICIENT_PERMS: new discord_js_1.MessageEmbed()
        .setTitle("Insufficient Permissions")
        .setColor(colors_1.Colors.error)
        .setDescription("Sorry, we cannot send messages in this channel. To ensure `Vyne` features function properly, please **allow us to send messages** in this channel or use another text channel. Sorry for the inconvenience.")
};
//# sourceMappingURL=embeds.js.map