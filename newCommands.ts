import dotenv from 'dotenv'
dotenv.config()

import { REST } from '@discordjs/rest'
import { ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v9'

const commands: RESTPostAPIApplicationCommandsJSONBody[] = [
    {
        name: 'verify',
        description: 'Verify your membership to gain access to the rest of the server',
        type: ApplicationCommandType.ChatInput,
        options: []
    }
]

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN!)

async function addCommands() {
    try {
        console.log('Adding commands...')

        // for (const c of commands) {
        // console.log(await rest.delete(Routes.applicationCommand(process.env.CLIENT_ID!, '955180189380382770')))
        console.log(await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            {
                body: commands
            }
        ))
        // }
        
        console.log("Updated commands")
    } catch(e) {
        console.error(e)
    }
}

addCommands()