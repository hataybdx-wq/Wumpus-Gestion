// ============================================================
//  Commande : github
//  Affiche les infos d'un dépôt GitHub ou d'un utilisateur.
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'github',
  description: 'Infos sur un dépôt GitHub ou un utilisateur',
  aliases: ['gh', 'git'],

  run: async (client, message, args, prefix) => {
    const arg = args[0]
    if (!arg) {
      return message.reply(
        `**Usage :**\n` +
        `> \`${prefix}github <user>\` · Profil (ex: \`${prefix}github torvalds\`)\n` +
        `> \`${prefix}github <user>/<repo>\` · Dépôt (ex: \`${prefix}github discord/discord-api-docs\`)`
      )
    }

    const waiting = await message.reply('🐙 Récupération GitHub...')
    const fetch = require('node-fetch')

    try {
      if (arg.includes('/')) {
        // Repo
        const res = await fetch(`https://api.github.com/repos/${arg}`, { timeout: 10000 })
        if (res.status === 404) return waiting.edit('Dépôt introuvable.')
        if (!res.ok) return waiting.edit(`Erreur API (${res.status})`)
        const r = await res.json()

        const embed = new EmbedBuilder()
          .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
          .setTitle(`${r.full_name}`)
          .setURL(r.html_url)
          .setColor(0xFF0000)
          .setThumbnail(r.owner?.avatar_url)
          .setDescription(r.description || '_Pas de description_')
          .addFields(
          .setFooter({ text: 'Made by Wumpus' })
            { name: '⭐ Stars',   value: `${r.stargazers_count.toLocaleString()}`,  inline: true },
            { name: '🍴 Forks',   value: `${r.forks_count.toLocaleString()}`,       inline: true },
            { name: '👀 Watch',   value: `${r.watchers_count.toLocaleString()}`,   inline: true },
            { name: '🐛 Issues',  value: `${r.open_issues_count.toLocaleString()}`, inline: true },
            { name: '💾 Taille',  value: `${(r.size / 1024).toFixed(1)} MB`,        inline: true },
            { name: '🗣️ Langage', value: r.language || '—',                         inline: true },
            { name: 'Licence',    value: r.license?.name || 'Aucune',               inline: true },
            { name: 'Branche',    value: r.default_branch,                          inline: true },
            { name: 'Créé',       value: `<t:${Math.floor(new Date(r.created_at).getTime() / 1000)}:R>`, inline: true },
          )

        waiting.edit({ content: null, embeds: [embed] })
      } else {
        // User
        const res = await fetch(`https://api.github.com/users/${arg}`, { timeout: 10000 })
        if (res.status === 404) return waiting.edit('Utilisateur introuvable.')
        if (!res.ok) return waiting.edit(`Erreur API (${res.status})`)
        const u = await res.json()

        const embed = new EmbedBuilder()
          .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
          .setTitle(`${u.name || u.login}${u.company ? ` · ${u.company}` : ''}`)
          .setURL(u.html_url)
          .setColor(0xFF0000)
          .setThumbnail(u.avatar_url)
          .setDescription(u.bio || '_Pas de bio_')
          .addFields(
          .setFooter({ text: 'Made by Wumpus' })
            { name: '📂 Dépôts publics', value: `${u.public_repos}`,  inline: true },
            { name: '👥 Followers',       value: `${u.followers}`,      inline: true },
            { name: '🔗 Following',       value: `${u.following}`,      inline: true },
            ...(u.location ? [{ name: '📍 Lieu',    value: u.location, inline: true }] : []),
            ...(u.blog     ? [{ name: '🔗 Site',    value: u.blog,     inline: true }] : []),
            { name: 'Créé',               value: `<t:${Math.floor(new Date(u.created_at).getTime() / 1000)}:R>`, inline: true },
          )

        waiting.edit({ content: null, embeds: [embed] })
      }
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
