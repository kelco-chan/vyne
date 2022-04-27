import { msToTime } from "basic-ms";
import discordModals from "discord-modals";
import { ActivitiesOptions, Client, Intents, MessageEmbed, TextChannel } from "discord.js";
import { Colors } from "../../assets/colors";
import { DISCORD_TOKEN, GUILD_LOGGING_CHANNEL } from "../../assets/config";

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});
discordModals(client);
client.once("ready", () => {
    console.log(`Connected to Discord, serving ${client.guilds.cache.size} guilds.`);
});

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
            .addField("Locale", guild.preferredLocale, true)
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
            .addField("Locale", guild.preferredLocale, true)
            .setFooter({text: `Total guild count: ${client.guilds.cache.size}`})
    ]})
})

client.login(DISCORD_TOKEN);
export default client;