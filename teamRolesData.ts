import fs from 'fs'
import { TeamRoleData } from '.'

let teamRolesData: TeamRoleData[] = JSON.parse(fs.readFileSync('teamRoles.json', 'utf-8'))

export function getTeamRolesData() {
    return teamRolesData
}

export function setTeamRolesData(value: TeamRoleData[]) {
    fs.writeFileSync('teamRoles.json', JSON.stringify(value, null, '\t'))
    teamRolesData = value
    return teamRolesData
}