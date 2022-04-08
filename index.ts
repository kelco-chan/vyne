import {Client, Intents, Interaction, MessageEmbed} from "discord.js";
import { InteractionResponseTypes} from "discord.js/typings/enums";
import { Command } from "./lib/Command";
import CONFIG from "./config.json";
import { Colors } from "./assets/colors";
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});

Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`))
client.once("ready", () => console.log("Connected to Discord."));
//handler for commands
client.on("interactionCreate", async interaction => {
    if(!interaction.isCommand()) return;
    for(let command of Command.loaded){
        if(!command.matches(interaction)) continue;
        try{
            let succeeded = await command.handler(interaction);
        }catch(e){
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
                .setDescription("Somehow you managed to send in an unknown command. Interesting.")
        ]})
    }
    
})
client.login(CONFIG.DISCORD_TOKEN);