// ============================================================
//  Commande : crypto
//  Affiche le prix actuel d'une crypto-monnaie via CoinGecko.
// ============================================================

const { EmbedBuilder } = require('discord.js')

const ALIASES = {
  btc: 'bitcoin', eth: 'ethereum', sol: 'solana', doge: 'dogecoin',
  ada: 'cardano', dot: 'polkadot', avax: 'avalanche-2', matic: 'matic-network',
  link: 'chainlink', xrp: 'ripple', ltc: 'litecoin', bnb: 'binancecoin',
  trx: 'tron', shib: 'shiba-inu', usdt: 'tether', usdc: 'usd-coin',
  atom: 'cosmos', arb: 'arbitrum', op: 'optimism', near: 'near',
  ton: 'the-open-network', inj: 'injective-protocol', sui: 'sui',
}

module.exports = {
  name: 'crypto',
  description: 'Prix actuel d\'une crypto-monnaie',
  aliases: ['coin', 'coinprice'],

  run: async (client, message, args, prefix) => {
    const coin = (args[0] || '').toLowerCase()
    if (!coin) {
      return message.reply(
        `**Usage :** \`${prefix}crypto <nom|ticker>\`\n` +
        `**Exemples :**\n` +
        `> \`${prefix}crypto btc\` · Bitcoin\n` +
        `> \`${prefix}crypto eth\` · Ethereum\n` +
        `> \`${prefix}crypto solana\`\n\n` +
        `**Tickers courants :** btc, eth, sol, doge, ada, dot, link, xrp, matic, bnb, ltc, shib, trx, ton, sui, avax`
      )
    }

    const coinId = ALIASES[coin] || coin
    const waiting = await message.reply('📈 Récupération...')

    try {
      const fetch = require('node-fetch')
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
      const res = await fetch(url, { timeout: 10000 })

      if (res.status === 404) {
        return waiting.edit(`Crypto \`${coin}\` introuvable. Utilise le ticker (btc, eth, sol...) ou l'ID CoinGecko complet.`)
      }
      if (!res.ok) return waiting.edit(`Erreur API (${res.status})`)

      const data = await res.json()
      const price = data.market_data?.current_price?.usd ?? 0
      const eur   = data.market_data?.current_price?.eur ?? 0
      const change24 = data.market_data?.price_change_percentage_24h ?? 0
      const change7  = data.market_data?.price_change_percentage_7d ?? 0
      const change30 = data.market_data?.price_change_percentage_30d ?? 0
      const mcap = data.market_data?.market_cap?.usd ?? 0
      const vol  = data.market_data?.total_volume?.usd ?? 0
      const rank = data.market_cap_rank

      const fmt = (n) => {
        if (n < 0.01) return `$${n.toFixed(6)}`
        if (n < 1)    return `$${n.toFixed(4)}`
        if (n < 100)  return `$${n.toFixed(2)}`
        return `$${Math.round(n).toLocaleString('en-US')}`
      }
      const fmtBig = (n) => {
        if (n > 1e12) return `$${(n / 1e12).toFixed(2)}T`
        if (n > 1e9)  return `$${(n / 1e9).toFixed(2)}B`
        if (n > 1e6)  return `$${(n / 1e6).toFixed(2)}M`
        return `$${Math.round(n).toLocaleString('en-US')}`
      }

      const emoji24 = change24 >= 0 ? '🟢' : '🔴'
      const emoji7  = change7 >= 0 ? '🟢' : '🔴'
      const emoji30 = change30 >= 0 ? '🟢' : '🔴'

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(`${data.name} (${data.symbol.toUpperCase()})`)
        .setColor(change24 >= 0 ? 0x00FF88 : 0xFF4444)
        .setThumbnail(data.image?.large)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Prix USD',  value: fmt(price),  inline: true },
          { name: 'Prix EUR',  value: `€${eur < 1 ? eur.toFixed(4) : Math.round(eur).toLocaleString('en-US')}`, inline: true },
          { name: 'Rang',      value: rank ? `#${rank}` : '—', inline: true },
          { name: '24h',       value: `${emoji24} ${change24.toFixed(2)}%`, inline: true },
          { name: '7j',        value: `${emoji7} ${change7.toFixed(2)}%`,   inline: true },
          { name: '30j',       value: `${emoji30} ${change30.toFixed(2)}%`, inline: true },
          { name: 'Market Cap', value: fmtBig(mcap), inline: true },
          { name: 'Volume 24h', value: fmtBig(vol),  inline: true },
          { name: 'ATH',        value: fmt(data.market_data?.ath?.usd || 0), inline: true },
        )
        .setFooter({ text: 'Données CoinGecko' })
        .setTimestamp()

      waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
