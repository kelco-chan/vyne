"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env["DISCORD_CLIENT_ID"];
const DEV_GUILD_ID = process.env["DEV_GUILD_ID"];
const Command_1 = require("../lib/Command");
async function main() {
    await Command_1.Command.loadAll();
    const rest = new rest_1.REST({ version: '9' }).setToken(DISCORD_TOKEN);
    await rest.put(v9_1.Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DEV_GUILD_ID), { body: Command_1.Command.loaded.map(cmd => cmd.toJSON()) });
    console.log('Successfully registered application commands.');
}
main();
//# sourceMappingURL=updateCommands.js.map