const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'hide',
  description: 'Cache le salon actuel pour @everyone',
  aliases: ['cacher'],
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      ViewChannel: false,
    }).catch(() => false)
    message.reply('👁️ Salon caché pour @everyone.')
  },
}
