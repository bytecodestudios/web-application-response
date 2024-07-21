import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';


const app = express();
const PORT = process.env.PORT || 3000;
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const botToken = process.env.BOT_TOKEN;
const guildId = process.env.GUILD_ID;
const addRole = process.env.ADD_ROLE;
const removeRole = process.env.REMOVE_ROLE;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
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

app.post('/api/send-response', async (req, res) => {
    const { text, discordId, status } = req.body;

    let embedColor;
    let emoji;
    let message;
    if (status === 'accepted') {
        embedColor = 0x00FF00; // Green color for accepted
        emoji = '✅'; // Check mark emoji
        message = `Your application to Prime City Roleplay has been **accepted** and you have been allowlisted.`;
    } else {
        embedColor = 0xFF0000; // Red color for denied
        emoji = '❌'; // Cross mark emoji
        message = `Your application to Prime City Roleplay has been **denied**, Reason: ${text || 'contact staff to know!'}`;
    }

    const data = {
        content: `<@${discordId}>`, // Tag the user outside the embed
        embeds: [{
            title: `Application Response`,
            description: `${emoji} <@${discordId}> ${message}`,
            color: embedColor
        }]
    };

    try {
        const response = await axios.post(webhookUrl, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 204) {
            if (status == 'accepted') {
                const guild = await client.guilds.fetch(guildId);
                const member = await guild.members.fetch(discordId);
                member.roles.add(addRole);
                member.roles.remove(removeRole);
            }
            res.status(200).json({ message: 'Success' });
        } else {
            res.status(500).json({ message: `Error sending message, status code: ${response.status}` });
        }
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error sending message', error: error.response ? error.response.data : error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
