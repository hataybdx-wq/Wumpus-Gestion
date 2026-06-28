// ============================================================
//  Commande : invite-setup — Interface unifiée
//  Configure le système d'invitations avec un panneau interactif
//
//  Fonctionnalités :
//    - Activer/désactiver
//    - Salon de logs
//    - Message DM aux paliers
//    - Rôles par palier
//
//  Usage : !invite-setup
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle,
  ChannelType, PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const { getConfig, setConfig, initGuild } = require('../utils/invites')

const COLOR = 0xFF0000

module.exports = {
  name: 'invite-setup',
  description: 'Configure le système d\'invitations avec une interface interactive',
  aliases: ['setup-invite', 'invites-setup'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const userId = message.author.id

    const msg = await message.reply({
      components: [buildMainPanel(message.guild, gid, userId)],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null)

    if (!msg) return

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 300000,
    })

    col.on('collect', async i => {
      // Select menu - choix salon
      if (i.isStringSelectMenu()) {
        if (i.customId.startsWith('invsetup_channel_')) {
          const cfg = getConfig(gid)
          cfg.logsChannelId = i.values[0]
          setConfig(gid, cfg)
          await i.update({
            components: [buildMainPanel(message.guild, gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => false)
        } else if (i.customId.startsWith('invsetup_rmrole_')) {
          // Retirer un palier de rôle
          const count = parseInt(i.values[0])
          const cfg = getConfig(gid)
          cfg.milestoneRoles = (cfg.milestoneRoles || []).filter(r => r.count !== count)
          setConfig(gid, cfg)
          await i.update({
            components: [buildMainPanel(message.guild, gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => false)
        }
        return
      }

      // Boutons
      if (i.isButton()) {
        const parts = i.customId.split('_')
        const action = parts[1]

        // Toggle on/off
        if (action === 'toggle') {
          const cfg = getConfig(gid)
          cfg.active = !cfg.active
          setConfig(gid, cfg)
          if (cfg.active) await initGuild(message.guild)
          await i.update({
            components: [buildMainPanel(message.guild, gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => false)
          return
        }

        // Configurer DM
        if (action === 'setdm') {
          const modal = new ModalBuilder()
            .setCustomId(`invsetup_setdm_${gid}`)
            .setTitle('Message DM aux paliers')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('message')
                  .setLabel('Message envoyé à chaque palier atteint')
                  .setStyle(TextInputStyle.Paragraph)
                  .setPlaceholder('Bravo {user} ! Tu as atteint {count} invitations sur {server} !')
                  .setValue(getConfig(gid).dmMessage || '')
                  .setRequired(false)
              )
            )
          await i.showModal(modal)
          return
        }

        // Désactiver DM
        if (action === 'dmdisable') {
          const cfg = getConfig(gid)
          cfg.dmMessage = null
          setConfig(gid, cfg)
          await i.update({
            components: [buildMainPanel(message.guild, gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => false)
          return
        }

        // Ajouter rôle par palier
        if (action === 'addrole') {
          const modal = new ModalBuilder()
            .setCustomId(`invsetup_addrole_${gid}`)
            .setTitle('Ajouter un palier de rôle')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('count')
                  .setLabel('Nombre d\'invitations requis')
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('5')
                  .setRequired(true)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('roleid')
                  .setLabel('ID du rôle à donner')
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('123456789012345678')
                  .setRequired(true)
              )
            )
          await i.showModal(modal)
          return
        }

        // Retirer palier de rôle
        if (action === 'rmrole') {
          const cfg = getConfig(gid)
          const roles = cfg.milestoneRoles || []
          if (roles.length === 0) {
            await i.reply({ content: '❌ Aucun palier configuré.', flags: 64 })
            return
          }

          const select = new StringSelectMenuBuilder()
            .setCustomId(`invsetup_rmrole_${gid}`)
            .setPlaceholder('Choisir un palier à retirer')
            .addOptions(
              roles.map(r => {
                const role = message.guild.roles.cache.get(r.roleId)
                return new StringSelectMenuOptionBuilder()
                  .setLabel(`${r.count} invitations`)
                  .setValue(r.count.toString())
                  .setDescription(role ? `Rôle: ${role.name}` : 'Rôle supprimé')
              })
            )

          await i.update({
            content: '**Sélectionnez un palier à retirer :**',
            components: [new ActionRowBuilder().addComponents(select)],
          }).catch(() => false)
          return
        }

        // Reset config
        if (action === 'reset') {
          setConfig(gid, {
            logsChannelId: null,
            active: false,
            dmMessage: null,
            milestoneRoles: [],
          })
          await i.update({
            components: [buildMainPanel(message.guild, gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => false)
          return
        }
      }

      // Modal submit - DM message
      if (i.isModalSubmit() && i.customId.startsWith('invsetup_setdm_')) {
        const msg = i.fields.getTextInputValue('message').trim()
        const cfg = getConfig(gid)
        cfg.dmMessage = msg || null
        setConfig(gid, cfg)
        await i.update({
          components: [buildMainPanel(message.guild, gid, userId)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
        return
      }

      // Modal submit - Ajouter rôle
      if (i.isModalSubmit() && i.customId.startsWith('invsetup_addrole_')) {
        const count = parseInt(i.fields.getTextInputValue('count'))
        const roleId = i.fields.getTextInputValue('roleid').trim()

        if (isNaN(count) || count <= 0) {
          await i.reply({ content: '❌ Le nombre d\'invitations doit être > 0.', flags: 64 })
          return
        }

        const role = message.guild.roles.cache.get(roleId)
        if (!role) {
          await i.reply({ content: '❌ Rôle introuvable. Vérifiez l\'ID.', flags: 64 })
          return
        }

        const cfg = getConfig(gid)
        cfg.milestoneRoles = cfg.milestoneRoles || []
        cfg.milestoneRoles = cfg.milestoneRoles.filter(r => r.count !== count)
        cfg.milestoneRoles.push({ count, roleId: role.id })
        cfg.milestoneRoles.sort((a, b) => a.count - b.count)
        setConfig(gid, cfg)

        await i.update({
          components: [buildMainPanel(message.guild, gid, userId)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
      }
    })

    col.on('end', () => {
      const end = new ContainerBuilder()
        .setAccentColor(COLOR)
        .addTextDisplayComponents(td => td.setContent(
          `## Configuration Invitations\n-# Session expirée · \`${prefix}invite-setup\` pour rouvrir`
        ))
      msg.edit({ components: [end], flags: MessageFlags.IsComponentsV2 }).catch(() => false)
    })
  },
}

// ── Builder ───────────────────────────────────────────────────
function buildMainPanel(guild, gid, userId) {
  const cfg = getConfig(gid)
  const container = new ContainerBuilder().setAccentColor(COLOR)

  // Header
  container.addTextDisplayComponents(td => td.setContent(
    `## Configuration Invitations\n` +
    `### ${cfg.active ? '🟢 Activé' : '🔴 Désactivé'}\n` +
    `-# Système de suivi et récompenses`
  ))

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Salon de logs
  const channelText = cfg.logsChannelId
    ? `<#${cfg.logsChannelId}>`
    : 'Non configuré'

  container.addTextDisplayComponents(td => td.setContent(
    `### Salon de logs\n` +
    `**Salon join/leave :** ${channelText}`
  ))

  // Select menu pour choisir salon
  const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText)
  if (textChannels.size > 0) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(`invsetup_channel_${userId}`)
      .setPlaceholder('Choisir un salon')
      .addOptions(
        textChannels.map(c => new StringSelectMenuOptionBuilder()
          .setLabel(`#${c.name}`)
          .setValue(c.id)
          .setDefault(c.id === cfg.logsChannelId)
        ).slice(0, 25) // Max 25 options
      )

    container.addActionRowComponents(row => row.setComponents(select))
  }

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  // DM aux paliers
  const dmText = cfg.dmMessage 
    ? `\`${cfg.dmMessage.slice(0, 100)}${cfg.dmMessage.length > 100 ? '...' : ''}\``
    : 'Non configuré'

  container.addTextDisplayComponents(td => td.setContent(
    `### Message DM\n` +
    `**Message aux paliers :** ${dmText}\n` +
    `-# Variables : {user} {count} {server}`
  ))

  container.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setCustomId(`invsetup_setdm_${userId}`)
      .setLabel(cfg.dmMessage ? 'Modifier DM' : 'Configurer DM')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`invsetup_dmdisable_${userId}`)
      .setLabel('Désactiver DM')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!cfg.dmMessage)
  ))

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  // Rôles par palier
  const roles = cfg.milestoneRoles || []
  const rolesList = roles.length > 0
    ? roles.map(r => {
        const role = guild.roles.cache.get(r.roleId)
        return `• **${r.count}** invitations → ${role ? `<@&${role.id}>` : '*(rôle supprimé)*'}`
      }).join('\n')
    : 'Aucun palier configuré'

  container.addTextDisplayComponents(td => td.setContent(
    `### Rôles par palier\n${rolesList}`
  ))

  container.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setCustomId(`invsetup_addrole_${userId}`)
      .setLabel('Ajouter palier')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`invsetup_rmrole_${userId}`)
      .setLabel('Retirer palier')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(roles.length === 0)
  ))

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Boutons principaux
  container.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setCustomId(`invsetup_toggle_${userId}`)
      .setLabel(cfg.active ? 'Désactiver' : 'Activer')
      .setStyle(cfg.active ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`invsetup_reset_${userId}`)
      .setLabel('Réinitialiser')
      .setStyle(ButtonStyle.Secondary)
  ))

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  container.addTextDisplayComponents(td => td.setContent(
    `-# Configuration sauvegardée automatiquement`
  ))

  return container
}
