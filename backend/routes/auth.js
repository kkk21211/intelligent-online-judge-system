const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 生成JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// 用户登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').isIn(['admin', 'teacher', 'student']).withMessage('角色无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password, role } = req.body;
    console.log('登录请求:', { username, role, password: '***' });

    // 测试数据库连接
    try {
      const testQuery = await query('SELECT COUNT(*) as count FROM users');
      console.log('数据库连接测试 - 用户总数:', testQuery[0].count);
    } catch (dbError) {
      console.error('数据库连接错误:', dbError);
      return res.status(500).json({ error: '数据库连接失败' });
    }

    // 查询用户
    console.log('SQL查询参数:', { username, role });
    const users = await query(
      'SELECT id, username, password, real_name, role, status FROM users WHERE username = ? AND role = ?',
      [username, role]
    );
    console.log('查询到的用户数量:', users.length);
    console.log('SQL查询结果:', users);

    if (users.length === 0) {
      console.log('用户不存在');
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = users[0];
    console.log('用户信息:', { id: user.id, username: user.username, role: user.role, status: user.status });

    // 检查用户状态
    if (user.status !== 'active') {
      console.log('用户状态不活跃:', user.status);
      return res.status(401).json({ error: '账号已被禁用' });
    }

    // 验证密码
    console.log('验证密码...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('密码验证结果:', isValidPassword);
    if (!isValidPassword) {
      console.log('密码验证失败');
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成token
    const token = generateToken(user.id, user.role);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await query(
      'SELECT id, username, real_name, email, phone, role, class_name, major, school FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 修改密码
router.put('/change-password', [
  authenticateToken,
  body('oldPassword').notEmpty().withMessage('原密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { oldPassword, newPassword } = req.body;

    // 获取当前用户密码
    const users = await query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 验证原密码
    const isValidPassword = await bcrypt.compare(oldPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '原密码错误' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
});

// 更新个人信息
router.put('/profile', [
  authenticateToken,
  body('real_name').optional().isLength({ min: 1 }).withMessage('姓名不能为空'),
  body('email').optional().isEmail().withMessage('邮箱格式无效'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { real_name, email, phone, class_name, major, school } = req.body;
    const updateFields = [];
    const updateValues = [];

    // 动态构建更新字段
    if (real_name !== undefined) {
      updateFields.push('real_name = ?');
      updateValues.push(real_name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (class_name !== undefined) {
      updateFields.push('class_name = ?');
      updateValues.push(class_name);
    }
    if (major !== undefined) {
      updateFields.push('major = ?');
      updateValues.push(major);
    }
    if (school !== undefined) {
      updateFields.push('school = ?');
      updateValues.push(school);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.user.id);

    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: '个人信息更新成功' });
  } catch (error) {
    console.error('更新个人信息错误:', error);
    res.status(500).json({ error: '更新个人信息失败' });
  }
});

// 验证token有效性
router.post('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      username: req.user.username,
      real_name: req.user.real_name,
      role: req.user.role
    }
  });
});

module.exports = router;