module.exports = {
  name: 'firstmessage',
  description: 'Lien vers le premier message d\'un salon',
  aliases: ['first-msg', 'fm'],
  run: async (client, message, args) => {
    const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel
    if (!ch.isTextBased()) return message.reply('Salon non textuel.')

    const first = await ch.messages.fetch({ after: '0', limit: 1 }).catch(() => null)
    if (!first || first.size === 0) return message.reply('Aucun message trouvé.')

    const msg = first.first()
    message.reply(`Premier message de <#${ch.id}> : ${msg.url}`)
  },
}
