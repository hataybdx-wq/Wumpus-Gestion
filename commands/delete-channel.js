const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'delchannel',
  description: 'Supprimer le salon actuel ou mentionné (avec confirmation)',
  aliases: ['delete-channel', 'rmchannel'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return
    const ch = message.mentions.channels.first() || message.channel

    const confirm = await message.reply(`⚠️ Confirme la suppression de <#${ch.id}> avec \`${prefix}delchannel confirm ${ch.id}\` dans 30s`)
    if (args[0] !== 'confirm' || args[1] !== ch.id) return

    try {
      await ch.delete(`Par ${message.author.tag}`)
    } catch {
      message.channel.send('Impossible de supprimer.').catch(() => {})
    }
  },
}
