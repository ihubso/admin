const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static files from the current directory
app.use(express.static(__dirname));

// Route root URL to your showcase page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📄 Serving admin-login.html\n`);
});