
const express = require('express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 

const router = express.Router();




router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
  
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'ユーザーはすでに存在します。' });
    }


    const user = new User({
      name,
      email,
      password,
    });


    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', {
      expiresIn: '30d',
    });

    res.status(201).json({
      message: '登録成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        date: new Date()
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'ユーザーが見つかりません' });
    }

    // Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'パスワードが間違っています' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', {
      expiresIn: '30d',
    });

    res.status(200).json({
      message: 'ログイン成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
});

// Forgot Password Route (Simplified)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'ユーザーが見つかりません' });
      }
  
      // Generate Password Reset Token and Save in DB
      const resetToken = jwt.sign({ id: user._id }, 'reset_secret', { expiresIn: '1h' });
      user.resetToken = resetToken;
      user.resetTokenExpire = Date.now() + 3600000;  // Token valid for 1 hour
  
      await user.save();
  
      // Simulate Email by Returning Reset Link in Response
      const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
  
      res.status(200).json({ 
        message: 'リセットリンクが作成されました',
        resetLink,  // Send reset link directly (For development purposes only)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'サーバーエラー' });
    }
  });
  
// Reset Password Route
// Reset Password Route with Confirm Password
router.post('/reset-password/:token', async (req, res) => {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
  
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'パスワードが一致しません' });
    }
  
    try {
      const decoded = jwt.verify(token, 'reset_secret');
      const user = await User.findById(decoded.id);
  
      if (!user) {
        return res.status(404).json({ message: 'ユーザーが見つかりません' });
      }
  
  
      user.password = password;  
      await user.save();
  
      res.status(200).json({ message: 'パスワードがリセットされました' });
    } catch (error) {
      res.status(400).json({ message: 'トークンが無効または期限切れです' });
    }
  });

router.get('/users', async (req, res) => {
    try {
      const users = await User.find().select('-password');  // Exclude the password field
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'サーバーエラー' });
    }
  });
  
  


router.get('/profile', async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: '認証トークンがありません' }); 
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const user = await User.findById(decoded.id).select('-password'); 

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
});


let tokenBlacklist = []; 


const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: '認証トークンがありません' });
  }

  if (tokenBlacklist.includes(token)) {
    return res.status(403).json({ message: '無効なトークンです' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'トークンが無効です' });
  }
};

router.post('/logout', (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    tokenBlacklist.push(token);  
  }
  res.status(200).json({ message: 'ログアウトしました' });
});

module.exports = router;
