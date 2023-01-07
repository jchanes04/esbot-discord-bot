import dotenv from 'dotenv'
dotenv.config()

import { Guild, MessageEmbed, ReactionCollector, TextChannel, User } from 'discord.js'
import { Client, Intents } from "discord.js"
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
})

client.on('guildMemberAdd', async member => {
    const esbotGuild = await client.guilds.fetch(process.env.ESBOT_GUILD_ID!)
    const welcomeChannel = await esbotGuild.channels.fetch(process.env.WELCOME_CHANNEL_ID!) as TextChannel
	welcomeChannel.send(`Welcome <@${member.user.id}>! Please read the rules in <#${process.env.RULES_CHANNEL_ID}> and agree to them to gain access to the rest of the server`)
})

client.login(process.env.TOKEN)