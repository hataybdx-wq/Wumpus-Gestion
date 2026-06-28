// ============================================================
//  Événement : ready — Electron Gestion
//  Mode préfixe uniquement (slash commands désactivées)
// ============================================================

const { REST, Routes } = require('discord.js')
const { initGuild } = require('../../utils/invites')

module.exports = async (client) => {
  console.log(`[BOT] ${client.user.username} connecté.`)

  // ── Initialiser le cache d'invitations pour tous les serveurs ──
  for (const guild of client.guilds.cache.values()) {
    await initGuild(guild)
  }
  console.log(`[INVITES] Cache initialisé pour ${client.guilds.cache.size} serveur(s).`)

  // ── Démarrer le scheduler de stats channels ─────────────
  try {
    const statsChan = require('../../commands/stats-channels')
    statsChan.startScheduler(client)
    await statsChan.refreshAll(client)
    console.log(`[STATS] Scheduler démarré (refresh toutes les 10 min).`)
  } catch (err) { console.error('[STATS] Erreur scheduler:', err.message) }

  // ── Scheduler des rappels ───────────────────────────────
  setInterval(async () => {
    try {
      const db = require('quick.db')
      const all = db.get('reminders') || []
      const now = Date.now()
      const due = all.filter(r => r.at <= now)
      if (due.length === 0) return

      for (const r of due) {
        try {
          const user = await client.users.fetch(r.userId).catch(() => null)
          if (user) {
            await user.send({ embeds: [{
              title: 'Rappel',
              author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
              description: r.text,
              color: 0xFF0000,
              author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
          footer: { text: 'Made by Wumpus' },
              footer: { text: `Défini ${new Date(r.created).toLocaleString('fr-FR')}` },
              timestamp: new Date(r.at).toISOString(),
            }] }).catch(() => false)
          }
        } catch {}
      }
      db.set('reminders', all.filter(r => r.at > now))
    } catch {}
  }, 30000)
  console.log(`[REMINDERS] Scheduler démarré (check toutes les 30s).`)

  // ── Vider les slash commands existantes (1 seule fois au boot) ──
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)
    await rest.put(Routes.applicationCommands(client.user.id), { body: [] })
    console.log(`[SLASH] Slash commands supprimées — mode préfixe uniquement.`)
  } catch (err) {
    console.error('[SLASH] Erreur nettoyage :', err.message)
  }
}
