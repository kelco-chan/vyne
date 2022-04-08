import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Interaction, InteractionReplyOptions, MessageActionRow, MessageEmbed } from "discord.js";
import { InteractionResponseTypes } from "discord.js/typings/enums";
import readdir from "recursive-readdir"
type CommandHandler = (interaction: CommandInteraction) => Promise<boolean>;
let commands:Command[] = [];
export class Command extends SlashCommandBuilder{
    handler: CommandHandler;
    constructor(){
        super();
        this.handler = () => { throw new Error(`Empty handler for function ${this.name}`) }
    }
    matches(interaction: Interaction): boolean{
        return interaction.isCommand() && (interaction.commandName === this.name);
    }
    setHandler(handler: CommandHandler){
        this.handler = handler;
        return this;
    }
    static async loadAll(){
        commands = [];
        let fileNames = (await readdir(__dirname + "/../commands"))
        for (let fileName of fileNames) {
            if (!fileName.endsWith(".js")) continue;
            //WARNING: THIS WILL ONLY WORK IN COMMONJS. DO NOT SWITCH TO ESM
            delete require.cache[require.resolve(fileName)];
            let cmd = (require(fileName)).default;
            if(cmd instanceof Command){
                commands.push(cmd);
            }else{
                console.error(`${fileName} does not export a valid command. If it is not a command, please move it outside of the commands directory in the future.`)
            }
        }
        commands = commands.sort((cmd1,cmd2)=>cmd1.name.localeCompare(cmd2.name));
        return commands;
    }
    static get loaded(){
        return commands;
    }
}