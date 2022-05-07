import { Modal, showModal, TextInputComponent } from "discord-modals";
import { MessageActionRow, MessageAttachment, MessageButton, MessageEmbed } from "discord.js";
import { Colors } from "../assets/colors";
import { Command } from "../lib/classes/Command";
import { cache } from "../lib/classes/InteractionCache";
import fetch from "node-fetch";

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
            new TextInputComponent()
                .setLabel("Please input your TeX expression below:")
                .setPlaceholder("\\frac{1}{2}")
                .setStyle("LONG")
                .setRequired(true)
                .setCustomId("input")
        )
}

export default new Command()
    .setName("tex")
    .setDescription("Render some LaTeX math")
    .setHandler(async (interaction) => {
        await showModal(createModal(interaction.user.id, "reply"), {client: interaction.client, interaction});
        return true;
    })
    .addModalHandler<{cmd:string, mode:"update" | "reply"}>(async (interaction, {data}) => {
        if(data.cmd !== "tex") return;
        let tex = interaction.getTextInputValue("input");
        
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
        return true;
    })
    .addButtonHandler<{cmd: string}>(async (interaction, {data}) => {
        if(data.cmd !== "show_tex_edit") return;
        await showModal(createModal(interaction.user.id, "update"), {client: interaction.client, interaction});
        return true;
    })