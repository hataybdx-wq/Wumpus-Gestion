const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'unhide',
  description: 'Rend le salon visible pour @everyone',
  aliases: ['show', 'montrer'],
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      ViewChannel: null,
    }).catch(() => false)
    message.reply('👁️ Salon à nouveau visible.')
  },
}
