// ============================================================
//  Commande : serveurinfo — Informations sur le serveur
//  v14 : guild.createdTimestamp (ms), EmbedBuilder
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'serveurinfo',
  description: 'Informations sur le serveur',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const g = message.guild

    const afk   = g.afkChannelId   ? `<#${g.afkChannelId}>`   : 'Aucun'
    const rules = g.rulesChannelId  ? `<#${g.rulesChannelId}>` : 'Aucun'
    const desc  = g.description     ?? 'Aucune'

    const verif = {
      0: 'Aucune', 1: 'Faible', 2: 'Moyenne', 3: 'Élevée', 4: 'Très élevée',
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setColor(0xFF0000)
      .setTitle(`Informations — ${g.name}`)
      .setThumbnail(g.iconURL({ dynamic: true }) ?? null)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: '🏷️ Nom',              value: g.name,                                                    inline: true },
        { name: '👑 Propriétaire',      value: `<@${g.ownerId}>`,                                        inline: true },
        { name: '🆔 ID',               value: g.id,                                                      inline: true },
        { name: '📝 Description',       value: desc,                                                      inline: false },
        { name: '💎 Boosts',            value: `${g.premiumSubscriptionCount} (Niveau ${g.premiumTier})`,inline: true },
        { name: '🔒 Vérification',      value: verif[g.verificationLevel] ?? 'Inconnue',                 inline: true },
        { name: '📅 Créé le',           value: `<t:${Math.floor(g.createdTimestamp / 1000)}:F>`,          inline: false },
        { name: '💬 Salons',            value: `${g.channels.cache.size}`,                               inline: true },
        { name: '🎭 Rôles',             value: `${g.roles.cache.size}`,                                  inline: true },
        { name: '😀 Emojis',            value: `${g.emojis.cache.size}`,                                 inline: true },
        { name: '👥 Membres',           value: `${g.memberCount}`,                                       inline: true },
        { name: '💤 AFK',              value: afk,                                                        inline: true },
        { name: '📜 Règles',            value: rules,                                                     inline: true },
      )
      .setTimestamp()
      .setFooter({ text: `Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })

    message.reply({ embeds: [embed] })
  },
}
