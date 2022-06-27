import { msToTime } from "basic-ms";
import { ActivitiesOptions, Client, Intents, Message, MessageAttachment, MessageEmbed, TextChannel } from "discord.js";
import { Colors } from "../../assets/colors";
import { DEV_EVAL_CHANNEL_ID, DEV_USER_ID, DISCORD_TOKEN, GUILD_LOGGING_CHANNEL, LE_CONSOLE_BOT_TOKEN, NODE_ENV, PROD_EVAL_CHANNEL_ID } from "../../assets/config";

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});
export const leConsoleClient = new Client({intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});

client.once("ready", () => {
    console.log(`Connected to Discord, serving ${client.guilds.cache.size} guilds.`);
});
leConsoleClient.once("ready", async () => console.log("Le Console connected to Discord"));

setInterval(() => {
    const activities:ActivitiesOptions[] = [{name : "with pomodoro timers", type:"PLAYING"}, {name:"you study", type:"WATCHING"}, {name:`over ${client.guilds.cache.size} servers`, type:"WATCHING"}]
    client.user?.setPresence({status:"online", afk:false, activities:[
        activities[Math.floor(Math.random() * activities.length)]
    ]})
}, 100_000);

client.on("guildCreate", async function(guild){
    let channel = (await client.channels.fetch(GUILD_LOGGING_CHANNEL)) as (TextChannel | null);
    channel && channel.send({embeds:[
        new MessageEmbed()
            .setColor(Colors.success)
            .setTitle(`Joined guild ${guild.name}`)
            .addField("Members", `${guild.memberCount || guild.approximateMemberCount}`, true)
            .addField("Created", `${guild.createdAt.toLocaleDateString()}`, true)
            .setFooter({text: `Total guild count: ${client.guilds.cache.size}`})
    ]})
})
client.on("guildDelete", async function(guild){
    let channel = (await client.channels.fetch(GUILD_LOGGING_CHANNEL)) as (TextChannel | null);
    channel && channel.send({embeds:[
        new MessageEmbed()
            .setColor(Colors.error)
            .setTitle(`Left guild ${guild.name}`)
            .addField("Guild ID", guild.id)
            .addField("Members", `${guild.memberCount || guild.approximateMemberCount}`, true)
            .addField("Server Created", `${guild.createdAt.toLocaleDateString()}`, true)
            .addField("Joined", `${msToTime(Date.now() - guild.createdTimestamp)} ago`, true)
            .setFooter({text: `Total guild count: ${client.guilds.cache.size}`})
    ]})
})
client.login(DISCORD_TOKEN);
leConsoleClient.login(LE_CONSOLE_BOT_TOKEN);
export default client;