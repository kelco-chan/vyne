import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Client, Intents } from 'discord.js';
import { DEV_USER_ID } from '../assets/config';
import { loadCommands, loadedCommands } from '../lib/classes/Command';
let production = process.env.NODE_ENV === "production"
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});
async function main(){
    console.log(`Updating commands for ${production ? "production" : "development"} ...`);
    await client.login();
    await loadCommands();
    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN || "");
    let body = { body: loadedCommands.map(cmd => cmd.toJSON()) };
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
        /*let isDevCommands = loadedCommands.filter(cmd => cmd.isDevOnly)
        if(isDevCommands.length > 0){
            let fullPermissions:temp[] = isDevCommands.map(cmd => {
                let id = cmdDatas.find(data => data.name === cmd.name && data.description === cmd.description)?.id + "";
                return {
                    id,
                    permissions:[{
                        type:"USER",
                        permission: true,
                        id:DEV_USER_ID
                    }]
                }
            });
            await client.application?.commands.permissions.set({fullPermissions, guild:process.env.DEV_GUILD_ID || ""})
        }*/
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
        /*let isDevCommands = loadedCommands.filter(cmd => cmd.isDevOnly)
        if(isDevCommands.length > 0){
            let fullPermissions:temp[] = isDevCommands.map(cmd => {
                let id = cmdDatas.find(data => data.name === cmd.name && data.description === cmd.description)?.id + "";
                return {
                    id,
                    permissions:[{
                        type:"USER",
                        permission: true,
                        id:DEV_USER_ID
                    }]
                }
            });
            await client.application?.commands.permissions.set({fullPermissions, guild:process.env.DEV_GUILD_ID || ""})
        }*/
    }
    console.log('Successfully registered application commands.');
    process.exit();
}
main();