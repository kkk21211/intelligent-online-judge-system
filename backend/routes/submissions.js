const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireTeacherOrAdmin } = require('../middleware/auth');
const codeEvaluator = require('../services/codeEvaluator');

const router = express.Router();

// 使用统一的代码评测服务

// 使用统一的代码评测服务

// 获取提交列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      assignment_id = '', 
      problem_id = '', 
      student_id = '', 
      status = '',
      language = ''
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    // 根据用户角色过滤
    if (req.user.role === 'student') {
      whereClause += ' AND s.student_id = ?';
      queryParams.push(req.user.id);
    } else if (req.user.role === 'teacher') {
      whereClause += ' AND EXISTS (SELECT 1 FROM assignments a WHERE a.id = s.assignment_id AND a.created_by = ?)';
      queryParams.push(req.user.id);
    }

    if (assignment_id) {
      whereClause += ' AND s.assignment_id = ?';
      queryParams.push(assignment_id);
    }

    if (problem_id) {
      whereClause += ' AND s.problem_id = ?';
      queryParams.push(problem_id);
    }

    if (student_id && req.user.role !== 'student') {
      whereClause += ' AND s.student_id = ?';
      queryParams.push(student_id);
    }

    if (status) {
      whereClause += ' AND s.status = ?';
      queryParams.push(status);
    }

    if (language) {
      whereClause += ' AND s.language = ?';
      queryParams.push(language);
    }

    const submissions = await query(
      `SELECT s.id, s.status, s.score, s.language, s.submitted_at, s.graded_at, s.submit_type,
              p.title as problem_title, p.type as problem_type,
              a.title as assignment_title,
              u.real_name as student_name, u.username as student_username
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       JOIN assignments a ON s.assignment_id = a.id
       JOIN users u ON s.student_id = u.id
       ${whereClause}
       ORDER BY s.submitted_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // 获取总数
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       JOIN assignments a ON s.assignment_id = a.id
       JOIN users u ON s.student_id = u.id
       ${whereClause}`,
      queryParams
    );

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取提交列表错误:', error);
    res.status(500).json({ error: '获取提交列表失败' });
  }
});

// 获取提交详情
router.get('/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submissions = await query(
      `SELECT s.*, p.title as problem_title, p.type as problem_type, p.answer as problem_answer,
              a.title as assignment_title, u.real_name as student_name, u.username as student_username
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       JOIN assignments a ON s.assignment_id = a.id
       JOIN users u ON s.student_id = u.id
       WHERE s.id = ?`,
      [submissionId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ error: '提交记录不存在' });
    }

    const submission = submissions[0];

    // 权限检查
    if (req.user.role === 'student' && submission.student_id !== req.user.id) {
      return res.status(403).json({ error: '没有查看该提交的权限' });
    }

    if (req.user.role === 'teacher') {
      const assignments = await query(
        'SELECT 1 FROM assignments WHERE id = ? AND created_by = ?',
        [submission.assignment_id, req.user.id]
      );
      
      if (assignments.length === 0) {
        return res.status(403).json({ error: '没有查看该提交的权限' });
      }
    }

    // 解密答案
    if (submission.answer && (submission.problem_type === 'code' || submission.problem_type === 'code_fragment')) {
      try {
        submission.answer = restoreKeywords(decryptCode(submission.answer));
      } catch (error) {
        console.error('解密答案失败:', error);
      }
    }

    // 如果是教师或管理员，显示标准答案
    if ((req.user.role === 'teacher' || req.user.role === 'admin') && submission.problem_answer) {
      if (submission.problem_type === 'code' || submission.problem_type === 'code_fragment') {
        try {
          submission.problem_answer = restoreKeywords(decryptCode(submission.problem_answer));
        } catch (error) {
          console.error('解密标准答案失败:', error);
        }
      }
    } else {
      delete submission.problem_answer;
    }

    // 获取评测结果
    if (submission.test_results) {
      try {
        submission.test_results = JSON.parse(submission.test_results);
      } catch (error) {
        submission.test_results = null;
      }
    }

    res.json({ submission });
  } catch (error) {
    console.error('获取提交详情错误:', error);
    res.status(500).json({ error: '获取提交详情失败' });
  }
});

// 评测代码提交
router.post('/:submissionId/evaluate', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { submissionId } = req.params;

    // 获取提交信息
    const submissions = await query(
      `SELECT s.*, p.type, p.language, p.time_limit, p.memory_limit, a.created_by
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = ?`,
      [submissionId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ error: '提交记录不存在' });
    }

    const submission = submissions[0];

    // 权限检查
    if (req.user.role === 'teacher' && submission.created_by !== req.user.id) {
      return res.status(403).json({ error: '没有评测该提交的权限' });
    }

    // 只有代码类题目才能自动评测
    if (submission.type !== 'code' && submission.type !== 'code_fragment') {
      return res.status(400).json({ error: '该题目类型不支持自动评测' });
    }

    // 获取测试用例
    const testCases = await query(
      'SELECT input_data, expected_output, score FROM test_cases WHERE problem_id = ? ORDER BY id ASC',
      [submission.problem_id]
    );

    if (testCases.length === 0) {
      return res.status(400).json({ error: '该题目没有测试用例' });
    }

    // 解密代码
    let code = submission.answer;
    try {
      code = restoreKeywords(decryptCode(code));
    } catch (error) {
      console.error('解密代码失败:', error);
      return res.status(400).json({ error: '代码解密失败' });
    }

    // 执行评测
    const evaluationResult = await codeEvaluator.evaluateCode(
      code,
      submission.language || submission.p_language,
      testCases,
      submission.time_limit || 1000,
      submission.memory_limit || 128
    );

    // 计算分数（百分制）
    const score = evaluationResult.maxScore > 0 
      ? Math.round((evaluationResult.totalScore / evaluationResult.maxScore) * 100)
      : 0;

    // 更新提交记录
    await query(
      `UPDATE submissions 
       SET status = 'graded', score = ?, test_results = ?, graded_at = CURRENT_TIMESTAMP, graded_by = ?
       WHERE id = ?`,
      [score, JSON.stringify(evaluationResult), req.user.id, submissionId]
    );

    // 更新学生作业状态和分数
    await query(
      `UPDATE student_assignments sa
       SET status = 'graded', 
           score = (
             SELECT AVG(s.score) 
             FROM submissions s 
             WHERE s.assignment_id = sa.assignment_id 
               AND s.student_id = sa.student_id 
               AND s.status = 'graded'
           ),
           graded_at = CURRENT_TIMESTAMP
       WHERE assignment_id = ? AND student_id = ?`,
      [submission.assignment_id, submission.student_id]
    );

    res.json({
      message: '评测完成',
      score,
      passed: evaluationResult.passed,
      results: evaluationResult.results
    });
  } catch (error) {
    console.error('代码评测错误:', error);
    res.status(500).json({ error: '代码评测失败: ' + error.message });
  }
});

// 手动评分
router.post('/:submissionId/grade', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('score').isFloat({ min: 0, max: 100 }).withMessage('分数必须在0-100之间'),
  body('feedback').optional().isString().withMessage('反馈必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { submissionId } = req.params;
    const { score, feedback } = req.body;

    // 获取提交信息
    const submissions = await query(
      `SELECT s.*, a.created_by
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = ?`,
      [submissionId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ error: '提交记录不存在' });
    }

    const submission = submissions[0];

    // 权限检查
    if (req.user.role === 'teacher' && submission.created_by !== req.user.id) {
      return res.status(403).json({ error: '没有评分该提交的权限' });
    }

    // 更新提交记录
    await query(
      `UPDATE submissions 
       SET status = 'graded', score = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP, graded_by = ?
       WHERE id = ?`,
      [score, feedback, req.user.id, submissionId]
    );

    // 更新学生作业状态和分数
    await query(
      `UPDATE student_assignments sa
       SET status = 'graded', 
           score = (
             SELECT AVG(s.score) 
             FROM submissions s 
             WHERE s.assignment_id = sa.assignment_id 
               AND s.student_id = sa.student_id 
               AND s.status = 'graded'
           ),
           graded_at = CURRENT_TIMESTAMP
       WHERE assignment_id = ? AND student_id = ?`,
      [submission.assignment_id, submission.student_id]
    );

    res.json({ message: '评分成功' });
  } catch (error) {
    console.error('手动评分错误:', error);
    res.status(500).json({ error: '手动评分失败' });
  }
});

// 批量评测
router.post('/batch-evaluate', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('assignment_id').isInt().withMessage('作业ID无效'),
  body('problem_id').optional().isInt().withMessage('题目ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { assignment_id, problem_id } = req.body;

    // 验证作业权限
    const assignments = await query(
      'SELECT * FROM assignments WHERE id = ? AND status = "active"',
      [assignment_id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const assignment = assignments[0];

    if (req.user.role === 'teacher' && assignment.created_by !== req.user.id) {
      return res.status(403).json({ error: '没有评测该作业的权限' });
    }

    // 构建查询条件
    let whereClause = 'WHERE s.assignment_id = ? AND s.status = "submitted"';
    let queryParams = [assignment_id];

    if (problem_id) {
      whereClause += ' AND s.problem_id = ?';
      queryParams.push(problem_id);
    }

    // 只评测代码类题目
    whereClause += ' AND (p.type = "code" OR p.type = "code_fragment")';

    // 获取待评测的提交
    const submissions = await query(
      `SELECT s.id FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       ${whereClause}`,
      queryParams
    );

    if (submissions.length === 0) {
      return res.status(400).json({ error: '没有待评测的代码提交' });
    }

    // 批量评测
    let successCount = 0;
    let failCount = 0;
    const errors1 = [];

    for (const submission of submissions) {
      try {
        // 调用单个评测接口
        await evaluateSubmission(submission.id, req.user.id);
        successCount++;
      } catch (error) {
        failCount++;
        errors1.push({
          submissionId: submission.id,
          error: error.message
        });
      }
    }

    res.json({
      message: '批量评测完成',
      total: submissions.length,
      success: successCount,
      failed: failCount,
      errors: errors1.slice(0, 10) // 只返回前10个错误
    });
  } catch (error) {
    console.error('批量评测错误:', error);
    res.status(500).json({ error: '批量评测失败' });
  }
});

// 评测单个提交的辅助函数
const evaluateSubmission = async (submissionId, graderId) => {
  // 获取提交信息
  const submissions = await query(
    `SELECT s.*, p.type, p.language, p.time_limit, p.memory_limit
     FROM submissions s
     JOIN problems p ON s.problem_id = p.id
     WHERE s.id = ?`,
    [submissionId]
  );

  if (submissions.length === 0) {
    throw new Error('提交记录不存在');
  }

  const submission = submissions[0];

  // 只评测代码类题目
  if (submission.type !== 'code' && submission.type !== 'code_fragment') {
    throw new Error('该题目类型不支持自动评测');
  }

  // 获取测试用例
  const testCases = await query(
    'SELECT input_data, expected_output, score FROM test_cases WHERE problem_id = ? ORDER BY id ASC',
    [submission.problem_id]
  );

  if (testCases.length === 0) {
    throw new Error('该题目没有测试用例');
  }

  // 解密代码
  let code = submission.answer;
  try {
    code = restoreKeywords(decryptCode(code));
  } catch (error) {
    throw new Error('代码解密失败');
  }

  // 执行评测
  const evaluationResult = await codeEvaluator.evaluateCode(
    code,
    submission.language || submission.p_language,
    testCases,
    submission.time_limit || 1000,
    submission.memory_limit || 128
  );

  // 计算分数
  const score = evaluationResult.maxScore > 0 
    ? Math.round((evaluationResult.totalScore / evaluationResult.maxScore) * 100)
    : 0;

  // 更新提交记录
  await query(
    `UPDATE submissions 
     SET status = 'graded', score = ?, test_results = ?, graded_at = CURRENT_TIMESTAMP, graded_by = ?
     WHERE id = ?`,
    [score, JSON.stringify(evaluationResult), graderId, submissionId]
  );

  // 更新学生作业状态和分数
  await query(
    `UPDATE student_assignments sa
     SET status = 'graded', 
         score = (
           SELECT AVG(s.score) 
           FROM submissions s 
           WHERE s.assignment_id = sa.assignment_id 
             AND s.student_id = sa.student_id 
             AND s.status = 'graded'
         ),
         graded_at = CURRENT_TIMESTAMP
     WHERE assignment_id = ? AND student_id = ?`,
    [submission.assignment_id, submission.student_id]
  );
};

module.exports = router;