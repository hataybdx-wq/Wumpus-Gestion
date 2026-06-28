const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'prefix',
  description: 'Change le préfixe du bot sur ce serveur',
  aliases: ['setprefix'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return
    if (!args[0]) return message.reply('❌ Veuillez indiquer un préfixe !').catch(() => false)

    db.set(`${message.guild.id}.prefix`, args[0])
    message.reply(`✅ Préfixe changé de \`${prefix}\` à \`${args[0]}\` !`).catch(() => false)
  },
}
