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
const formChannelId = process.env.FORM_CHANNEL_ID;
const responseChannelId = process.env.RESPONSE_CHANNEL_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.login(botToken);

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

app.use(cors());
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
            content: `<@${discordId}>`,
            embeds: [embed],
            components: [actionRow]
        });

        res.status(200).json({ message: 'Success' });
    } catch (error) {
        console.error('Error details:', error.message);
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() || interaction.isModalSubmit()) {
        try {
            if (interaction.isButton()) {
                const { customId } = interaction;
                const [action, discordId] = customId.split('_');

                if (action === 'accept') {
                    const guild = await client.guilds.fetch(guildId);
                    const member = await guild.members.fetch(discordId);
                    
                    // Adding and removing roles
                    await member.roles.add(addRole);
                    await member.roles.remove(removeRole);

                    const responseEmbed = new EmbedBuilder()
                        .setTitle('Application Response')
                        .setDescription(`✅ Your application to Prime City Roleplay has been **Accepted** and you have been allowlisted.`)
                        .setColor(0x00FF00);

                    const responseChannel = await client.channels.fetch(responseChannelId);
                    await responseChannel.send({
                        content: `<@${discordId}>`,
                        embeds: [responseEmbed]
                    });

                    // Disabling buttons after action is taken
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
                    const modal = new ModalBuilder()
                        .setCustomId(`declineReason_${discordId}`)
                        .setTitle('Provide Reason for Decline')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('declineReasonInput')
                                    .setLabel('Reason for Decline')
                                    .setStyle(TextInputStyle.Paragraph)
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

            if (interaction.isModalSubmit()) {
                const { customId, fields } = interaction;

                if (customId.startsWith('declineReason_')) {
                    const [_, discordId] = customId.split('_');
                    const reason = fields.getTextInputValue('declineReasonInput');

                    const responseEmbed = new EmbedBuilder()
                        .setTitle('Application Response')
                        .setDescription(`❌ Your application to Prime City Roleplay has been **Denied**. \n**Reason**: ${reason}`)
                        .setColor(0xFF0000);

                    const responseChannel = await client.channels.fetch(responseChannelId);
                    await responseChannel.send({
                        content: `<@${discordId}>`,
                        embeds: [responseEmbed]
                    });

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
                    }
                }
            }
        } catch (error) {
            console.error('Interaction error:', error.message);
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
