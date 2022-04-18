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
        .setDescription("Somehow you managed to send in an unknown command and studybot didn't know how to respond. Interesting."),
    EXPIRED_COMPONENT: new discord_js_1.MessageEmbed()
        .setTitle("Expired interaction")
        .setColor(colors_1.Colors.error)
        .setDescription("The interaction which you tried to complete has expired. Be faster next time."),
    INVALID_USER: new discord_js_1.MessageEmbed()
        .setTitle("Invalid user")
        .setColor(colors_1.Colors.error)
        .setDescription("This is not your interaction. Please run the appropriate command yourself.")
};
//# sourceMappingURL=embeds.js.map