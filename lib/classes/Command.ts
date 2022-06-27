import { SlashCommandBuilder } from "@discordjs/builders";
import { AutocompleteInteraction, ButtonInteraction, CommandInteraction, ContextMenuInteraction, Interaction, InteractionReplyOptions, MessageActionRow, MessageComponentInteraction, MessageContextMenuInteraction, MessageEmbed, ModalSubmitInteraction, SelectMenuInteraction, UserContextMenuInteraction } from "discord.js";
import { InteractionResponseTypes } from "discord.js/typings/enums";
import readdir from "recursive-readdir"
import { Embeds } from "../../assets/embeds";
import client from "../common/client";
import { reject } from "../errorHandling";
import { CustomIdEntry, resolveEntry } from "./InteractionCache";

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

export let loadedCommands:SlashCommandBuilder[] = [];
export let loadedHandlers:Handler<any>[] = [];
/**
 * Specifies what commands to execut the handler on.
 */
type HandlerCommandMatcher = string | RegExp | string[] | ((fullCommandName: string) => boolean)

type HandlerResult = "NO_MATCH" | "SUCCESS" | "ERROR";
type CommandHandlerCallback = (interaction: CommandInteraction) => Promise<HandlerResult>;
type AutocompleteHandlerCallback = (interaction: AutocompleteInteraction) => Promise<HandlerResult>;
type MessageContextMenuHandlerCallback = (interaction: MessageContextMenuInteraction) => Promise<HandlerResult>;
type UserContextMenuHandlerCallback = (interaction: UserContextMenuInteraction) => Promise<HandlerResult>;
type ButtonHandlerCallback<T extends {cmd: string}> = (interaction: ButtonInteraction, entry: CustomIdEntry<T>) => Promise<HandlerResult>;
type SelectMenuHandlerCallback<T extends {cmd: string}> = (interaction: SelectMenuInteraction, entry: CustomIdEntry<T>) => Promise<HandlerResult>;
type ModalSubmitHandlerCallback<T extends {cmd: string}> = (interaction: ModalSubmitInteraction, entry: CustomIdEntry<T>) => Promise<HandlerResult>;

type CommandHandler = {type:"Command", command: HandlerCommandMatcher, fn: CommandHandlerCallback};
type AutocompleteHandler = {type:"Autocomplete", command: HandlerCommandMatcher, fn: AutocompleteHandlerCallback};
type MessageContextMenuHandler = {type:"MessageContextMenu", command: HandlerCommandMatcher, fn: MessageContextMenuHandlerCallback};
type UserContextMenuHandler = {type:"UserContextMenu", command: HandlerCommandMatcher, fn: UserContextMenuHandlerCallback};

type ButtonHandler<T extends {cmd: string}> = {type:"Button", fn: ButtonHandlerCallback<T>};
type SelectMenuHandler<T extends {cmd: string}> = {type:"SelectMenu", fn: SelectMenuHandlerCallback<T>};
type ModalSubmitHandler<T extends {cmd: string}> = {type:"ModalSubmit", fn: ModalSubmitHandlerCallback<T>};

type CommandBasedHandlers = CommandHandler | AutocompleteHandler | MessageContextMenuHandler | UserContextMenuHandler;
type CustomIdBasedHandler<T extends {cmd: string}> = ButtonHandler<T> | SelectMenuHandler<T> | ModalSubmitHandler<T>;
type Handler<T extends {cmd: string}> = CommandHandler | AutocompleteHandler | MessageContextMenuHandler | UserContextMenuHandler | ButtonHandler<T> | SelectMenuHandler<T> | ModalSubmitHandler<T>;

export async function loadCommands(){
    loadedCommands = [];
    let fileNames = (await readdir(__dirname + "/../../commands"))
    for (let fileName of fileNames) {
        if (!fileName.endsWith(".js")) continue;
        //WARNING: THIS WILL ONLY WORK IN COMMONJS. DO NOT SWITCH TO ESM
        delete require.cache[require.resolve(fileName)];
        let cmd = (require(fileName)).default;
        if(cmd instanceof SlashCommandBuilder){
            loadedCommands.push(cmd);
        }else{
            console.warn(`${fileName} does not export a valid command. If it is not a command, please move it outside of the commands directory in the future.`)
        }
    }
    loadedCommands = loadedCommands.sort((cmd1,cmd2)=>cmd1.name.localeCompare(cmd2.name));
    return loadedCommands;
}
function doesCommandMatchHandler(handler: CommandBasedHandlers, interaction: CommandInteraction | AutocompleteInteraction){
    let fullName = interaction.commandName;
    try{
        fullName += " " + interaction.options.getSubcommandGroup(true);
    }catch(e){}
    try{
        fullName += " " + interaction.options.getSubcommand(true);
    }catch(e){}
    if(typeof handler.command === "string"){
        return fullName === handler.command
    }else if(handler.command instanceof RegExp){
        return handler.command.test(fullName)
    }else if(Array.isArray(handler.command)){
        return handler.command.includes(fullName);
    }else{
        return handler.command(fullName);
    }
}
//handler for commands
client.on("interactionCreate", async interaction => {
    let timeStarted = Date.now();
    try{
        let entry;
        if(interaction.isMessageComponent()){
            entry = resolveEntry(interaction);
            if(!entry) return await interaction.reply({embeds:[Embeds.EXPIRED_COMPONENT], ephemeral: true});
            if(entry === "INVALID_USER") return await interaction.reply({embeds:[Embeds.INVALID_USER], ephemeral: true})
        }
        for(let handler of loadedHandlers){
            let status:HandlerResult;
            if(interaction.isCommand() && (handler.type === "Command") && doesCommandMatchHandler(handler, interaction)){
                status = await handler.fn(interaction);
            }
            if(interaction.isAutocomplete() && (handler.type === "Autocomplete") && doesCommandMatchHandler(handler, interaction)){
                status = await handler.fn(interaction);
            }
            if(interaction.isMessageContextMenu() && (handler.type === "MessageContextMenu") && (interaction.commandName === handler.command)){
                status = await handler.fn(interaction);
            }
            if(interaction.isUserContextMenu() && (handler.type === "UserContextMenu") && (interaction.commandName === handler.command)){
                status = await handler.fn(interaction);
            }
            if(interaction.isButton() && handler.type === "Button" && entry){
                status = await handler.fn(interaction, entry);
            }
            if(interaction.isSelectMenu() && handler.type === "SelectMenu" && entry){
                status = await handler.fn(interaction, entry);
            }
            if(interaction.isModalSubmit() && handler.type === "ModalSubmit" && entry){
                status = await handler.fn(interaction, entry);
            }
            
            //TODO: do something about command statuses
        }
    }catch(e){
        reject(interaction, e as Error, timeStarted);
    }
});
export function addCommandHandler(command: string | string[] | RegExp, fn: CommandHandlerCallback){
    loadedHandlers.push({type:"Command", command, fn});
}

export function addAutocompleteHandler(command: string, fn: AutocompleteHandlerCallback){
    loadedHandlers.push({type:"Autocomplete", command, fn});
}

export function addMessageContextMenuHandler(command: string, fn: MessageContextMenuHandlerCallback){
    loadedHandlers.push({type:"MessageContextMenu", command, fn});
}

export function addUserContextMenuHandler(command: string, fn: UserContextMenuHandlerCallback){
    loadedHandlers.push({type:"UserContextMenu", command, fn});
}

export function addButtonHandler<T extends {cmd: string}>(fn:ButtonHandlerCallback<T>){
    loadedHandlers.push({type:"Button", fn});
}

export function addSelectMenuHandler<T extends {cmd: string}>(fn:SelectMenuHandlerCallback<T>){
    loadedHandlers.push({type:"SelectMenu", fn});
}

export function addModalSubmitHandler<T extends {cmd: string}>(fn:ModalSubmitHandlerCallback<T>){
    loadedHandlers.push({type:"ModalSubmit", fn});
}