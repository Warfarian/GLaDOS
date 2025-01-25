const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get games by search query
app.get('/api/games/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const response = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        search: query,
        page_size: 10
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get game details by ID
app.get('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${RAWG_BASE_URL}/games/${id}`, {
      params: {
        key: RAWG_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

// Get store links for a game by name
app.get('/api/games/stores', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'Game name is required' });
    }

    // First, search for the game to get its ID
    const searchResponse = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        search: name,
        page_size: 1
      }
    });

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const gameId = searchResponse.data.results[0].id;

    // Then get the store links for that game
    const storesResponse = await axios.get(`${RAWG_BASE_URL}/games/${gameId}/stores`, {
      params: {
        key: RAWG_API_KEY
      }
    });

    const stores = storesResponse.data.results.map(result => ({
      storeName: result.store.name,
      url: result.url
    }));

    res.json({
      game: searchResponse.data.results[0].name,
      stores: stores
    });
  } catch (error) {
    console.error('Error fetching game stores:', error);
    res.status(500).json({ error: 'Failed to fetch game stores' });
  }
});

// Get game recommendations based on a game ID
app.get('/api/games/:id/recommendations', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${RAWG_BASE_URL}/games/${id}/suggested`, {
      params: {
        key: RAWG_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching game recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch game recommendations' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
