import dotenv from 'dotenv'
dotenv.config()

import { ReactionCollector, TextChannel } from 'discord.js'
import { Client, Intents } from "discord.js"
import { getTeams } from './mongo.js'
export const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS ] })

client.on('error', console.error)

client.on('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}`)
    const esbotGuild = await client.guilds.fetch(process.env.ESBOT_GUILD_ID!)
    const rulesChannel = await esbotGuild.channels.fetch(process.env.RULES_CHANNEL_ID!) as TextChannel
    const rulesMessage = await rulesChannel.messages.fetch(process.env.RULES_MESSAGE_ID!)
    const reactionCollector = new ReactionCollector(rulesMessage)
    reactionCollector.on('collect', async (reaction, user) => {
        if (reaction.emoji.name === "✅") {
            const member = await esbotGuild.members.fetch(user.id)
            member.roles.add(process.env.MEMBER_ROLE_ID!)
        }
        reaction.users.remove(user.id)
    })

    const teamListChannel = await esbotGuild.channels.fetch(process.env.TEAM_LIST_CHANNEL_ID!) as TextChannel
    const teamListMessage = await teamListChannel.messages.fetch(process.env.TEAM_LIST_MESSAGE_ID!)
    
    setInterval(async () => {
        const teams = await getTeams()
        if (!teams) return console.log("Failed to fetch teams")
    
        teamListMessage.edit({
            embeds: [{
                "type": "rich",
                "title": `Team List`,
                "description": teams.map(t => t.name).join("\n"),
                "color": 0x006242
            }]
        })
    }, 300_000)
})

client.on('guildMemberAdd', async member => {
    const esbotGuild = await client.guilds.fetch(process.env.ESBOT_GUILD_ID!)
    const welcomeChannel = await esbotGuild.channels.fetch(process.env.WELCOME_CHANNEL_ID!) as TextChannel
	welcomeChannel.send(`Welcome <@${member.user.id}>! Please read the rules in <#${process.env.RULES_CHANNEL_ID}> and agree to them to gain access to the rest of the server`)
})

client.login(process.env.TOKEN)