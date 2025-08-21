const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// 验证JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: '访问令牌缺失' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 验证用户是否存在且状态正常
    const users = await query(
      'SELECT id, username, real_name, role, status FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '访问令牌已过期' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的访问令牌' });
    }
    console.error('认证错误:', error);
    res.status(500).json({ error: '认证服务异常' });
  }
};

// 验证管理员权限
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

// 验证教师权限
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要教师权限' });
  }
  next();
};

// 验证学生权限
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: '需要学生权限' });
  }
  next();
};

// 验证教师或管理员权限
const requireTeacherOrAdmin = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要教师或管理员权限' });
  }
  next();
};

// 验证课程权限（教师只能访问自己的课程）
const requireCoursePermission = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;
    
    if (!courseId) {
      return res.status(400).json({ error: '课程ID缺失' });
    }

    // 管理员有所有权限
    if (req.user.role === 'admin') {
      return next();
    }

    // 检查教师是否有该课程权限
    if (req.user.role === 'teacher') {
      const permissions = await query(
        'SELECT 1 FROM teacher_courses WHERE teacher_id = ? AND course_id = ?',
        [req.user.id, courseId]
      );
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: '没有该课程的访问权限' });
      }
    }

    next();
  } catch (error) {
    console.error('课程权限验证错误:', error);
    res.status(500).json({ error: '权限验证失败' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireTeacherOrAdmin,
  requireCoursePermission
};