import {ActivitiesOptions, Activity, Client, Intents, Interaction, Message, MessageEmbed, TextChannel} from "discord.js";
import { Command } from "./lib/Command";
import { Colors } from "./assets/colors";
import { DISCORD_TOKEN } from "./assets/config";
import { PrismaClient } from "@prisma/client";
import { Embeds } from "./assets/embeds";
import { resolveEntry } from "./lib/InteractionCache";
import discordModals from "discord-modals";
import prisma from "./lib/prisma";
import { Pomodoro } from "./lib/Pomodoro";
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});

discordModals(client);

Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`))
prisma.$connect();
client.once("ready", () => {
    console.log(`Connected to Discord, serving ${client.guilds.cache.size} guilds.`);
});
//handler for commands
client.on("interactionCreate", async interaction => {
    if(!interaction.isCommand()) return;
    for(let command of Command.loaded){
        if(!command.matches(interaction)) continue;
        try{
            let succeeded = await command.handler(interaction);
        }catch(e){
            console.error(e);
            await interaction.reply({embeds:[Embeds.UNKNOWN_ERROR]})
        }
    }
    if(!interaction.replied){
        await interaction.reply({embeds:[Embeds.UNKNOWN_COMMAND]})
    }
});
//handler for buttons
client.on("interactionCreate", async interaction => {
    if(!interaction.isButton()) return;
    let entry = resolveEntry(interaction);
    if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
    if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
    try{
        for(let command of Command.loaded){
            for(let buttonHandler of command.buttonHandlers){
                let success = await buttonHandler(interaction, entry);
                if(success === true){
                    ;//successful exection
                }else if(success === false){
                    ;//absolute disaster struck
                }else if(success === undefined){
                    ;///didnt match nooooo
                }
            }
        }
    }catch(e){
        console.error(e)
        await interaction.reply({embeds:[Embeds.UNKNOWN_ERROR]});
    }
    if(!interaction.replied) await interaction.reply({embeds:[Embeds.UNKNOWN_COMMAND]});
});
//handler for select menus
client.on("interactionCreate", async interaction => {
    if(!interaction.isSelectMenu()) return;
    let entry = resolveEntry(interaction);
    if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
    if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
    try{
        for(let command of Command.loaded){
            for(let selectMenuHandler of command.selectMenuHandlers){
                let success = await selectMenuHandler(interaction, entry);
                if(success === true){
                    ;//successful exection
                }else if(success === false){
                    ;//absolute disaster struck
                }else if(success === undefined){
                    ;///didnt match nooooo
                }
            }
        }
    }catch(e){
        console.error(e)
        await interaction.reply({embeds:[Embeds.UNKNOWN_ERROR]});
    }
    if(!interaction.replied) await interaction.reply({embeds:[Embeds.UNKNOWN_COMMAND]});
});
client.on("modalSubmit", async interaction => {
    let entry = resolveEntry(interaction);
    if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
    if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
    try{
        for(let command of Command.loaded){
            for(let modalHandler of command.modalHandlers){
                let success = await modalHandler(interaction, entry);
                if(success === true){
                    ;//successful exection
                }else if(success === false){
                    ;//absolute disaster struck
                }else if(success === undefined){
                    ;///didnt match nooooo
                }
            }
        }
    }catch(e){
        console.error(e)
        await interaction.reply({embeds:[Embeds.UNKNOWN_ERROR]});
    }
    if(!interaction.replied) await interaction.reply({embeds:[Embeds.UNKNOWN_COMMAND]});
})
client.on("voiceStateUpdate", (_, state) => {
    let member = state.member;
    if(!member || member.user.bot) return;
    let session = Pomodoro.active.find(session => session.vcId === state.channelId);
})
setInterval(() => {
    const activities:ActivitiesOptions[] = [{name : "with pomodoro timers", type:"PLAYING"}, {name:"you study", type:"WATCHING"}, {name:`over ${client.guilds.cache.size} servers`, type:"WATCHING"}]
    client.user?.setPresence({status:"online", afk:false, activities:[
        activities[Math.floor(Math.random() * activities.length)]
    ]})
}, 100_000);
client.login(DISCORD_TOKEN);