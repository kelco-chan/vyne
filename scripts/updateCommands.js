"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const discord_js_1 = require("discord.js");
const Command_1 = require("../lib/classes/Command");
let production = process.env.PRODUCTION === "true";
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES] });
async function main() {
    console.log(`Updating commands for ${production ? "production" : "development"} ...`);
    await client.login();
    await Command_1.Command.loadAll();
    const rest = new rest_1.REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN || "");
    let body = { body: Command_1.Command.loaded.map(cmd => cmd.toJSON()) };
    if (production) {
        let cmdDatas = await rest.put(v9_1.Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || ""), body);
        let isDevCommands = Command_1.Command.loaded.filter(cmd => cmd.isDevOnly);
        let fullPermissions = isDevCommands.map(cmd => {
            let id = cmdDatas.find(data => data.name === cmd.name && data.description === cmd.description)?.id + "";
            return {
                id,
                permissions: [{
                        type: "USER",
                        permission: true,
                        id: "624510393292816395"
                    }]
            };
        });
        await client.application?.commands.permissions.set({ fullPermissions, guild: process.env.DEV_GUILD_ID || "" });
    }
    else {
        await rest.put(v9_1.Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID || "", process.env.DEV_GUILD_ID || ""), { body: [] });
        let cmdDatas = await rest.put(v9_1.Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || ""), body);
        let isDevCommands = Command_1.Command.loaded.filter(cmd => cmd.isDevOnly);
        let fullPermissions = isDevCommands.map(cmd => {
            let id = cmdDatas.find(data => data.name === cmd.name && data.description === cmd.description)?.id + "";
            return {
                id,
                permissions: [{
                        type: "USER",
                        permission: true,
                        id: "624510393292816395"
                    }]
            };
        });
        await client.application?.commands.permissions.set({ fullPermissions, guild: process.env.DEV_GUILD_ID || "" });
    }
    console.log('Successfully registered application commands.');
    process.exit();
}
main();
//# sourceMappingURL=updateCommands.js.map