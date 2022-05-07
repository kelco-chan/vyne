"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_modals_1 = require("discord-modals");
const discord_js_1 = require("discord.js");
const colors_1 = require("../assets/colors");
const Command_1 = require("../lib/classes/Command");
const InteractionCache_1 = require("../lib/classes/InteractionCache");
const node_fetch_1 = __importDefault(require("node-fetch"));
function createModal(userid, mode) {
    return new discord_modals_1.Modal()
        .setTitle("TeX Editor")
        .setCustomId((0, InteractionCache_1.cache)({
        cmd: "tex",
        mode: "reply"
    }, {
        users: [userid]
    }))
        .addComponents(new discord_modals_1.TextInputComponent()
        .setLabel("Please input your TeX expression below:")
        .setPlaceholder("\\frac{1}{2}")
        .setStyle("LONG")
        .setRequired(true)
        .setCustomId("input"));
}
exports.default = new Command_1.Command()
    .setName("tex")
    .setDescription("Render some LaTeX math")
    .setHandler(async (interaction) => {
    await (0, discord_modals_1.showModal)(createModal(interaction.user.id, "reply"), { client: interaction.client, interaction });
    return true;
})
    .addModalHandler(async (interaction, { data }) => {
    if (data.cmd !== "tex")
        return;
    let tex = interaction.getTextInputValue("input");
    let url = `https://chart.googleapis.com/chart?cht=tx&chco=FFFFFF&chf=bg,s,00FF0000&chs=${300}&chl=${encodeURIComponent(tex)}`;
    let res = await (0, node_fetch_1.default)(url);
    let buf = await res.buffer();
    let payload = {
        embeds: [
            res.status === 200
                ? new discord_js_1.MessageEmbed()
                    .setColor(colors_1.Colors.success)
                    .setTitle("Rendered successfully!")
                    .setImage("attachment://tex.png")
                : new discord_js_1.MessageEmbed()
                    .setColor(colors_1.Colors.error)
                    .setTitle("Too big!")
                    .setDescription("The  LaTeX that you entered was too big for us to process. Consider splitting it into smaller portions.")
        ],
        files: res.status === 200 ? [
            new discord_js_1.MessageAttachment(buf, "tex.png")
        ] : [],
        components: [new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton()
                .setLabel("Edit")
                .setEmoji("✏")
                .setStyle("SECONDARY")
                .setCustomId((0, InteractionCache_1.cache)({
                cmd: "show_tex_edit"
            }, { users: [interaction.user.id] })))]
    };
    if (data.mode === "reply") {
        await interaction.reply(payload);
    }
    else {
        await interaction.update(payload);
    }
    return true;
})
    .addButtonHandler(async (interaction, { data }) => {
    if (data.cmd !== "show_tex_edit")
        return;
    await (0, discord_modals_1.showModal)(createModal(interaction.user.id, "update"), { client: interaction.client, interaction });
    return true;
});
//# sourceMappingURL=tex.js.map