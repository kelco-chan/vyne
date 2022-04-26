import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Client, Intents } from 'discord.js';
import { Command } from '../lib/classes/Command';
let production = process.env.PRODUCTION === "true";
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});
async function main(){
    console.log(`Updating commands for ${production ? "production" : "development"} ...`);
    await client.login();
    await Command.loadAll();
    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN || "");
    let body = { body: Command.loaded.map(cmd => cmd.toJSON()) };
    if(production){
        let cmdDatas = <{id:string, name: string, description: string}[]> await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || ""), body);
        type temp = {
            id: string;
            permissions: {
                type: "USER" | "ROLE";
                permission: boolean;
                id: string;
            }[];
        }
        let isDevCommands = Command.loaded.filter(cmd => cmd.isDevOnly)
        let fullPermissions:temp[] = isDevCommands.map(cmd => {
            let id = cmdDatas.find(data => data.name === cmd.name && data.description === cmd.description)?.id + "";
            return {
                id,
                permissions:[{
                    type:"USER",
                    permission: true,
                    id:"961445600967163954"
                }]
            }
        });
        await client.application?.commands.permissions.set({fullPermissions, guild:process.env.DEV_GUILD_ID || ""})
    }else{
        
        await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID || "", process.env.DEV_GUILD_ID || ""), {body:[]})
        let cmdDatas = <{id:string, name: string, description: string}[]> await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || ""), body)
        type temp = {
            id: string;
            permissions: {
                type: "USER" | "ROLE";
                permission: boolean;
                id: string;
            }[];
        }
        let isDevCommands = Command.loaded.filter(cmd => cmd.isDevOnly)
        let fullPermissions:temp[] = isDevCommands.map(cmd => {
            let id = cmdDatas.find(data => data.name === cmd.name && data.description === cmd.description)?.id + "";
            return {
                id,
                permissions:[{
                    type:"USER",
                    permission: true,
                    id:"624510393292816395"
                }]
            }
        });
        await client.application?.commands.permissions.set({fullPermissions, guild:process.env.DEV_GUILD_ID || ""})
    }
    console.log('Successfully registered application commands.');
    process.exit();
}
main();