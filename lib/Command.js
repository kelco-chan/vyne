"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const builders_1 = require("@discordjs/builders");
const recursive_readdir_1 = __importDefault(require("recursive-readdir"));
let commands = [];
class Command extends builders_1.SlashCommandBuilder {
    constructor() {
        super();
        this.handler = () => { throw new Error(`Empty handler for function ${this.name}`); };
        this.buttonHandlers = [];
        this.selectMenuHandlers = [];
        this.modalHandlers = [];
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
        let fileNames = (await (0, recursive_readdir_1.default)(__dirname + "/../commands"));
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
                console.error(`${fileName} does not export a valid command. If it is not a command, please move it outside of the commands directory in the future.`);
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
//# sourceMappingURL=Command.js.map