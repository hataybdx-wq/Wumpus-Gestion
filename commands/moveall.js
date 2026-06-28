const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'moveall',
  description: 'Déplace tous les membres d\'un vocal vers un autre',
  aliases: ['move-all'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers)) return
    const from = message.member.voice.channel
    if (!from) return message.reply('Tu dois être dans un vocal source.')

    const arg = args.join(' ')
    const to = message.guild.channels.cache.get(arg) ||
      message.guild.channels.cache.find(c => c.isVoiceBased() && c.name.toLowerCase() === arg.toLowerCase())
    if (!to) return message.reply(`Usage : \`${prefix}moveall <id_ou_nom_vocal>\``)

    let count = 0
    for (const m of from.members.values()) {
      await m.voice.setChannel(to).then(() => count++).catch(() => {})
    }
    message.reply(`${count} membre(s) déplacé(s) vers **${to.name}**.`)
  },
}
