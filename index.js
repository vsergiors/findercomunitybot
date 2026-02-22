const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder 
} = require('discord.js');

const fs = require('fs');

// ===================== CONFIG =====================
client.login(process.env.DISCORD_TOKEN);
const CLIENT_ID = "1475243172765630584";
const GUILD_ID = "1475243595266261002";

const REQUIRED_ROLES = {
    megagen: "Megagen",
    finder: "Finder"
};

// ===================== CLIENT =====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

// ===================== CARGAR DATA =====================
function loadData() {
    try {
        const raw = fs.readFileSync('./data.json');
        return JSON.parse(raw);
    } catch (err) {
        console.error("Error cargando data.json:", err);
        return [];
    }
}

// ===================== UTILIDADES =====================
function hasRole(member, roleName) {
    return member.roles.cache.some(role => role.name === roleName);
}

function maskToken(token) {
    if (token.length <= 4) return "****";
    const visible = token.slice(-4);
    return "*".repeat(token.length - 4) + visible;
}

// ===================== COMANDOS =====================
const commands = [
    new SlashCommandBuilder()
        .setName('finder')
        .setDescription('Busca una cuenta ficticia')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('Usuario a buscar')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('megagen')
        .setDescription('Genera 7 cuentas ficticias aleatorias'),

    new SlashCommandBuilder()
        .setName('freesearch')
        .setDescription('Busca una cuenta con token oculto')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('Usuario a buscar')
                .setRequired(true)
        )
].map(cmd => cmd.toJSON());

// ===================== REGISTRO DE SLASH =====================
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log("Registrando comandos...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log("Comandos registrados correctamente.");
    } catch (error) {
        console.error("Error registrando comandos:", error);
    }
})();

// ===================== EVENTO READY =====================
client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

// ===================== INTERACTION =====================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const data = loadData();
    const member = interaction.member;

    try {

        // ================= FINDER =================
        if (interaction.commandName === 'finder') {

            if (!hasRole(member, REQUIRED_ROLES.finder)) {
                return interaction.reply({
                    content: "❌ No tienes permiso para usar este comando.",
                    ephemeral: true
                });
            }

            const username = interaction.options.getString('user');
            const account = data.find(acc => acc.username === username);

            if (!account) {
                return interaction.reply({
                    content: "⚠️ Usuario no encontrado.",
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: "📩 Revisa tus mensajes privados.",
                ephemeral: true
            });

            try {
                await interaction.user.send(
                    `🔎 **Resultado Finder**\n\n` +
                    `Servidor: ${account.server}\n` +
                    `Usuario: ${account.username}\n` +
                    `Token: ${account.token}`
                );
            } catch {
                await interaction.followUp({
                    content: "❌ No puedo enviarte DM. Tienes los mensajes cerrados.",
                    ephemeral: true
                });
            }
        }

        // ================= MEGAGEN =================
        if (interaction.commandName === 'megagen') {

            if (!hasRole(member, REQUIRED_ROLES.megagen)) {
                return interaction.reply({
                    content: "❌ No tienes permiso para usar este comando.",
                    ephemeral: true
                });
            }

            if (data.length === 0) {
                return interaction.reply({
                    content: "⚠️ No hay cuentas disponibles.",
                    ephemeral: true
                });
            }

            const shuffled = data.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 7);

            await interaction.reply({
                content: "📩 Revisa tus mensajes privados.",
                ephemeral: true
            });

            let message = "🎲 **MegaGen Resultados**\n\n";

            selected.forEach((acc, i) => {
                message += `#${i + 1}\nServidor: ${acc.server}\nUsuario: ${acc.username}\nToken: ${acc.token}\n\n`;
            });

            try {
                await interaction.user.send(message);
            } catch {
                await interaction.followUp({
                    content: "❌ No puedo enviarte DM. Tienes los mensajes cerrados.",
                    ephemeral: true
                });
            }
        }

        // ================= FREESEARCH =================
        if (interaction.commandName === 'freesearch') {

            const username = interaction.options.getString('user');
            const account = data.find(acc => acc.username === username);

            if (!account) {
                return interaction.reply({
                    content: "⚠️ Usuario no encontrado.",
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: "📩 Revisa tus mensajes privados.",
                ephemeral: true
            });

            try {
                await interaction.user.send(
                    `🔎 **FreeSearch Resultado**\n\n` +
                    `Servidor: ${account.server}\n` +
                    `Usuario: ${account.username}\n` +
                    `Token: ${maskToken(account.token)}`
                );
            } catch {
                await interaction.followUp({
                    content: "❌ No puedo enviarte DM. Tienes los mensajes cerrados.",
                    ephemeral: true
                });
            }
        }

    } catch (err) {
        console.error("Error en comando:", err);

        if (!interaction.replied) {
            await interaction.reply({
                content: "⚠️ Ocurrió un error inesperado.",
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);
