const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 9876;
const BASE_URL = "http://20.244.56.144/evaluation-service";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

async function fetchData(url) {
    try {
        const response = await axios.get(url, {
            headers: {
            Authorization: ACCESS_TOKEN,
            },
        });
    return response.data;
    } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return null;
    }
}

app.get("/users", async (req, res) => {
const usersData = await fetchData(`${BASE_URL}/users`);
if (!usersData || !usersData.users) {
    return res.status(500).json({ error: "Failed to fetch users data" });
}

const userPostCounts = [];
for (const userId in usersData.users) {
    const postsData = await fetchData(`${BASE_URL}/users/${userId}/posts`);
    if (!postsData || !postsData.posts) continue;
    userPostCounts.push({
        userId,
        name: usersData.users[userId],
        postCount: postsData.posts.length,
    });
}

const topUsers = userPostCounts
.sort((a, b) => b.postCount - a.postCount)
.slice(0, 5);

res.status(200).json(topUsers);
});

// Route: Get Top or Latest Posts
app.get("/posts", async (req, res) => {
const { type } = req.query;

if (!type || !["popular", "latest"].includes(type)) {
return res.status(400).json({ error: "Invalid type parameter. Use 'latest' or 'popular'." });
}

const usersData = await fetchData(`${BASE_URL}/users`);
if (!usersData || !usersData.users) {
return res.status(500).json({ error: "Failed to fetch users data" });
}

const allPosts = [];
for (const userId in usersData.users) {
const postsData = await fetchData(`${BASE_URL}/users/${userId}/posts`);
if (!postsData || !postsData.posts) continue;

for (const post of postsData.posts) {
const commentsData = await fetchData(`${BASE_URL}/posts/${post.id}/comments`);
allPosts.push({
...post,
commentsCount: commentsData ? commentsData.comments.length : 0,
});
}
}

if (type === "popular") {
const maxCommentsCount = Math.max(...allPosts.map((post) => post.commentsCount));
const popularPosts = allPosts.filter((post) => post.commentsCount === maxCommentsCount);
return res.status(200).json(popularPosts);
} else if (type === "latest") {
const latestPosts = allPosts
.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
.slice(0, 5);
return res.status(200).json(latestPosts);
}
});

app.use((req, res) => {
res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
console.log(`Microservice running on http://localhost:${PORT}`);
});
