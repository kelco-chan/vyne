import {ActivitiesOptions, Activity, Client, Intents, Interaction, Message, MessageEmbed, TextChannel} from "discord.js";
import { Command } from "./lib/Command";
import { Colors } from "./assets/colors";
import { DISCORD_TOKEN } from "./assets/config";
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});
Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`))
client.once("ready", () => {
    console.log(`Connected to Discord, serving ${client.guilds.cache} guilds.`);
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
            await interaction.reply({embeds:[
                new MessageEmbed()
                    .setTitle("Something ran wrong ...")
                    .setColor(Colors.error)
                    .setDescription("An unexpected error occured and the command was termined. Please try again, but if this issue persists please contact Silenced#8839.")
            ]})
        }
    }
    if(!interaction.replied){
        await interaction.reply({embeds:[
            new MessageEmbed()
                .setTitle("Unknown command")
                .setColor(Colors.error)
                .setDescription("Somehow you managed to send in an unknown command and studybot didn't know how to respond. Interesting.")
        ]})
    }
    
});
setInterval(() => {
    const activities:ActivitiesOptions[] = [{name : "with pomodoro timers", type:"PLAYING"}, {name:"/help", type:"PLAYING"}, {name:"you study", type:"WATCHING"}, {name:`over ${client.guilds.cache.size}`, type:"WATCHING"}]
    client.user?.setPresence({status:"online", afk:false, activities:[
        activities[Math.floor(Math.random() * activities.length)]
    ]})
}, 100_000);
client.login(DISCORD_TOKEN);