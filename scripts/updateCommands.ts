import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { DEV_GUILD_ID, DISCORD_CLIENT_ID, DISCORD_TOKEN } from '../assets/config';
import { Command } from '../lib/Command';

async function main(){
    await Command.loadAll();
    const rest = new REST({ version: '9' }).setToken(DISCORD_TOKEN);
    await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DEV_GUILD_ID), { body: Command.loaded.map(cmd => cmd.toJSON()) })
    console.log('Successfully registered application commands.');
}
main();