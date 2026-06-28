# Electron Gestion

> Bot Discord polyvalent — **Made by Wumpus**
> discord.js v14 · Node.js 20+
> discord : https://discord.gg/n2VRgSu9eb 
> Telegram : https://t.me/wumpusproject

---

## Installation

```bash
# 1. Cloner / dézipper le projet
cd Electron-Gestion

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env .env.local   # ou éditer directement .env

# 4. Lancer le bot
npm start
```

---

## Configuration `.env`

| Variable | Description | Obligatoire |
|---|---|---|
| `TOKEN` | Token du bot Discord | ✅ |
| `prefix` | Préfixe des commandes (défaut : `!`) | ✅ |
| `OWNER_ID` | ID Discord du propriétaire | ✅ |
| `WEATHER_API` | Clé OpenWeatherMap (`!weather`) | ⬜ |
| `STEAM_API` | Clé Steam Web API (`!steam`) | ⬜ |
| `DEEPL_API` | Clé DeepL (`!translate`) | ⬜ |

---

## Commandes (196)

### 🛡️ Modération
`!ban` `!kick` `!tempban` `!mute` `!unmute` `!timeout` `!warn` `!warns`
`!clearwarns` `!unwarn` `!sanction` `!set-sanction` `!cases` `!unban` `!gban` `!gunban`

### 🔒 Sécurité
`!secur` `!secur-max` `!secur-off` `!secur-on`
`!antiban` `!antibot` `!antichannel` `!anticreainvite` `!antiguildupdate`
`!antikick` `!antilien` `!antilink` `!antimassban` `!antimasskick`
`!antiraid` `!anti-masse-mention` `!wl` `!wl-strict` `!public-mode`

### ⚙️ Gestion du serveur
`!clear` `!nuke` `!lock` `!unlock` `!lockall` `!unlockall`
`!hide` `!unhide` `!slowmode` `!topic` `!clone-channel`
`!create-channel` `!delete-channel` `!create-role` `!delete-emoji`
`!rename-emoji` `!steal-emoji` `!rename` `!nick`
`!addrole` `!removerole` `!role-all` `!unrole-all` `!prune`
`!move` `!moveall` `!disconnect-all` `!vc`
`!create-voice` `!vjoin` `!vkick` `!vmute` `!vunmute` `!voice-count`

### ℹ️ Informations
`!userinfo` `!serveurinfo` `!channelinfo` `!roleinfo`
`!membercount` `!member` `!bots` `!boosters` `!staff` `!inrole`
`!invite` `!invites` `!prevnames` `!banlist`
`!emojis` `!emojiinfo` `!id` `!age` `!joined`
`!list-channels` `!rolelist` `!admins` `!perms`
`!firstmessage` `!inactive`

### 🎫 Tickets
`!ticket` `!ticket-setup` `!ticket-quick` `!ticket-close`
`!ticket-claim` `!ticket-list` `!ticket-add` `!ticket-remove`

### 🛠️ Utilitaires
`!avatar` `!banner` `!serverbanner` `!servericon`
`!say` `!say-embed` `!embed` `!afk` `!remindme`
`!timestamp` `!date-info` `!calc` `!convert`
`!base64` `!hash` `!morse` `!reverse` `!mock`
`!color` `!randomcolor` `!qrcode`
`!weather` `!translate` `!wiki` `!urban`
`!github` `!steam` `!ip-lookup` `!whois` `!whois-domain`
`!httpstatus` `!shorten` `!speedtest`

### 🎉 Giveaway
`!giveaway`

### 👋 Bienvenue & Rôles
`!welcome` `!autorole` `!selfroles` `!ghostjoin` `!setup-captcha`

### 📩 Invitations
`!invite-setup` `!invites` `!invite-guild`

### 📝 Logs
`!setup-log` `!setup-logs` `!snipe`

### 🤖 Automod
`!autoresponder` `!tag-setup` `!warnsetup`

### 💹 Crypto / Finance
`!crypto` `!fiat`

### 🎮 Jeux Discord
`!betrayal` `!checkers` `!chess` `!doodle-crew`
`!land-io` `!letter-league` `!mimes` `!poker`
`!spellcast` `!word-snack` `!puttparty` `!ankword` `!fishing`

### 🎲 Fun
`!8ball` `!ask-away` `!pp` `!pp-random` `!pp-serveur`
`!count` `!password` `!latency` `!ping` `!uptime`
`!stat` `!serverstats` `!stats-channels`

---

## Structure

```
Electron-Gestion/
├── index.js              ← Point d'entrée
├── deploy-commands.js    ← Déploiement slash (optionnel)
├── .env                  ← Variables d'environnement
├── quickdb.json          ← Base de données locale
├── commands/             ← 196 commandes
├── events/
│   ├── Client/           ← Événements Discord (ready, guildCreate…)
│   ├── Automod/          ← Automodération
│   ├── Secur/            ← Mode Secur
│   ├── SecurMax/         ← Mode Secur Max
│   ├── SecurOn/          ← Mode Secur On
│   ├── Captcha/          ← Système de captcha
│   └── Blacklist/        ← Blacklist
├── utils/                ← Fonctions utilitaires (logs, tickets…)
├── data/                 ← Données persistantes (invites…)
└── quickdb/              ← Driver base de données local
```

---

## Permissions recommandées

Invitez le bot avec la permission **Administrateur** pour un fonctionnement optimal.

---

## Crédits

**Made by Wumpus**
