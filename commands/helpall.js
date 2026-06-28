// ============================================================
//  Commande : helpall — Toutes les commandes avec descriptions
//  Design premium avec thumbnail, progression et navigation
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  SectionBuilder, ThumbnailBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')

const COLOR = 0xFF0000

const CATEGORIES = [
  {
    name: 'Sécurité',
    tagline: 'Protéger votre serveur',
    cmds: [
      ['secur-max',                 'Mode sécurité maximal (owner only)'],
      ['secur-on',                  'Activer la sécurité standard'],
      ['secur-off',                 'Désactiver la sécurité'],
      ['secur',                     'État actuel des protections'],
      ['antiraid on/off',           'Protection anti-raid globale'],
      ['antibot on/off',            'Bloquer les ajouts de bots'],
      ['antilink / antilien',       'Bloquer les liens'],
      ['antiban / antikick',        'Empêcher bans/kicks abusifs'],
      ['antimassban / antimasskick','Détection mass-actions'],
      ['anti-masse-mention',        'Bloquer les @ en masse'],
      ['antichannel',               'Protection création/suppression'],
      ['antiguildupdate',           'Protection modification serveur'],
      ['spam on/off/seuil',         'Anti-spam'],
      ['set-sanction <action> <ban/kick/mute>', 'Sanction par type'],
      ['set-sanction <action> seuil <n>',       'Seuil personnalisé'],
      ['sanction',                  'Voir les sanctions configurées'],
      ['wl add/remove/list @m',     'Whitelist sécurité'],
      ['wl-strict on/off',          'Whitelist stricte (only owner)'],
      ['setup-captcha #salon',      'Vérification captcha à l\'arrivée'],
    ],
  },
  {
    name: 'Modération',
    tagline: 'Maintenir l\'ordre',
    cmds: [
      ['ban @m [raison]',                 'Bannissement définitif'],
      ['tempban @m <durée> [raison]',     'Bannissement temporaire'],
      ['unban <ID> [raison]',             'Lever un bannissement'],
      ['kick @m [raison]',                'Expulser'],
      ['mute @m <durée> [raison]',        'Timeout Discord'],
      ['unmute @m',                       'Lever le timeout'],
      ['timeout @m <durée>',              'Alias de mute'],
      ['gban @m [raison]',                'Bannissement global'],
      ['gunban <ID>',                     'Lever ban global'],
      ['warn @m <raison>',                'Avertir (DM + historique)'],
      ['warns @m',                        'Historique des warns'],
      ['unwarn @m <id>',                  'Retirer un warn'],
      ['clearwarns @m',                   'Effacer tous les warns'],
      ['warnsetup <N> <mute/kick/ban>',   'Auto-sanction à N warns'],
      ['cases @m',                        'Historique complet'],
      ['clear <1-100>',                   'Supprimer N messages'],
      ['prune @m <1-100>',                'Messages d\'un membre'],
      ['snipe',                           'Dernier message supprimé'],
      ['slowmode <durée>',                'Mode lent (off pour désactiver)'],
      ['unslow',                          'Désactiver slowmode'],
      ['lock / unlock',                   'Verrouiller/déverrouiller'],
      ['lockall confirm / unlockall confirm', 'Tous les salons'],
      ['hide / unhide',                   'Cacher/afficher le salon'],
      ['vmute / vunmute / vkick @m',      'Modération vocale'],
      ['public-mode on/off',              'Accès commandes fun à tous'],
      ['renew',                           'Recréer le salon à l\'identique'],
      ['role-all @rôle [humans/bots]',    'Rôle à tous les membres'],
      ['unrole-all @rôle',                'Retirer un rôle à tous'],
    ],
  },
  {
    name: 'Gestion serveur',
    tagline: 'Salons, rôles, emojis, vocaux',
    cmds: [
      ['createchannel <nom>',       'Créer un salon textuel'],
      ['createvoice <nom>',         'Créer un salon vocal'],
      ['delchannel confirm <id>',   'Supprimer un salon'],
      ['clone',                     'Cloner un salon'],
      ['nuke confirm',              'Recréer le salon à neuf'],
      ['rename <nom>',              'Renommer le salon'],
      ['topic <sujet>',             'Changer le sujet du salon'],
      ['createrole <nom>',          'Créer un rôle'],
      ['addrole @m @rôle',          'Donner un rôle'],
      ['removerole @m @rôle',       'Retirer un rôle'],
      ['inrole @rôle',              'Liste des membres d\'un rôle'],
      ['nick @m [surnom]',          'Changer le surnom'],
      ['stealemoji <emoji> [nom]',  'Voler un emoji d\'ailleurs'],
      ['delemoji <emoji>',          'Supprimer un emoji'],
      ['renameemoji <emoji> <nom>', 'Renommer un emoji'],
      ['move @m <vocal>',           'Déplacer un membre en vocal'],
      ['moveall <vocal>',           'Déplacer tout le monde'],
      ['dcall',                     'Déconnecter tous du vocal'],
      ['vjoin <vocal>',             'Se téléporter dans un vocal'],
      ['say <message>',             'Envoyer en tant que bot'],
      ['sayembed <texte>',          'Envoyer un embed simple'],
      ['embed [#salon]',            'Créer un embed custom (modal)'],
    ],
  },
  {
    name: 'Tickets & Invitations',
    tagline: 'Support et tracking',
    cmds: [
      ['ticket-setup',              'Interface de configuration tickets'],
      ['ticket-quick',              'Setup rapide (catégorie + panneau)'],
      ['ticket-add @m',             'Ajouter un membre au ticket'],
      ['ticket-remove @m',          'Retirer un membre'],
      ['ticket-close',              'Fermer le ticket (transcript HTML)'],
      ['ticket-claim',              'Prendre en charge un ticket'],
      ['ticket-list',               'Liste des tickets ouverts'],
      ['invite-setup',              'Interface invitations'],
      ['invite-setup channel #s',   'Salon de tracking join/leave'],
      ['invite-setup role <n> @r',  'Palier de rôle automatique'],
      ['invites [@m]',              'Statistiques d\'invitations'],
      ['invite-guild',              'Top des inviteurs'],
      ['giveaway <durée> <prix>',   'Lancer un giveaway'],
      ['giveaway --role @r',        'Avec prérequis de rôle'],
      ['giveaway --invites <n>',    'Avec minimum d\'invitations'],
    ],
  },
  {
    name: 'Engagement',
    tagline: 'Welcome, auto-rôles, stats, embeds',
    cmds: [
      ['welcome info',                       'Interface welcome/goodbye'],
      ['welcome channel #salon',             'Salon d\'arrivée'],
      ['welcome message <texte>',            'Message d\'arrivée'],
      ['welcome dm <texte>',                 'DM à l\'arrivée'],
      ['goodbye channel / message',          'Message de départ'],
      ['ar add <trigger> | <réponse>',       'Auto-réponse'],
      ['ar remove <trigger> / ar list',      'Gérer'],
      ['autorole add/remove @rôle',          'Auto-rôle à l\'arrivée'],
      ['selfroles create <titre>',           'Panneau de self-roles'],
      ['selfroles add <id> @rôle <desc>',    'Ajouter un rôle'],
      ['selfroles panel <id> [#salon]',      'Envoyer le panneau'],
      ['stats-channels setup',               '4 salons stats auto'],
      ['ghostjoin add #salon',               'Ping fantôme à l\'arrivée'],
      ['tag-setup @rôle <texte>',            'Tag pseudo → rôle'],
      ['poll <q> | <opt1> | <opt2>',         'Sondage moderne (boutons)'],
      ['sondage <question>',                 'Sondage oui/non réactions'],
      ['support-setup @rôle <texte>',        'Rôle selon statut Discord'],
      ['support-reward <msg>',               'Message DM aux supporters'],
      ['support-reward reset-dm @m',         'Réinitialiser DM d\'un membre'],
      ['support-list',                       'Liste des supporters'],
      ['setup',                              'Assistant complet (wizard)'],
    ],
  },
  {
    name: 'Info & Utilitaires',
    tagline: 'Informations serveur et membres',
    cmds: [
      ['userinfo [@m]',    'Infos complètes d\'un membre'],
      ['avatar [@m]',      'Avatar HD'],
      ['banner [@m]',      'Bannière'],
      ['age [@m]',         'Âge du compte Discord'],
      ['joined [@m]',      'Date d\'arrivée'],
      ['prevnames [@m]',   'Anciens pseudos'],
      ['whois <ID>',       'Lookup par ID'],
      ['serveurinfo',      'Infos serveur'],
      ['serverstats',      'Stats détaillées du serveur'],
      ['servericon',       'Icône du serveur'],
      ['serverbanner',     'Bannière du serveur'],
      ['channels',         'Liste des salons'],
      ['channelinfo [#]',  'Infos salon'],
      ['rolelist',         'Liste des rôles'],
      ['roleinfo @rôle',   'Infos rôle'],
      ['emojis',           'Liste des emojis'],
      ['emojiinfo <emoji>','Infos emoji'],
      ['admins / staff / bots', 'Listes spécifiques'],
      ['banlist',          'Liste des bannis'],
      ['inactive',         'Membres inactifs'],
      ['boosters',         'Liste des boosters'],
      ['membercount / voicecount / count', 'Compteurs'],
      ['perms [@m]',       'Permissions ici'],
      ['uptime / latency', 'État du bot'],
      ['id [@m/server]',   'Afficher un ID'],
      ['firstmessage [#]', 'Premier message du salon'],
      ['ping / stat',      'Ping et statistiques'],
      ['afk [raison]',     'Se marquer AFK'],
      ['calc <expression>', 'Calculatrice'],
      ['password [len]',   'Mot de passe sécurisé (DM)'],
      ['timestamp',        'Timestamps Discord'],
      ['color <#hex> / randomcolor', 'Couleurs'],
      ['dateinfo [date]',  'Infos date/timestamp'],
      ['remindme <durée> <texte>', 'Rappel DM'],
    ],
  },
  {
    name: 'Web & API',
    tagline: 'Scraping, crypto, conversion, recherche',
    cmds: [
      ['scrapp <url>',              'Preview d\'une URL (OG/Twitter)'],
      ['crypto <btc|eth|sol|...>',  'Prix crypto en temps réel'],
      ['wallet <adresse>',          'Solde ETH / BTC / SOL'],
      ['fiat <montant> <de> <vers>','Conversion de devise'],
      ['convert <val> <de> <vers>', 'Conversion d\'unités'],
      ['weather <ville>',           'Météo en temps réel'],
      ['github <user[/repo]>',      'Infos GitHub'],
      ['npm <package>',             'Infos package npm'],
      ['wiki <terme>',              'Article Wikipédia'],
      ['steam <jeu>',               'Infos jeu Steam'],
      ['urban <terme>',             'Urban Dictionary'],
      ['translate <langue> <texte>','Traduction (MyMemory)'],
      ['ip <ip|domaine>',           'Géolocalisation IP'],
      ['domain <domaine>',          'DNS lookup'],
      ['speedtest',                 'Test latence vers Discord/Google/...'],
      ['shorten <url>',             'Raccourcir une URL'],
      ['qrcode <texte|url>',        'Générer un QR code'],
      ['hash <algo> <texte>',       'md5/sha1/sha256/sha512'],
      ['httpstatus <code>',         'Signification code HTTP'],
      ['8ball <question>',          'Boule magique'],
      ['snipe',                     'Dernier message supprimé'],
    ],
  },
  {
    name: 'Tableau de bord',
    tagline: 'Vue centrale du serveur',
    cmds: [
      ['dashboard',                  'Dashboard complet (7 pages)'],
      ['dashboard → Vue d\'ensemble','Statistiques générales'],
      ['dashboard → Sécurité',      'Protections actives'],
      ['dashboard → Modération',    'Warns, cases, auto-sanctions'],
      ['dashboard → Tickets',       'Config tickets'],
      ['dashboard → Invitations',   'Config invitations + paliers'],
      ['dashboard → Rôles',         'Autorole + selfroles'],
      ['dashboard → Engagement',    'Welcome, AR, stats, tag'],
      ['help',                      'Menu d\'aide moderne'],
      ['helpall',                   'Cette liste exhaustive'],
      ['patch-note',                'Dernières mises à jour'],
      ['my-bot',                    'Créer ton propre bot avec une clé'],
      ['genkey',                    'Admin · Générer une clé'],
      ['claim <clé>',               'Revendiquer une clé'],
    ],
  },
]

module.exports = {
  name: 'helpall',
  description: 'Lister toutes les commandes avec descriptions',
  aliases: ['allhelp', 'commandesall'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const total = CATEGORIES.reduce((a, c) => a + c.cmds.length, 0)
    const botAvatar = client.user.displayAvatarURL({ size: 256, extension: 'png' })

    const buildPage = (idx) => {
      const c = new ContainerBuilder().setAccentColor(COLOR)

      if (idx === -1) {
        // Page d'accueil — index avec grille de catégories
        c.addSectionComponents(sec => sec
          .addTextDisplayComponents(td => td.setContent(
            `## ${client.user.username} · Commandes\n` +
            `### Catalogue complet\n` +
            `-# ${total} commandes réparties sur ${CATEGORIES.length} catégories`
          ))
          .setThumbnailAccessory(thumb => thumb.setURL(botAvatar))
        )

        c.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

        // Deux colonnes de catégories
        const half = Math.ceil(CATEGORIES.length / 2)
        const col1 = CATEGORIES.slice(0, half).map((cat, i) =>
          `**${String(i + 1).padStart(2, '0')}.** ${cat.name}\n-# ${cat.cmds.length} commande${cat.cmds.length > 1 ? 's' : ''}`
        ).join('\n\n')
        const col2 = CATEGORIES.slice(half).map((cat, i) =>
          `**${String(i + half + 1).padStart(2, '0')}.** ${cat.name}\n-# ${cat.cmds.length} commande${cat.cmds.length > 1 ? 's' : ''}`
        ).join('\n\n')

        c.addTextDisplayComponents(td => td.setContent(`${col1}\n\n${col2}`))

        c.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

        c.addActionRowComponents(row => row.setComponents(
          new ButtonBuilder().setCustomId('ha_start').setLabel('Parcourir les catégories').setStyle(ButtonStyle.Primary)
        ))
      } else {
        // Page d'une catégorie
        const cat  = CATEGORIES[idx]

        c.addSectionComponents(sec => sec
          .addTextDisplayComponents(td => td.setContent(
            `## ${client.user.username}\n` +
            `### ${cat.name}\n` +
            `-# ${cat.tagline} · ${cat.cmds.length} commande${cat.cmds.length > 1 ? 's' : ''}`
          ))
          .setThumbnailAccessory(thumb => thumb.setURL(botAvatar))
        )

        c.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

        // Barre de progression de navigation
        const progress = Math.round(((idx + 1) / CATEGORIES.length) * 10)
        const bar = '▰'.repeat(progress) + '▱'.repeat(10 - progress)
        c.addTextDisplayComponents(td => td.setContent(
          `-# Catégorie ${idx + 1}/${CATEGORIES.length}  \`${bar}\``
        ))

        c.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))

        // Liste des commandes — par chunks de 10 pour pas faire trop long
        const chunks = []
        for (let i = 0; i < cat.cmds.length; i += 10) {
          chunks.push(cat.cmds.slice(i, i + 10))
        }

        chunks.forEach((chunk, i) => {
          const list = chunk.map(([name, desc]) => `\`${prefix}${name}\`\n-# ${desc}`).join('\n\n')
          c.addTextDisplayComponents(td => td.setContent(list))
          if (i < chunks.length - 1) {
            c.addSeparatorComponents(sep => sep.setDivider(false).setSpacing(SeparatorSpacingSize.Small))
          }
        })

        c.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Large))

        // Navigation
        c.addActionRowComponents(row => row.setComponents(
          new ButtonBuilder().setCustomId('ha_prev').setLabel('Précédent').setStyle(ButtonStyle.Secondary).setDisabled(idx === 0),
          new ButtonBuilder().setCustomId('ha_home').setLabel('Index').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('ha_next').setLabel('Suivant').setStyle(ButtonStyle.Secondary).setDisabled(idx === CATEGORIES.length - 1),
        ))

        // Jump menu pour aller direct à une catégorie
        const jumpSelect = new StringSelectMenuBuilder()
          .setCustomId('ha_jump')
          .setPlaceholder('Aller directement à une catégorie')
          .addOptions(
            CATEGORIES.map((cat, i) => new StringSelectMenuOptionBuilder()
              .setLabel(cat.name)
              .setValue(String(i))
              .setDescription(`${cat.cmds.length} commande${cat.cmds.length > 1 ? 's' : ''} · ${cat.tagline}`)
              .setDefault(i === idx)
            )
          )
        c.addActionRowComponents(row => row.setComponents(jumpSelect))
      }

      c.addTextDisplayComponents(td => td.setContent(
        `-# Préfixe · \`${prefix}\`  •  ${prefix}help pour le menu détaillé  •  ${prefix}dashboard`
      ))

      return c
    }

    let page = -1

    const msg = await message.reply({
      components: [buildPage(page)],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null)
    if (!msg) return

    const col = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 300000,
    })

    col.on('collect', async i => {
      if (i.customId === 'ha_start' || i.customId === 'ha_home') page = 0
      else if (i.customId === 'ha_prev' && page > 0) page--
      else if (i.customId === 'ha_next' && page < CATEGORIES.length - 1) page++
      else if (i.customId === 'ha_jump' && i.isStringSelectMenu()) page = parseInt(i.values[0])

      await i.update({
        components: [buildPage(page)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => false)
    })

    col.on('end', () => {
      msg.edit({
        components: [new ContainerBuilder().setAccentColor(COLOR)
          .addTextDisplayComponents(td => td.setContent(
            `## ${client.user.username}\n-# Session expirée · \`${prefix}helpall\` pour rouvrir`
          ))],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => false)
    })
  },
}
