import { stripIndents } from "common-tags";
import {ActivitiesOptions, Activity, Client, Intents, Interaction, Message, MessageEmbed, TextChannel, VoiceChannel} from "discord.js";
import { DISCORD_TOKEN, GUILD_LOGGING_CHANNEL } from "../assets/config";
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});
client.once("ready", async () => {
    console.log(`Connected to Discord and querying ${client.guilds.cache.size} guilds.`);
    let guildInfos = [];
    for(const [guildId, g] of client.guilds.cache){
        let guild = await g.fetch();
        guildInfos.push(stripIndents`
        Name: ${guild.name}
        Member Count: ${guild.memberCount}
        Guild Created: ${guild.createdAt}
        Bot Joined: ${guild.joinedAt}
        `)
    }
    console.log(guildInfos.join("\n\n"))
});
client.login(DISCORD_TOKEN);