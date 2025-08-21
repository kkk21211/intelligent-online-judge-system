const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// 配置文件上传
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许文本文件和CSV文件
    if (file.mimetype === 'text/csv' || file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('只支持CSV和TXT文件格式'));
    }
  }
});

// 所有教师路由都需要认证和教师权限
router.use(authenticateToken, requireTeacher);

// 获取教师的课程列表
router.get('/courses', async (req, res) => {
  try {
    let courses;
    
    if (req.user.role === 'admin') {
      // 管理员可以看到所有课程
      courses = await query(`
        SELECT c.id, c.name, c.description, c.status, c.created_at,
               u.real_name as teacher_name
        FROM courses c
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE c.status = 'active'
        ORDER BY c.created_at DESC
      `);
    } else {
      // 教师只能看到自己的课程
      courses = await query(`
        SELECT c.id, c.name, c.description, c.status, c.created_at
        FROM courses c
        JOIN teacher_courses tc ON c.id = tc.course_id
        WHERE tc.teacher_id = ? AND c.status = 'active'
        ORDER BY c.created_at DESC
      `, [req.user.id]);
    }

    res.json({ courses });
  } catch (error) {
    console.error('获取课程列表错误:', error);
    res.status(500).json({ error: '获取课程列表失败' });
  }
});

// 单独添加学生
router.post('/students', [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3位'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('real_name').notEmpty().withMessage('真实姓名不能为空'),
  body('email').optional().isEmail().withMessage('邮箱格式无效'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password, real_name, email, phone, class_name, major, school } = req.body;

    // 检查用户名是否已存在
    const existingUsers = await query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入学生账号
    const result = await query(
      'INSERT INTO users (username, password, real_name, email, phone, class_name, major, school, role, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "student", ?)',
      [username, hashedPassword, real_name, email, phone, class_name, major, school, req.user.id]
    );

    res.status(201).json({
      message: '学生账号创建成功',
      student: {
        id: result.insertId,
        username,
        real_name,
        email,
        phone,
        class_name,
        major,
        school
      }
    });
  } catch (error) {
    console.error('创建学生账号错误:', error);
    res.status(500).json({ error: '创建学生账号失败' });
  }
});

// 批量导入学生
router.post('/students/batch', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const fs = require('fs');
    const path = require('path');
    
    // 读取上传的文件
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 解析CSV或TXT文件
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return res.status(400).json({ error: '文件内容为空' });
    }

    const students = [];
    const errors = [];
    
    // 解析每一行数据
    // 格式: username,password,real_name,email,phone,class_name,major,school
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = line.split(',').map(field => field.trim());
      
      if (fields.length < 3) {
        errors.push(`第${i + 1}行: 数据格式错误，至少需要用户名、密码、姓名`);
        continue;
      }
      
      const [username, password, real_name, email = '', phone = '', class_name = '', major = '', school = ''] = fields;
      
      if (!username || !password || !real_name) {
        errors.push(`第${i + 1}行: 用户名、密码、姓名不能为空`);
        continue;
      }
      
      if (password.length < 6) {
        errors.push(`第${i + 1}行: 密码至少6位`);
        continue;
      }
      
      students.push({
        username,
        password,
        real_name,
        email: email || null,
        phone: phone || null,
        class_name: class_name || null,
        major: major || null,
        school: school || null
      });
    }
    
    if (students.length === 0) {
      return res.status(400).json({ error: '没有有效的学生数据', details: errors });
    }
    
    // 批量插入学生数据
    const successCount = await transaction(async (connection) => {
      let count = 0;
      
      for (const student of students) {
        try {
          // 检查用户名是否已存在
          const [existing] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            [student.username]
          );
          
          if (existing.length > 0) {
            errors.push(`用户名 ${student.username} 已存在`);
            continue;
          }
          
          // 加密密码
          const hashedPassword = await bcrypt.hash(student.password, 10);
          
          // 插入学生
          await connection.execute(
            'INSERT INTO users (username, password, real_name, email, phone, class_name, major, school, role, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "student", ?)',
            [student.username, hashedPassword, student.real_name, student.email, student.phone, student.class_name, student.major, student.school, req.user.id]
          );
          
          count++;
        } catch (error) {
          errors.push(`用户名 ${student.username}: ${error.message}`);
        }
      }
      
      return count;
    });
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    res.json({
      message: `批量导入完成，成功创建 ${successCount} 个学生账号`,
      successCount,
      totalCount: students.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('批量导入学生错误:', error);
    res.status(500).json({ error: '批量导入失败' });
  }
});

// 获取学生列表
router.get('/students', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', class_name = '', major = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE role = "student"';
    let queryParams = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (class_name) {
      whereClause += ' AND class_name = ?';
      queryParams.push(class_name);
    }
    
    if (major) {
      whereClause += ' AND major = ?';
      queryParams.push(major);
    }

    // 获取学生列表
    const students = await query(
      `SELECT id, username, real_name, email, phone, class_name, major, school, status, created_at 
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
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取学生列表错误:', error);
    res.status(500).json({ error: '获取学生列表失败' });
  }
});

// 更新学生信息
router.put('/students/:studentId', [
  body('real_name').optional().isLength({ min: 1 }).withMessage('姓名不能为空'),
  body('email').optional().isEmail().withMessage('邮箱格式无效'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { studentId } = req.params;
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
    updateValues.push(studentId);

    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ? AND role = "student"`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    res.json({ message: '学生信息更新成功' });
  } catch (error) {
    console.error('更新学生信息错误:', error);
    res.status(500).json({ error: '更新学生信息失败' });
  }
});

// 删除学生
router.delete('/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await query(
      'DELETE FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    res.json({ message: '学生删除成功' });
  } catch (error) {
    console.error('删除学生错误:', error);
    res.status(500).json({ error: '删除学生失败' });
  }
});

// 重置学生密码
router.put('/students/:studentId/reset-password', [
  body('new_password').isLength({ min: 6 }).withMessage('新密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { studentId } = req.params;
    const { new_password } = req.body;

    // 加密新密码
    const hashedPassword = await bcrypt.hash(new_password, 10);

    const result = await query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = "student"',
      [hashedPassword, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    res.json({ message: '密码重置成功' });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ error: '重置密码失败' });
  }
});

// 获取班级列表
router.get('/classes', async (req, res) => {
  try {
    const classes = await query(
      'SELECT DISTINCT class_name FROM users WHERE role = "student" AND class_name IS NOT NULL ORDER BY class_name'
    );

    res.json({ classes: classes.map(c => c.class_name) });
  } catch (error) {
    console.error('获取班级列表错误:', error);
    res.status(500).json({ error: '获取班级列表失败' });
  }
});

// 获取专业列表
router.get('/majors', async (req, res) => {
  try {
    const majors = await query(
      'SELECT DISTINCT major FROM users WHERE role = "student" AND major IS NOT NULL ORDER BY major'
    );
    res.json({ majors: majors.map(m => m.major) });
  } catch (error) {
    console.error('获取专业列表错误:', error);
    res.status(500).json({ error: '获取专业列表失败' });
  }
});

// 导出学生数据
router.get('/students/export', async (req, res) => {
  try {
    const { search = '', class_name = '', major = '' } = req.query;
    
    let whereClause = 'WHERE role = "student"';
    let queryParams = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (class_name) {
      whereClause += ' AND class_name = ?';
      queryParams.push(class_name);
    }
    
    if (major) {
      whereClause += ' AND major = ?';
      queryParams.push(major);
    }

    const students = await query(
      `SELECT username as '学号', real_name as '姓名', email as '邮箱', 
              phone as '手机号', class_name as '班级', major as '专业', 
              school as '学校', status as '状态', created_at as '创建时间'
       FROM users ${whereClause} 
       ORDER BY created_at DESC`,
      queryParams
    );

    // 简单的CSV格式导出
    let csvContent = '';
    if (students.length > 0) {
      // 添加表头
      const headers = Object.keys(students[0]);
      csvContent += headers.join(',') + '\n';
      
      // 添加数据行
      students.forEach(student => {
        const row = headers.map(header => {
          const value = student[header] || '';
          // 处理包含逗号的值
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvContent += row.join(',') + '\n';
      });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send('\uFEFF' + csvContent); // 添加BOM以支持中文
  } catch (error) {
    console.error('导出学生数据错误:', error);
    res.status(500).json({ error: '导出学生数据失败' });
  }
});

module.exports = router;