// ============================================================
//  Commande : lock — Verrouiller un salon
//  v14 : PermissionFlagsBits (enum), plus de strings
// ============================================================

const { PermissionFlagsBits } = require('discord.js')

module.exports = {
  name: 'lock',
  description: 'Verrouille le salon (plus personne ne peut parler)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return

    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false,
      Speak:        false,
      AddReactions: false,
    }).catch(() => false)

    message.reply('🔒 Le salon a bien été **fermé** !')
  },
}
