import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Command } from '../lib/Command';
let production = process.env.PRODUCTION === "true";
async function main(){
    console.log(`Updating commands for ${production ? "production" : "development"} ...`)
    await Command.loadAll();
    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN || "");
    let body = { body: Command.loaded.map(cmd => cmd.toJSON()) };
    if(production){
        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || ""), body)
    }else{
        await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID || "", process.env.DEV_GUILD_ID || ""), body)
    }
    console.log('Successfully registered application commands.');
    process.exit();
}
main();