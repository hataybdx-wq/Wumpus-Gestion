// ============================================================
//  Commande : ticket-claim  (alias: tclaim, prendre)
//  Prend en charge le ticket courant (staff uniquement).
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize, MessageFlags, PermissionFlagsBits,
} = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'ticket-claim',
  description: 'Prend en charge le ticket actuel (staff)',
  aliases: ['tclaim', 'prendre'],

  run: async (client, message, args, prefix) => {
    const ticketData = db.get(`ticket_channel_${message.channel.id}`)
    if (!ticketData) return message.reply('❌ Ce salon n\'est pas un ticket.')

    const cfg     = db.get(`tickets_${message.guild.id}`) || {}
    const isStaff = cfg.staffRoleId
      ? message.member.roles.cache.has(cfg.staffRoleId)
      : message.member.permissions.has(PermissionFlagsBits.ManageChannels)
    if (!isStaff) return message.reply('❌ Réservé au staff.')

    if (ticketData.claimedBy)
      return message.reply(`❌ Ce ticket a déjà été pris en charge par <@${ticketData.claimedBy}>.`)

    ticketData.claimedBy = message.author.id
    db.set(`ticket_channel_${message.channel.id}`, ticketData)

    const allOpen = db.get(`tickets_open_${message.guild.id}`) || {}
    if (allOpen[message.channel.id]) {
      allOpen[message.channel.id].claimedBy = message.author.id
      db.set(`tickets_open_${message.guild.id}`, allOpen)
    }

    try {
      const newName = message.channel.name.replace(
        /^([^-]+-[^-]+)/,
        `$1-[${message.member.displayName.toLowerCase().slice(0, 8)}]`
      )
      await message.channel.setName(newName)
    } catch {}

    const c = new ContainerBuilder().setAccentColor(0x2ECC71)
    c.addTextDisplayComponents(td => td.setContent(
      `✋ **<@${message.author.id}> a pris en charge ce ticket.**\n` +
      `-# Votre demande est entre de bonnes mains.`
    ))
    message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 })
  },
}
