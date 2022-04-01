import dotenv from 'dotenv'
dotenv.config()

import { REST } from '@discordjs/rest'
import { ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIApplicationGuildCommandsJSONBody, Routes } from 'discord-api-types/v9'

const commands: RESTPostAPIApplicationCommandsJSONBody[] = [
    {
        name: 'verify',
        description: 'Verify your membership to gain access to the rest of the server',
        type: ApplicationCommandType.ChatInput,
        options: []
    }
]

const guildCommands: RESTPostAPIApplicationGuildCommandsJSONBody[] = [
    {
        name: 'massverify',
        description: 'Verify all members in the server',
        type: ApplicationCommandType.ChatInput,
        default_permission: false
    },
    {
        name: 'verifyuser',
        description: 'Verify a specific user',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'user',
                description: 'The user to verify',
                type: ApplicationCommandOptionType.User,
                required: true
            }
        ],
        default_permission: false
    }
]

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN!)

async function addCommands() {
    try {
        console.log('Adding commands...')

        // for (const c of commands) {
        // console.log(await rest.delete(Routes.applicationCommand(process.env.CLIENT_ID!, '955180189380382770')))
        console.log(await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.ESBOT_GUILD_ID!),
            {
                body: guildCommands
            }
        ))
        // }
        
        console.log("Updated commands")
    } catch(e) {
        console.error(e)
    }
}

addCommands()