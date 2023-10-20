import axios, { AxiosResponse } from 'axios';

async function sendMattermostAlert(message: string): Promise<void> {
    const bearer_token: string = "rjx4h6r8mi8pim91bg3ok3ecde";
    const channel_id: string = "yjo535moaiy55no3afzjqaqbca";
    const mattermost_url: string = "https://matter.knaken.eu/api/v4/posts";

    const payload = {
        channel_id: channel_id,
        message: message,
    };

    try {
        const response: AxiosResponse = await axios.post(mattermost_url, payload, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearer_token}`
            }
        });

        console.log(`${new Date().toISOString()} - Melding gemaakt naar Mattermost\n\n`);
    } catch (error) {
        console.error('Error sending alert to Mattermost:', error);
    }
}

export default sendMattermostAlert;
