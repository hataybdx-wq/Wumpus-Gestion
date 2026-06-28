// ============================================================
//  Commande : dashboard — Tableau de bord premium
//  Electron Gestion
//
//  Design moderne avec :
//  - Header avec thumbnail du serveur
//  - Sections visuellement séparées
//  - Indicateurs colorés (● actif / ○ inactif)
//  - Boutons d'action rapide par page
//  - Navigation fluide par select menu
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  SectionBuilder, ThumbnailBuilder,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ButtonBuilder, ButtonStyle,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

const COLOR       = 0xFF0000
const COLOR_OK    = 0x57F287
const COLOR_WARN  = 0xFEE75C
const COLOR_OFF   = 0xED4245

// Indicateurs visuels
const DOT_ON   = '🟢'
const DOT_OFF  = '⚫'
const DOT_WARN = '🟡'

// ── Helpers ────────────────────────────────────────────────────

function statusLine(on, label) {
  return `${on ? DOT_ON : DOT_OFF} **${label}**`
}

function kv(label, value) {
  return `\u200b \u200b ${label} ${value}`
}

// ── PAGES ──────────────────────────────────────────────────────

function pageOverview(guild, prefix) {
  const gid = guild.id

  const systems = [
    { on: db.get(`secur_${gid}`) === true,               label: 'Sécurité Max' },
    { on: !!db.get(`tickets_${gid}`),                    label: 'Tickets' },
    { on: db.get(`config_${gid}`)?.active === true,      label: 'Invitations' },
    { on: (db.get(`autoroles_${gid}`) || []).length > 0, label: 'Auto-rôles' },
    { on: Object.keys(db.get(`selfroles_${gid}`) || {}).length > 0, label: 'Self-roles' },
    { on: (db.get(`statschan_${gid}`) || []).length > 0, label: 'Stats channels' },
    { on: (db.get(`${gid}.greets`) || []).length > 0,    label: 'Ghost ping' },
    { on: db.get(`tag_${gid}`)?.active === true,         label: 'Tag pseudo' },
    { on: db.get(`${gid}.support.active`) === true,      label: 'Soutien' },
    { on: db.get(`public_mode_${gid}`) === true,         label: 'Mode public' },
  ]

  const active = systems.filter(s => s.on).length
  const total  = systems.length
  const pct    = Math.round((active / total) * 100)
  const bar    = '▰'.repeat(Math.round((active / total) * 10)) + '▱'.repeat(10 - Math.round((active / total) * 10))

  const members = guild.memberCount
  const humans  = guild.members.cache.filter(m => !m.user.bot).size
  const bots    = guild.members.cache.filter(m => m.user.bot).size
  const channels = guild.channels.cache.size
  const roles   = guild.roles.cache.size

  // Deux colonnes de systèmes
  const col1 = systems.slice(0, 5).map(s => statusLine(s.on, s.label)).join('\n')
  const col2 = systems.slice(5).map(s => statusLine(s.on, s.label)).join('\n')

  return {
    title: 'Vue d\'ensemble',
    subtitle: `${active}/${total} systèmes actifs`,
    header: true,
    sections: [
      {
        heading: 'Statistiques du serveur',
        content:
          `\u200b \u200b ${kv('Membres', `**${members}**`)}  \u200b·\u200b  ${kv('Humains', `**${humans}**`)}  \u200b·\u200b  ${kv('Bots', `**${bots}**`)}\n` +
          `\u200b \u200b ${kv('Salons', `**${channels}**`)}  \u200b·\u200b  ${kv('Rôles', `**${roles}**`)}  \u200b·\u200b  ${kv('Boosts', `**${guild.premiumSubscriptionCount || 0}**`)}`,
      },
      {
        heading: `Activité des systèmes · ${pct}%`,
        content: `\`${bar}\`\n\n**${col1}**\n\n${col2}`,
      },
    ],
    actions: [
      { id: 'dash_goto_security', label: 'Sécurité',    style: ButtonStyle.Danger },
      { id: 'dash_goto_tickets',  label: 'Tickets',      style: ButtonStyle.Primary },
      { id: 'dash_goto_roles',    label: 'Rôles',        style: ButtonStyle.Secondary },
    ],
  }
}

function pageSecurity(guild, prefix) {
  const gid = guild.id
  const securMax    = db.get(`secur_${gid}`) === true
  const defSanction = db.get(`sanctions.${gid}.default`) || 'kick'

  const PROTECTIONS = [
    ['bans',            'Anti-Ban',            'ban'],
    ['kick',            'Anti-Kick',           'kick'],
    ['bots',            'Anti-Bot',            'bot'],
    ['spam',            'Anti-Spam',           'spam'],
    ['link',            'Anti-Lien',           'link'],
    ['massbans',        'Anti-MassBan',        'massban'],
    ['masskick',        'Anti-MassKick',       'masskick'],
    ['massping',        'Anti-Masse-Mention',  'massmention'],
    ['channels',        'Anti-Channel',        'channel'],
    ['antiguildupdate', 'Anti-Guild-Update',   'guildupdate'],
  ]

  const col1 = PROTECTIONS.slice(0, 6).map(([key, label]) => {
    const on = db.get(`${key}_${gid}`) === true
    return `${on ? DOT_ON : DOT_OFF} ${label}`
  }).join('\n')

  const col2 = PROTECTIONS.slice(6).map(([key, label]) => {
    const on = db.get(`${key}_${gid}`) === true
    return `${on ? DOT_ON : DOT_OFF} ${label}`
  }).join('\n')

  const activeCount = PROTECTIONS.filter(([key]) => db.get(`${key}_${gid}`) === true).length

  const modeIcon = securMax ? '🔴' : (activeCount > 0 ? '🟡' : '⚫')
  const modeLbl  = securMax ? 'SECUR-MAX' : (activeCount > 0 ? 'Standard' : 'Désactivé')
  const modeDesc = securMax
    ? 'Admins Discord **non exempts** · Seuls le propriétaire et le bot owner sont épargnés'
    : activeCount > 0
      ? 'Admins Discord **exempts** · Protection standard'
      : 'Aucune protection active sur ce serveur'

  return {
    title: 'Sécurité',
    subtitle: `${activeCount}/${PROTECTIONS.length} protections actives`,
    sections: [
      {
        heading: `Mode ${modeIcon} ${modeLbl}`,
        content: `${modeDesc}\n\n**Sanction par défaut :** \`${defSanction}\``,
      },
      {
        heading: 'Protections',
        content: `**${col1}**\n\n${col2}`,
      },
      {
        heading: 'Commandes',
        content:
          `\`${prefix}secur-max\` · Toutes protections (admins non exempts)\n` +
          `\`${prefix}secur-on\` · Protection standard\n` +
          `\`${prefix}set-sanction list\` · Configurer sanctions & seuils`,
      },
    ],
    actions: [
      { id: 'dash_secur_max',  label: 'Activer SECUR-MAX', style: ButtonStyle.Danger,    disabled: securMax },
      { id: 'dash_secur_on',   label: 'Protection standard', style: ButtonStyle.Primary,  disabled: !securMax && activeCount > 0 },
      { id: 'dash_secur_off',  label: 'Tout désactiver',     style: ButtonStyle.Secondary,disabled: activeCount === 0 && !securMax },
    ],
  }
}

function pageTickets(guild, prefix) {
  const gid = guild.id
  const cfg = db.get(`tickets_${gid}`)

  if (!cfg) {
    return {
      title: 'Tickets',
      subtitle: 'Non configuré',
      sections: [
        {
          heading: 'Système de tickets',
          content:
            `Le système de tickets n'est pas encore configuré sur ce serveur.\n\n` +
            `**Setup rapide** — crée automatiquement catégorie + salons + panneau :\n` +
            `> \`${prefix}ticket-quick [@rôle_staff]\`\n\n` +
            `**Setup manuel** — configuration étape par étape :\n` +
            `> \`${prefix}ticket-setup info\``,
        },
      ],
      actions: [],
    }
  }

  const openTickets = Object.keys(db.get(`tickets_open_${gid}`) || {}).length

  const check = (v) => v ? DOT_ON : DOT_OFF
  const configStatus =
    `${check(cfg.panelChannelId)} Salon panneau\n` +
    `${check(cfg.categoryId)} Catégorie\n` +
    `${check(cfg.logsChannelId)} Salon de logs\n` +
    `${check(cfg.staffRoleId)} Rôle staff`

  const options =
    `${check(cfg.transcript)} Transcripts HTML\n` +
    `${check(cfg.mention)} Mention du staff\n` +
    `${cfg.maxOpen || 1}× Max par membre\n` +
    `${(cfg.types || []).length}× Types de tickets`

  return {
    title: 'Tickets',
    subtitle: `${openTickets} ticket${openTickets !== 1 ? 's' : ''} ouvert${openTickets !== 1 ? 's' : ''}`,
    sections: [
      {
        heading: 'Configuration',
        content: `**${configStatus}**\n\n**Options**\n${options}`,
      },
      {
        heading: 'Salons',
        content:
          `**Panneau** ${cfg.panelChannelId ? `<#${cfg.panelChannelId}>` : '—'}\n` +
          `**Catégorie** ${cfg.categoryId ? `<#${cfg.categoryId}>` : '—'}\n` +
          `**Logs** ${cfg.logsChannelId ? `<#${cfg.logsChannelId}>` : '—'}\n` +
          `**Staff** ${cfg.staffRoleId ? `<@&${cfg.staffRoleId}>` : '—'}`,
      },
      {
        heading: 'Commandes',
        content:
          `\`${prefix}ticket-setup info\` · Configuration complète\n` +
          `\`${prefix}ticket-setup panel\` · Renvoyer le panneau\n` +
          `\`${prefix}ticket-list\` · Voir tous les tickets ouverts`,
      },
    ],
    actions: [],
  }
}

function pageModeration(guild, prefix) {
  const gid = guild.id
  const warns = db.get(`warns_${gid}`) || {}
  const cases = db.get(`cases_${gid}`) || {}
  const warnRules = db.get(`warnrules_${gid}`) || {}

  // Statistiques globales
  let totalWarns = 0
  let membersWithWarns = 0
  for (const [uid, list] of Object.entries(warns)) {
    if (list && list.length > 0) {
      totalWarns += list.length
      membersWithWarns++
    }
  }

  let totalCases = 0
  for (const [uid, list] of Object.entries(cases)) {
    if (list && list.length > 0) totalCases += list.length
  }

  // Top 5 warns
  const topWarns = Object.entries(warns)
    .map(([uid, list]) => [uid, list?.length || 0])
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const topWarnsText = topWarns.length > 0
    ? topWarns.map(([uid, n]) => `<@${uid}> · **${n}** warn${n > 1 ? 's' : ''}`).join('\n')
    : '_Aucun membre averti_'

  // Règles auto-sanction
  const rulesEntries = Object.entries(warnRules).sort(([a], [b]) => parseInt(a) - parseInt(b))
  const rulesText = rulesEntries.length > 0
    ? rulesEntries.map(([count, action]) => {
        const label = action === 'mute' ? 'Timeout 1h' : action === 'kick' ? 'Expulsion' : 'Bannissement'
        return `**${count} warn${count > 1 ? 's' : ''}** → ${label}`
      }).join('\n')
    : '_Aucune règle auto-sanction_'

  return {
    title: 'Modération',
    subtitle: `${totalWarns} warns · ${totalCases} cas`,
    sections: [
      {
        heading: 'Statistiques globales',
        content:
          `**${totalWarns}** warns sur **${membersWithWarns}** membre${membersWithWarns > 1 ? 's' : ''}\n` +
          `**${totalCases}** cas de modération au total`,
      },
      {
        heading: `Top warns · ${topWarns.length}`,
        content: topWarnsText,
      },
      {
        heading: 'Règles d\'auto-sanction',
        content: rulesText,
      },
      {
        heading: 'Commandes',
        content:
          `\`${prefix}warn @m <raison>\` · Avertir un membre\n` +
          `\`${prefix}warns @m\` · Historique des warns\n` +
          `\`${prefix}unwarn @m <id>\` · Retirer un warn\n` +
          `\`${prefix}clearwarns @m\` · Tout effacer\n` +
          `\`${prefix}warnsetup <N> <action>\` · Règle auto-sanction\n` +
          `\`${prefix}cases @m\` · Historique complet de modération`,
      },
    ],
    actions: [],
  }
}

function pageInvites(guild, prefix) {
  const gid = guild.id
  const cfg = db.get(`config_${gid}`) || {}

  const paliers = cfg.milestoneRoles || []
  const dmConfigured = !!cfg.dmMessage

  const status =
    `${cfg.active ? DOT_ON : DOT_OFF} Tracking des invitations\n` +
    `${cfg.logsChannelId ? DOT_ON : DOT_OFF} Salon join/leave\n` +
    `${dmConfigured ? DOT_ON : DOT_OFF} DM aux paliers\n` +
    `${paliers.length > 0 ? DOT_ON : DOT_OFF} Rôles par palier`

  const palierList = paliers.length > 0
    ? paliers.map(r => `**${r.count}** invitations → <@&${r.roleId}>`).join('\n')
    : '_Aucun palier configuré_'

  return {
    title: 'Invitations',
    subtitle: cfg.active ? 'Tracking actif' : 'Tracking inactif',
    sections: [
      {
        heading: 'État',
        content: `**${status}**`,
      },
      {
        heading: `Paliers de rôles · ${paliers.length}`,
        content: palierList,
      },
      {
        heading: 'Configuration actuelle',
        content:
          `**Salon** ${cfg.logsChannelId ? `<#${cfg.logsChannelId}>` : '—'}\n` +
          `**DM** ${dmConfigured ? '_Configuré_' : '—'}`,
      },
      {
        heading: 'Commandes',
        content:
          `\`${prefix}invite-setup channel #salon\` · Salon join/leave\n` +
          `\`${prefix}invite-setup role <n> @rôle\` · Ajouter un palier\n` +
          `\`${prefix}invite-setup dm <message>\` · Message DM\n` +
          `\`${prefix}invites top\` · Classement des inviteurs`,
      },
    ],
    actions: [
      { id: 'dash_invites_toggle', label: cfg.active ? 'Désactiver' : 'Activer', style: cfg.active ? ButtonStyle.Secondary : ButtonStyle.Success },
    ],
  }
}

function pageRoles(guild, prefix) {
  const gid = guild.id
  const autoroles = db.get(`autoroles_${gid}`) || []
  const selfroles = Object.values(db.get(`selfroles_${gid}`) || {})

  const autorolesList = autoroles.length > 0
    ? autoroles.map(id => `<@&${id}>`).join(' ')
    : '_Aucun auto-rôle_'

  const selfrolesList = selfroles.length > 0
    ? selfroles.map(p => {
        const sent = p.channelId ? `<#${p.channelId}>` : '_non envoyé_'
        return `**${p.title}** · \`${p.id}\`\n-# ${p.roles.length} rôle(s) · ${sent}`
      }).join('\n\n')
    : '_Aucun panneau créé_'

  return {
    title: 'Rôles',
    subtitle: `${autoroles.length} auto-rôles · ${selfroles.length} panneaux`,
    sections: [
      {
        heading: `Auto-rôles à l'arrivée · ${autoroles.length}`,
        content: autorolesList,
      },
      {
        heading: `Panneaux de self-roles · ${selfroles.length}`,
        content: selfrolesList,
      },
      {
        heading: 'Gestion en masse',
        content:
          `\`${prefix}role-all @rôle\` · Ajouter un rôle à tous\n` +
          `\`${prefix}unrole-all @rôle\` · Retirer un rôle à tous`,
      },
      {
        heading: 'Commandes',
        content:
          `\`${prefix}autorole\` · Interface auto-rôles\n` +
          `\`${prefix}selfroles create <titre>\` · Créer un panneau`,
      },
    ],
    actions: [],
  }
}

function pageEngagement(guild, prefix) {
  const gid = guild.id
  const tag = db.get(`tag_${gid}`) || {}
  const greets = db.get(`${gid}.greets`) || []
  const stats = db.get(`statschan_${gid}`) || []
  const support = db.get(`${gid}.support`) || {}
  const welcome = db.get(`welcome_${gid}`) || {}
  const ars = db.get(`autoresponders_${gid}`) || {}
  const warnRules = db.get(`warnrules_${gid}`) || {}

  const welcomeOn = !!(welcome.welcome_channel && welcome.welcome_message)
  const goodbyeOn = !!(welcome.goodbye_channel && welcome.goodbye_message)

  const status =
    `${welcomeOn ? DOT_ON : DOT_OFF} Message d'arrivée\n` +
    `${goodbyeOn ? DOT_ON : DOT_OFF} Message de départ\n` +
    `${greets.length > 0 ? DOT_ON : DOT_OFF} Ghost ping (${greets.length} salon${greets.length > 1 ? 's' : ''})\n` +
    `${tag.active ? DOT_ON : DOT_OFF} Tag pseudo\n` +
    `${stats.length > 0 ? DOT_ON : DOT_OFF} Stats channels (${stats.length})\n` +
    `${support.active ? DOT_ON : DOT_OFF} Soutien par statut\n` +
    `${Object.keys(ars).length > 0 ? DOT_ON : DOT_OFF} Auto-réponses (${Object.keys(ars).length})\n` +
    `${Object.keys(warnRules).length > 0 ? DOT_ON : DOT_OFF} Règles auto-warns`

  const details = []
  if (welcomeOn)  details.push(`**Welcome** · <#${welcome.welcome_channel}>`)
  if (goodbyeOn)  details.push(`**Goodbye** · <#${welcome.goodbye_channel}>`)
  if (greets.length > 0) details.push(`**Ghost ping** · ${greets.slice(0, 5).map(id => `<#${id}>`).join(' ')}${greets.length > 5 ? ` +${greets.length - 5}` : ''}`)
  if (tag.active) details.push(`**Tag pseudo** · \`${tag.text}\` → <@&${tag.roleId}>`)
  if (stats.length > 0) details.push(`**Stats** · ${[...new Set(stats.map(s => s.type))].join(' · ')}`)
  if (support.active) details.push(`**Soutien** · \`${support.text}\` → <@&${support.roleId}>`)
  if (Object.keys(ars).length > 0) details.push(`**Auto-réponses** · ${Object.keys(ars).slice(0, 5).map(k => `\`${k}\``).join(' ')}`)

  return {
    title: 'Engagement',
    subtitle: `${[welcomeOn, goodbyeOn, greets.length > 0, tag.active, stats.length > 0, support.active, Object.keys(ars).length > 0].filter(Boolean).length}/7 systèmes actifs`,
    sections: [
      {
        heading: 'État des systèmes',
        content: `**${status}**`,
      },
      {
        heading: 'Configuration',
        content: details.length > 0 ? details.join('\n\n') : '_Aucun système configuré_',
      },
      {
        heading: 'Commandes',
        content:
          `\`${prefix}welcome info\` · Messages d'arrivée/départ\n` +
          `\`${prefix}ghostjoin add #salon\` · Ghost ping à l'arrivée\n` +
          `\`${prefix}tag-setup @rôle <texte>\` · Tag pseudo\n` +
          `\`${prefix}stats-channels setup\` · Salons stats auto\n` +
          `\`${prefix}ar add <trigger> | <réponse>\` · Auto-réponses\n` +
          `\`${prefix}warnsetup <N> <action>\` · Auto-sanctions`,
      },
    ],
    actions: [],
  }
}

// ── PAGES REGISTRY ─────────────────────────────────────────────
const PAGES = {
  overview:   { label: 'Vue d\'ensemble', desc: 'État général du serveur',          build: pageOverview },
  security:   { label: 'Sécurité',       desc: 'Protections et sanctions',         build: pageSecurity },
  moderation: { label: 'Modération',     desc: 'Warns, cases, historique',         build: pageModeration },
  tickets:    { label: 'Tickets',        desc: 'Système de support',                build: pageTickets },
  invites:    { label: 'Invitations',    desc: 'Tracking et paliers de rôles',     build: pageInvites },
  roles:      { label: 'Rôles',          desc: 'Auto-rôles et self-roles',         build: pageRoles },
  engagement: { label: 'Engagement',     desc: 'Welcome, ghost ping, tags, stats', build: pageEngagement },
}

// ── BUILDER ────────────────────────────────────────────────────

function buildContainer(guild, pageKey, prefix, userId) {
  const page = PAGES[pageKey] || PAGES.overview
  const data = page.build(guild, prefix)

  const container = new ContainerBuilder().setAccentColor(COLOR)

  // Header avec icône du serveur
  const iconURL = guild.iconURL({ size: 256, extension: 'png' })
  if (iconURL) {
    container.addSectionComponents(sec => sec
      .addTextDisplayComponents(
        td => td.setContent(
          `## Dashboard Electron\n` +
          `### ${guild.name}\n` +
          `-# ${data.title} · ${data.subtitle || ''}`
        )
      )
      .setThumbnailAccessory(
        thumb => thumb.setURL(iconURL)
      )
    )
  } else {
    container.addTextDisplayComponents(td => td.setContent(
      `## Dashboard Electron\n` +
      `### ${guild.name}\n` +
      `-# ${data.title} · ${data.subtitle || ''}`
    ))
  }

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Sections
  data.sections.forEach((section, i) => {
    container.addTextDisplayComponents(td => td.setContent(
      `### ${section.heading}\n${section.content}`
    ))
    if (i < data.sections.length - 1) {
      container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))
    }
  })

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Navigation select
  const select = new StringSelectMenuBuilder()
    .setCustomId(`dash_${userId}`)
    .setPlaceholder(`${PAGES[pageKey].label} — Changer de section`)
    .addOptions(
      Object.entries(PAGES).map(([key, page]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(page.label)
          .setValue(key)
          .setDescription(page.desc)
          .setDefault(key === pageKey)
      )
    )

  container.addActionRowComponents(row => row.setComponents(select))

  // Action buttons (si la page en a)
  if (data.actions && data.actions.length > 0) {
    const actionRow = new ActionRowBuilder()
    data.actions.forEach(a => {
      const btn = new ButtonBuilder()
        .setCustomId(`${a.id}_${userId}`)
        .setLabel(a.label)
        .setStyle(a.style)
      if (a.disabled) btn.setDisabled(true)
      actionRow.addComponents(btn)
    })
    container.addActionRowComponents(() => actionRow)
  }

  container.addTextDisplayComponents(td => td.setContent(
    `-# Electron Gestion · \`${prefix}dashboard\` · Mis à jour · <t:${Math.floor(Date.now() / 1000)}:R>`
  ))

  return container
}

// ── MODULE ─────────────────────────────────────────────────────
module.exports = {
  name: 'dashboard',
  description: 'Tableau de bord central du serveur',
  aliases: ['dash', 'panel', 'admin'],
  buildContainer,

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const msg = await message.reply({
      components: [buildContainer(message.guild, 'overview', prefix, message.author.id)],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null)
    if (!msg) return

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 300000,
    })

    col.on('collect', async i => {
      // Select menu navigation
      if (i.isStringSelectMenu() && i.customId.startsWith('dash_')) {
        return i.update({
          components: [buildContainer(message.guild, i.values[0], prefix, message.author.id)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
      }

      // Boutons d'actions rapides
      if (!i.isButton()) return

      const gid = message.guild.id
      let feedback = null
      let jumpTo   = null

      if (i.customId.startsWith('dash_secur_max_')) {
        // Activer SECUR-MAX
        const PROT = ['bans','kick','bots','spam','link','massbans','masskick','massping','channels','antiguildupdate']
        for (const k of PROT) db.set(`${k}_${gid}`, true)
        db.set(`secur_${gid}`, true)
        feedback = 'SECUR-MAX activé — toutes les protections sont en place.'
        jumpTo = 'security'
      }
      else if (i.customId.startsWith('dash_secur_on_')) {
        const PROT = ['bots','spam','link','massbans','masskick','massping','antiguildupdate']
        for (const k of PROT) db.set(`${k}_${gid}`, true)
        db.set(`secur_${gid}`, false)
        db.set(`channels_${gid}`, false)
        db.set(`bans_${gid}`, false)
        db.set(`kick_${gid}`, false)
        feedback = 'Protection standard activée.'
        jumpTo = 'security'
      }
      else if (i.customId.startsWith('dash_secur_off_')) {
        const ALL = ['bans','kick','bots','spam','link','massbans','masskick','massping','channels','antiguildupdate']
        for (const k of ALL) db.set(`${k}_${gid}`, false)
        db.set(`secur_${gid}`, false)
        feedback = 'Toutes les protections ont été désactivées.'
        jumpTo = 'security'
      }
      else if (i.customId.startsWith('dash_invites_toggle_')) {
        const cfg = db.get(`config_${gid}`) || { active: false }
        cfg.active = !cfg.active
        db.set(`config_${gid}`, cfg)
        feedback = cfg.active ? 'Tracking des invitations activé.' : 'Tracking désactivé.'
        jumpTo = 'invites'
      }
      else if (i.customId.startsWith('dash_goto_')) {
        const target = i.customId.replace('dash_goto_', '').split('_')[0]
        jumpTo = target
      }

      if (jumpTo) {
        await i.update({
          components: [buildContainer(message.guild, jumpTo, prefix, message.author.id)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => false)
        if (feedback) {
          await i.followUp({ content: feedback, flags: 64 }).catch(() => false)
        }
      }
    })

    col.on('end', () => {
      msg.edit({
        components: [new ContainerBuilder().setAccentColor(COLOR)
          .addTextDisplayComponents(td => td.setContent(
            `## Dashboard Electron\n-# Session expirée · \`${prefix}dashboard\` pour rouvrir`
          ))],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => false)
    })
  },
}
