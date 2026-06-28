// ============================================================
//  Commande : antilien — Interface unifiée
//  Configure l'anti-lien avec un panneau interactif moderne
//
//  Fonctionnalités :
//    - Activer/désactiver
//    - Mode : tous les liens ou invitations Discord uniquement
//    - Whitelist de domaines autorisés
//    - Sanction (warn/mute/kick/ban)
//
//  Usage : !antilien
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

const COLOR = 0xFF0000

module.exports = {
  name: 'antilien',
  description: 'Configure l\'anti-lien avec une interface interactive',
  aliases: ['antilink'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    const userId = message.author.id

    const msg = await message.reply({
      components: [buildMainPanel(gid, userId)],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null)

    if (!msg) return

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 300000,
    })

    col.on('collect', async i => {
      // Select menu - changement de mode ou sanction
      if (i.isStringSelectMenu()) {
        if (i.customId.startsWith('antilien_mode_')) {
          db.set(`link_mode_${gid}`, i.values[0])
          await i.update({
            components: [buildMainPanel(gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => false)
        } else if (i.customId.startsWith('antilien_sanction_')) {
          db.set(`link_sanction_${gid}`, i.values[0])
          await i.update({
            components: [buildMainPanel(gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => false)
        } else if (i.customId.startsWith('antilien_selectrmwl_')) {
          // Retirer domaine sélectionné
          const domain = i.values[0]
          const wl = (db.get(`link_whitelist_${gid}`) || []).filter(d => d !== domain)
          db.set(`link_whitelist_${gid}`, wl)

          await i.update({
            content: `✅ \`${domain}\` retiré de la whitelist.`,
            components: [buildMainPanel(gid, userId)],
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
          const current = db.get(`link_${gid}`) === true
          db.set(`link_${gid}`, !current)
          await i.update({
            components: [buildMainPanel(gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => false)
          return
        }

        // Ajouter domaine à la whitelist
        if (action === 'addwl') {
          const modal = new ModalBuilder()
            .setCustomId(`antilien_addwl_${gid}`)
            .setTitle('Ajouter un domaine à la whitelist')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('domain')
                  .setLabel('Nom de domaine (ex: youtube.com)')
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('exemple.com')
                  .setRequired(true)
              )
            )
          await i.showModal(modal)
          return
        }

        // Retirer domaine de la whitelist
        if (action === 'rmwl') {
          const wl = db.get(`link_whitelist_${gid}`) || []
          if (wl.length === 0) {
            await i.reply({ content: '❌ Aucun domaine dans la whitelist.', flags: 64 })
            return
          }

          // Créer un select menu pour choisir le domaine à retirer
          const select = new StringSelectMenuBuilder()
            .setCustomId(`antilien_selectrmwl_${gid}`)
            .setPlaceholder('Choisir un domaine à retirer')
            .addOptions(
              wl.map(d => new StringSelectMenuOptionBuilder()
                .setLabel(d)
                .setValue(d)
              )
            )

          await i.update({
            content: '**Sélectionnez un domaine à retirer :**',
            components: [new ActionRowBuilder().addComponents(select)],
          }).catch(() => false)
          return
        }

        // Voir la whitelist
        if (action === 'viewwl') {
          const wl = db.get(`link_whitelist_${gid}`) || []
          const list = wl.length > 0 ? wl.map(d => `• \`${d}\``).join('\n') : 'Aucun domaine'
          await i.reply({ content: `**Whitelist (${wl.length}) :**\n${list}`, flags: 64 })
          return
        }

        // Reset configuration
        if (action === 'reset') {
          db.set(`link_${gid}`, null)
          db.set(`link_mode_${gid}`, null)
          db.set(`link_sanction_${gid}`, null)
          db.set(`link_whitelist_${gid}`, null)
          await i.update({
            components: [buildMainPanel(gid, userId)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => false)
          return
        }
      }

      // Modal submit - ajout domaine
      if (i.isModalSubmit() && i.customId.startsWith('antilien_addwl_')) {
        const domain = i.fields.getTextInputValue('domain').toLowerCase().trim()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0]

        if (!domain || domain.length < 3) {
          await i.reply({ content: '❌ Domaine invalide.', flags: 64 })
          return
        }

        const wl = db.get(`link_whitelist_${gid}`) || []
        if (wl.includes(domain)) {
          await i.reply({ content: `❌ \`${domain}\` est déjà dans la whitelist.`, flags: 64 })
          return
        }

        wl.push(domain)
        db.set(`link_whitelist_${gid}`, wl)

        await i.update({
          components: [buildMainPanel(gid, userId)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
        return
      }
    })

    col.on('end', () => {
      const end = new ContainerBuilder()
        .setAccentColor(COLOR)
        .addTextDisplayComponents(td => td.setContent(
          `## Anti-Lien\n-# Session expirée · \`${prefix}antilien\` pour rouvrir`
        ))
      msg.edit({ components: [end], flags: MessageFlags.IsComponentsV2 }).catch(() => false)
    })
  },
}

// ── Builder du panneau principal ──────────────────────────────
function buildMainPanel(gid, userId) {
  const enabled   = db.get(`link_${gid}`) === true
  const mode      = db.get(`link_mode_${gid}`) || 'all'
  const sanction  = db.get(`link_sanction_${gid}`) || 'kick'
  const whitelist = db.get(`link_whitelist_${gid}`) || []

  const container = new ContainerBuilder().setAccentColor(COLOR)

  // Header
  container.addSectionComponents(sec => sec.addTextDisplayComponents(
    td => td.setContent(
      `## Anti-Lien\n` +
      `### ${enabled ? '🟢 Activé' : '🔴 Désactivé'}\n` +
      `-# Configuration simplifiée`
    )
  ))

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Configuration
  const modeLabels = {
    all: 'Tous les liens',
    invites: 'Invitations Discord uniquement',
  }

  container.addTextDisplayComponents(td => td.setContent(
    `### Configuration\n` +
    `**Mode :** ${modeLabels[mode]}\n` +
    `**Sanction :** ${sanction}\n` +
    `**Whitelist :** ${whitelist.length} domaine${whitelist.length > 1 ? 's' : ''} autorisé${whitelist.length > 1 ? 's' : ''}`
  ))

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  // Select - Mode
  const selectMode = new StringSelectMenuBuilder()
    .setCustomId(`antilien_mode_${userId}`)
    .setPlaceholder('Mode de détection')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Tous les liens')
        .setValue('all')
        .setDescription('Bloque tous les liens (sauf whitelist)')
        .setDefault(mode === 'all'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Invitations Discord uniquement')
        .setValue('invites')
        .setDescription('Bloque uniquement discord.gg/...')
        .setDefault(mode === 'invites')
    )

  container.addActionRowComponents(row => row.setComponents(selectMode))

  // Select - Sanction
  const selectSanction = new StringSelectMenuBuilder()
    .setCustomId(`antilien_sanction_${userId}`)
    .setPlaceholder('Type de sanction')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('Avertissement').setValue('warn').setDefault(sanction === 'warn'),
      new StringSelectMenuOptionBuilder().setLabel('Mute').setValue('mute').setDefault(sanction === 'mute'),
      new StringSelectMenuOptionBuilder().setLabel('Kick').setValue('kick').setDefault(sanction === 'kick'),
      new StringSelectMenuOptionBuilder().setLabel('Ban').setValue('ban').setDefault(sanction === 'ban')
    )

  container.addActionRowComponents(row => row.setComponents(selectSanction))

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  // Boutons - Whitelist
  container.addTextDisplayComponents(td => td.setContent(
    `### Whitelist\n` +
    `-# Domaines autorisés (non bloqués)`
  ))

  container.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder().setCustomId(`antilien_addwl_${userId}`).setLabel('Ajouter domaine').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`antilien_rmwl_${userId}`).setLabel('Retirer domaine').setStyle(ButtonStyle.Secondary).setDisabled(whitelist.length === 0),
    new ButtonBuilder().setCustomId(`antilien_viewwl_${userId}`).setLabel(`Voir (${whitelist.length})`).setStyle(ButtonStyle.Secondary)
  ))

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Boutons d'action
  container.addActionRowComponents(row => row.setComponents(
    new ButtonBuilder()
      .setCustomId(`antilien_toggle_${userId}`)
      .setLabel(enabled ? 'Désactiver' : 'Activer')
      .setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`antilien_reset_${userId}`)
      .setLabel('Réinitialiser')
      .setStyle(ButtonStyle.Secondary)
  ))

  container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

  container.addTextDisplayComponents(td => td.setContent(
    `-# Les changements sont sauvegardés automatiquement`
  ))

  return container
}
