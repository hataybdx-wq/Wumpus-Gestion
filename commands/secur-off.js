const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'secur-off',
  description: 'Désactive toutes les protections actives',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    if (!db.get(`secur_${message.guild.id}`))
      return message.channel.send('❌ La sécurité est déjà désactivée.')

    db.set(`secur_${message.guild.id}`, null)
    message.channel.send('✅ La sécurité globale est maintenant **désactivée**.')
  },
}
