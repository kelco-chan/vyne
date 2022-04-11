"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const Command_1 = require("../lib/Command");
let production = process.env.PRODUCTION === "true";
async function main() {
    console.log(`Updating commands for ${production ? "production" : "development"} ...`);
    await Command_1.Command.loadAll();
    const rest = new rest_1.REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN || "");
    let body = { body: Command_1.Command.loaded.map(cmd => cmd.toJSON()) };
    if (production) {
        await rest.put(v9_1.Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || ""), body);
    }
    else {
        await rest.put(v9_1.Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID || "", process.env.DEV_GUILD_ID || ""), body);
    }
    console.log('Successfully registered application commands.');
    process.exit();
}
main();
//# sourceMappingURL=updateCommands.js.map