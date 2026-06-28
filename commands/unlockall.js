const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'unlockall',
  description: 'Déverrouille tous les salons',
  aliases: ['unlock-all'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return
    if (args[0] !== 'confirm') {
      return message.reply(`⚠️ Confirme avec \`${prefix}unlockall confirm\``)
    }

    const m = await message.reply('Déverrouillage en cours...')
    let ok = 0
    for (const ch of message.guild.channels.cache.values()) {
      if (!ch.isTextBased() || !ch.permissionOverwrites) continue
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null,
      }).then(() => ok++).catch(() => {})
    }
    m.edit(`🔓 ${ok} salon(s) déverrouillé(s).`)
  },
}
