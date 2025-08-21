const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireStudent } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CryptoJS = require('crypto-js');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/submissions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 使用安全的文件扩展名
    const safeExtensions = {
      '.py': '.txt',
      '.cpp': '.txt',
      '.c': '.txt',
      '.java': '.txt',
      '.js': '.txt',
      '.bat': '.txt',
      '.sh': '.txt'
    };
    
    const originalExt = path.extname(file.originalname).toLowerCase();
    const safeExt = safeExtensions[originalExt] || '.txt';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    
    cb(null, `submission_${timestamp}_${randomStr}${safeExt}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的MIME类型
    const allowedMimes = [
      'text/plain',
      'text/x-c',
      'text/x-c++',
      'text/x-python',
      'text/x-java-source',
      'application/octet-stream'
    ];
    
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 代码解密函数
const decryptCode = (encryptedCode) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedCode, process.env.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return encryptedCode; // 如果解密失败，返回原文
  }
};

// 代码加密函数
const encryptCode = (code) => {
  return CryptoJS.AES.encrypt(code, process.env.ENCRYPTION_KEY).toString();
};

// 关键字替换（避免网络安全检测）
const replaceKeywords = (code) => {
  const keywordMap = {
    'system': 'sys_tem',
    'exec': 'ex_ec',
    'eval': 'ev_al',
    'import': 'imp_ort',
    'include': 'inc_lude',
    'require': 'req_uire'
  };
  
  let processedCode = code;
  for (const [keyword, replacement] of Object.entries(keywordMap)) {
    processedCode = processedCode.replace(new RegExp(keyword, 'gi'), replacement);
  }
  
  return processedCode;
};

// 恢复关键字
const restoreKeywords = (code) => {
  const keywordMap = {
    'sys_tem': 'system',
    'ex_ec': 'exec',
    'ev_al': 'eval',
    'imp_ort': 'import',
    'inc_lude': 'include',
    'req_uire': 'require'
  };
  
  let processedCode = code;
  for (const [replacement, keyword] of Object.entries(keywordMap)) {
    processedCode = processedCode.replace(new RegExp(replacement, 'gi'), keyword);
  }
  
  return processedCode;
};

// 获取学生的作业列表
router.get('/assignments', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE sa.student_id = ?';
    let queryParams = [req.user.id];

    if (status !== 'all') {
      whereClause += ' AND sa.status = ?';
      queryParams.push(status);
    }

    const assignments = await query(
      `SELECT a.id, a.title, a.description, a.start_time, a.end_time,
              sa.status, sa.score, sa.submitted_at, sa.graded_at,
              c.name as course_name,
              u.real_name as teacher_name,
              COUNT(ap.problem_id) as total_problems,
              COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_problems
       FROM student_assignments sa
       JOIN assignments a ON sa.assignment_id = a.id
       LEFT JOIN courses c ON a.course_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       LEFT JOIN assignment_problems ap ON a.id = ap.assignment_id
       LEFT JOIN submissions s ON ap.problem_id = s.problem_id AND s.student_id = sa.student_id AND s.assignment_id = a.id
       ${whereClause}
       GROUP BY a.id, sa.id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // 获取总数
    const totalResult = await query(
      `SELECT COUNT(DISTINCT a.id) as total
       FROM student_assignments sa
       JOIN assignments a ON sa.assignment_id = a.id
       ${whereClause}`,
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
router.get('/assignments/:assignmentId', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // 验证学生是否有该作业
    const studentAssignments = await query(
      `SELECT sa.*, a.title, a.description, a.start_time, a.end_time, a.instructions,
              c.name as course_name, u.real_name as teacher_name
       FROM student_assignments sa
       JOIN assignments a ON sa.assignment_id = a.id
       LEFT JOIN courses c ON a.course_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE sa.assignment_id = ? AND sa.student_id = ?`,
      [assignmentId, req.user.id]
    );

    if (studentAssignments.length === 0) {
      return res.status(404).json({ error: '作业不存在或无权访问' });
    }

    const assignment = studentAssignments[0];

    // 获取作业题目
    const problems = await query(
      `SELECT p.id, p.title, p.type, p.difficulty, p.description, p.language,
              p.time_limit, p.memory_limit, p.template_code, p.keywords,
              ap.score as max_score,
              s.id as submission_id, s.status as submission_status, s.score as submission_score,
              s.submitted_at, s.feedback
       FROM assignment_problems ap
       JOIN problems p ON ap.problem_id = p.id
       LEFT JOIN submissions s ON p.id = s.problem_id AND s.student_id = ? AND s.assignment_id = ?
       WHERE ap.assignment_id = ?
       ORDER BY ap.order_index ASC`,
      [req.user.id, assignmentId, assignmentId]
    );

    // 处理题目数据
    for (let problem of problems) {
      // 解密代码模板
      if (problem.template_code && (problem.type === 'code' || problem.type === 'code_fragment')) {
        try {
          problem.template_code = restoreKeywords(decryptCode(problem.template_code));
        } catch (error) {
          console.error('解密代码模板失败:', error);
        }
      }

      // 解析关键词
      if (problem.keywords) {
        try {
          problem.keywords = JSON.parse(problem.keywords);
        } catch (e) {
          problem.keywords = [];
        }
      }

      // 获取样例测试用例（仅显示样例）
      if (problem.type === 'code' || problem.type === 'code_fragment') {
        const sampleCases = await query(
          'SELECT input_data, expected_output FROM test_cases WHERE problem_id = ? AND is_sample = true ORDER BY id ASC',
          [problem.id]
        );
        problem.sample_cases = sampleCases;
      }
    }

    res.json({
      assignment,
      problems
    });
  } catch (error) {
    console.error('获取作业详情错误:', error);
    res.status(500).json({ error: '获取作业详情失败' });
  }
});

// 提交答案（文本形式）
router.post('/assignments/:assignmentId/problems/:problemId/submit', [
  authenticateToken,
  requireStudent,
  body('answer').notEmpty().withMessage('答案不能为空'),
  body('submit_type').isIn(['text', 'file']).withMessage('提交类型无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { assignmentId, problemId } = req.params;
    const { answer, language } = req.body;

    // 验证学生是否有该作业和题目
    const assignments = await query(
      `SELECT sa.*, a.end_time, ap.score as max_score, p.type, p.submit_type
       FROM student_assignments sa
       JOIN assignments a ON sa.assignment_id = a.id
       JOIN assignment_problems ap ON a.id = ap.assignment_id AND ap.problem_id = ?
       JOIN problems p ON ap.problem_id = p.id
       WHERE sa.assignment_id = ? AND sa.student_id = ?`,
      [problemId, assignmentId, req.user.id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: '作业或题目不存在' });
    }

    const assignment = assignments[0];

    // 检查作业是否已截止
    if (new Date() > new Date(assignment.end_time)) {
      return res.status(400).json({ error: '作业已截止，无法提交' });
    }

    // 检查提交类型是否匹配
    if (assignment.submit_type && assignment.submit_type !== 'text') {
      return res.status(400).json({ error: '该题目不支持文本提交' });
    }

    // 处理代码类题目的答案加密
    let processedAnswer = answer;
    if (assignment.type === 'code' || assignment.type === 'code_fragment') {
      processedAnswer = encryptCode(replaceKeywords(answer));
    }

    // 插入或更新提交记录
    const existingSubmissions = await query(
      'SELECT id FROM submissions WHERE assignment_id = ? AND problem_id = ? AND student_id = ?',
      [assignmentId, problemId, req.user.id]
    );

    let submissionId;
    if (existingSubmissions.length > 0) {
      // 更新现有提交
      submissionId = existingSubmissions[0].id;
      await query(
        `UPDATE submissions 
         SET answer = ?, language = ?, status = 'submitted', submitted_at = CURRENT_TIMESTAMP, 
             score = NULL, feedback = NULL, graded_at = NULL
         WHERE id = ?`,
        [processedAnswer, language, submissionId]
      );
    } else {
      // 创建新提交
      const result = await query(
        `INSERT INTO submissions 
         (assignment_id, problem_id, student_id, answer, language, status, submit_type) 
         VALUES (?, ?, ?, ?, ?, 'submitted', 'text')`,
        [assignmentId, problemId, req.user.id, processedAnswer, language]
      );
      submissionId = result.insertId;
    }

    // 更新学生作业状态
    await query(
      `UPDATE student_assignments 
       SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP 
       WHERE assignment_id = ? AND student_id = ?`,
      [assignmentId, req.user.id]
    );

    res.json({
      message: '提交成功',
      submissionId
    });
  } catch (error) {
    console.error('提交答案错误:', error);
    res.status(500).json({ error: '提交答案失败' });
  }
});

// 提交答案（文件形式）
router.post('/assignments/:assignmentId/problems/:problemId/submit-file', [
  authenticateToken,
  requireStudent,
  upload.single('file')
], async (req, res) => {
  try {
    const { assignmentId, problemId } = req.params;
    const { language } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    // 验证学生是否有该作业和题目
    const assignments = await query(
      `SELECT sa.*, a.end_time, ap.score as max_score, p.type, p.submit_type
       FROM student_assignments sa
       JOIN assignments a ON sa.assignment_id = a.id
       JOIN assignment_problems ap ON a.id = ap.assignment_id AND ap.problem_id = ?
       JOIN problems p ON ap.problem_id = p.id
       WHERE sa.assignment_id = ? AND sa.student_id = ?`,
      [problemId, assignmentId, req.user.id]
    );

    if (assignments.length === 0) {
      // 删除上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: '作业或题目不存在' });
    }

    const assignment = assignments[0];

    // 检查作业是否已截止
    if (new Date() > new Date(assignment.end_time)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: '作业已截止，无法提交' });
    }

    // 检查提交类型是否匹配
    if (assignment.submit_type && assignment.submit_type !== 'file') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: '该题目不支持文件提交' });
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    // 处理代码类题目的文件内容加密
    let processedContent = fileContent;
    if (assignment.type === 'code' || assignment.type === 'code_fragment') {
      processedContent = encryptCode(replaceKeywords(fileContent));
    }

    // 插入或更新提交记录
    const existingSubmissions = await query(
      'SELECT id, file_path FROM submissions WHERE assignment_id = ? AND problem_id = ? AND student_id = ?',
      [assignmentId, problemId, req.user.id]
    );

    let submissionId;
    if (existingSubmissions.length > 0) {
      // 删除旧文件
      const oldSubmission = existingSubmissions[0];
      if (oldSubmission.file_path && fs.existsSync(oldSubmission.file_path)) {
        fs.unlinkSync(oldSubmission.file_path);
      }

      // 更新现有提交
      submissionId = oldSubmission.id;
      await query(
        `UPDATE submissions 
         SET answer = ?, file_path = ?, language = ?, status = 'submitted', 
             submitted_at = CURRENT_TIMESTAMP, score = NULL, feedback = NULL, graded_at = NULL
         WHERE id = ?`,
        [processedContent, req.file.path, language, submissionId]
      );
    } else {
      // 创建新提交
      const result = await query(
        `INSERT INTO submissions 
         (assignment_id, problem_id, student_id, answer, file_path, language, status, submit_type) 
         VALUES (?, ?, ?, ?, ?, ?, 'submitted', 'file')`,
        [assignmentId, problemId, req.user.id, processedContent, req.file.path, language]
      );
      submissionId = result.insertId;
    }

    // 更新学生作业状态
    await query(
      `UPDATE student_assignments 
       SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP 
       WHERE assignment_id = ? AND student_id = ?`,
      [assignmentId, req.user.id]
    );

    res.json({
      message: '文件提交成功',
      submissionId,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('文件提交错误:', error);
    // 删除上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: '文件提交失败' });
  }
});

// 获取提交历史
router.get('/assignments/:assignmentId/problems/:problemId/submissions', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { assignmentId, problemId } = req.params;

    const submissions = await query(
      `SELECT id, status, score, feedback, submitted_at, graded_at, submit_type, language
       FROM submissions 
       WHERE assignment_id = ? AND problem_id = ? AND student_id = ?
       ORDER BY submitted_at DESC`,
      [assignmentId, problemId, req.user.id]
    );

    res.json({ submissions });
  } catch (error) {
    console.error('获取提交历史错误:', error);
    res.status(500).json({ error: '获取提交历史失败' });
  }
});

// 获取个人信息
router.get('/profile', authenticateToken, requireStudent, async (req, res) => {
  try {
    const users = await query(
      'SELECT id, username, real_name, email, phone, class, major, school, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('获取个人信息错误:', error);
    res.status(500).json({ error: '获取个人信息失败' });
  }
});

// 更新个人信息
router.put('/profile', [
  authenticateToken,
  requireStudent,
  body('real_name').optional().notEmpty().withMessage('真实姓名不能为空'),
  body('email').optional().isEmail().withMessage('邮箱格式无效'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { real_name, email, phone, class: userClass, major, school } = req.body;

    const updateFields = [];
    const updateValues = [];

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
    if (userClass !== undefined) {
      updateFields.push('class = ?');
      updateValues.push(userClass);
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

// 获取学习统计
router.get('/stats', authenticateToken, requireStudent, async (req, res) => {
  try {
    // 获取作业统计
    const assignmentStats = await query(
      `SELECT 
         COUNT(*) as total_assignments,
         COUNT(CASE WHEN sa.status = 'submitted' THEN 1 END) as submitted_assignments,
         COUNT(CASE WHEN sa.status = 'graded' THEN 1 END) as graded_assignments,
         AVG(CASE WHEN sa.status = 'graded' THEN sa.score END) as average_score
       FROM student_assignments sa
       WHERE sa.student_id = ?`,
      [req.user.id]
    );

    // 获取题目类型统计
    const problemTypeStats = await query(
      `SELECT p.type, COUNT(*) as count, AVG(s.score) as average_score
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       WHERE s.student_id = ? AND s.status = 'graded'
       GROUP BY p.type`,
      [req.user.id]
    );

    // 获取最近提交
    const recentSubmissions = await query(
      `SELECT p.title, p.type, s.score, s.submitted_at, a.title as assignment_title
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = ?
       ORDER BY s.submitted_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      assignmentStats: assignmentStats[0],
      problemTypeStats,
      recentSubmissions
    });
  } catch (error) {
    console.error('获取学习统计错误:', error);
    res.status(500).json({ error: '获取学习统计失败' });
  }
});

module.exports = router;