// ============================================================
//  Événement : interactionCreate
//  Slash commands + modals + boutons
// ============================================================

const { MessageFlags } = require('discord.js')
const botManager  = require('../../system/botManager')
const claim       = require('../../commands/claim')
const myBot       = require('../../commands/my-bot')
const genkey      = require('../../commands/genkey')
const prevnames   = require('../../commands/prevnames')
const db          = require('quick.db')
const jsondb      = require('../../utils/jsondb')
const {
  cfg: tktCfg, saveCfg, KEY: TKT,
  createTicket, requestClose, confirmClose,
  buildOpenModal, buildPanel, buildSetupPanel, buildPrioPanel,
  PRIORITY,
} = require('../../utils/tickets')
const { getTotal } = require('../../utils/invites')

const gdb = jsondb('giveaways')

module.exports = async (client, interaction) => {
  try {

  console.log(`[INTERACTION] type=${interaction.type} customId=${interaction.customId || interaction.commandName || '-'}`)

  // ── Slash commands ─────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    // Commandes slash avec logique dédiée
    if (interaction.commandName === 'claim')     return claim.handleInteraction(interaction, client)
    if (interaction.commandName === 'my-bot')    return myBot.handleInteraction(interaction, client)
    if (interaction.commandName === 'genkey')    return genkey.handleInteraction(interaction, client)
    if (interaction.commandName === 'prevnames') return prevnames.handleInteraction(interaction, client)

    // Routage automatique : toutes les autres slash commands sont
    // redirigées vers la commande préfixe équivalente.
    // On simule un "message" minimal pour que command.run() fonctionne.
    const cmdName = interaction.commandName
    const command = client.commands.get(cmdName) || client.commands.get(client.aliases.get(cmdName))
    if (command && typeof command.run === 'function') {
      // Vérif mode public pour les non-admins
      const isAdmin   = interaction.member?.permissions?.has(0x8n)
      const pubMode   = db.get(`public_mode_${interaction.guild?.id}`) === true
      const needAdmin = ['setup-logs','setup-log','secur-max','secur-on','secur-off',
        'antiban','antikick','antibot','antiraid','antimassban','antimasskick',
        'antichannel','antiguildupdate','antilien','spam',
        'anti-masse-mention','setup-captcha','ticket','public-mode',
        'prefix','greet','set-status','support-setup','support-reward',
        'wl','wl-strict','set-sanction','genkey','leave','shutdown','alladmin','allserveur']

      if (!isAdmin && needAdmin.includes(cmdName)) {
        return interaction.reply({ content: 'Cette commande est réservée aux administrateurs.', flags: MessageFlags.Ephemeral })
      }
      if (!isAdmin && !pubMode) {
        return interaction.reply({ content: 'Le mode public n\'est pas activé sur ce serveur.', flags: MessageFlags.Ephemeral })
      }

      await interaction.deferReply({}).catch(() => {})

      // Faux objet message pour la compatibilité avec command.run()
      const fakeMessage = {
        guild:   interaction.guild,
        channel: interaction.channel,
        author:  interaction.user,
        member:  interaction.member,
        content: `/${cmdName}`,
        reply:   (payload) => {
          const isStr = typeof payload === 'string'
          return interaction.editReply(isStr ? { content: payload } : payload).catch(() => {})
        },
        mentions: { members: { first: () => null }, channels: { first: () => null }, roles: { first: () => null }, users: { first: () => null } },
      }

      const prefix = db.get(`${interaction.guild?.id}.prefix`) || process.env.prefix || '!'
      try {
        await command.run(client, fakeMessage, [], prefix)
      } catch (err) {
        console.error(`[SLASH→CMD] /${cmdName}:`, err.message)
        interaction.editReply({ content: 'Une erreur est survenue.' }).catch(() => {})
      }
      return
    }
  }

  // ── Modals ─────────────────────────────────────────────────
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'claim_modal')  return claim.handleInteraction(interaction, client)
    if (interaction.customId === 'genkey_modal') return genkey.handleInteraction(interaction, client)
    if (interaction.customId.startsWith('embm_')) {
      return require('../../commands/embed').handleModal(interaction)
    }

    // ── Modaux setup ticket ───────────────────────────────
    // IMPORTANT : createMessageComponentCollector() ne capture pas
    // les modal submits — ils doivent être traités ici.
    if (interaction.customId.startsWith('tkt:modal-setup:')) {
      const gid    = interaction.guild?.id
      if (!gid) return interaction.reply({ content: '❌ Guild introuvable.', flags: 64 })
      const parts2  = interaction.customId.split(':')   // ['tkt','modal-setup','action','userId']
      const action2 = parts2[2]
      const config2 = tktCfg(gid)

      if (action2 === 'maxopen') {
        config2.maxOpen = Math.max(0, parseInt(interaction.fields.getTextInputValue('v')) || 0)
        saveCfg(gid, config2)
      } else if (action2 === 'autoclose') {
        const h = parseInt(interaction.fields.getTextInputValue('v')) || 0
        config2.autoClose = h > 0 ? h : null
        saveCfg(gid, config2)
      } else if (action2 === 'welcome') {
        config2.openMessage = interaction.fields.getTextInputValue('v').trim() || 'Bienvenue {user} !'
        saveCfg(gid, config2)
      } else if (action2 === 'title') {
        config2.panelTitle = interaction.fields.getTextInputValue('title').trim()
        config2.panelDesc  = interaction.fields.getTextInputValue('desc').trim()
        saveCfg(gid, config2)
      } else if (action2 === 'addtype') {
        const label2  = interaction.fields.getTextInputValue('label').trim()
        const emoji2  = (interaction.fields.fields.has('emoji') ? interaction.fields.getTextInputValue('emoji').trim() : '') || '🎫'
        const desc2   = (interaction.fields.fields.has('desc')  ? interaction.fields.getTextInputValue('desc').trim()  : '') || ''
        const typeId2 = label2.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
        config2.types = config2.types || []
        config2.types.push({ id: typeId2, label: label2, emoji: emoji2, description: desc2 })
        saveCfg(gid, config2)
      }

      // Mettre à jour le panneau de setup dans le channel
      const userId2 = parts2[3]
      try {
        await interaction.update({ components: [buildSetupPanel(interaction.guild, userId2)], flags: MessageFlags.IsComponentsV2 })
      } catch {
        // interaction.update échoue si le modal n'est pas lié à un composant (edge case)
        await interaction.reply({ content: '✅ Paramètre sauvegardé.', flags: 64 }).catch(() => {})
      }
      return
    }

    // ── Modal ouverture ticket v3 ──────────────────────────
    if (interaction.customId.startsWith('tkt:modal:')) {
      const gid    = interaction.guild?.id
      if (!gid) return
      const config = tktCfg(gid)
      if (config.enabled === false)
        return interaction.reply({ content: '❌ Le système de tickets est désactivé.', flags: MessageFlags.Ephemeral })

      const typeId   = interaction.customId.replace('tkt:modal:', '')
      const typeData = typeId === 'default'
        ? null
        : (config.types || []).find(t => t.id === typeId) || null

      const subject = interaction.fields.getTextInputValue('subject').trim()
      const details = interaction.fields.fields.has('details')
        ? interaction.fields.getTextInputValue('details').trim()
        : ''

      await interaction.deferReply({ flags: MessageFlags.Ephemeral })
      try {
        const result = await createTicket(client, interaction.guild, interaction.member, {
          typeId:    typeData?.id    || 'default',
          typeLabel: typeData?.label || 'Général',
          priority:  'normal',
          subject, details,
        })
        if (!result.ok) return interaction.editReply({ content: `❌ ${result.error}` })
        return interaction.editReply({ content: `✅ Ticket créé : <#${result.channel.id}>` })
      } catch (err) {
        console.error('[TKT MODAL]', err)
        return interaction.editReply({ content: `❌ Erreur : ${err.message}` }).catch(() => {})
      }
    }
  }

  // ── Boutons ────────────────────────────────────────────────
  if (interaction.isButton()) {
    const parts = interaction.customId.split('_')

    // Boutons help (pagination)
    if (parts[0] === 'help') return  // géré dans la commande help

    // Boutons my-bot
    if (parts[0] === 'mybot') {
      const [, action, targetUserId] = parts
      if (interaction.user.id !== targetUserId)
        return interaction.reply({ content: 'Ce panneau ne vous appartient pas.', flags: MessageFlags.Ephemeral })

      await interaction.deferUpdate()

      if (action === 'start') {
        const r = botManager.startBot(targetUserId)
        return interaction.followUp({ content: r.ok ? 'Bot démarré.' : r.error, flags: MessageFlags.Ephemeral })
      }
      if (action === 'stop') {
        const r = botManager.stopBot(targetUserId)
        return interaction.followUp({ content: r.ok ? 'Bot arrêté.' : r.error, flags: MessageFlags.Ephemeral })
      }
    }

    // Boutons Poll
    if (parts[0] === 'poll') {
      const pollId = parts[1]
      const optIdx = parseInt(parts[2])
      const polls  = db.get(`polls_${interaction.guild.id}`) || {}
      const poll   = polls[pollId]
      if (!poll) return interaction.reply({ content: 'Sondage introuvable.', flags: MessageFlags.Ephemeral })

      poll.votes = poll.votes || {}
      const current = poll.votes[interaction.user.id]

      if (current === optIdx) {
        delete poll.votes[interaction.user.id]
      } else {
        poll.votes[interaction.user.id] = optIdx
      }
      polls[pollId] = poll
      db.set(`polls_${interaction.guild.id}`, polls)

      // Mettre à jour l'affichage
      const { buildContainer } = require('../../commands/poll')
      const { MessageFlags } = require('discord.js')
      await interaction.update({ components: [buildContainer(poll)], flags: MessageFlags.IsComponentsV2 }).catch(() => false)
      return
    }

    // ── Boutons Tickets v3 ───────────────────────────────────
    if (parts[0] === 'tkt') {
      const action = parts[1]
      const gid    = interaction.guild?.id
      if (!gid) return
      const config = tktCfg(gid)

      // ── Ouvrir un ticket → afficher le modal ──────────────
      if (action === 'open') {
        if (config.enabled === false)
          return interaction.reply({ content: '❌ Le système de tickets est désactivé.', flags: MessageFlags.Ephemeral })
        const typeId   = parts.slice(2).join('_') || 'default'
        const typeData = typeId === 'default'
          ? null
          : (config.types || []).find(t => t.id === typeId) || null
        return interaction.showModal(buildOpenModal(typeId, typeData?.label))
      }

      // ── Fermer un ticket ──────────────────────────────────
      if (action === 'close') {
        const channelId  = parts.slice(2).join('_')
        const ticketData = db.get(TKT.ch(channelId))
        if (!ticketData) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral })
        const isOwner = ticketData.userId === interaction.user.id
        const isStaff = config.staffRoleId
          ? interaction.member.roles.cache.has(config.staffRoleId)
          : interaction.member.permissions.has(8n)
        if (!isOwner && !isStaff)
          return interaction.reply({ content: '❌ Seul le créateur ou un membre du staff peut fermer ce ticket.', flags: MessageFlags.Ephemeral })
        await interaction.deferUpdate()
        await requestClose(interaction.channel, interaction.member, 'Fermé via le bouton')
        return
      }

      // ── Prendre en charge ─────────────────────────────────
      if (action === 'claim') {
        const channelId  = parts.slice(2).join('_')
        const ticketData = db.get(TKT.ch(channelId))
        if (!ticketData) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral })
        const isStaff = config.staffRoleId
          ? interaction.member.roles.cache.has(config.staffRoleId)
          : interaction.member.permissions.has(8n)
        if (!isStaff) return interaction.reply({ content: '❌ Réservé au staff.', flags: MessageFlags.Ephemeral })
        if (ticketData.claimedBy)
          return interaction.reply({ content: `❌ Déjà pris en charge par <@${ticketData.claimedBy}>.`, flags: MessageFlags.Ephemeral })

        ticketData.claimedBy = interaction.user.id
        ticketData.claimedAt = Date.now()
        db.set(TKT.ch(channelId), ticketData)
        const allOpen = db.get(TKT.open(gid)) || {}
        if (allOpen[channelId]) { allOpen[channelId].claimedBy = interaction.user.id; db.set(TKT.open(gid), allOpen) }

        const { ContainerBuilder, SeparatorSpacingSize } = require('discord.js')
        const c = new ContainerBuilder().setAccentColor(0x2ECC71)
        c.addTextDisplayComponents(td => td.setContent(
          `✋ **<@${interaction.user.id}> prend en charge ce ticket.**\n-# Votre demande est entre de bonnes mains.`
        ))
        await interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 })
        try {
          const newName = interaction.channel.name.replace(/^([^-]+-[^-]+)/, `$1-[${interaction.member.displayName.toLowerCase().slice(0, 8)}]`)
          await interaction.channel.setName(newName)
        } catch {}
        return
      }

      // ── Panel priorité ────────────────────────────────────
      if (action === 'prio') {
        const channelId = parts.slice(2).join('_')
        const ticketData = db.get(TKT.ch(channelId))
        if (!ticketData) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral })
        const isStaff = config.staffRoleId
          ? interaction.member.roles.cache.has(config.staffRoleId)
          : interaction.member.permissions.has(8n)
        if (!isStaff) return interaction.reply({ content: '❌ Réservé au staff.', flags: MessageFlags.Ephemeral })
        return interaction.reply({ components: [buildPrioPanel(channelId)], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral })
      }

      // ── Changer la priorité ───────────────────────────────
      if (action === 'set-prio') {
        const channelId = parts[2]
        const level     = parts[3]
        const ticketData = db.get(TKT.ch(channelId))
        if (!ticketData || !PRIORITY[level]) return interaction.deferUpdate()
        ticketData.priority = level
        db.set(TKT.ch(channelId), ticketData)
        const allOpen = db.get(TKT.open(gid)) || {}
        if (allOpen[channelId]) { allOpen[channelId].priority = level; db.set(TKT.open(gid), allOpen) }
        const p = PRIORITY[level]
        await interaction.reply({ content: `${p.emoji} Priorité changée en **${p.label}**.`, flags: MessageFlags.Ephemeral })
        return
      }

      // ── Notation ──────────────────────────────────────────
      if (action === 'rate') {
        const channelId = parts[2]
        const stars     = parseInt(parts[3]) || 0
        const ticketData = db.get(TKT.ch(channelId))
        if (!ticketData) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral })
        if (interaction.user.id !== ticketData.userId)
          return interaction.reply({ content: '❌ Seul le créateur du ticket peut noter.', flags: MessageFlags.Ephemeral })
        ticketData.rating = stars
        db.set(TKT.ch(channelId), ticketData)
        await interaction.reply({ content: `${'⭐'.repeat(stars)} Note enregistrée !`, flags: MessageFlags.Ephemeral })
        return
      }

      // ── Confirmer la fermeture ────────────────────────────
      if (action === 'confirm-close') {
        const channelId = parts[2]
        const reason    = decodeURIComponent(parts.slice(3).join('_') || 'Aucune raison')
        const ticketData = db.get(TKT.ch(channelId))
        if (!ticketData) return interaction.reply({ content: '❌ Ticket introuvable.', flags: MessageFlags.Ephemeral })
        const isOwner = ticketData.userId === interaction.user.id
        const isStaff = config.staffRoleId
          ? interaction.member.roles.cache.has(config.staffRoleId)
          : interaction.member.permissions.has(8n)
        if (!isOwner && !isStaff)
          return interaction.reply({ content: '❌ Non autorisé.', flags: MessageFlags.Ephemeral })
        await interaction.deferUpdate()
        await confirmClose(client, interaction.guild, interaction.channel, interaction.member, reason)
        return
      }
    }

    // ── Boutons Giveaway ─────────────────────────────────────
    if (parts[0] === 'gw' && parts[1] === 'join') {
      const id = parts.slice(2).join('_')
      const g  = gdb.get(id)
      if (!g) return interaction.reply({ content: 'Giveaway introuvable.', flags: MessageFlags.Ephemeral })
      if (g.ended) return interaction.reply({ content: 'Ce giveaway est déjà terminé.', flags: MessageFlags.Ephemeral })

      // Vérif rôle requis
      if (g.requiredRoleId && !interaction.member.roles.cache.has(g.requiredRoleId)) {
        return interaction.reply({
          content: `Il vous faut le rôle <@&${g.requiredRoleId}> pour participer.`,
          flags: MessageFlags.Ephemeral,
        })
      }

      // Vérif invitations requises
      if (g.requiredInvites > 0) {
        const total = getTotal(interaction.guild.id, interaction.user.id)
        if (total < g.requiredInvites) {
          return interaction.reply({
            content: `Il vous faut **${g.requiredInvites}** invitations pour participer (vous en avez **${total}**).`,
            flags: MessageFlags.Ephemeral,
          })
        }
      }

      g.participants = g.participants || []
      if (g.participants.includes(interaction.user.id)) {
        g.participants = g.participants.filter(p => p !== interaction.user.id)
        gdb.set(id, g)
        return interaction.reply({ content: 'Vous avez quitté le giveaway.', flags: MessageFlags.Ephemeral })
      }

      g.participants.push(interaction.user.id)
      gdb.set(id, g)

      // Mettre à jour le nombre de participants dans l'embed
      try {
        const { buildEmbed, buildRow } = require('../../commands/giveaway')
        const msg = await interaction.channel.messages.fetch(g.messageId).catch(() => null)
        if (msg) {
          msg.edit({ embeds: [buildEmbed(g, g.participants)], components: [buildRow(g, false)] }).catch(() => false)
        }
      } catch { /* ignore */ }

      return interaction.reply({
        content: `Vous participez au giveaway pour **${g.prize}** ! Bonne chance.`,
        flags: MessageFlags.Ephemeral,
      })
    }
  }

  // ── Select menus ────────────────────────────────────────────
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'help_select') {
      // handled inline by the collector in the help command
    }

    // Select menu du panneau de tickets v3
    if (interaction.customId === 'tkt:select-type') {
      const gid    = interaction.guild?.id
      if (!gid) return
      const config = tktCfg(gid)
      if (config.enabled === false)
        return interaction.reply({ content: '❌ Le système de tickets est désactivé.', flags: MessageFlags.Ephemeral })
      const typeId   = interaction.values[0]
      const typeData = (config.types || []).find(t => t.id === typeId) || null
      return interaction.showModal(buildOpenModal(typeId, typeData?.label))
    }

    // Self-roles select menu
    if (interaction.customId.startsWith('selfrole_')) {
      const panelId = interaction.customId.replace('selfrole_', '')
      const panels  = db.get(`selfroles_${interaction.guild.id}`) || {}
      const panel   = panels[panelId]
      if (!panel) return interaction.reply({ content: 'Panneau introuvable.', flags: MessageFlags.Ephemeral })

      await interaction.deferReply({ flags: MessageFlags.Ephemeral })

      const selected = interaction.values
      const allRoleIds = panel.roles.map(r => r.id)
      const member = interaction.member

      const toAdd    = selected.filter(id => !member.roles.cache.has(id))
      const toRemove = allRoleIds.filter(id => !selected.includes(id) && member.roles.cache.has(id))

      const added = [], removed = []
      for (const id of toAdd) {
        const success = await member.roles.add(id, 'Self-role').then(() => true).catch(() => false)
        if (success) added.push(id)
      }
      for (const id of toRemove) {
        const success = await member.roles.remove(id, 'Self-role').then(() => true).catch(() => false)
        if (success) removed.push(id)
      }

      let reply = ''
      if (added.length > 0)   reply += `**Ajoutés :** ${added.map(id => `<@&${id}>`).join(', ')}\n`
      if (removed.length > 0) reply += `**Retirés :** ${removed.map(id => `<@&${id}>`).join(', ')}\n`
      if (!reply) reply = 'Aucun changement.'

      return interaction.editReply({ content: reply.trim() })
    }
  }
  } catch (err) {
    console.error('[INTERACTION ERROR]', err)
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Une erreur interne est survenue.', flags: 64 })
      } else if (interaction.deferred) {
        await interaction.editReply({ content: '❌ Une erreur interne est survenue.' })
      }
    } catch {}
  }
}
