// ============================================================
//  Événement : guildCreate — Message de bienvenue premium
//  Electron Gestion
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

const SUPPORT_SERVER = 'https://discord.gg/n64X38d8'
const COLOR = 0xFF0000

module.exports = async (client, guild) => {
  console.log(`[BOT] Rejoint : ${guild.name} (${guild.id}) — ${guild.memberCount} membres`)

  // Init préfixe par défaut
  if (!db.get(`${guild.id}.prefix`)) {
    db.set(`${guild.id}.prefix`, process.env.prefix || '!')
  }

  const prefix = db.get(`${guild.id}.prefix`) || process.env.prefix || '!'

  // Trouver un salon où écrire
  const channel = guild.channels.cache
    .filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    )
    .sort((a, b) => a.rawPosition - b.rawPosition)
    .first()

  if (!channel) return

  const botInvite = 'https://discord.com/oauth2/authorize?client_id=1494736949985021952&permissions=8&integration_type=0&scope=bot'
  const botAvatar = client.user.displayAvatarURL({ size: 256, extension: 'png' })

  const container = new ContainerBuilder().setAccentColor(COLOR)

  // Header avec thumbnail du bot
  container.addSectionComponents(sec => sec
    .addTextDisplayComponents(td => td.setContent(
      `## Merci de votre confiance\n` +
      `### ${client.user.username} vient d'arriver\n` +
      `-# Sur **${guild.name}** · ${guild.memberCount} membre${guild.memberCount > 1 ? 's' : ''}`
    ))
    .setThumbnailAccessory(thumb => thumb.setURL(botAvatar))
  )

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Section : Démarrage en 30 secondes
  container.addTextDisplayComponents(td => td.setContent(
    `### Démarrage rapide\n` +
    `Commencez par la commande la plus utile :\n\n` +
    `**\`${prefix}dashboard\`** · Tableau de bord central\n` +
    `-# Toute la configuration du serveur en un seul endroit, avec boutons d'action rapide.`
  ))

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  // Section : Configurations essentielles
  container.addTextDisplayComponents(td => td.setContent(
    `### Configurations essentielles\n` +
    `\`${prefix}secur-max\` — Activer toutes les protections\n` +
    `\`${prefix}setup-logs\` — Créer les salons de logs\n` +
    `\`${prefix}ticket-quick\` — Système de tickets en 1 commande\n` +
    `\`${prefix}invite-setup on\` — Tracker les invitations\n` +
    `\`${prefix}autorole\` — Auto-rôles à l'arrivée`
  ))

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  // Section : Aide
  container.addTextDisplayComponents(td => td.setContent(
    `### Aide & Informations\n` +
    `\`${prefix}help\` — Menu d'aide interactif\n` +
    `\`${prefix}helpall\` — Liste complète des commandes\n` +
    `\`${prefix}prefix <nouveau>\` — Changer le préfixe (actuel : \`${prefix}\`)\n\n` +
    `**Permissions** · Donnez-moi le rôle **Administrateur** pour un fonctionnement optimal.`
  ))

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Boutons d'action
  container.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setLabel('Serveur de support')
      .setURL(SUPPORT_SERVER)
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel('Inviter le bot ailleurs')
      .setURL(botInvite)
      .setStyle(ButtonStyle.Link),
  ))

  container.addTextDisplayComponents(td => td.setContent(
    `-# ${client.user.username} · Préfixe \`${prefix}\` · discord.gg/n64X38d8`
  ))

  channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  }).catch(() => false)
}
