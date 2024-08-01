import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const botToken = process.env.BOT_TOKEN;
const guildId = process.env.GUILD_ID;
const addRole = process.env.ADD_ROLE;
const removeRole = process.env.REMOVE_ROLE;
const formChannelId = process.env.FORM_CHANNEL_ID; // Channel ID where form details are posted
const responseChannelId = process.env.RESPONSE_CHANNEL_ID; // Channel ID where responses are posted

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.login(botToken);

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(join(__dirname, 'public')));

app.get('/*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.post('/api/submit-form', async (req, res) => {
    const { characterName, characterNationality, discordId, linked } = req.body;

    try {
        const formChannel = await client.channels.fetch(formChannelId);
        if (!formChannel || !formChannel.isTextBased()) {
            throw new Error('Invalid form channel');
        }

        // Create buttons with custom ID including discordId
        const acceptButton = new ButtonBuilder()
            .setCustomId(`accept_${discordId}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);

        const declineButton = new ButtonBuilder()
            .setCustomId(`decline_${discordId}`)
            .setLabel('Decline')
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder()
            .addComponents(acceptButton, declineButton);

        // Create embed with form details
        const embed = new EmbedBuilder()
            .setTitle('New Application')
            .addFields(
                { name: 'Character Name', value: characterName, inline: true },
                { name: 'Character Nationality', value: characterNationality, inline: true },
                { name: 'Discord ID', value: discordId, inline: true },
            )
            .setDescription(`${linked === 'Yes' ? 'This person has **linked** their cfx with fivem' : 'This person has **not linked** their cfx with fivem'}`)
            .setColor(0x00FF00);

        await formChannel.send({
            content: `<@${discordId}>`, // Tag the user outside the embed
            embeds: [embed],
            components: [actionRow] // Add buttons to the message
        });

        res.status(200).json({ message: 'Success' });
    } catch (error) {
        console.error('Error details:', error.message);
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
});

// Interaction handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    try {
        // Handle button interactions
        if (interaction.isButton()) {
            const { customId } = interaction;
            const [action, discordId] = customId.split('_');

            if (action === 'accept') {
                // Handle acceptance
                const guild = await client.guilds.fetch(guildId);
                const member = await guild.members.fetch(discordId);
                await member.roles.add(addRole);
                await member.roles.remove(removeRole);

                const responseEmbed = new EmbedBuilder()
                    .setTitle('Application Response')
                    .setDescription(`✅ Your application to Prime City Roleplay has been **Accepted** and you have been allowlisted.`)
                    .setColor(0x00FF00); // Green color

                await (await client.channels.fetch(responseChannelId)).send({
                    content: `<@${discordId}>`,
                    embeds: [responseEmbed]
                });

                // Disable buttons in the original message
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`accept_${discordId}`)
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`decline_${discordId}`)
                        .setLabel('Decline')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.update({ components: [row] });
                }

            } else if (action === 'decline') {
                // Show a modal to collect the reason
                const modal = new ModalBuilder()
                    .setCustomId(`declineReason_${discordId}`)
                    .setTitle('Provide Reason for Decline')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('declineReasonInput')
                                .setLabel('Reason for Decline')
                                .setStyle(TextInputStyle.Paragraph) // Corrected enum value
                                .setRequired(true)
                        )
                    );

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.showModal(modal);
                }

            } else {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Invalid action.', ephemeral: true });
                }
            }
        }

        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            const { customId, fields } = interaction;

            if (customId.startsWith('declineReason_')) {
                const [_, discordId] = customId.split('_');
                const reason = fields.getTextInputValue('declineReasonInput');

                const responseEmbed = new EmbedBuilder()
                    .setTitle('Application Response')
                    .setDescription(`❌ Your application to Prime City Roleplay has been **Denied**. \n**Reason**: ${reason}`)
                    .setColor(0xFF0000); // Red color

                await (await client.channels.fetch(responseChannelId)).send({
                    content: `<@${discordId}>`,
                    embeds: [responseEmbed]
                });

                // Disable buttons in the original message
                const formChannel = await client.channels.fetch(formChannelId);
                const formMessage = await formChannel.messages.fetch(interaction.message.id);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`accept_${discordId}`)
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`decline_${discordId}`)
                        .setLabel('Decline')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

                if (!interaction.replied && !interaction.deferred) {
                    await formMessage.edit({ components: [row] });
                    await interaction.reply({ content: 'Reason recorded and response sent.', ephemeral: true });
                }
            }
        }

    } catch (error) {
        console.error('Interaction error:', error.message);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
