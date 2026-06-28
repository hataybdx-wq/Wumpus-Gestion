const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'dcall',
  description: 'Déconnecte tout le monde d\'un vocal',
  aliases: ['disconnect-all', 'kickall'],
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers)) return
    const ch = message.member.voice.channel
    if (!ch) return message.reply('Tu dois être dans le vocal à vider.')

    let count = 0
    for (const m of ch.members.values()) {
      await m.voice.disconnect().then(() => count++).catch(() => {})
    }
    message.reply(`${count} membre(s) déconnecté(s) de **${ch.name}**.`)
  },
}
