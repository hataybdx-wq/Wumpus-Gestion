const { PermissionFlagsBits } = require('discord.js')

module.exports = {
  name: 'leave',
  description: 'Fait quitter le bot un serveur (owner uniquement)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return
    if (!args[0]) return message.reply('❌ Veuillez fournir l\'ID du serveur !')

    const guild = client.guilds.cache.get(args[0])
    if (!guild) return message.reply('❌ Je ne suis pas sur ce serveur !')

    await message.reply('✅ Serveur quitté !')
    await guild.leave().catch(() => false)
  },
}
