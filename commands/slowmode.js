// ============================================================
//  Commande : slowmode — Ralentir un salon
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const ms = require('ms')

module.exports = {
  name: 'slowmode',
  description: 'Définir un mode lent dans le salon actuel',
  aliases: ['sm', 'slow'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return

    const arg = args[0]
    if (!arg || arg === 'off' || arg === '0') {
      await message.channel.setRateLimitPerUser(0, `Slowmode désactivé par ${message.author.tag}`).catch(() => false)
      return message.reply('Slowmode désactivé.')
    }

    // Accepter "5" (secondes), "5m", "1h", etc.
    let seconds = parseInt(arg)
    if (isNaN(seconds) || arg.match(/[a-z]/i)) {
      const msVal = ms(arg)
      if (!msVal) return message.reply(`Usage : \`${prefix}slowmode <durée>\` (ex: \`5\`, \`10s\`, \`1m\`, \`5m\`, \`1h\`, \`6h\`)`)
      seconds = Math.floor(msVal / 1000)
    }

    // Max 6 heures (limite Discord)
    if (seconds > 21600) return message.reply('Le slowmode maximum est de **6 heures**.')
    if (seconds < 0) return message.reply('La durée doit être positive.')

    await message.channel.setRateLimitPerUser(seconds, `Slowmode défini par ${message.author.tag}`).catch(() => false)

    const human = seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h`
    return message.reply(`Slowmode défini sur **${human}** dans ce salon.`)
  },
}
