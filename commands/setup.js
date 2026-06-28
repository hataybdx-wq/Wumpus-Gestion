// ============================================================
//  Commande : setup — Assistant de configuration complète
//  Guide l'utilisateur à travers les configs essentielles.
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelSelectMenuBuilder, RoleSelectMenuBuilder,
  PermissionFlagsBits, MessageFlags, ChannelType,
} = require('discord.js')
const db = require('quick.db')

const COLOR = 0xFF0000

// Étapes du setup
const STEPS = [
  { key: 'start',      title: 'Bienvenue',              description: 'Assistant de configuration complet' },
  { key: 'security',   title: 'Sécurité',               description: 'Activer les protections anti-raid' },
  { key: 'logs',       title: 'Logs',                   description: 'Créer les salons de logs' },
  { key: 'tickets',    title: 'Tickets',                description: 'Mettre en place le système de tickets' },
  { key: 'invites',    title: 'Invitations',            description: 'Tracking des invitations' },
  { key: 'done',       title: 'Terminé',                description: 'Récapitulatif' },
]

function stepNumber(key) {
  return STEPS.findIndex(s => s.key === key) + 1
}

function progressBar(current) {
  const total = STEPS.length - 2  // on exclut start et done
  const actual = Math.max(0, Math.min(current - 1, total))
  const filled = Math.round((actual / total) * 10)
  return '▰'.repeat(filled) + '▱'.repeat(10 - filled)
}

function buildStep(message, step, state) {
  const container = new ContainerBuilder().setAccentColor(COLOR)
  const icon = message.guild.iconURL({ size: 256 }) || message.client.user.displayAvatarURL()

  const info = STEPS.find(s => s.key === step) || STEPS[0]

  container.addSectionComponents(sec => sec
    .addTextDisplayComponents(td => td.setContent(
      `## Configuration du serveur\n### Étape : ${info.title}\n-# ${info.description}`
    ))
    .setThumbnailAccessory(thumb => thumb.setURL(icon))
    .setFooter({ text: 'Made by Wumpus' })
  )

  if (step !== 'start' && step !== 'done') {
    container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))
    container.addTextDisplayComponents(td => td.setContent(
      `-# Étape ${stepNumber(step)}/${STEPS.length - 1}  \`${progressBar(stepNumber(step))}\``
    ))
  }

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  const userId = message.author.id

  if (step === 'start') {
    container.addTextDisplayComponents(td => td.setContent(
      `Cet assistant va vous guider pour configurer votre serveur en quelques minutes.\n\n` +
      `**Ce qui sera configuré :**\n` +
      `▸ Sécurité anti-raid\n` +
      `▸ Salons de logs\n` +
      `▸ Système de tickets\n` +
      `▸ Tracking des invitations\n\n` +
      `Vous pouvez **passer n'importe quelle étape** si vous ne voulez pas la configurer maintenant.`
    ))

    container.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder().setCustomId(`su_start_${userId}`).setLabel('Commencer').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`su_cancel_${userId}`).setLabel('Annuler').setStyle(ButtonStyle.Secondary),
    ))
  }

  else if (step === 'security') {
    container.addTextDisplayComponents(td => td.setContent(
      `La protection anti-raid bloque :\n` +
      `▸ Les bannissements / expulsions / créations de salon non autorisés\n` +
      `▸ Les ajouts de bots\n` +
      `▸ Le spam et les @everyone\n` +
      `▸ Les liens Discord et URL externes\n\n` +
      `**Deux modes disponibles :**\n` +
      `▸ **Standard** — Les admins Discord restent exempts\n` +
      `▸ **Max** — Personne n'est exempt, seul le propriétaire`
    ))

    container.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder().setCustomId(`su_secur_max_${userId}`).setLabel('Sécurité Max').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`su_secur_on_${userId}`).setLabel('Sécurité Standard').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`su_skip_logs_${userId}`).setLabel('Passer').setStyle(ButtonStyle.Secondary),
    ))
  }

  else if (step === 'logs') {
    container.addTextDisplayComponents(td => td.setContent(
      `Les salons de logs surveillent toute l'activité du serveur :\n` +
      `▸ Modération (bans, kicks, mutes…)\n` +
      `▸ Sécurité (tentatives bloquées)\n` +
      `▸ Membres (arrivées / départs)\n` +
      `▸ Messages (suppressions / éditions)\n` +
      `▸ Vocal · Invitations · Rôles · Salons\n\n` +
      `Cliquez sur **Créer** pour créer automatiquement une catégorie avec 8 salons de logs.`
    ))

    container.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder().setCustomId(`su_logs_create_${userId}`).setLabel('Créer les 8 salons').setStyle(ButtonStyle.Success).setDisabled(!!state.logs_done),
      new ButtonBuilder().setCustomId(`su_skip_tickets_${userId}`).setLabel('Passer').setStyle(ButtonStyle.Secondary),
    ))
  }

  else if (step === 'tickets') {
    container.addTextDisplayComponents(td => td.setContent(
      `Le système de tickets permet aux membres de contacter le staff en privé.\n\n` +
      `Cliquez sur **Configurer** pour créer automatiquement :\n` +
      `▸ La catégorie \`TICKETS\`\n` +
      `▸ Un salon pour le panneau (avec bouton "Ouvrir un ticket")\n` +
      `▸ Un salon de logs pour les tickets fermés\n\n` +
      `Le rôle staff sera pingé à l'ouverture de chaque ticket.`
    ))

    if (state.selectedStaffRole) {
      container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))
      container.addTextDisplayComponents(td => td.setContent(
        `**Rôle staff sélectionné :** <@&${state.selectedStaffRole}>`
      ))
    }

    container.addActionRowComponents(row => row.setComponents(
      new RoleSelectMenuBuilder().setCustomId(`su_staff_select_${userId}`).setPlaceholder('Choisir le rôle staff').setMinValues(1).setMaxValues(1)
    ))

    container.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder().setCustomId(`su_tickets_create_${userId}`).setLabel('Configurer').setStyle(ButtonStyle.Success).setDisabled(!state.selectedStaffRole || !!state.tickets_done),
      new ButtonBuilder().setCustomId(`su_skip_invites_${userId}`).setLabel('Passer').setStyle(ButtonStyle.Secondary),
    ))
  }

  else if (step === 'invites') {
    container.addTextDisplayComponents(td => td.setContent(
      `Le tracking des invitations permet de voir qui invite qui, et d'attribuer des rôles automatiquement en fonction du nombre d'invitations.\n\n` +
      `**Activer le tracking** active la détection. Vous pourrez ensuite :\n` +
      `▸ Configurer un salon de join/leave : \`!invite-setup channel #salon\`\n` +
      `▸ Ajouter des paliers de rôles : \`!invite-setup role 5 @Invitant\``
    ))

    container.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder().setCustomId(`su_invites_on_${userId}`).setLabel('Activer le tracking').setStyle(ButtonStyle.Success).setDisabled(!!state.invites_done),
      new ButtonBuilder().setCustomId(`su_skip_done_${userId}`).setLabel('Passer').setStyle(ButtonStyle.Secondary),
    ))
  }

  else if (step === 'done') {
    const summary = [
      state.secur_done   ? '🟢 Sécurité configurée'           : '⚫ Sécurité passée',
      state.logs_done    ? '🟢 Logs créés'                    : '⚫ Logs passés',
      state.tickets_done ? '🟢 Tickets configurés'            : '⚫ Tickets passés',
      state.invites_done ? '🟢 Invitations activées'          : '⚫ Invitations passées',
    ]

    container.addTextDisplayComponents(td => td.setContent(
      `### Configuration terminée !\n\n` +
      `**Récapitulatif :**\n${summary.join('\n')}\n\n` +
      `### Prochaines étapes\n` +
      `\`!dashboard\` · Voir toute la config\n` +
      `\`!help\` · Découvrir toutes les commandes\n` +
      `\`!autorole\` · Configurer les rôles à l'arrivée\n` +
      `\`!welcome channel #salon\` · Message de bienvenue`
    ))

    container.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder().setCustomId(`su_finish_${userId}`).setLabel('Fermer').setStyle(ButtonStyle.Success),
    ))
  }

  return container
}

module.exports = {
  name: 'setup',
  description: 'Assistant de configuration complète du serveur',
  aliases: ['wizard', 'config'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const state = {
      step: 'start',
      selectedStaffRole: null,
      secur_done: false,
      logs_done: false,
      tickets_done: false,
      invites_done: false,
    }

    const msg = await message.reply({
      components: [buildStep(message, 'start', state)],
      flags: MessageFlags.IsComponentsV2,
    })

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 900000,
    })

    col.on('collect', async i => {
      const id = i.customId

      // Navigation
      if (id.startsWith('su_start_'))   state.step = 'security'
      if (id.startsWith('su_cancel_')) {
        col.stop()
        return i.update({
          components: [new ContainerBuilder().setAccentColor(0x808080)
            .addTextDisplayComponents(td => td.setContent(`## Setup annulé`))],
          flags: MessageFlags.IsComponentsV2,
        })
      }

      // ── Sécurité ──
      if (id.startsWith('su_secur_max_')) {
        const PROT = ['bans','kick','bots','spam','link','massbans','masskick','massping','channels','antiguildupdate']
        for (const k of PROT) db.set(`${k}_${message.guild.id}`, true)
        db.set(`secur_${message.guild.id}`, true)
        state.secur_done = true
        state.step = 'logs'
      }
      if (id.startsWith('su_secur_on_')) {
        const PROT = ['bots','spam','link','massbans','masskick','massping','antiguildupdate']
        for (const k of PROT) db.set(`${k}_${message.guild.id}`, true)
        db.set(`secur_${message.guild.id}`, false)
        state.secur_done = true
        state.step = 'logs'
      }
      if (id.startsWith('su_skip_logs_'))     state.step = 'logs'

      // ── Logs ──
      if (id.startsWith('su_logs_create_')) {
        await i.deferUpdate()
        try {
          const category = await message.guild.channels.create({
            name: '〔 LOGS 〕',
            type: ChannelType.GuildCategory,
          })

          const LOG_CHANNELS = [
            { name: '🔨・logs-moderation', key: 'mod' },
            { name: '🛡️・logs-securite',   key: 'secur' },
            { name: '👥・logs-membres',    key: 'members' },
            { name: '💬・logs-messages',   key: 'messages' },
            { name: '🎙️・logs-vocal',      key: 'voice' },
            { name: '🔗・logs-invitations',key: 'invites' },
            { name: '🎭・logs-roles',      key: 'roles' },
            { name: '📁・logs-salons',     key: 'channels' },
          ]

          for (const log of LOG_CHANNELS) {
            const ch = await message.guild.channels.create({
              name: log.name,
              type: ChannelType.GuildText,
              parent: category.id,
              permissionOverwrites: [
                { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
              ],
            })
            db.set(`log_${log.key}_${message.guild.id}`, ch.id)
          }

          state.logs_done = true
          state.step = 'tickets'
        } catch (err) {
          return i.followUp({ content: `Erreur : ${err.message}`, flags: 64 })
        }
        await i.editReply({ components: [buildStep(message, state.step, state)], flags: MessageFlags.IsComponentsV2 })
        return
      }
      if (id.startsWith('su_skip_tickets_'))  state.step = 'tickets'

      // ── Tickets ──
      if (id.startsWith('su_staff_select_') && i.isRoleSelectMenu()) {
        state.selectedStaffRole = i.values[0]
      }
      if (id.startsWith('su_tickets_create_')) {
        await i.deferUpdate()
        try {
          // Catégorie
          const category = await message.guild.channels.create({
            name: '〔 TICKETS 〕', type: ChannelType.GuildCategory,
            permissionOverwrites: [
              { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
              { id: state.selectedStaffRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
            ],
          })

          // Salon panneau
          const panelCh = await message.guild.channels.create({
            name: '📩・tickets', type: ChannelType.GuildText,
            permissionOverwrites: [
              { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.SendMessages] },
            ],
          })

          // Salon logs
          const logsCh = await message.guild.channels.create({
            name: '📋・tickets-logs', type: ChannelType.GuildText, parent: category.id,
            permissionOverwrites: [
              { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
              { id: state.selectedStaffRole, allow: [PermissionFlagsBits.ViewChannel] },
            ],
          })

          db.set(`tickets_${message.guild.id}`, {
            panelChannelId: panelCh.id,
            categoryId:     category.id,
            logsChannelId:  logsCh.id,
            staffRoleId:    state.selectedStaffRole,
            maxOpen:        1,
            transcript:     true,
            mention:        true,
            color:          0xFF0000,
            author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
            title:          'Ouvrir un ticket',
            author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
            desc:           'Cliquez sur le bouton ci-dessous pour contacter le staff.',
            types:          [],
          })

          // Envoi du panneau basique
          const panelButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_open_default').setLabel('Ouvrir un ticket').setStyle(ButtonStyle.Primary).setEmoji('📩')
          )
          await panelCh.send({ embeds: [{
            title: 'Ouvrir un ticket',
            author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
            description: 'Cliquez sur le bouton ci-dessous pour contacter le staff.',
            color: 0xFF0000,
            author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
          }], components: [panelButton] })

          state.tickets_done = true
          state.step = 'invites'
        } catch (err) {
          return i.followUp({ content: `Erreur : ${err.message}`, flags: 64 })
        }
        await i.editReply({ components: [buildStep(message, state.step, state)], flags: MessageFlags.IsComponentsV2 })
        return
      }
      if (id.startsWith('su_skip_invites_')) state.step = 'invites'

      // ── Invites ──
      if (id.startsWith('su_invites_on_')) {
        const cfg = db.get(`config_${message.guild.id}`) || {}
        cfg.active = true
        db.set(`config_${message.guild.id}`, cfg)
        state.invites_done = true
        state.step = 'done'
      }
      if (id.startsWith('su_skip_done_'))    state.step = 'done'

      // ── Finish ──
      if (id.startsWith('su_finish_')) {
        col.stop()
        return i.update({
          components: [new ContainerBuilder().setAccentColor(0x57F287)
            .addTextDisplayComponents(td => td.setContent(
              `## Setup terminé\n-# Utilisez \`${prefix}dashboard\` pour voir la config complète`
            ))],
          flags: MessageFlags.IsComponentsV2,
        })
      }

      // Update standard
      if (!i.replied && !i.deferred) {
        await i.update({
          components: [buildStep(message, state.step, state)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
      }
    })

    col.on('end', () => {
      msg.edit({
        components: [new ContainerBuilder().setAccentColor(0x808080)
          .addTextDisplayComponents(td => td.setContent(`## Setup terminé\n-# Session expirée`))],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => false)
    })
  },
}
