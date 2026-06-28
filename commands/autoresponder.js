// ============================================================
//  Commande : autoresponder (AR)
//  Réponses automatiques à des mots-clés.
//
//  Usage :
//    !ar add <trigger> | <response>  → ajouter
//    !ar remove <trigger>            → supprimer
//    !ar list                        → lister
//    !ar clear                       → tout supprimer
// ============================================================

const {
  ContainerBuilder, SeparatorSpacingSize,
  PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'autoresponder',
  description: 'Réponses automatiques à des mots-clés',
  aliases: ['ar', 'autoreply', 'trigger'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return

    const gid = message.guild.id
    const sub = (args[0] || '').toLowerCase()

    const getAll = () => db.get(`autoresponders_${gid}`) || {}
    const setAll = (a) => db.set(`autoresponders_${gid}`, a)

    // ── add ────────────────────────────────────────────────
    if (sub === 'add' || sub === 'create') {
      const content = args.slice(1).join(' ')
      if (!content.includes('|')) {
        return message.reply(
          `Usage : \`${prefix}ar add <trigger> | <response>\`\n` +
          `**Exemple :** \`${prefix}ar add hello | Salut {user} !\`\n\n` +
          `Variables : \`{user}\` \`{mention}\` \`{server}\``
        )
      }

      const [trigger, ...respParts] = content.split('|')
      const response = respParts.join('|').trim()
      const triggerKey = trigger.trim().toLowerCase()

      if (!triggerKey || !response) return message.reply('Trigger et réponse requis.')

      const all = getAll()
      all[triggerKey] = response
      setAll(all)

      return message.reply(`Auto-réponse ajoutée :\n> Trigger : \`${triggerKey}\`\n> Réponse : ${response}`)
    }

    // ── remove ─────────────────────────────────────────────
    if (sub === 'remove' || sub === 'rm' || sub === 'delete') {
      const key = args.slice(1).join(' ').toLowerCase()
      if (!key) return message.reply(`Usage : \`${prefix}ar remove <trigger>\``)

      const all = getAll()
      if (!all[key]) return message.reply(`Trigger \`${key}\` introuvable.`)

      delete all[key]
      setAll(all)
      return message.reply(`Auto-réponse \`${key}\` supprimée.`)
    }

    // ── clear ──────────────────────────────────────────────
    if (sub === 'clear' || sub === 'reset') {
      db.delete(`autoresponders_${gid}`)
      return message.reply('Toutes les auto-réponses supprimées.')
    }

    // ── list (défaut) ──────────────────────────────────────
    const all = getAll()
    const entries = Object.entries(all)

    const container = new ContainerBuilder().setAccentColor(0xFF0000)

    container.addTextDisplayComponents(td => td.setContent(
      `## Auto-réponses\n-# ${entries.length} déclencheur${entries.length > 1 ? 's' : ''} configuré${entries.length > 1 ? 's' : ''}`
    ))

    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

    if (entries.length === 0) {
      container.addTextDisplayComponents(td => td.setContent(
        `_Aucune auto-réponse configurée._\n\n` +
        `Ajoutez-en une avec \`${prefix}ar add <trigger> | <réponse>\``
      ))
    } else {
      const lines = entries.slice(0, 20).map(([k, v]) => {
        const preview = v.length > 100 ? v.slice(0, 100) + '...' : v
        return `**\`${k}\`**\n> ${preview}`
      }).join('\n\n')
      container.addTextDisplayComponents(td => td.setContent(lines))

      if (entries.length > 20) {
        container.addTextDisplayComponents(td => td.setContent(`-# +${entries.length - 20} autres triggers`))
      }
    }

    container.addSeparatorComponents(sep => sep.setDivider(true).setSpacing(SeparatorSpacingSize.Small))

    container.addTextDisplayComponents(td => td.setContent(
      `### Commandes\n` +
      `\`${prefix}ar add <trigger> | <réponse>\` · Ajouter\n` +
      `\`${prefix}ar remove <trigger>\` · Supprimer\n` +
      `\`${prefix}ar clear\` · Tout supprimer\n\n` +
      `### Variables de réponse\n` +
      `\`{user}\` · Pseudo\n` +
      `\`{mention}\` · Mention (@user)\n` +
      `\`{server}\` · Nom du serveur`
    ))

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
  },
}
