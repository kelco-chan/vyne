import {ActivitiesOptions, Activity, Client, Intents, Interaction, Message, MessageEmbed, TextChannel, VoiceChannel} from "discord.js";
import { Command } from "./lib/classes/Command";
import { DISCORD_TOKEN, GUILD_LOGGING_CHANNEL } from "./assets/config";
import { Embeds } from "./assets/embeds";
import { resolveEntry } from "./lib/classes/InteractionCache";
import discordModals from "discord-modals";
import prisma from "./lib/prisma";
import { Pomodoro } from "./lib/classes/Pomodoro";
import PausableTimer from "./lib/classes/PausableTimer";
import { reject } from "./lib/errorHandling";
import http from "http";
import { Colors } from "./assets/colors";
//sh -c \"while true; do timeout 10800 <start command here>; done\"
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});
discordModals(client);
Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`))
client.once("ready", () => {
    console.log(`Connected to Discord, serving ${client.guilds.cache.size} guilds.`);
});
//handler for commands
client.on("interactionCreate", async interaction => {
    let timeStarted = Date.now();
    if(!interaction.isCommand()) return;
    for(let command of Command.loaded){
        if(!command.matches(interaction)) continue;
        try{
            await command.handler(interaction);
        }catch(e){
            reject(interaction, e as Error, timeStarted);
        }
    }
});
//handler for buttons
client.on("interactionCreate", async interaction => {
    if(!interaction.isButton()) return;
    let timeStarted = Date.now();
    let entry = resolveEntry(interaction);
    if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
    if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
    try{
        for(let command of Command.loaded){
            for(let buttonHandler of command.buttonHandlers){
                await buttonHandler(interaction, entry);
            }
        }
    }catch(e){
        reject(interaction, e as Error, timeStarted);
    }
});
//handler for select menus
client.on("interactionCreate", async interaction => {
    if(!interaction.isSelectMenu()) return;
    let timeStarted = Date.now();
    let entry = resolveEntry(interaction);
    if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
    if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
    try{
        for(let command of Command.loaded){
            for(let selectMenuHandler of command.selectMenuHandlers){
                selectMenuHandler(interaction, entry);
            }
        }
    }catch(e){
        reject(interaction, e as Error, timeStarted)
    }
});
client.on("modalSubmit", async interaction => {
    let timeStarted = Date.now();
    let entry = resolveEntry(interaction);
    if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
    if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
    try{
        for(let command of Command.loaded){
            for(let modalHandler of command.modalHandlers){
                modalHandler(interaction, entry);
            }
        }
    }catch(e){
        reject(interaction, e as Error, timeStarted);
    }
})
client.on("voiceStateUpdate", async (oldState, newState) => {
    if(newState?.member?.user?.bot || oldState?.member?.user?.bot) return;
    let oldSession = Pomodoro.active.find(session => session.vcId === oldState.channelId);
    let newSession = Pomodoro.active.find(session => session.vcId === newState.channelId);
    if(oldSession && oldState.member){
        //this is the session that was left
        let timer = oldSession.userTimers.get(oldState.member.user.id);
        timer && timer.pause();
        let channel = await client.channels.fetch(oldSession.vcId) as VoiceChannel | null;
        if(channel && (channel.members.size === 1)){
            //everyone left STOP THE SESSION
            oldSession.interaction.channel?.send({embeds:[
                new MessageEmbed()
                .setTitle("Session Stopped")
                .setColor(Colors.error)
                .setDescription("The pomodoro session was stopped since everyone left the voice channel.")
            ]})
            oldSession.destroy();
        }
    }
    if(newSession && newState.member){
        let timer = newSession.userTimers.get(newState.member.user.id);
        if(!timer){
            timer = new PausableTimer();
            newSession.userTimers.set(newState.member.user.id, timer);
        }
        if(newSession.paused){
            timer.pause();
        }else{
            timer.resume();
        }
    }
})
http.createServer(async function(req,res){
    res.setHeader("Content-Type", "application/json");
    if(req.method === "GET" && req.url === "/servercount"){
        res.end(JSON.stringify({
            error: false,
            data: {
                serverCount: client.guilds.cache.size
            }
        }))
    }

}).listen(process.env.PORT || 3000);
client.on("guildCreate", async function(guild){
    let channel = (await client.channels.fetch(GUILD_LOGGING_CHANNEL)) as (TextChannel | null);
    channel && channel.send({embeds:[
        new MessageEmbed()
            .setColor(Colors.success)
            .setTitle(`Joined guild ${guild.name}`)
            .addField("Members", "" + guild.approximateMemberCount, true)
            .addField("Locale", guild.preferredLocale, true)
            .setFooter({text: `Total guild count: ${client.guilds.cache.size}`})
    ]})
})
client.on("guildDelete", async function(guild){
    let channel = (await client.channels.fetch(GUILD_LOGGING_CHANNEL)) as (TextChannel | null);
    channel && channel.send({embeds:[
        new MessageEmbed()
            .setColor(Colors.error)
            .setTitle(`Left guild ${guild.name}`)
            .addField("Guild ID", guild.id)
            .addField("Members", "" + guild.approximateMemberCount, true)
            .addField("Locale", guild.preferredLocale, true)
            .addField("Joined", guild.joinedAt.toLocaleDateString())
            .setFooter({text: `Total guild count: ${client.guilds.cache.size}`})
    ]})
})
setInterval(() => {
    const activities:ActivitiesOptions[] = [{name : "with pomodoro timers", type:"PLAYING"}, {name:"you study", type:"WATCHING"}, {name:`over ${client.guilds.cache.size} servers`, type:"WATCHING"}]
    client.user?.setPresence({status:"online", afk:false, activities:[
        activities[Math.floor(Math.random() * activities.length)]
    ]})
}, 100_000);
client.login(DISCORD_TOKEN);