import dotenv from 'dotenv'
dotenv.config()

export type TeamRoleData = {
    teamName: string,
    teamId: string,
    roleId: string,
    schoolName: string
}

type DbTeam = {
    id: string,
    teamName: string,
    userId: string,
    members: DbMember[],
    createdAt: Date
}

type DbMember = {
    id: number,
    firstName: string,
    lastName: string,
    discordUsername: string,
    grade: string
}

import { Collection, MongoClient } from 'mongodb'
const dbClient = new MongoClient(process.env.DATABASE_URL!)
console.log('connecting...')
await dbClient.connect()
console.log('connected')
const db = dbClient.db('esbot')
const teamsCollection: Collection<DbTeam> = db.collection('teams')
const usersCollection = db.collection('users')

import { Guild, ReactionCollector, TextChannel, User } from 'discord.js'
import { Client, Intents } from "discord.js"
export const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS ] })

import { getTeamRolesData, setTeamRolesData } from './teamRolesData.js'

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
    await fetchTeams(esbotGuild)
    setInterval(() => {
        fetchTeams(esbotGuild)
    }, 300000)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand())
        return
    
    if (interaction.commandName === "verify") {
        const esbotGuild = await client.guilds.fetch(process.env.ESBOT_GUILD_ID!)
        verify(interaction.user, esbotGuild).catch((e) => {
            console.dir(e)
            if (e.message == `Player not found`) {
                interaction.reply("Your discord tag couldnt be found in our database, please check if it was input into the registration site properly. Remember, you must include the 4 digits after the hash ex. `Bomjoe#9924`")
            } else {
                interaction.reply("Verification Failed. DM a board member to be verified ")
            }
        })
    }
})

client.on('guildMemberAdd', async member => {
    const esbotGuild = await client.guilds.fetch(process.env.ESBOT_GUILD_ID!)
    const welcomeChannel = await esbotGuild.channels.fetch(process.env.WELCOME_CHANNEL_ID!) as TextChannel

    verify(member.user, esbotGuild).then(() => {
        welcomeChannel.send(`Welcome <@${member.user.id}>! Please read the rules in <#${process.env.RULES_CHANNEL_ID}> and agree to them to gain access to the rest of the server`)
    }).catch((e) => {
        welcomeChannel.send(`Welcome <@${member.user.id}>! Please read the rules in <#${process.env.RULES_CHANNEL_ID}> and agree to them to gain access to the rest of the server`)
        if (e.message == `Player not found`) {
            member.user.send("Your discord tag couldnt be found in our database, please check if it was input into the registration site properly. Remember, you must include the 4 digits after the hash ex. `Bomjoe#9924`.")
        } else {
            member.user.send("Verification Failed. DM a board member to be verified ")
        }
    })
})

client.login(process.env.TOKEN)

async function fetchTeams(guild: Guild) {
    const dbTeams = await teamsCollection.find({}).toArray()
    const withSchools: (DbTeam & { schoolName: string })[] = await Promise.all(dbTeams.map(async t => {
        const user = await usersCollection.findOne({ id: t.userId })
        return {
            ...t,
            schoolName: user?.schoolName ?? ""
        }
    }))
    const savedTeams = getTeamRolesData()
    const newTeamList: TeamRoleData[] = []
    for (const t of savedTeams) {
        const dbTeam = withSchools.find(x => x.id === t.teamId)
        if (!dbTeam) {
            const role = await guild.roles.fetch(t.roleId)
            await role?.delete()
        } else {
            newTeamList.push({
                teamId: dbTeam.id,
                teamName: dbTeam.teamName,
                schoolName: dbTeam.schoolName,
                roleId: t.roleId
            })
        }
    }

    for (const t of withSchools) {
        const savedTeam = savedTeams.find(x => x.teamId === t.id)
        if (!savedTeam) {
            const newRole = await guild.roles.create({
                name: t.teamName
            })

            newTeamList.push({
                teamId: t.id,
                teamName: t.teamName,
                schoolName: t.schoolName,
                roleId: newRole.id
            })
        }
    }

    setTeamRolesData(newTeamList)
}

async function verify(user: User, guild: Guild) {
    const tag = user.username + "#" + user.discriminator
    const dbTeam = await getTeamFromTag(tag)
    if (!dbTeam)
        throw new Error(`Player not found`)
    const player = dbTeam.members.find(x => x.discordUsername === tag)
    const member = await guild.members.fetch(user.id)
    member.setNickname(`${player?.firstName} ${player?.lastName} [${dbTeam.teamName}]`)
    
    const teamRole = getTeamRolesData().find(x => x.teamId === dbTeam.id)
    if (!teamRole)
        throw new Error("Role data not found")

    member.roles.add(teamRole.roleId)
}

async function getTeamFromTag(tag: string): Promise<DbTeam | null> {
    console.log(tag)
    return teamsCollection.findOne({ "members.discordUsername": tag })
}