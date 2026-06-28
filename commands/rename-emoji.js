const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'renameemoji',
  description: 'Renommer un emoji du serveur',
  aliases: ['rename-emoji'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) return
    const arg = args[0]
    const newName = args[1]
    if (!arg || !newName) return message.reply(`Usage : \`${prefix}renameemoji <emoji> <nouveau_nom>\``)

    const match = arg.match(/<a?:\w+:(\d+)>/)
    const id = match ? match[1] : arg
    const emoji = message.guild.emojis.cache.get(id)
    if (!emoji) return message.reply('Emoji non trouvé.')

    const old = emoji.name
    try {
      await emoji.setName(newName)
      message.reply(`Emoji \`:${old}:\` → \`:${newName}:\``)
    } catch { message.reply('Impossible.') }
  },
}
