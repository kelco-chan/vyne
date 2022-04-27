import { SlashCommandBuilder } from "@discordjs/builders";
import { ModalData, ModalSubmitInteraction } from "discord-modals";
import { ButtonInteraction, CommandInteraction, Interaction, InteractionReplyOptions, MessageActionRow, MessageEmbed, SelectMenuInteraction } from "discord.js";
import { InteractionResponseTypes } from "discord.js/typings/enums";
import readdir from "recursive-readdir"
import { Embeds } from "../../assets/embeds";
import client from "../common/client";
import { reject } from "../errorHandling";
import { CustomIdEntry, resolveEntry } from "./InteractionCache";
type CommandHandler = (interaction: CommandInteraction) => Promise<boolean>;
type ButtonHandler<T> = (interaction: ButtonInteraction, entry: CustomIdEntry<T>) => Promise<boolean|undefined>;
type SelectMenuHandler<T> = (interaction: SelectMenuInteraction, entry: CustomIdEntry<T>) => Promise<boolean|undefined>;
type ModalHandler<T> = (interaction: ModalSubmitInteraction, entry: CustomIdEntry<T>) => Promise<boolean|undefined>;

let commands:Command[] = [];
export class Command extends SlashCommandBuilder{
    /**
     * slash command handler for that interaction;
     */
    handler: CommandHandler;
    /**
     * Whether or not this command is limited to developers
     */
    isDevOnly: boolean;
    buttonHandlers: ButtonHandler<any>[];
    selectMenuHandlers: SelectMenuHandler<any>[];
    modalHandlers: ModalHandler<any>[];

    constructor(){
        super();
        this.handler = () => { throw new Error(`Empty handler for function ${this.name}`) };
        this.buttonHandlers = [];
        this.selectMenuHandlers = [];
        this.modalHandlers = [];
        this.isDevOnly = false;
    }
    devOnly(){
        this.isDevOnly = true;
        this.setDefaultPermission(false);
        return this;
    }
    matches(interaction: Interaction): boolean{
        return interaction.isCommand() && (interaction.commandName === this.name);
    }

    addButtonHandler<T>(handler:ButtonHandler<T>){
        this.buttonHandlers.push(handler);
        return this;
    }
    addSelectMenuHandler<T>(handler:SelectMenuHandler<T>){
        this.selectMenuHandlers.push(handler);
        return this;
    }
    addModalHandler<T>(handler:ModalHandler<T>){
        this.modalHandlers.push(handler);
        return this;
    }

    setHandler(handler: CommandHandler){
        this.handler = handler;
        return this;
    }
    static async loadAll(){
        commands = [];
        let fileNames = (await readdir(__dirname + "/../../commands"))
        for (let fileName of fileNames) {
            if (!fileName.endsWith(".js")) continue;
            //WARNING: THIS WILL ONLY WORK IN COMMONJS. DO NOT SWITCH TO ESM
            delete require.cache[require.resolve(fileName)];
            let cmd = (require(fileName)).default;
            if(cmd instanceof Command){
                commands.push(cmd);
            }else{
                console.warn(`${fileName} does not export a valid command. If it is not a command, please move it outside of the commands directory in the future.`)
            }
        }
        commands = commands.sort((cmd1,cmd2)=>cmd1.name.localeCompare(cmd2.name));
        return commands;
    }
    static get loaded(){
        return commands;
    }
}

//handler for commands
client.on("interactionCreate", async interaction => {
    let timeStarted = Date.now();
    if(!interaction.isCommand()) return;
    for(let command of Command.loaded){
        if(!command.matches(interaction)) continue;
        try{
            await command.handler(interaction);
        }catch(e){
            reject(interaction, e as Error, timeStarted);
        }
    }
});
//handler for buttons
client.on("interactionCreate", async interaction => {
    if(!interaction.isButton()) return;
    let timeStarted = Date.now();
    let entry = resolveEntry(interaction);
    if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
    if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
    try{
        for(let command of Command.loaded){
            for(let buttonHandler of command.buttonHandlers){
                await buttonHandler(interaction, entry);
            }
        }
    }catch(e){
        reject(interaction, e as Error, timeStarted);
    }
});
//handler for select menus
client.on("interactionCreate", async interaction => {
    if(!interaction.isSelectMenu()) return;
    let timeStarted = Date.now();
    let entry = resolveEntry(interaction);
    if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
    if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
    try{
        for(let command of Command.loaded){
            for(let selectMenuHandler of command.selectMenuHandlers){
                selectMenuHandler(interaction, entry);
            }
        }
    }catch(e){
        reject(interaction, e as Error, timeStarted)
    }
});
client.on("modalSubmit", async interaction => {
    let timeStarted = Date.now();
    let entry = resolveEntry(interaction);
    if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
    if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
    try{
        for(let command of Command.loaded){
            for(let modalHandler of command.modalHandlers){
                modalHandler(interaction, entry);
            }
        }
    }catch(e){
        reject(interaction, e as Error, timeStarted);
    }
})