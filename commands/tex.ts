import { MessageActionRow, MessageAttachment, MessageButton, MessageEmbed, Modal, ModalActionRowComponent, TextInputComponent } from "discord.js";
import { Colors } from "../assets/colors";
import { addButtonHandler, addCommandHandler, addModalSubmitHandler } from "../lib/classes/Command";
import { cache } from "../lib/classes/InteractionCache";
import fetch from "node-fetch";
import { SlashCommandBuilder } from "@discordjs/builders";

function createModal(userid: string, mode: "reply" | "update"){
    return new Modal()
        .setTitle("TeX Editor")
        .setCustomId(cache({
            cmd:"tex",
            mode:"reply"
        }, {
            users:[userid]
        }))
        .addComponents(
            new MessageActionRow<ModalActionRowComponent>().addComponents(
                new TextInputComponent()
                    .setLabel("Please input your TeX expression below:")
                    .setPlaceholder("\\frac{1}{2}")
                    .setStyle("PARAGRAPH")
                    .setRequired(true)
                    .setCustomId("input")
            )
        )
}

export default new SlashCommandBuilder()
    .setName("tex")
    .setDescription("Render some LaTeX math")

addCommandHandler("tex", async (interaction) => {
    await interaction.showModal(createModal(interaction.user.id, "reply"));
    return "SUCCESS";
})
addModalSubmitHandler<{cmd:string, mode:"update" | "reply"}>(async (interaction, {data}) => {
    if(data.cmd !== "tex") return "NO_MATCH";
    let tex = interaction.fields.getTextInputValue("input");
    
    let url = `https://chart.googleapis.com/chart?cht=tx&chco=FFFFFF&chf=bg,s,00FF0000&chs=${300}&chl=${encodeURIComponent(tex)}`;
    let res = await fetch(url);
    let buf = await res.buffer();
    let payload = {
        embeds:[
            res.status === 200
            ? new MessageEmbed()
                .setColor(Colors.success)
                .setTitle("Rendered successfully!")
                .setImage("attachment://tex.png") 
                
            : new MessageEmbed()
                .setColor(Colors.error)
                .setTitle("Too big!")
                .setDescription("The  LaTeX that you entered was too big for us to process. Consider splitting it into smaller portions.")
        ],
        files: res.status === 200 ? [
             new MessageAttachment(buf, "tex.png") 
        ] : [],
        components:[new MessageActionRow().addComponents(
            new MessageButton()
                .setLabel("Edit")
                .setEmoji("✏")
                .setStyle("SECONDARY")
                .setCustomId(cache({
                    cmd:"show_tex_edit"
                },{users: [interaction.user.id]}))
        )]
    };
    if(data.mode === "reply"){
        await interaction.reply(payload)
    }else{
        await interaction.update(payload);
    }
    return "SUCCESS";
})

addButtonHandler<{cmd: string}>(async (interaction, {data}) => {
    if(data.cmd !== "show_tex_edit") return "NO_MATCH";
    await interaction.showModal(createModal(interaction.user.id, "update"));
    return "SUCCESS";
})