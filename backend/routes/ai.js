const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireTeacherOrAdmin } = require('../middleware/auth');
const aiGenerator = require('../services/aiGenerator');
const codeEvaluator = require('../services/codeEvaluator');

const router = express.Router();

// 生成编程题目
router.post('/generate/code', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('language').isIn(['python', 'c', 'cpp', 'java']).withMessage('编程语言无效'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('难度等级无效'),
  body('topic').isString().isLength({ min: 1, max: 100 }).withMessage('题目主题长度必须在1-100字符之间'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('course_id').optional().isInt().withMessage('课程ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { language, difficulty, topic, description, course_id } = req.body;

    // 验证课程权限
    if (course_id && req.user.role === 'teacher') {
      const permissions = await query(
        'SELECT 1 FROM teacher_course_permissions WHERE teacher_id = ? AND course_id = ?',
        [req.user.id, course_id]
      );
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: '没有该课程的权限' });
      }
    }

    // 调用AI生成题目
    const generatedProblem = await aiGenerator.generateCodeProblem({
      language,
      difficulty,
      topic,
      description
    });

    // 验证生成的代码
    if (generatedProblem.reference_code) {
      const decryptedCode = codeEvaluator.restoreKeywords(
        codeEvaluator.decryptCode(generatedProblem.reference_code)
      );
      
      const syntaxCheck = await codeEvaluator.validateSyntax(decryptedCode, language);
      if (!syntaxCheck.valid) {
        console.warn('生成的代码语法检查失败:', syntaxCheck.error);
      }
    }

    res.json({
      message: '题目生成成功',
      problem: generatedProblem
    });
  } catch (error) {
    console.error('生成编程题目错误:', error);
    res.status(500).json({ error: error.message || '生成题目失败' });
  }
});

// 生成代码片段题目
router.post('/generate/code-fragment', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('language').isIn(['python', 'c', 'cpp', 'java']).withMessage('编程语言无效'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('难度等级无效'),
  body('topic').isString().isLength({ min: 1, max: 100 }).withMessage('题目主题长度必须在1-100字符之间'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('course_id').optional().isInt().withMessage('课程ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { language, difficulty, topic, description, course_id } = req.body;

    // 验证课程权限
    if (course_id && req.user.role === 'teacher') {
      const permissions = await query(
        'SELECT 1 FROM teacher_course_permissions WHERE teacher_id = ? AND course_id = ?',
        [req.user.id, course_id]
      );
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: '没有该课程的权限' });
      }
    }

    // 调用AI生成代码片段题目
    const generatedProblem = await aiGenerator.generateCodeFragmentProblem({
      language,
      difficulty,
      topic,
      description
    });

    res.json({
      message: '代码片段题目生成成功',
      problem: generatedProblem
    });
  } catch (error) {
    console.error('生成代码片段题目错误:', error);
    res.status(500).json({ error: error.message || '生成题目失败' });
  }
});

// 生成选择题
router.post('/generate/choice', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('subject').isString().isLength({ min: 1, max: 100 }).withMessage('学科领域长度必须在1-100字符之间'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('难度等级无效'),
  body('topic').optional().isString().isLength({ max: 100 }).withMessage('题目主题长度不能超过100字符'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('course_id').optional().isInt().withMessage('课程ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { subject, difficulty, topic, description, course_id } = req.body;

    // 验证课程权限
    if (course_id && req.user.role === 'teacher') {
      const permissions = await query(
        'SELECT 1 FROM teacher_course_permissions WHERE teacher_id = ? AND course_id = ?',
        [req.user.id, course_id]
      );
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: '没有该课程的权限' });
      }
    }

    // 调用AI生成选择题
    const generatedProblem = await aiGenerator.generateChoiceProblem({
      subject,
      difficulty,
      topic,
      description
    });

    res.json({
      message: '选择题生成成功',
      problem: generatedProblem
    });
  } catch (error) {
    console.error('生成选择题错误:', error);
    res.status(500).json({ error: error.message || '生成题目失败' });
  }
});

// 生成填空题
router.post('/generate/fill-blank', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('subject').isString().isLength({ min: 1, max: 100 }).withMessage('学科领域长度必须在1-100字符之间'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('难度等级无效'),
  body('topic').optional().isString().isLength({ max: 100 }).withMessage('题目主题长度不能超过100字符'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('course_id').optional().isInt().withMessage('课程ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { subject, difficulty, topic, description, course_id } = req.body;

    // 验证课程权限
    if (course_id && req.user.role === 'teacher') {
      const permissions = await query(
        'SELECT 1 FROM teacher_course_permissions WHERE teacher_id = ? AND course_id = ?',
        [req.user.id, course_id]
      );
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: '没有该课程的权限' });
      }
    }

    // 调用AI生成填空题
    const generatedProblem = await aiGenerator.generateFillBlankProblem({
      subject,
      difficulty,
      topic,
      description
    });

    res.json({
      message: '填空题生成成功',
      problem: generatedProblem
    });
  } catch (error) {
    console.error('生成填空题错误:', error);
    res.status(500).json({ error: error.message || '生成题目失败' });
  }
});

// 生成简答题
router.post('/generate/essay', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('subject').isString().isLength({ min: 1, max: 100 }).withMessage('学科领域长度必须在1-100字符之间'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('难度等级无效'),
  body('topic').optional().isString().isLength({ max: 100 }).withMessage('题目主题长度不能超过100字符'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('course_id').optional().isInt().withMessage('课程ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { subject, difficulty, topic, description, course_id } = req.body;

    // 验证课程权限
    if (course_id && req.user.role === 'teacher') {
      const permissions = await query(
        'SELECT 1 FROM teacher_course_permissions WHERE teacher_id = ? AND course_id = ?',
        [req.user.id, course_id]
      );
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: '没有该课程的权限' });
      }
    }

    // 调用AI生成简答题
    const generatedProblem = await aiGenerator.generateEssayProblem({
      subject,
      difficulty,
      topic,
      description
    });

    res.json({
      message: '简答题生成成功',
      problem: generatedProblem
    });
  } catch (error) {
    console.error('生成简答题错误:', error);
    res.status(500).json({ error: error.message || '生成题目失败' });
  }
});

// 智能选题
router.post('/select-problems', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('count').isInt({ min: 1, max: 20 }).withMessage('题目数量必须在1-20之间'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('难度等级无效'),
  body('topics').isArray().withMessage('主题必须是数组'),
  body('types').isArray().withMessage('题目类型必须是数组'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('course_id').optional().isInt().withMessage('课程ID无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { count, difficulty, topics, types, description, course_id } = req.body;

    // 验证课程权限
    if (course_id && req.user.role === 'teacher') {
      const permissions = await query(
        'SELECT 1 FROM teacher_course_permissions WHERE teacher_id = ? AND course_id = ?',
        [req.user.id, course_id]
      );
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: '没有该课程的权限' });
      }
    }

    // 调用AI智能选题
    const selection = await aiGenerator.selectProblems({
      count,
      difficulty,
      topics,
      types,
      description
    });

    // 根据AI建议从数据库中查找匹配的题目
    let whereClause = 'WHERE status = "active"';
    let queryParams = [];

    if (req.user.role === 'teacher') {
      if (course_id) {
        whereClause += ' AND course_id = ?';
        queryParams.push(course_id);
      } else {
        whereClause += ' AND created_by = ?';
        queryParams.push(req.user.id);
      }
    }

    if (types.length > 0) {
      whereClause += ` AND type IN (${types.map(() => '?').join(',')})`;
      queryParams.push(...types);
    }

    const availableProblems = await query(
      `SELECT id, title, type, difficulty, created_at FROM problems ${whereClause} ORDER BY created_at DESC LIMIT 50`,
      queryParams
    );

    res.json({
      message: '智能选题完成',
      selection,
      available_problems: availableProblems
    });
  } catch (error) {
    console.error('智能选题错误:', error);
    res.status(500).json({ error: error.message || '智能选题失败' });
  }
});

// 保存AI生成的题目
router.post('/save-problem', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('题目标题长度必须在1-200字符之间'),
  body('type').isIn(['choice', 'fill_blank', 'essay', 'code', 'code_fragment']).withMessage('题目类型无效'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('难度等级无效'),
  body('description').isString().isLength({ min: 1 }).withMessage('题目描述不能为空'),
  body('course_id').optional().isInt().withMessage('课程ID无效'),
  body('problem_data').isObject().withMessage('题目数据必须是对象')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { title, type, difficulty, description, course_id, problem_data } = req.body;

    // 验证课程权限
    if (course_id && req.user.role === 'teacher') {
      const permissions = await query(
        'SELECT 1 FROM teacher_course_permissions WHERE teacher_id = ? AND course_id = ?',
        [req.user.id, course_id]
      );
      
      if (permissions.length === 0) {
        return res.status(403).json({ error: '没有该课程的权限' });
      }
    }

    await transaction(async (connection) => {
      // 插入题目
      const problemResult = await connection.query(
        `INSERT INTO problems (title, type, difficulty, description, answer, language, time_limit, memory_limit, course_id, created_by, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          title,
          type,
          difficulty,
          description,
          problem_data.reference_code || problem_data.reference_answer || JSON.stringify(problem_data),
          problem_data.language || null,
          problem_data.time_limit || 1000,
          problem_data.memory_limit || 128,
          course_id || null,
          req.user.id
        ]
      );

      const problemId = problemResult.insertId;

      // 如果是编程题，插入测试用例
      if ((type === 'code' || type === 'code_fragment') && problem_data.test_cases) {
        for (const testCase of problem_data.test_cases) {
          await connection.query(
            'INSERT INTO test_cases (problem_id, input_data, expected_output, score) VALUES (?, ?, ?, ?)',
            [problemId, testCase.input_data, testCase.expected_output, testCase.score || 10]
          );
        }
      }

      res.json({
        message: '题目保存成功',
        problem_id: problemId
      });
    });
  } catch (error) {
    console.error('保存题目错误:', error);
    res.status(500).json({ error: '保存题目失败' });
  }
});

// 评估简答题答案
router.post('/evaluate-essay', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('question').isString().isLength({ min: 1 }).withMessage('题目不能为空'),
  body('answer').isString().isLength({ min: 1 }).withMessage('答案不能为空'),
  body('key_points').isArray().withMessage('关键点必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { question, answer, key_points } = req.body;

    // 调用AI评估答案
    const evaluation = await aiGenerator.evaluateEssayAnswer(question, answer, key_points);

    res.json({
      message: '答案评估完成',
      evaluation
    });
  } catch (error) {
    console.error('评估答案错误:', error);
    res.status(500).json({ error: error.message || '答案评估失败' });
  }
});

// 验证代码语法
router.post('/validate-code', [
  authenticateToken,
  requireTeacherOrAdmin,
  body('code').isString().isLength({ min: 1 }).withMessage('代码不能为空'),
  body('language').isIn(['python', 'c', 'cpp', 'java']).withMessage('编程语言无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { code, language } = req.body;

    // 解密和恢复关键字
    let processedCode = code;
    try {
      processedCode = codeEvaluator.restoreKeywords(codeEvaluator.decryptCode(code));
    } catch (error) {
      // 如果解密失败，使用原始代码
      processedCode = code;
    }

    // 验证语法
    const validation = await codeEvaluator.validateSyntax(processedCode, language);

    res.json({
      message: '代码验证完成',
      validation
    });
  } catch (error) {
    console.error('验证代码错误:', error);
    res.status(500).json({ error: '代码验证失败' });
  }
});

module.exports = router;