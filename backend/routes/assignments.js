const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireTeacherOrAdmin, requireCoursePermission } = require('../middleware/auth');

const router = express.Router();

// 获取作业列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', course_id = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE a.status = "active"';
    let queryParams = [];

    // 根据用户角色过滤
    if (req.user.role === 'teacher') {
      whereClause += ' AND a.created_by = ?';
      queryParams.push(req.user.id);
    } else if (req.user.role === 'student') {
      whereClause += ' AND EXISTS (SELECT 1 FROM student_assignments sa WHERE sa.assignment_id = a.id AND sa.student_id = ?)';
      queryParams.push(req.user.id);
    }

    if (status) {
      const now = new Date();
      if (status === 'active') {
        whereClause += ' AND a.start_time <= ? AND a.end_time > ?';
        queryParams.push(now, now);
      } else if (status === 'upcoming') {
        whereClause += ' AND a.start_time > ?';
        queryParams.push(now);
      } else if (status === 'ended') {
        whereClause += ' AND a.end_time <= ?';
        queryParams.push(now);
      }
    }

    if (course_id) {
      whereClause += ' AND a.course_id = ?';
      queryParams.push(course_id);
    }

    if (search) {
      whereClause += ' AND (a.title LIKE ? OR a.description LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // 获取作业列表
    const assignments = await query(
      `SELECT a.id, a.title, a.description, a.start_time, a.end_time, a.created_at,
              c.name as course_name, u.real_name as creator_name,
              COUNT(DISTINCT ap.problem_id) as problem_count,
              COUNT(DISTINCT sa.student_id) as student_count,
              COUNT(DISTINCT CASE WHEN sa.status = 'submitted' THEN sa.student_id END) as submitted_count
       FROM assignments a
       LEFT JOIN courses c ON a.course_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       LEFT JOIN assignment_problems ap ON a.id = ap.assignment_id
       LEFT JOIN student_assignments sa ON a.id = sa.assignment_id
       ${whereClause}
       GROUP BY a.id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // 获取总数
    const totalResult = await query(
      `SELECT COUNT(DISTINCT a.id) as total FROM assignments a ${whereClause}`,
      queryParams
    );

    res.json({
      assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取作业列表错误:', error);
    res.status(500).json({ error: '获取作业列表失败' });
  }
});

// 获取作业详情
router.get('/:assignmentId', authenticateToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // 获取作业基本信息
    const assignments = await query(
      `SELECT a.*, c.name as course_name, u.real_name as creator_name
       FROM assignments a
       LEFT JOIN courses c ON a.course_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = ? AND a.status = "active"`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const assignment = assignments[0];

    // 权限检查
    if (req.user.role === 'teacher' && assignment.created_by !== req.user.id) {
      return res.status(403).json({ error: '没有访问该作业的权限' });
    }

    if (req.user.role === 'student') {
      const studentAssignments = await query(
        'SELECT 1 FROM student_assignments WHERE assignment_id = ? AND student_id = ?',
        [assignmentId, req.user.id]
      );
      
      if (studentAssignments.length === 0) {
        return res.status(403).json({ error: '没有访问该作业的权限' });
      }
    }

    // 获取作业题目
    const problems = await query(
      `SELECT p.id, p.title, p.type, p.difficulty, p.description, ap.score, ap.order_index
       FROM assignment_problems ap
       JOIN problems p ON ap.problem_id = p.id
       WHERE ap.assignment_id = ?
       ORDER BY ap.order_index ASC`,
      [assignmentId]
    );

    // 获取学生列表（仅教师和管理员可见）
    let students = [];
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      students = await query(
        `SELECT u.id, u.username, u.real_name, u.class, u.major,
                sa.status, sa.score, sa.submitted_at, sa.graded_at
         FROM student_assignments sa
         JOIN users u ON sa.student_id = u.id
         WHERE sa.assignment_id = ?
         ORDER BY u.real_name ASC`,
        [assignmentId]
      );
    }

    res.json({
      assignment,
      problems,
      students
    });
  } catch (error) {
    console.error('获取作业详情错误:', error);
    res.status(500).json({ error: '获取作业详情失败' });
  }
});

// 创建作业
router.post('/', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('title').notEmpty().withMessage('作业标题不能为空'),
  body('description').optional(),
  body('start_time').isISO8601().withMessage('开始时间格式无效'),
  body('end_time').isISO8601().withMessage('结束时间格式无效'),
  body('course_id').optional().isInt().withMessage('课程ID无效'),
  body('problems').isArray().withMessage('题目列表必须是数组'),
  body('students').isArray().withMessage('学生列表必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const {
      title, description, start_time, end_time, instructions,
      course_id, problems, students
    } = req.body;

    // 验证时间
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ error: '开始时间必须早于结束时间' });
    }

    // 验证课程权限
    if (course_id && req.user.role === 'teacher') {
      const permissions = await query(
        'SELECT 1 FROM teacher_courses WHERE teacher_id = ? AND course_id = ?',
        [req.user.id, course_id]
      );
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: '没有该课程的权限' });
      }
    }

    // 验证题目是否存在
    if (problems.length === 0) {
      return res.status(400).json({ error: '至少需要选择一道题目' });
    }

    const problemIds = problems.map(p => p.problem_id);
    const existingProblems = await query(
      `SELECT id FROM problems WHERE id IN (${problemIds.map(() => '?').join(',')}) AND status = "active"`,
      problemIds
    );

    if (existingProblems.length !== problemIds.length) {
      return res.status(400).json({ error: '部分题目不存在或已被删除' });
    }

    // 验证学生是否存在
    if (students.length === 0) {
      return res.status(400).json({ error: '至少需要分配给一名学生' });
    }

    const existingStudents = await query(
      `SELECT id FROM users WHERE id IN (${students.map(() => '?').join(',')}) AND role = "student" AND status = "active"`,
      students
    );

    if (existingStudents.length !== students.length) {
      return res.status(400).json({ error: '部分学生不存在或已被禁用' });
    }

    const result = await transaction(async (connection) => {
      // 创建作业
      const [assignmentResult] = await connection.execute(
        `INSERT INTO assignments 
         (title, description, start_time, end_time, instructions, course_id, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description, start_time, end_time, instructions, course_id, req.user.id]
      );

      const assignmentId = assignmentResult.insertId;

      // 添加题目到作业
      for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];
        await connection.execute(
          'INSERT INTO assignment_problems (assignment_id, problem_id, score, order_index) VALUES (?, ?, ?, ?)',
          [assignmentId, problem.problem_id, problem.score || 100, i + 1]
        );
      }

      // 分配给学生
      for (const studentId of students) {
        await connection.execute(
          'INSERT INTO student_assignments (assignment_id, student_id, status) VALUES (?, ?, "assigned")',
          [assignmentId, studentId]
        );
      }

      return assignmentId;
    });

    res.status(201).json({
      message: '作业创建成功',
      assignmentId: result
    });
  } catch (error) {
    console.error('创建作业错误:', error);
    res.status(500).json({ error: '创建作业失败' });
  }
});

// 更新作业
router.put('/:assignmentId', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('title').optional().notEmpty().withMessage('作业标题不能为空'),
  body('start_time').optional().isISO8601().withMessage('开始时间格式无效'),
  body('end_time').optional().isISO8601().withMessage('结束时间格式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { assignmentId } = req.params;
    const { title, description, start_time, end_time, instructions } = req.body;

    // 验证作业是否存在且有权限修改
    const assignments = await query(
      'SELECT * FROM assignments WHERE id = ? AND status = "active"',
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const assignment = assignments[0];

    // 检查权限
    if (req.user.role === 'teacher' && assignment.created_by !== req.user.id) {
      return res.status(403).json({ error: '没有修改该作业的权限' });
    }

    // 验证时间
    const newStartTime = start_time || assignment.start_time;
    const newEndTime = end_time || assignment.end_time;
    
    if (new Date(newStartTime) >= new Date(newEndTime)) {
      return res.status(400).json({ error: '开始时间必须早于结束时间' });
    }

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (start_time !== undefined) {
      updateFields.push('start_time = ?');
      updateValues.push(start_time);
    }
    if (end_time !== undefined) {
      updateFields.push('end_time = ?');
      updateValues.push(end_time);
    }
    if (instructions !== undefined) {
      updateFields.push('instructions = ?');
      updateValues.push(instructions);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(assignmentId);

    await query(
      `UPDATE assignments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: '作业更新成功' });
  } catch (error) {
    console.error('更新作业错误:', error);
    res.status(500).json({ error: '更新作业失败' });
  }
});

// 删除作业
router.delete('/:assignmentId', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // 验证作业是否存在且有权限删除
    const assignments = await query(
      'SELECT * FROM assignments WHERE id = ? AND status = "active"',
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const assignment = assignments[0];

    // 检查权限
    if (req.user.role === 'teacher' && assignment.created_by !== req.user.id) {
      return res.status(403).json({ error: '没有删除该作业的权限' });
    }

    // 软删除作业
    await query(
      'UPDATE assignments SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [assignmentId]
    );

    res.json({ message: '作业删除成功' });
  } catch (error) {
    console.error('删除作业错误:', error);
    res.status(500).json({ error: '删除作业失败' });
  }
});

// 添加学生到作业
router.post('/:assignmentId/students', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('student_ids').isArray().withMessage('学生ID列表必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { assignmentId } = req.params;
    const { student_ids } = req.body;

    // 验证作业是否存在且有权限
    const assignments = await query(
      'SELECT * FROM assignments WHERE id = ? AND status = "active"',
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const assignment = assignments[0];

    if (req.user.role === 'teacher' && assignment.created_by !== req.user.id) {
      return res.status(403).json({ error: '没有修改该作业的权限' });
    }

    // 验证学生是否存在
    const existingStudents = await query(
      `SELECT id FROM users WHERE id IN (${student_ids.map(() => '?').join(',')}) AND role = "student" AND status = "active"`,
      student_ids
    );

    if (existingStudents.length !== student_ids.length) {
      return res.status(400).json({ error: '部分学生不存在或已被禁用' });
    }

    // 检查哪些学生已经分配了该作业
    const alreadyAssigned = await query(
      `SELECT student_id FROM student_assignments WHERE assignment_id = ? AND student_id IN (${student_ids.map(() => '?').join(',')})`,
      [assignmentId, ...student_ids]
    );

    const alreadyAssignedIds = alreadyAssigned.map(sa => sa.student_id);
    const newStudentIds = student_ids.filter(id => !alreadyAssignedIds.includes(id));

    if (newStudentIds.length === 0) {
      return res.status(400).json({ error: '所有学生都已分配该作业' });
    }

    // 添加新学生
    for (const studentId of newStudentIds) {
      await query(
        'INSERT INTO student_assignments (assignment_id, student_id, status) VALUES (?, ?, "assigned")',
        [assignmentId, studentId]
      );
    }

    res.json({
      message: `成功添加 ${newStudentIds.length} 名学生`,
      added_count: newStudentIds.length,
      already_assigned_count: alreadyAssignedIds.length
    });
  } catch (error) {
    console.error('添加学生到作业错误:', error);
    res.status(500).json({ error: '添加学生到作业失败' });
  }
});

// 从作业中移除学生
router.delete('/:assignmentId/students/:studentId', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;

    // 验证作业是否存在且有权限
    const assignments = await query(
      'SELECT * FROM assignments WHERE id = ? AND status = "active"',
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const assignment = assignments[0];

    if (req.user.role === 'teacher' && assignment.created_by !== req.user.id) {
      return res.status(403).json({ error: '没有修改该作业的权限' });
    }

    // 删除学生作业分配
    const result = await query(
      'DELETE FROM student_assignments WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '该学生未分配此作业' });
    }

    res.json({ message: '学生移除成功' });
  } catch (error) {
    console.error('移除学生错误:', error);
    res.status(500).json({ error: '移除学生失败' });
  }
});

// 获取作业统计
router.get('/:assignmentId/stats', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // 验证作业是否存在且有权限
    const assignments = await query(
      'SELECT * FROM assignments WHERE id = ? AND status = "active"',
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const assignment = assignments[0];

    if (req.user.role === 'teacher' && assignment.created_by !== req.user.id) {
      return res.status(403).json({ error: '没有查看该作业统计的权限' });
    }

    // 获取基本统计
    const basicStats = await query(
      `SELECT 
         COUNT(*) as total_students,
         COUNT(CASE WHEN sa.status = 'submitted' THEN 1 END) as submitted_students,
         COUNT(CASE WHEN sa.status = 'graded' THEN 1 END) as graded_students,
         AVG(CASE WHEN sa.status = 'graded' THEN sa.score END) as average_score
       FROM student_assignments sa
       WHERE sa.assignment_id = ?`,
      [assignmentId]
    );

    // 获取题目统计
    const problemStats = await query(
      `SELECT p.id, p.title, p.type,
              COUNT(s.id) as submission_count,
              AVG(s.score) as average_score,
              COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count
       FROM assignment_problems ap
       JOIN problems p ON ap.problem_id = p.id
       LEFT JOIN submissions s ON p.id = s.problem_id AND s.assignment_id = ?
       WHERE ap.assignment_id = ?
       GROUP BY p.id
       ORDER BY ap.order_index ASC`,
      [assignmentId, assignmentId]
    );

    // 获取分数分布
    const scoreDistribution = await query(
      `SELECT 
         CASE 
           WHEN sa.score >= 90 THEN '90-100'
           WHEN sa.score >= 80 THEN '80-89'
           WHEN sa.score >= 70 THEN '70-79'
           WHEN sa.score >= 60 THEN '60-69'
           ELSE '0-59'
         END as score_range,
         COUNT(*) as count
       FROM student_assignments sa
       WHERE sa.assignment_id = ? AND sa.status = 'graded'
       GROUP BY score_range
       ORDER BY score_range DESC`,
      [assignmentId]
    );

    res.json({
      basicStats: basicStats[0],
      problemStats,
      scoreDistribution
    });
  } catch (error) {
    console.error('获取作业统计错误:', error);
    res.status(500).json({ error: '获取作业统计失败' });
  }
});

module.exports = router;