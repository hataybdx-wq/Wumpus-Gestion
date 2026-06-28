module.exports = {
  name: 'vjoin',
  description: 'Te téléporte dans un salon vocal',
  aliases: ['join-voice'],
  run: async (client, message, args, prefix) => {
    if (!message.member.voice.channel) return message.reply('Tu dois déjà être en vocal pour te téléporter.')
    const arg = args.join(' ')
    const ch = message.guild.channels.cache.get(arg) ||
      message.guild.channels.cache.find(c => c.isVoiceBased() && c.name.toLowerCase().includes(arg.toLowerCase()))
    if (!ch) return message.reply(`Usage : \`${prefix}vjoin <id_ou_nom_vocal>\``)
    try {
      await message.member.voice.setChannel(ch)
      message.reply(`Téléporté dans **${ch.name}**`)
    } catch { message.reply('Impossible.') }
  },
}
