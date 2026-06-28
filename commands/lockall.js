const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'lockall',
  description: 'Verrouille tous les salons pour @everyone',
  aliases: ['lock-all'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return
    if (args[0] !== 'confirm') {
      return message.reply(`⚠️ Cette action verrouille tous les salons. Confirme avec \`${prefix}lockall confirm\``)
    }

    const m = await message.reply('Verrouillage en cours...')
    let ok = 0
    for (const ch of message.guild.channels.cache.values()) {
      if (!ch.isTextBased() || !ch.permissionOverwrites) continue
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
      }).then(() => ok++).catch(() => {})
    }
    m.edit(`🔒 ${ok} salon(s) verrouillé(s).`)
  },
}
