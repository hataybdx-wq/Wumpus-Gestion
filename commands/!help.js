// ============================================================
//  Commande : help — Interface premium
//  Electron Gestion
//
//  Design moderne avec :
//  - Header avec thumbnail du bot
//  - Sections visuellement groupées
//  - Icônes de section et navigation
//  - Boutons d'action rapide (support, inviter, dashboard)
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  SectionBuilder, ThumbnailBuilder,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

const COLOR      = 0xFF0000
const SUPPORT    = 'https://discord.gg/n64X38d8'
const BOT_INVITE = 'https://discord.com/oauth2/authorize?client_id=1494736949985021952&permissions=8&integration_type=0&scope=bot'

// ── Données des catégories ────────────────────────────────────

const CATS = {
  info: {
    label: 'Informations',
    desc: 'Support, invitation, dashboard',
    tagline: 'Prise en main du bot',
    sections: (p, c) => [
      {
        heading: 'Nouveau ici ?',
        content:
          `**\`${p}setup\`** — Assistant de configuration complet (guidé)\n` +
          `-# Sécurité, logs, tickets, invitations en quelques clics.\n\n` +
          `**\`${p}dashboard\`** — Tableau de bord complet du serveur\n` +
          `**\`${p}help\`** — Ce menu\n` +
          `**\`${p}helpall\`** — Liste exhaustive (commande admin)`,
      },
      {
        heading: 'Commandes basiques',
        content:
          `\`${p}ping\` · \`${p}stat\` · \`${p}uptime\` · \`${p}latency\`\n` +
          `\`${p}patch-note\` · \`${p}join\` · \`${p}invite\``,
      },
    ],
    showLinks: true,
  },

  security: {
    label: 'Sécurité',
    desc: 'Anti-raid, anti-spam, whitelist',
    tagline: 'Protéger votre serveur',
    sections: (p) => [
      {
        heading: 'Modes de sécurité',
        content:
          `\`${p}secur-max\` — Mode maximal (seul owner exempt)\n` +
          `\`${p}secur-on\` · \`${p}secur-off\` — Activer/désactiver\n` +
          `\`${p}secur\` — État actuel`,
      },
      {
        heading: 'Protections individuelles',
        content:
          `\`${p}antiraid\` \`${p}antibot\` \`${p}antilink\`\n` +
          `\`${p}antiban\` \`${p}antikick\`\n` +
          `\`${p}antimassban\` \`${p}antimasskick\`\n` +
          `\`${p}anti-masse-mention\` \`${p}antichannel\` \`${p}antiguildupdate\``,
      },
      {
        heading: 'Configuration',
        content:
          `\`${p}set-sanction <action> <ban/kick/mute>\` — Sanction\n` +
          `\`${p}set-sanction <action> seuil <n>\` — Seuil (spam min 3)\n` +
          `\`${p}spam on/off/seuil <n>\` — Anti-spam\n` +
          `\`${p}sanction\` — Voir toutes les sanctions`,
      },
      {
        heading: 'Whitelist',
        content:
          `\`${p}wl add/remove/list @m\` — Gérer la whitelist\n` +
          `\`${p}wl-strict on/off\` — Seul l'owner passe`,
      },
    ],
  },

  moderation: {
    label: 'Modération',
    desc: 'Ban, kick, mute, warns',
    tagline: 'Garder le serveur propre',
    sections: (p) => [
      {
        heading: 'Sanctions',
        content:
          `\`${p}ban @m [raison]\` · \`${p}tempban @m <durée>\`\n` +
          `\`${p}unban <ID>\` · \`${p}gban @m\` · \`${p}gunban <ID>\`\n` +
          `\`${p}kick @m\` · \`${p}mute @m <durée>\` · \`${p}timeout @m <durée>\`\n` +
          `\`${p}unmute @m\``,
      },
      {
        heading: 'Avertissements',
        content:
          `\`${p}warn @m <raison>\` — Avec DM + historique\n` +
          `\`${p}warns @m\` · \`${p}unwarn @m <id>\` · \`${p}clearwarns @m\`\n` +
          `\`${p}warnsetup <N> <mute/kick/ban>\` — Auto-sanction\n` +
          `\`${p}cases @m\` — Historique complet de modération`,
      },
      {
        heading: 'Salon & Messages',
        content:
          `\`${p}clear <1-100>\` · \`${p}prune @m <1-100>\` · \`${p}snipe\`\n` +
          `\`${p}slowmode <durée>\` · \`${p}unslow\`\n` +
          `\`${p}lock\` · \`${p}unlock\` · \`${p}lockall\` · \`${p}unlockall\`\n` +
          `\`${p}hide\` · \`${p}unhide\` · \`${p}renew\``,
      },
      {
        heading: 'Vocal & Rôles',
        content:
          `\`${p}vmute @m\` · \`${p}vunmute @m\` · \`${p}vkick @m\`\n` +
          `\`${p}role-all @rôle [humans/bots]\` — À tous les membres\n` +
          `\`${p}unrole-all @rôle\``,
      },
    ],
  },

  management: {
    label: 'Gestion serveur',
    desc: 'Salons, rôles, emojis, vocaux',
    tagline: 'Administrer le serveur',
    sections: (p) => [
      {
        heading: 'Salons',
        content:
          `\`${p}createchannel <nom>\` · \`${p}createvoice <nom>\`\n` +
          `\`${p}clone\` · \`${p}nuke confirm\` · \`${p}rename <nom>\`\n` +
          `\`${p}delchannel confirm <id>\` · \`${p}topic <sujet>\``,
      },
      {
        heading: 'Rôles',
        content:
          `\`${p}createrole <nom>\`\n` +
          `\`${p}addrole @m @rôle\` · \`${p}removerole @m @rôle\`\n` +
          `\`${p}inrole @rôle\` · \`${p}nick @m [surnom]\``,
      },
      {
        heading: 'Emojis',
        content:
          `\`${p}stealemoji <emoji> [nom]\` — Voler d'un autre serveur\n` +
          `\`${p}delemoji <emoji>\` · \`${p}renameemoji <emoji> <nom>\``,
      },
      {
        heading: 'Vocal & Communication',
        content:
          `\`${p}move @m <vocal>\` · \`${p}moveall <vocal>\`\n` +
          `\`${p}dcall\` · \`${p}vjoin <vocal>\`\n` +
          `\`${p}say <message>\` · \`${p}sayembed <texte>\`\n` +
          `\`${p}embed [#salon]\` — Créateur d'embed avec modal`,
      },
    ],
  },

  tickets_invites: {
    label: 'Tickets & Invitations',
    desc: 'Support et tracking',
    tagline: 'Engager la communauté',
    sections: (p) => [
      {
        heading: 'Tickets',
        content:
          `**\`${p}ticket-setup\`** — Interface complète avec setup automatique\n` +
          `-# Créer catégorie + rôle + message en 1 clic !\n\n` +
          `\`${p}ticket-add @m\` · \`${p}ticket-remove @m\`\n` +
          `\`${p}ticket-close\` · \`${p}ticket-claim\` · \`${p}ticket-list\``,
      },
      {
        heading: 'Invitations',
        content:
          `**\`${p}invite-setup\`** — Panneau de configuration\n` +
          `-# Salon, message DM, paliers de rôles\n\n` +
          `**\`${p}invites\`** — Vos stats d'invitations\n` +
          `\`${p}invites @m\` — Stats d'un membre\n` +
          `\`${p}invites top\` — Classement avec pagination`,
      },
      {
        heading: 'Giveaways',
        content:
          `**\`${p}giveaway create <durée> <nb> <prix>\`** — Lancer\n` +
          `-# Ex: ${p}giveaway create 1h 2 Nitro Classic\n\n` +
          `\`${p}giveaway end <id>\` — Terminer\n` +
          `\`${p}giveaway reroll <id>\` — Nouveau gagnant\n` +
          `\`${p}giveaway list\` — Liste des giveaways`,
      },
    ],
  },

  engagement: {
    label: 'Engagement',
    desc: 'Welcome, auto-rôles, stats, embeds',
    tagline: 'Activer la communauté',
    sections: (p) => [
      {
        heading: 'Welcome & Goodbye',
        content:
          `**\`${p}welcome info\`** — Interface complète\n` +
          `\`${p}welcome channel #salon\` · \`${p}welcome message <texte>\`\n` +
          `\`${p}welcome dm <texte>\` · \`${p}goodbye channel/message\`\n` +
          `-# Variables : \`{user}\` \`{mention}\` \`{server}\` \`{count}\``,
      },
      {
        heading: 'Auto-réponses & Rôles',
        content:
          `\`${p}ar add <trigger> | <réponse>\` — Auto-réponse\n` +
          `\`${p}ar remove\` · \`${p}ar list\`\n` +
          `\`${p}autorole add/remove @rôle\` — Rôle à l'arrivée\n` +
          `\`${p}selfroles create/add/panel\` — Panneaux`,
      },
      {
        heading: 'Stats & Autres',
        content:
          `\`${p}stats-channels setup\` — 4 salons auto\n` +
          `\`${p}ghostjoin add #salon\` — Ping fantôme\n` +
          `\`${p}tag-setup @rôle <texte>\` — Tag pseudo\n` +
          `\`${p}poll <q> | <opt1> | <opt2>\` — Sondage moderne\n` +
          `\`${p}support-setup @rôle <texte>\` — Rôle selon statut`,
      },
    ],
  },

  info_utils: {
    label: 'Info & Utilitaires',
    desc: 'Informations et outils pratiques',
    tagline: 'Consulter les données',
    sections: (p) => [
      {
        heading: 'Infos membres',
        content:
          `\`${p}userinfo [@m]\` · \`${p}avatar [@m]\` · \`${p}banner [@m]\`\n` +
          `\`${p}age [@m]\` · \`${p}joined [@m]\` · \`${p}prevnames [@m]\`\n` +
          `\`${p}whois <ID>\` · \`${p}perms [@m]\``,
      },
      {
        heading: 'Infos serveur',
        content:
          `\`${p}serveurinfo\` · \`${p}serverstats\` · \`${p}servericon\`\n` +
          `\`${p}channels\` · \`${p}channelinfo [#]\`\n` +
          `\`${p}rolelist\` · \`${p}roleinfo @rôle\`\n` +
          `\`${p}emojis\` · \`${p}emojiinfo <emoji>\`\n` +
          `\`${p}admins\` · \`${p}staff\` · \`${p}bots\` · \`${p}banlist\` · \`${p}boosters\` · \`${p}inactive\``,
      },
      {
        heading: 'Outils pratiques',
        content:
          `\`${p}calc <expression>\` · \`${p}password [len]\` (DM)\n` +
          `\`${p}timestamp\` · \`${p}dateinfo [date]\`\n` +
          `\`${p}color <#hex>\` · \`${p}randomcolor\`\n` +
          `\`${p}afk [raison]\` · \`${p}remindme <durée> <texte>\``,
      },
    ],
  },

  web: {
    label: 'Web & API',
    desc: 'Scraping, crypto, conversion, recherche',
    tagline: 'Services externes',
    sections: (p) => [
      {
        heading: 'Scraping & Preview',
        content:
          `**\`${p}scrapp <url>\`** — Preview d'une URL (OG/Twitter Card)\n` +
          `-# Titre, description, image, favicon\n\n` +
          `\`${p}wiki <terme>\` — Article Wikipédia\n` +
          `\`${p}urban <terme>\` — Urban Dictionary\n` +
          `\`${p}translate <langue> <texte>\` — Traduction`,
      },
      {
        heading: 'Crypto & Finance',
        content:
          `**\`${p}crypto <btc|eth|sol|...>\`** — Prix en temps réel\n` +
          `-# Rang, 24h/7j/30j, market cap, ATH\n\n` +
          `**\`${p}wallet <adresse>\`** — Solde ETH / BTC / SOL\n` +
          `-# Détection automatique du type + valeur USD/EUR\n\n` +
          `\`${p}fiat <montant> <de> <vers>\` — Convertir devise\n` +
          `\`${p}convert <val> <de> <vers>\` — Convertir unités`,
      },
      {
        heading: 'Dev & Réseau',
        content:
          `\`${p}github <user[/repo]>\` — Stats GitHub\n` +
          `\`${p}npm <package>\` — Infos npm\n` +
          `\`${p}steam <jeu>\` — Infos jeu Steam\n` +
          `\`${p}ip <ip|domaine>\` — Géolocalisation\n` +
          `\`${p}domain <domaine>\` — DNS lookup\n` +
          `\`${p}weather <ville>\` — Météo réelle\n` +
          `\`${p}speedtest\` — Latence Discord/Google/...`,
      },
      {
        heading: 'Tools',
        content:
          `\`${p}shorten <url>\` — Raccourcir URL\n` +
          `\`${p}qrcode <texte|url>\` — QR code\n` +
          `\`${p}hash <algo> <texte>\` — md5/sha1/sha256/sha512\n` +
          `\`${p}httpstatus <code>\` — Signification HTTP\n` +
          `\`${p}8ball <question>\` · \`${p}snipe\``,
      },
    ],
  },
}

// ── BUILDER ────────────────────────────────────────────────────

function buildContainer(client, pageKey, prefix, userId, isAdmin, keys) {
  const cat = CATS[pageKey] || CATS.info
  const data = cat.sections(prefix, client)

  const container = new ContainerBuilder().setAccentColor(COLOR)

  // Header avec thumbnail du bot
  const botAvatar = client.user.displayAvatarURL({ size: 256, extension: 'png' })

  container.addSectionComponents(sec => sec
    .addTextDisplayComponents(
      td => td.setContent(
        `## ${client.user.username}\n` +
        `### ${cat.label}\n` +
        `-# ${cat.tagline}`
      )
    )
    .setThumbnailAccessory(thumb => thumb.setURL(botAvatar))
  )

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Sections
  data.forEach((section, i) => {
    container.addTextDisplayComponents(td => td.setContent(
      `### ${section.heading}\n${section.content}`
    ))
    if (i < data.length - 1) {
      container.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))
    }
  })

  container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

  // Select menu de navigation
  const select = new StringSelectMenuBuilder()
    .setCustomId(`help_${userId}`)
    .setPlaceholder(`${cat.label} — Changer de catégorie`)
    .addOptions(
      keys.map(k => new StringSelectMenuOptionBuilder()
        .setLabel(CATS[k].label)
        .setValue(k)
        .setDescription(CATS[k].desc)
        .setDefault(k === pageKey)
      )
    )

  container.addActionRowComponents(row => row.setComponents(select))

  // Boutons liens (uniquement page info)
  if (cat.showLinks) {
    container.addActionRowComponents(row => row.setComponents(
      new ButtonBuilder().setLabel('Serveur de support').setURL(SUPPORT).setStyle(ButtonStyle.Link),
      new ButtonBuilder().setLabel('Inviter le bot').setURL(BOT_INVITE).setStyle(ButtonStyle.Link),
    ))
  }

  container.addTextDisplayComponents(td => td.setContent(
    `-# Préfixe · \`${prefix}\`  •  ${prefix}helpall pour tout  •  ${prefix}dashboard pour configurer`
  ))

  return container
}

// ── MODULE ─────────────────────────────────────────────────────
module.exports = {
  name: 'help',
  description: 'Afficher le menu d\'aide',
  aliases: [],

  run: async (client, message, args, prefix) => {
    const isAdmin    = message.member.permissions.has(PermissionFlagsBits.Administrator)
    const publicMode = db.get(`public_mode_${message.guild.id}`) === true
    if (!isAdmin && !publicMode) return

    const adminKeys  = ['info','security','moderation','management','tickets_invites','engagement','info_utils','web']
    const publicKeys = ['info','info_utils','web']
    const keys = isAdmin ? adminKeys : publicKeys

    const msg = await message.reply({
      components: [buildContainer(client, 'info', prefix, message.author.id, isAdmin, keys)],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null)
    if (!msg) return

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 300000,
    })

    col.on('collect', async i => {
      if (!i.isStringSelectMenu()) return
      await i.update({
        components: [buildContainer(client, i.values[0], prefix, message.author.id, isAdmin, keys)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => false)
    })

    col.on('end', () => {
      const end = new ContainerBuilder().setAccentColor(COLOR)
        .addTextDisplayComponents(td => td.setContent(
          `## ${client.user.username}\n-# Session expirée · \`${prefix}help\` pour rouvrir`
        ))
      msg.edit({ components: [end], flags: MessageFlags.IsComponentsV2 }).catch(() => false)
    })
  },
}
