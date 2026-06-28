const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'antiguildupdate',
  description: 'Bloque les modifications du serveur (nom, icône)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return
    if (!args[0]) return message.reply('❌ Veuillez indiquer `on` ou `off` !')
    const key = `antiguildupdate_${message.guild.id}`
    if (args[0] === 'on') {
      if (db.get(key) === true) return message.channel.send(`❌ L'anti-guild-update est déjà activé.`)
      db.set(key, true)
      message.channel.send(`✅ L'anti-guild-update est maintenant **activé**.`)
    } else if (args[0] === 'off') {
      if (!db.get(key)) return message.channel.send(`❌ L'anti-guild-update est déjà désactivé.`)
      db.set(key, null)
      message.channel.send(`✅ L'anti-guild-update est maintenant **désactivé**.`)
    } else {
      message.reply('❌ Veuillez indiquer `on` ou `off` !')
    }
  },
}
