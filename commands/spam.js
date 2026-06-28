const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'spam',
  description: 'Sanctionne le spam (>4 messages en 7 secondes)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return
    if (!args[0]) return message.reply('❌ Veuillez indiquer `on` ou `off` !')
    const key = `spam_${message.guild.id}`
    if (args[0] === 'on') {
      if (db.get(key) === true) return message.channel.send(`❌ L'anti-spam est déjà activé.`)
      db.set(key, true)
      message.channel.send(`✅ L'anti-spam est maintenant **activé**.`)
    } else if (args[0] === 'off') {
      if (!db.get(key)) return message.channel.send(`❌ L'anti-spam est déjà désactivé.`)
      db.set(key, null)
      message.channel.send(`✅ L'anti-spam est maintenant **désactivé**.`)
    } else {
      message.reply('❌ Veuillez indiquer `on` ou `off` !')
    }
  },
}
