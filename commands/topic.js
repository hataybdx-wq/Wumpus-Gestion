const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'topic',
  description: 'Changer le sujet du salon',
  aliases: ['sujet'],
  run: async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return

    const topic = args.join(' ')
    if (!topic) {
      await message.channel.setTopic(null).catch(() => false)
      return message.reply('Sujet supprimé.')
    }
    await message.channel.setTopic(topic).catch(() => false)
    message.reply(`Sujet défini : **${topic}**`)
  },
}
