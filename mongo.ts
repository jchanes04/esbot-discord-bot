export type Team = {
    id: string,
    name: string,
    userId: string,
    members: Member[],
    createdAt: Date
}

export type Grade = "8th and under" | "9th" | "10th" | "11th" | "12th"

export type Member = {
    id: number,
    firstName: string,
    lastName: string,
    discordUsername: string,
    grade: Grade
}

import { Collection, MongoClient } from 'mongodb'
import dotenv from 'dotenv';
dotenv.config()

const collections: {
    teams?: Collection<Team>
} = {}
const client = new MongoClient(process.env.DATABASE_URL!, { directConnection: true })

async function init(): Promise<{
    teams: Collection<Team>
}> {
    try {
        console.log("Connecting...")
        await client.connect()

        const db = client.db('esbot')
        console.log('Connected')
        return {
            teams: db.collection('teams')
        }
    } catch (e) {
        console.log(e)
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 10000);
        });
        return init();
    }
}

const { teams } = await init()

export async function getTeams() {
    const fetchedTeams = teams.find({})
    if (fetchedTeams) {
        return fetchedTeams.toArray()
    } else {
        return null
    }
}
