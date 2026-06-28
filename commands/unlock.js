// ============================================================
//  Commande : unlock — Déverrouiller un salon
// ============================================================

const { PermissionFlagsBits } = require('discord.js')

module.exports = {
  name: 'unlock',
  description: 'Déverrouille le salon',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return

    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: null,
      Speak:        null,
      AddReactions: null,
    }).catch(() => false)

    message.reply('🔓 Le salon a bien été **rouvert** !')
  },
}
