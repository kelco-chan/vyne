"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const config_json_1 = require("../config.json");
const Command_1 = require("../lib/Command");
async function main() {
    await Command_1.Command.loadAll();
    const rest = new rest_1.REST({ version: '9' }).setToken(config_json_1.DISCORD_TOKEN);
    await rest.put(v9_1.Routes.applicationGuildCommands(config_json_1.DISCORD_CLIENT_ID, config_json_1.DEV_GUILD_ID), { body: Command_1.Command.loaded.map(cmd => cmd.toJSON()) });
    console.log('Successfully registered application commands.');
}
main();
//# sourceMappingURL=updateCommands.js.map