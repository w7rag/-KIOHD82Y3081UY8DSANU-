const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running and alive!'); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
