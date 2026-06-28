// ============================================================
//  Commande : prevnames (slash + préfixe)
//  Historique des anciens pseudos — prevnames.json
//
//  Stockage séparé pour :
//    - Performance optimale
//    - Partage entre bot principal et bots privés
//    - Backup facile
// ============================================================

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const prevnamesDB = require('../utils/prevnamesDB')

// ── Labels d'affichage ─────────────────────────────────────
const TYPE_LABEL = {
  username: '@pseudo',
  nickname: 'Surnom serveur',
}

// ── Construire l'embed ─────────────────────────────────────
function buildEmbed(guildId, userId, username, avatarURL, list) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
    .setTitle(`Historique des pseudos — ${username}`)
    .setColor(0xFF0000)
    .setThumbnail(avatarURL)
    .setFooter({ text: 'Made by Wumpus' })

  if (list.length === 0) {
    embed.setDescription(
      'Aucun changement enregistré.\n' +
      'Les changements sont enregistrés automatiquement dès maintenant.'
    )
    return embed
  }

  const entries = [...list].reverse().slice(0, 25)

  // Grouper par type pour l'affichage
  const byType = { username: [], nickname: [] }
  entries.forEach(e => {
    if (byType[e.type]) byType[e.type].push(e)
  })

  const fields = []

  for (const [type, label] of Object.entries(TYPE_LABEL)) {
    const items = byType[type]
    if (!items || items.length === 0) continue
    fields.push({
      name: label,
      value: items.map(e =>
        `\`${e.name}\` — <t:${Math.floor(e.savedAt / 1000)}:R>`
      ).join('\n'),
      inline: false,
    })
  }

  if (fields.length > 0) {
    embed.addFields(fields)
  } else {
    embed.setDescription('Aucun changement enregistré.')
  }

  embed.setFooter({ text: `${list.length} changement${list.length > 1 ? 's' : ''} total` })
  embed.setTimestamp()

  return embed
}
      inline: false,
    })
  }

  if (fields.length > 0) embed.addFields(fields)
  embed.setFooter({ text: `${list.length} entrée(s) au total` }).setTimestamp()
  return embed
}

// ── Module ─────────────────────────────────────────────────
module.exports = {
  name: 'prevnames',
  description: 'Voir l\'historique des pseudos d\'un membre',

  slashData: new SlashCommandBuilder()
    .setName('prevnames')
    .setDescription('Voir les anciens pseudos d\'un membre')
    .addUserOption(o =>
      o.setName('membre')
       .setDescription('Membre à inspecter (vous-même si vide)')
       .setRequired(false)
    ),

  async handleInteraction(interaction) {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'prevnames') return
    await interaction.deferReply()

    const target = interaction.options.getUser('membre') || interaction.user
    const guildId = interaction.guild.id
    const list = prevnamesDB.getPrevNames(guildId, target.id)
    const embed = buildEmbed(
      guildId,
      target.id,
      target.username,
      target.displayAvatarURL({ dynamic: true }),
      list
    )
    return interaction.editReply({ embeds: [embed] })
  },

  run: async (client, message, args, prefix) => {
    const tgt = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member
    const guildId = message.guild.id
    const list = prevnamesDB.getPrevNames(guildId, tgt.id)
    const embed = buildEmbed(
      guildId,
      tgt.id,
      tgt.user.username,
      tgt.user.displayAvatarURL({ dynamic: true }),
      list
    )
    return message.reply({ embeds: [embed] })
  },
}
