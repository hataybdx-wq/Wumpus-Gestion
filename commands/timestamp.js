module.exports = {
  name: 'timestamp',
  description: 'Génère un timestamp Discord',
  aliases: ['ts', 'time-format'],
  run: async (client, message, args) => {
    const now = Math.floor(Date.now() / 1000)
    const styles = {
      t: 'Heure courte',
      T: 'Heure longue',
      d: 'Date courte',
      D: 'Date longue',
      f: 'Date + heure (défaut)',
      F: 'Date + heure longue',
      R: 'Relatif',
    }

    const list = Object.entries(styles).map(([s, desc]) =>
      `\`<t:${now}:${s}>\` → <t:${now}:${s}> · ${desc}`
    ).join('\n')

    message.reply({ embeds: [{
      title: 'Timestamps Discord',
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      description: list,
      color: 0xFF0000,
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      footer: { text: 'Copiez le format et remplacez le timestamp | Made by Wumpus' },
    }] })
  },
}
