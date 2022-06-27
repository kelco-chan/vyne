"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addModalSubmitHandler = exports.addSelectMenuHandler = exports.addButtonHandler = exports.addUserContextMenuHandler = exports.addMessageContextMenuHandler = exports.addAutocompleteHandler = exports.addCommandHandler = exports.loadCommands = exports.loadedHandlers = exports.loadedCommands = void 0;
const builders_1 = require("@discordjs/builders");
const recursive_readdir_1 = __importDefault(require("recursive-readdir"));
const embeds_1 = require("../../assets/embeds");
const client_1 = __importDefault(require("../common/client"));
const errorHandling_1 = require("../errorHandling");
const InteractionCache_1 = require("./InteractionCache");
/*
* WARNING: The code that follows may make you cry:
*           A Safety Pig has been provided below for your benefit
*                              _
*      _._ _..._ .-',     _.._(`))
*     '-. `     '  /-._.-'    ',/
*       )         \            '.
*      / _    _    |             \
*     |  a    a    /              |
*      \   .-.                     ;
*       '-('' ).-'       ,'       ;
*          '-;           |      .'
*            \           \    /
*            | 7  .__  _.-\   \
*            | |  |  ``/  /`  /
*           /,_|  |   /,_/   /
*              /,_/      '`-'
*/
exports.loadedCommands = [];
exports.loadedHandlers = [];
async function loadCommands() {
    exports.loadedCommands = [];
    let fileNames = (await (0, recursive_readdir_1.default)(__dirname + "/../../commands"));
    for (let fileName of fileNames) {
        if (!fileName.endsWith(".js"))
            continue;
        //WARNING: THIS WILL ONLY WORK IN COMMONJS. DO NOT SWITCH TO ESM
        delete require.cache[require.resolve(fileName)];
        let cmd = (require(fileName)).default;
        if (cmd instanceof builders_1.SlashCommandBuilder) {
            exports.loadedCommands.push(cmd);
        }
        else {
            console.warn(`${fileName} does not export a valid command. If it is not a command, please move it outside of the commands directory in the future.`);
        }
    }
    exports.loadedCommands = exports.loadedCommands.sort((cmd1, cmd2) => cmd1.name.localeCompare(cmd2.name));
    return exports.loadedCommands;
}
exports.loadCommands = loadCommands;
function doesCommandMatchHandler(handler, interaction) {
    let fullName = interaction.commandName;
    try {
        fullName += " " + interaction.options.getSubcommandGroup(true);
    }
    catch (e) { }
    try {
        fullName += " " + interaction.options.getSubcommand(true);
    }
    catch (e) { }
    if (typeof handler.command === "string") {
        return fullName === handler.command;
    }
    else if (handler.command instanceof RegExp) {
        return handler.command.test(fullName);
    }
    else if (Array.isArray(handler.command)) {
        return handler.command.includes(fullName);
    }
    else {
        return handler.command(fullName);
    }
}
//handler for commands
client_1.default.on("interactionCreate", async (interaction) => {
    let timeStarted = Date.now();
    try {
        let entry;
        if (interaction.isMessageComponent()) {
            entry = (0, InteractionCache_1.resolveEntry)(interaction);
            if (!entry)
                return await interaction.reply({ embeds: [embeds_1.Embeds.EXPIRED_COMPONENT], ephemeral: true });
            if (entry === "INVALID_USER")
                return await interaction.reply({ embeds: [embeds_1.Embeds.INVALID_USER], ephemeral: true });
        }
        for (let handler of exports.loadedHandlers) {
            let status;
            if (interaction.isCommand() && (handler.type === "Command") && doesCommandMatchHandler(handler, interaction)) {
                status = await handler.fn(interaction);
            }
            if (interaction.isAutocomplete() && (handler.type === "Autocomplete") && doesCommandMatchHandler(handler, interaction)) {
                status = await handler.fn(interaction);
            }
            if (interaction.isMessageContextMenu() && (handler.type === "MessageContextMenu") && (interaction.commandName === handler.command)) {
                status = await handler.fn(interaction);
            }
            if (interaction.isUserContextMenu() && (handler.type === "UserContextMenu") && (interaction.commandName === handler.command)) {
                status = await handler.fn(interaction);
            }
            if (interaction.isButton() && handler.type === "Button" && entry) {
                status = await handler.fn(interaction, entry);
            }
            if (interaction.isSelectMenu() && handler.type === "SelectMenu" && entry) {
                status = await handler.fn(interaction, entry);
            }
            if (interaction.isModalSubmit() && handler.type === "ModalSubmit" && entry) {
                status = await handler.fn(interaction, entry);
            }
            //TODO: do something about command statuses
        }
    }
    catch (e) {
        (0, errorHandling_1.reject)(interaction, e, timeStarted);
    }
});
function addCommandHandler(command, fn) {
    exports.loadedHandlers.push({ type: "Command", command, fn });
}
exports.addCommandHandler = addCommandHandler;
function addAutocompleteHandler(command, fn) {
    exports.loadedHandlers.push({ type: "Autocomplete", command, fn });
}
exports.addAutocompleteHandler = addAutocompleteHandler;
function addMessageContextMenuHandler(command, fn) {
    exports.loadedHandlers.push({ type: "MessageContextMenu", command, fn });
}
exports.addMessageContextMenuHandler = addMessageContextMenuHandler;
function addUserContextMenuHandler(command, fn) {
    exports.loadedHandlers.push({ type: "UserContextMenu", command, fn });
}
exports.addUserContextMenuHandler = addUserContextMenuHandler;
function addButtonHandler(fn) {
    exports.loadedHandlers.push({ type: "Button", fn });
}
exports.addButtonHandler = addButtonHandler;
function addSelectMenuHandler(fn) {
    exports.loadedHandlers.push({ type: "SelectMenu", fn });
}
exports.addSelectMenuHandler = addSelectMenuHandler;
function addModalSubmitHandler(fn) {
    exports.loadedHandlers.push({ type: "ModalSubmit", fn });
}
exports.addModalSubmitHandler = addModalSubmitHandler;
//# sourceMappingURL=Command.js.map