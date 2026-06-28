const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'delemoji',
  description: 'Supprime un emoji du serveur',
  aliases: ['delete-emoji', 'removeemoji'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) return
    const arg = args[0]
    if (!arg) return message.reply(`Usage : \`${prefix}delemoji <emoji>\``)

    const match = arg.match(/<a?:\w+:(\d+)>/)
    const id = match ? match[1] : arg
    const emoji = message.guild.emojis.cache.get(id)
    if (!emoji) return message.reply('Emoji non trouvé.')

    try {
      await emoji.delete()
      message.reply(`Emoji supprimé : \`:${emoji.name}:\``)
    } catch { message.reply('Impossible.') }
  },
}
