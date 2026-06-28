const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'rename',
  description: 'Renommer le salon actuel',
  aliases: ['renommer'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return
    const name = args.join('-').toLowerCase()
    if (!name) return message.reply(`Usage : \`${prefix}rename <nouveau_nom>\``)
    try {
      const old = message.channel.name
      await message.channel.setName(name)
      message.reply(`Salon renommé : **${old}** → **${name}**`)
    } catch { message.reply('Impossible de renommer.') }
  },
}
