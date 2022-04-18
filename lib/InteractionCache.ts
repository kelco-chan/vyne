import { ModalSubmitInteraction } from "discord-modals";
import { ButtonInteraction, Interaction, MessageComponentInteraction, SelectMenuInteraction, User } from "discord.js";
import { nanoid } from "nanoid";
import { CUSTOMID_CACHE_DEFAULT_LIFETIME, CUSTOMID_SWEEP_INTERVAL } from "../assets/config";

export type CustomIdEntry<T> = {
    /**
     * Timestamp in which this entry roughly should expire
     */
    expires: number
    /**
     * Intended users of this interaction. Add `all` to allow anyone to use it
     */
    intendedUsers: string[]
    /**
     * Allow repeated resolution of this customId (ie does this component need to be used twice)
     */
    allowRepeatedUsage: boolean
    /**
     * Custom data of choice
     */
    data:  {cmd:string} & T
}
type CacheOptions = {
    /**
     * Duration to store entry for, in minutes. Defaults to `CONFIG.CUSTOMID_CACHE_TIME`
     */
    duration?: number,
    /**
     * List of user ids to allow this interaction for. Defaults to `interaction.user.id`
     */
    users: string[]
    /**
     * Allow repeated resolution of this customId. Defaults to false
     */
     allowRepeatedUsage?: boolean
}
let entryCache:Map<string, CustomIdEntry<any>> = new Map();
export function cache<T extends {cmd: string}>(data: T, options: CacheOptions){
    let key = nanoid();
    entryCache.set(key, {
        expires: Date.now() + (options?.duration || CUSTOMID_CACHE_DEFAULT_LIFETIME),
        intendedUsers: options.users,
        allowRepeatedUsage: options?.allowRepeatedUsage || false,
        data
    });
    return key;
}

export function resolveEntry<T extends {cmd: string}>(interaction: ButtonInteraction | SelectMenuInteraction | ModalSubmitInteraction): CustomIdEntry<T> | undefined | "INVALID_USER" {
    let entry = entryCache.get(interaction.customId);
    if(!entry) return undefined;
    if(!(entry.intendedUsers.includes(interaction.user.id) || entry.intendedUsers.includes("all"))){
        return "INVALID_USER";
    }
    if(!entry.allowRepeatedUsage){
        entryCache.delete(interaction.customId);
    }
    return entry;
}

setInterval(() => {
    let time = Date.now();
    let numberCleared = 0;
    for(let [key, value] of entryCache){
        if(value.expires > time){
            entryCache.delete(key);
            numberCleared += 1;
        }
    }
}, CUSTOMID_SWEEP_INTERVAL)