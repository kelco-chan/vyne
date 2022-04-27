"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const builders_1 = require("@discordjs/builders");
const recursive_readdir_1 = __importDefault(require("recursive-readdir"));
const embeds_1 = require("../../assets/embeds");
const client_1 = __importDefault(require("../common/client"));
const errorHandling_1 = require("../errorHandling");
const InteractionCache_1 = require("./InteractionCache");
let commands = [];
class Command extends builders_1.SlashCommandBuilder {
    constructor() {
        super();
        this.handler = () => { throw new Error(`Empty handler for function ${this.name}`); };
        this.buttonHandlers = [];
        this.selectMenuHandlers = [];
        this.modalHandlers = [];
        this.isDevOnly = false;
    }
    devOnly() {
        this.isDevOnly = true;
        this.setDefaultPermission(false);
        return this;
    }
    matches(interaction) {
        return interaction.isCommand() && (interaction.commandName === this.name);
    }
    addButtonHandler(handler) {
        this.buttonHandlers.push(handler);
        return this;
    }
    addSelectMenuHandler(handler) {
        this.selectMenuHandlers.push(handler);
        return this;
    }
    addModalHandler(handler) {
        this.modalHandlers.push(handler);
        return this;
    }
    setHandler(handler) {
        this.handler = handler;
        return this;
    }
    static async loadAll() {
        commands = [];
        let fileNames = (await (0, recursive_readdir_1.default)(__dirname + "/../../commands"));
        for (let fileName of fileNames) {
            if (!fileName.endsWith(".js"))
                continue;
            //WARNING: THIS WILL ONLY WORK IN COMMONJS. DO NOT SWITCH TO ESM
            delete require.cache[require.resolve(fileName)];
            let cmd = (require(fileName)).default;
            if (cmd instanceof Command) {
                commands.push(cmd);
            }
            else {
                console.warn(`${fileName} does not export a valid command. If it is not a command, please move it outside of the commands directory in the future.`);
            }
        }
        commands = commands.sort((cmd1, cmd2) => cmd1.name.localeCompare(cmd2.name));
        return commands;
    }
    static get loaded() {
        return commands;
    }
}
exports.Command = Command;
//handler for commands
client_1.default.on("interactionCreate", async (interaction) => {
    let timeStarted = Date.now();
    if (!interaction.isCommand())
        return;
    for (let command of Command.loaded) {
        if (!command.matches(interaction))
            continue;
        try {
            await command.handler(interaction);
        }
        catch (e) {
            (0, errorHandling_1.reject)(interaction, e, timeStarted);
        }
    }
});
//handler for buttons
client_1.default.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton())
        return;
    let timeStarted = Date.now();
    let entry = (0, InteractionCache_1.resolveEntry)(interaction);
    if (!entry)
        return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
    if (entry === "INVALID_USER")
        return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
    try {
        for (let command of Command.loaded) {
            for (let buttonHandler of command.buttonHandlers) {
                await buttonHandler(interaction, entry);
            }
        }
    }
    catch (e) {
        (0, errorHandling_1.reject)(interaction, e, timeStarted);
    }
});
//handler for select menus
client_1.default.on("interactionCreate", async (interaction) => {
    if (!interaction.isSelectMenu())
        return;
    let timeStarted = Date.now();
    let entry = (0, InteractionCache_1.resolveEntry)(interaction);
    if (!entry)
        return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
    if (entry === "INVALID_USER")
        return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
    try {
        for (let command of Command.loaded) {
            for (let selectMenuHandler of command.selectMenuHandlers) {
                selectMenuHandler(interaction, entry);
            }
        }
    }
    catch (e) {
        (0, errorHandling_1.reject)(interaction, e, timeStarted);
    }
});
client_1.default.on("modalSubmit", async (interaction) => {
    let timeStarted = Date.now();
    let entry = (0, InteractionCache_1.resolveEntry)(interaction);
    if (!entry)
        return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
    if (entry === "INVALID_USER")
        return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
    try {
        for (let command of Command.loaded) {
            for (let modalHandler of command.modalHandlers) {
                modalHandler(interaction, entry);
            }
        }
    }
    catch (e) {
        (0, errorHandling_1.reject)(interaction, e, timeStarted);
    }
});
//# sourceMappingURL=Command.js.map