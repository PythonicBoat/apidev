const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 9876;

const WINDOW_SIZE = 10;
const QUALIFIED_IDS = ["p", "f", "e", "r"];
let slidingWindow = [];

async function fetchNumbers(numberId) {
let apiUrl;

switch(numberId) {
case 'p':
apiUrl = 'http://20.244.56.144/evaluation-service/primes';
break;
case 'f':
apiUrl = 'http://20.244.56.144/evaluation-service/fibo';
break;
case 'e':
apiUrl = 'http://20.244.56.144/evaluation-service/even';
break;
case 'r':
apiUrl = 'http://20.244.56.144/evaluation-service/rand';
break;
}

try {
const response = await axios.get(apiUrl, { timeout: 500 });
return response.data.numbers || [];
} catch (error) {
return [];
}
}

app.get("/numbers/:numberId", async (req, res) => {
const { numberId } = req.params;

if (!QUALIFIED_IDS.includes(numberId)) {
return res.status(400).json({ error: "Invalid number ID" });
}

const newNumbers = await fetchNumbers(numberId);
const windowPrevState = [...slidingWindow];

const uniqueNewNumbers = newNumbers.filter(
(num) => !slidingWindow.includes(num)
);

slidingWindow.push(...uniqueNewNumbers);

if (slidingWindow.length > WINDOW_SIZE) {
slidingWindow.splice(0, slidingWindow.length - WINDOW_SIZE);
}

const avg =
slidingWindow.length > 0
? Number((slidingWindow.reduce((sum, num) => sum + num, 0) / slidingWindow.length).toFixed(2))
: null;

const response = {
windowPrevState: windowPrevState,
windowCurrState: [...slidingWindow],
numbers: newNumbers,
avg: avg
};

res.status(200).json(response);
});

app.listen(PORT, () => {
console.log(`Average Calculator Microservice running on https://localhost:${PORT}`);
});
