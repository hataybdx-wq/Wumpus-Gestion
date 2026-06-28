const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'nick',
  description: 'Changer le surnom d\'un membre',
  aliases: ['nickname', 'surnom'],
  run: async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) return

    const target = message.mentions.members.first()
    if (!target) return message.reply(`Usage : \`!nick @membre [nouveau_surnom]\``)

    const newNick = args.slice(1).join(' ') || null

    try {
      await target.setNickname(newNick, `Changé par ${message.author.tag}`)
      message.reply(newNick ? `Surnom de <@${target.id}> changé en **${newNick}**.` : `Surnom de <@${target.id}> réinitialisé.`)
    } catch {
      message.reply('Impossible de changer le surnom (permissions insuffisantes).')
    }
  },
}
