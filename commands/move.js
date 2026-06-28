const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'move',
  description: 'Déplacer un membre dans un autre salon vocal',
  aliases: ['déplacer'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers)) return
    const target = message.mentions.members.first()
    if (!target) return message.reply(`Usage : \`${prefix}move @membre <id_vocal|nom>\``)
    if (!target.voice.channel) return message.reply('Le membre n\'est pas en vocal.')

    const arg = args.slice(1).join(' ')
    const ch = message.guild.channels.cache.get(arg) ||
      message.guild.channels.cache.find(c => c.isVoiceBased() && c.name.toLowerCase() === arg.toLowerCase())
    if (!ch) return message.reply('Salon vocal introuvable.')

    try {
      await target.voice.setChannel(ch, `Moved by ${message.author.tag}`)
      message.reply(`<@${target.id}> déplacé vers **${ch.name}**.`)
    } catch {
      message.reply('Impossible de déplacer.')
    }
  },
}
