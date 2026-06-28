const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'clone',
  description: 'Cloner un salon (salon mentionné ou actuel)',
  aliases: ['clone-channel'],
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return
    const ch = message.mentions.channels.first() || message.channel
    try {
      const cloned = await ch.clone()
      message.reply(`Salon cloné : <#${cloned.id}>`)
    } catch {
      message.reply('Impossible de cloner.')
    }
  },
}
