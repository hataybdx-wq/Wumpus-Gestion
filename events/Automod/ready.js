// ============================================================
//  Événement : ready (Automod) — Rotation du statut
//  discord.js v14 : ActivityType.Streaming (enum, non string)
// ============================================================

const db = require('quick.db')
const { ActivityType } = require('discord.js')

module.exports = async (client) => {
  setInterval(() => {
    const status = db.get('status')
    if (!status?.length) return

    const idx         = Math.floor(Math.random() * status.length)
    const newActivity = status[idx]

    // v14 : type est ActivityType.Streaming, pas la string 'STREAMING'
    client.user.setActivity(newActivity, {
      type: ActivityType.Streaming,
      url:  'https://www.twitch.tv/discord',
    })
  }, 4000)
}
