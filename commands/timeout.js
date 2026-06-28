const { PermissionFlagsBits } = require('discord.js')
const ms = require('ms')

module.exports = {
  name: 'timeout',
  description: 'Timeout Discord un membre (alias de mute)',
  aliases: ['to'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return
    const target = message.mentions.members.first()
    if (!target) return message.reply(`Usage : \`${prefix}timeout @membre <durée> [raison]\``)

    const duration = args[1]
    const reason = args.slice(2).join(' ') || 'Aucune raison'
    const msValue = ms(duration)
    if (!msValue || msValue > 2419200000) return message.reply('Durée invalide (max 28j)')

    try {
      await target.timeout(msValue, `${reason} — par ${message.author.tag}`)
      message.reply(`⏱️ <@${target.id}> timeout pour **${duration}**.\n**Raison :** ${reason}`)
    } catch {
      message.reply('Impossible (permissions manquantes).')
    }
  },
}
