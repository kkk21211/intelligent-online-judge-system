const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 所有管理员路由都需要认证和管理员权限
router.use(authenticateToken, requireAdmin);

// 添加教师账号
router.post('/teachers', [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3位'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('realName').notEmpty().withMessage('真实姓名不能为空'),
  body('email').optional().isEmail().withMessage('邮箱格式无效'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { username, password, realName, email, phone, department } = req.body;

    // 检查用户名是否已存在
    const existingUsers = await query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入教师账号
    const result = await query(
      'INSERT INTO users (username, password, real_name, email, phone, department, role, status, created_by) VALUES (?, ?, ?, ?, ?, ?, "teacher", "active", ?)',
      [username, hashedPassword, realName, email, phone, department, req.user.id]
    );

    res.status(201).json({
      message: '教师账号创建成功',
      teacher: {
        id: result.insertId,
        username,
        realName,
        email,
        phone,
        department,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('创建教师账号错误:', error);
    res.status(500).json({ message: '创建教师账号失败' });
  }
});

// 更新课程
router.put('/courses/:id', [
  body('courseName').notEmpty().withMessage('课程名称不能为空'),
  body('courseCode').optional().isString(),
  body('description').optional().isString(),
  body('credits').optional().isInt(),
  body('semester').optional().isString(),
  body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { courseName, courseCode, description, credits, semester, status } = req.body;

    // 检查课程是否存在
    const existingCourse = await query(
      'SELECT id FROM courses WHERE id = ?',
      [id]
    );

    if (existingCourse.length === 0) {
      return res.status(404).json({ message: '课程不存在' });
    }

    // 更新课程信息
    await query(
      'UPDATE courses SET name = ?, course_code = ?, description = ?, credits = ?, semester = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [courseName, courseCode, description, credits, semester, status, id]
    );

    res.json({
      message: '课程信息更新成功',
      course: {
        id: parseInt(id),
        courseName,
        courseCode,
        description,
        credits,
        semester,
        status
      }
    });
  } catch (error) {
    console.error('更新课程信息错误:', error);
    res.status(500).json({ message: '更新课程信息失败' });
  }
});

// 删除课程
router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查课程是否存在
    const existingCourse = await query(
      'SELECT id FROM courses WHERE id = ?',
      [id]
    );

    if (existingCourse.length === 0) {
      return res.status(404).json({ message: '课程不存在' });
    }

    // 删除课程（软删除，设置状态为inactive）
    await query(
      'UPDATE courses SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: '课程删除成功' });
  } catch (error) {
    console.error('删除课程错误:', error);
    res.status(500).json({ message: '删除课程失败' });
  }
});

// 获取所有教师列表
router.get('/teachers', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE role = "teacher"';
    let queryParams = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // 获取教师列表
    const teachersResult = await query(
      `SELECT id, username, real_name as realName, email, phone, department, status, created_at as createdAt 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // 获取总数
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );

    res.json({
      teachers: teachersResult,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取教师列表错误:', error);
    res.status(500).json({ message: '获取教师列表失败' });
  }
});

// 编辑教师信息
router.put('/teachers/:id', [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3位'),
  body('realName').notEmpty().withMessage('真实姓名不能为空'),
  body('email').optional().isEmail().withMessage('邮箱格式无效'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { username, realName, email, phone, department } = req.body;

    // 检查教师是否存在
    const existingTeacher = await query(
      'SELECT id FROM users WHERE id = ? AND role = "teacher"',
      [id]
    );

    if (existingTeacher.length === 0) {
      return res.status(404).json({ message: '教师不存在' });
    }

    // 检查用户名是否被其他用户使用
    const existingUsers = await query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 更新教师信息
    await query(
      'UPDATE users SET username = ?, real_name = ?, email = ?, phone = ?, department = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username, realName, email, phone, department, id]
    );

    res.json({
      message: '教师信息更新成功',
      teacher: {
        id: parseInt(id),
        username,
        realName,
        email,
        phone,
        department
      }
    });
  } catch (error) {
    console.error('更新教师信息错误:', error);
    res.status(500).json({ message: '更新教师信息失败' });
  }
});

// 创建课程
router.post('/courses', [
  body('courseName').notEmpty().withMessage('课程名称不能为空'),
  body('courseCode').optional().isString(),
  body('description').optional().isString(),
  body('credits').optional().isInt(),
  body('semester').optional().isString(),
  body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { courseName, courseCode, description, credits, semester, status = 'active' } = req.body;

    // 创建课程
    const result = await query(
      'INSERT INTO courses (name, course_code, description, credits, semester, status) VALUES (?, ?, ?, ?, ?, ?)',
      [courseName, courseCode, description, credits, semester, status]
    );

    res.status(201).json({
      message: '课程创建成功',
      course: {
        id: result.insertId,
        courseName,
        courseCode,
        description,
        credits,
        semester,
        status
      }
    });
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(500).json({ error: '创建课程失败' });
  }
});

// 获取所有课程列表
router.get('/courses', async (req, res) => {
  try {
    const coursesResult = await query(`
      SELECT id, name as courseName, course_code as courseCode, description, credits, semester, status, created_at as createdAt
      FROM courses
      ORDER BY created_at DESC
    `);

    res.json({ courses: coursesResult });
  } catch (error) {
    console.error('获取课程列表错误:', error);
    res.status(500).json({ message: '获取课程列表失败' });
  }
});

// 为教师分配课程权限
router.post('/assign-course', [
  body('teacher_id').isInt().withMessage('教师ID无效'),
  body('course_id').isInt().withMessage('课程ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { teacher_id, course_id } = req.body;

    // 验证教师和课程是否存在
    const teacher = await query(
      'SELECT id FROM users WHERE id = ? AND role = "teacher" AND status = "active"',
      [teacher_id]
    );

    const course = await query(
      'SELECT id FROM courses WHERE id = ? AND status = "active"',
      [course_id]
    );

    if (teacher.length === 0) {
      return res.status(400).json({ error: '指定的教师不存在或已被禁用' });
    }

    if (course.length === 0) {
      return res.status(400).json({ error: '指定的课程不存在或已被禁用' });
    }

    // 检查是否已经分配过权限
    const existing = await query(
      'SELECT id FROM teacher_courses WHERE teacher_id = ? AND course_id = ?',
      [teacher_id, course_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: '该教师已有此课程权限' });
    }

    // 分配权限
    await query(
      'INSERT INTO teacher_courses (teacher_id, course_id, assigned_by) VALUES (?, ?, ?)',
      [teacher_id, course_id, req.user.id]
    );

    res.json({ message: '课程权限分配成功' });
  } catch (error) {
    console.error('分配课程权限错误:', error);
    res.status(500).json({ error: '分配课程权限失败' });
  }
});

// 撤销教师课程权限
router.delete('/revoke-course', [
  body('teacher_id').isInt().withMessage('教师ID无效'),
  body('course_id').isInt().withMessage('课程ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { teacher_id, course_id } = req.body;

    const result = await query(
      'DELETE FROM teacher_courses WHERE teacher_id = ? AND course_id = ?',
      [teacher_id, course_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '未找到相关权限记录' });
    }

    res.json({ message: '课程权限撤销成功' });
  } catch (error) {
    console.error('撤销课程权限错误:', error);
    res.status(500).json({ error: '撤销课程权限失败' });
  }
});

// 获取教师的课程权限
router.get('/teachers/:teacherId/permissions', async (req, res) => {
  try {
    const { teacherId } = req.params;

    const permissions = await query(`
      SELECT c.id as courseId, c.name as courseName, c.course_code as courseCode, tc.created_at as assignedAt
      FROM teacher_courses tc
      JOIN courses c ON tc.course_id = c.id
      WHERE tc.teacher_id = ? AND c.status = 'active'
      ORDER BY tc.created_at DESC
    `, [teacherId]);

    res.json({ permissions });
  } catch (error) {
    console.error('获取教师课程权限错误:', error);
    res.status(500).json({ message: '获取教师课程权限失败' });
  }
});

// 设置教师课程权限
router.post('/teachers/:teacherId/permissions', [
  body('courseIds').isArray().withMessage('课程ID列表必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { teacherId } = req.params;
    const { courseIds } = req.body;

    // 检查教师是否存在
    const teacher = await query(
      'SELECT id FROM users WHERE id = ? AND role = "teacher" AND status = "active"',
      [teacherId]
    );

    if (teacher.length === 0) {
      return res.status(404).json({ message: '教师不存在或已被禁用' });
    }

    // 开始事务
    await query('START TRANSACTION');

    try {
      // 删除现有权限
      await query(
        'DELETE FROM teacher_courses WHERE teacher_id = ?',
        [teacherId]
      );

      // 添加新权限
      if (courseIds && courseIds.length > 0) {
        const values = courseIds.map(courseId => [teacherId, courseId, req.user.id]);
        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatValues = values.flat();
        
        await query(
          `INSERT INTO teacher_courses (teacher_id, course_id, assigned_by) VALUES ${placeholders}`,
          flatValues
        );
      }

      await query('COMMIT');
      res.json({ message: '权限设置成功' });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('设置教师课程权限错误:', error);
    res.status(500).json({ message: '设置教师课程权限失败' });
  }
});

// 获取教师的课程权限（保持原有接口兼容性）
router.get('/teachers/:teacherId/courses', async (req, res) => {
  try {
    const { teacherId } = req.params;

    const courses = await query(`
      SELECT c.id, c.name, c.description, tc.created_at as assigned_at
      FROM teacher_courses tc
      JOIN courses c ON tc.course_id = c.id
      WHERE tc.teacher_id = ? AND c.status = 'active'
      ORDER BY tc.created_at DESC
    `, [teacherId]);

    res.json({ courses });
  } catch (error) {
    console.error('获取教师课程权限错误:', error);
    res.status(500).json({ message: '获取教师课程权限失败' });
  }
});

// 禁用/启用教师账号
router.put('/teachers/:teacherId/status', [
  body('status').isIn(['active', 'inactive']).withMessage('状态值无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { teacherId } = req.params;
    const { status } = req.body;

    const result = await query(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = "teacher"',
      [status, teacherId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '教师不存在' });
    }

    res.json({ message: `教师账号已${status === 'active' ? '启用' : '禁用'}` });
  } catch (error) {
    console.error('更新教师状态错误:', error);
    res.status(500).json({ error: '更新教师状态失败' });
  }
});

module.exports = router;