# UserPlugins Script Generator
This is a static React site built with Vite to generate installation scripts for Equicord and Vencord, allowing users to select plugins from the [o9 Plugins](https://github.com/o9-9/VBPGenerator/blob/main/README.md) organization.

## Features
- **Client Selection**: Choose between Equicord, Vencord, or a Custom fork.
- **Dynamic Plugin List**: Fetches all repositories from the organization as available plugins.
- **Script Generation**: Supports PowerShell 7+, PowerShell 5, and Batch scripts.
- **Rich UI**: Modern dark theme with glassmorphism effects.
- **Advanced Options**: Git cloning vs ZIP download, custom install paths, dependency installers.

## Generator
A collection of Vencord plugins developed by o9 for enhancing Discord functionality.

## Installation
The easiest way to install these plugins is to use the **[Plugin Installer Generator](https://generator.o9ll.com)**.
Simply select the plugins you want and download your custom installation script.

## Plugins
| Plugin | Description | Repository |
| :--- | :--- | :--- |
| **vb-devtools-icon** | Adds a DevTools icon next to the inbox icon in the top navigation | [vb-devtools-icon](https://github.com/o9-9/vb-devtools-icon) |
| **vb-ghosted** | A Vencord/Equicord plugin. | [vb-ghosted](https://github.com/o9-9/vb-ghosted) |
| **vb-guild-export** | A Vencord/Equicord plugin. | [vb-guild-export](https://github.com/o9-9/vb-guild-export) |
| **vb-guildInviteSaver** | A Vencord/Equicord plugin. | [vb-guildInviteSaver](https://github.com/o9-9/vb-guildInviteSaver) |
| **vb-homeassistant-events** | A Vencord/Equicord plugin. | [vb-homeassistant-events](https://github.com/o9-9/vb-homeassistant-events) |
| **vb-instantScreenshare** | A Vencord/Equicord plugin. | [vb-instantScreenshare](https://github.com/o9-9/vb-instantScreenshare) |
| **vb-keepServers** | Keeps track of servers you've joined and allows you to rejoin them later (Web version using localStorage) | [vb-keepServers](https://github.com/o9-9/vb-keepServers) |
| **vb-keepServers.desktop** | Keeps track of servers you've joined and allows you to rejoin them later | [vb-keepServers.desktop](https://github.com/o9-9/vb-keepServers.desktop) |
| **vb-mcp** | MCP server for inspecting Discord and running JavaScript | [vb-mcp](https://github.com/o9-9/vb-mcp) |
| **vb-multiacc** | A Vencord plugin that allows using multiple Discord accounts in one instance by merging DMs and servers | [vb-multiacc](https://github.com/o9-9/vb-multiacc) |
| **vb-performancemodetoggle** | Adds a performance mode toggle button that optimizes Discord settings for better performance | [vb-performancemodetoggle](https://github.com/o9-9/vb-performancemodetoggle) |
| **vb-pttToggle** | A Vencord/Equicord plugin. | [vb-pttToggle](https://github.com/o9-9/vb-pttToggle) |
| **vb-reply-deleted** | A Vencord/Equicord plugin. | [vb-reply-deleted](https://github.com/o9-9/vb-reply-deleted) |
| **vb-startupChannel** | A Vencord/Equicord plugin. | [vb-startupChannel](https://github.com/o9-9/vb-startupChannel) |
| **vb-channeladmin** | Automatically blocks users when they join your voice channel by simulating button clicks on bot messages | [vb-channeladmin](https://github.com/o9-9/vb-channeladmin) |
| **vb-log** | Logs voice channel joins/leaves to the associated text chat | [vb-log](https://github.com/o9-9/vb-log) |
| **vb-user-actions** | Automatically takes actions against users joining your voice channel. | [vb-user-actions](https://github.com/o9-9/vb-user-actions) |
| **vb-waitforslot** | A Vencord plugin that adds a 'Wait for Slot' button to voice channel context menus | [vb-waitforslot](https://github.com/o9-9/vb-waitforslot) |
| **vb-followUser** | A Vencord/Equicord plugin. | [vb-followUser](https://github.com/o9-9/vb-followUser) |
| **vb-voiceChatUtilities** | A Vencord/Equicord plugin. | [vb-voiceChatUtilities](https://github.com/o9-9/vb-voiceChatUtilities) |

## AI Disclaimer
These plugins were developed with assistance from **Antigravity** (Google DeepMind's AI coding assistant). The AI was used to help with code generation, debugging, documentation, and implementation. While AI assistance was utilized, all code and features were reviewed and tested to ensure quality and functionality.

## Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

* **To deploy to GitHub Pages:**
1. Update `vite.config.js` with the correct `base` path if not hosting at root (e.g. `base: '/repo-name/'`).
2. Run `npm run build`.
3. Push the contents of `dist` to the `gh-pages` branch, or use a GitHub Action.

Since this repo is named `User.github.io`, it is a User/Org site, so it will be hosted at the root domain. The `base` in vite config should be `/` (default).

## Plugin Template

- [Template](https://github.com/o9-9/VBPTemplate)

## License
All plugins follow the same GPL-3.0-or-later license as Vencord.
