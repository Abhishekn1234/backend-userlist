
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(bodyParser.json());


mongoose.connect('mongodb+srv://userlist:userlist@userlist.4gdog.mongodb.net/?retryWrites=true&w=majority&appName=USERLIST', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));


app.use('/user', authRoutes);
app.get('/',async(req,res)=>{
  res.send("Hello from userlist")
})
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
