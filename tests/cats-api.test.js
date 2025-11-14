require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.CAT_API_KEY;
if (!API_KEY) throw new Error('Set CAT_API_KEY in .env');

const api = axios.create({
    baseURL: 'https://api.thecatapi.com/v1',
    headers: { 'x-api-key': API_KEY },
});

describe('The Cat API - Images ↔ Votes ↔ Favourites', () => {
    let receivedImageId;
    let favouriteId;
    let createdVoteId;

    // 1. GET IMAGE FIRST
    test('GET /images/search → obtain image_id', async () => {
        const { data } = await api.get('/images/search');
        receivedImageId = data[0].id;

        expect(Array.isArray(data)).toBe(true);
        expect(receivedImageId).toBeDefined();
    });

    // ---- FAVOURITES ----
    test('POST /favourites → add favourite', async () => {
        const { data } = await api.post('/favourites', {
            image_id: receivedImageId,
        });
        expect(data.message).toBe('SUCCESS');
        favouriteId = data.id;
    });

    test('GET /favourites → favourite exists', async () => {
        const { data } = await api.get('/favourites');
        // Go through each favourite (f), and give me the first one whose image_id matches receivedImageId
        const found = data.find(f => f.image_id === receivedImageId);
        expect(found).toBeDefined();
    });

    test('DELETE /favourites → favourite removed', async () => {
        await api.delete(`/favourites/${favouriteId}`);
        const { data } = await api.get('/favourites');
        const found = data.find(f => f.image_id === receivedImageId);
        expect(found).toBeUndefined();
    });

    // ---- VOTES ----
    test('POST /votes → add vote', async () => {
        const { data } = await api.post('/votes', {
            image_id: receivedImageId,
            value: 1,
        });
        expect(data.message).toBe('SUCCESS');
        createdVoteId = data.id;
    });

    test('GET /votes → vote exists', async () => {
        const { data } = await api.get('/votes');

        // Search vote obj by image_id and id
        const vote = data.find(vote =>
            vote.image_id === receivedImageId &&
            vote.id === createdVoteId
        );

        expect(vote).toBeDefined();
        expect(vote.image_id).toBe(receivedImageId);
        expect(vote.id).toBe(createdVoteId);
    });

    test('DELETE /votes → vote removed', async () => {
        await api.delete(`/votes/${createdVoteId}`);
        const { data } = await api.get('/votes');
        const found = data.find(v => v.image_id === receivedImageId);
        expect(found).toBeUndefined();
    });
});