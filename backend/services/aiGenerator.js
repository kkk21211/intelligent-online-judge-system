const axios = require('axios');
const CryptoJS = require('crypto-js');

class AIGenerator {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || 'sk-c5a6fbba333f42d9833ac91747c63e9c';
    this.apiUrl = process.env.AI_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    this.model = process.env.AI_MODEL || 'deepseek-chat';
  }

  // 加密代码
  encryptCode(code) {
    try {
      return CryptoJS.AES.encrypt(code, process.env.ENCRYPTION_KEY).toString();
    } catch (error) {
      return code;
    }
  }

  // 替换关键字
  replaceKeywords(code) {
    const keywordMap = {
      'system': 'sys_tem',
      'exec': 'ex_ec',
      'eval': 'ev_al',
      'import': 'imp_ort',
      'include': 'inc_lude',
      'require': 'req_uire',
      'printf': 'pr_intf',
      'scanf': 'sc_anf',
      'stdio': 'st_dio',
      'stdlib': 'st_dlib',
      'main': 'ma_in',
      'void': 'vo_id',
      'int': 'in_t',
      'char': 'ch_ar',
      'float': 'fl_oat',
      'double': 'do_uble'
    };
    
    let processedCode = code;
    for (const [keyword, replacement] of Object.entries(keywordMap)) {
      processedCode = processedCode.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), replacement);
    }
    
    return processedCode;
  }

  // 调用AI API
  async callAI(prompt, maxTokens = 2000) {
    if (!this.apiKey) {
      throw new Error('AI API密钥未配置');
    }

    try {
      const response = await axios.post(this.apiUrl, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的编程题目生成助手，能够根据要求生成高质量的编程题目、测试用例和参考代码。请严格按照JSON格式返回结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI API调用失败:', error.message);
      throw new Error('AI服务暂时不可用，请稍后重试');
    }
  }

  // 生成编程题目
  async generateCodeProblem(requirements) {
    const { 
      language = 'python', 
      difficulty = 'medium', 
      topic = '基础编程', 
      description = '' 
    } = requirements;

    const prompt = `
请根据以下要求生成一个编程题目：

编程语言：${language}
难度等级：${difficulty}
题目主题：${topic}
具体要求：${description}

请生成包含以下内容的JSON格式响应：
{
  "title": "题目标题",
  "description": "详细的题目描述，包括输入输出格式说明",
  "input_format": "输入格式说明",
  "output_format": "输出格式说明",
  "sample_input": "示例输入",
  "sample_output": "示例输出",
  "test_cases": [
    {
      "input_data": "测试输入1",
      "expected_output": "期望输出1",
      "score": 20
    },
    {
      "input_data": "测试输入2",
      "expected_output": "期望输出2",
      "score": 20
    },
    {
      "input_data": "测试输入3",
      "expected_output": "期望输出3",
      "score": 20
    },
    {
      "input_data": "测试输入4",
      "expected_output": "期望输出4",
      "score": 20
    },
    {
      "input_data": "测试输入5",
      "expected_output": "期望输出5",
      "score": 20
    }
  ],
  "reference_code": "参考代码实现",
  "hints": ["提示1", "提示2"],
  "time_limit": 1000,
  "memory_limit": 128
}

要求：
1. 题目描述要清晰明确，包含完整的输入输出说明
2. 测试用例要覆盖边界情况和常规情况
3. 参考代码要正确且高效
4. 难度要符合指定等级
5. 所有字符串都要用双引号包围
`;

    try {
      const response = await this.callAI(prompt, 3000);
      const result = JSON.parse(response);
      
      // 处理参考代码
      if (result.reference_code) {
        const processedCode = this.replaceKeywords(result.reference_code);
        result.reference_code = this.encryptCode(processedCode);
      }
      
      return result;
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error('AI生成的内容格式错误，请重试');
      }
      throw error;
    }
  }

  // 生成代码片段题目
  async generateCodeFragmentProblem(requirements) {
    const { 
      language = 'python', 
      difficulty = 'medium', 
      topic = '代码补全', 
      description = '' 
    } = requirements;

    const prompt = `
请根据以下要求生成一个代码片段补全题目：

编程语言：${language}
难度等级：${difficulty}
题目主题：${topic}
具体要求：${description}

请生成包含以下内容的JSON格式响应：
{
  "title": "题目标题",
  "description": "题目描述，说明需要补全的代码功能",
  "code_template": "包含空白处的代码模板，用 _____ 表示需要填空的地方",
  "input_format": "输入格式说明",
  "output_format": "输出格式说明",
  "sample_input": "示例输入",
  "sample_output": "示例输出",
  "test_cases": [
    {
      "input_data": "测试输入1",
      "expected_output": "期望输出1",
      "score": 20
    },
    {
      "input_data": "测试输入2",
      "expected_output": "期望输出2",
      "score": 20
    },
    {
      "input_data": "测试输入3",
      "expected_output": "期望输出3",
      "score": 20
    },
    {
      "input_data": "测试输入4",
      "expected_output": "期望输出4",
      "score": 20
    },
    {
      "input_data": "测试输入5",
      "expected_output": "期望输出5",
      "score": 20
    }
  ],
  "reference_answer": "完整的参考答案代码",
  "hints": ["提示1", "提示2"],
  "time_limit": 1000,
  "memory_limit": 128
}

要求：
1. 代码模板要有适当的难度，不能太简单也不能太复杂
2. 空白处的设计要有逻辑性，考查特定的编程概念
3. 测试用例要全面覆盖各种情况
4. 参考答案要正确且优雅
`;

    try {
      const response = await this.callAI(prompt, 3000);
      const result = JSON.parse(response);
      
      // 处理代码模板和参考答案
      if (result.code_template) {
        const processedTemplate = this.replaceKeywords(result.code_template);
        result.code_template = this.encryptCode(processedTemplate);
      }
      
      if (result.reference_answer) {
        const processedAnswer = this.replaceKeywords(result.reference_answer);
        result.reference_answer = this.encryptCode(processedAnswer);
      }
      
      return result;
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error('AI生成的内容格式错误，请重试');
      }
      throw error;
    }
  }

  // 生成选择题
  async generateChoiceProblem(requirements) {
    const { 
      subject = '编程基础', 
      difficulty = 'medium', 
      topic = '', 
      description = '' 
    } = requirements;

    const prompt = `
请根据以下要求生成一个选择题：

学科领域：${subject}
难度等级：${difficulty}
题目主题：${topic}
具体要求：${description}

请生成包含以下内容的JSON格式响应：
{
  "title": "题目标题",
  "description": "题目描述和问题",
  "options": {
    "A": "选项A内容",
    "B": "选项B内容",
    "C": "选项C内容",
    "D": "选项D内容"
  },
  "correct_answer": "A",
  "explanation": "答案解析",
  "score": 10
}

要求：
1. 题目要有一定的思考性，不能过于简单
2. 选项要有迷惑性，但只有一个正确答案
3. 解析要详细说明为什么选择该答案
4. 内容要准确无误
`;

    try {
      const response = await this.callAI(prompt, 1500);
      return JSON.parse(response);
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error('AI生成的内容格式错误，请重试');
      }
      throw error;
    }
  }

  // 生成填空题
  async generateFillBlankProblem(requirements) {
    const { 
      subject = '编程基础', 
      difficulty = 'medium', 
      topic = '', 
      description = '' 
    } = requirements;

    const prompt = `
请根据以下要求生成一个填空题：

学科领域：${subject}
难度等级：${difficulty}
题目主题：${topic}
具体要求：${description}

请生成包含以下内容的JSON格式响应：
{
  "title": "题目标题",
  "description": "题目描述，用 _____ 表示需要填空的地方",
  "answers": ["答案1", "答案2"],
  "explanation": "答案解析",
  "score": 10,
  "case_sensitive": false
}

要求：
1. 填空处要设计合理，考查关键知识点
2. 如果有多个空，answers数组按顺序对应
3. 要考虑是否区分大小写
4. 解析要说明答案的原理
`;

    try {
      const response = await this.callAI(prompt, 1500);
      return JSON.parse(response);
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error('AI生成的内容格式错误，请重试');
      }
      throw error;
    }
  }

  // 生成简答题
  async generateEssayProblem(requirements) {
    const { 
      subject = '编程理论', 
      difficulty = 'medium', 
      topic = '', 
      description = '' 
    } = requirements;

    const prompt = `
请根据以下要求生成一个简答题：

学科领域：${subject}
难度等级：${difficulty}
题目主题：${topic}
具体要求：${description}

请生成包含以下内容的JSON格式响应：
{
  "title": "题目标题",
  "description": "题目描述和问题",
  "key_points": [
    {
      "point": "关键点1",
      "score": 5,
      "description": "评分说明"
    },
    {
      "point": "关键点2",
      "score": 5,
      "description": "评分说明"
    }
  ],
  "reference_answer": "参考答案",
  "total_score": 10,
  "grading_criteria": "评分标准说明"
}

要求：
1. 问题要有深度，能考查学生的理解和分析能力
2. 关键点要明确，便于评分
3. 参考答案要全面且准确
4. 评分标准要客观公正
`;

    try {
      const response = await this.callAI(prompt, 2000);
      return JSON.parse(response);
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error('AI生成的内容格式错误，请重试');
      }
      throw error;
    }
  }

  // 智能选题
  async selectProblems(requirements) {
    const { 
      count = 5, 
      difficulty = 'medium', 
      topics = [], 
      types = [], 
      description = '' 
    } = requirements;

    // 返回模拟的智能选题结果
    return {
      selection_strategy: `基于${difficulty}难度，从${types.join('、')}类型中选择${count}道题目`,
      recommended_problems: Array.from({ length: count }, (_, i) => ({
        type: types[i % types.length] || 'programming',
        topic: topics[i % topics.length] || '基础算法',
        difficulty: difficulty,
        weight: Math.floor(100 / count),
        reason: `第${i + 1}道题目，适合${difficulty}难度要求`
      })),
      total_score: 100,
      estimated_time: `${count * 15}分钟`
    };
  }

  // 评估简答题答案
  async evaluateEssayAnswer(question, answer, keyPoints) {
    const prompt = `
请评估以下简答题的学生答案：

题目：${question}

学生答案：${answer}

评分要点：
${keyPoints.map((point, index) => `${index + 1}. ${point.point} (${point.score}分): ${point.description}`).join('\n')}

请生成包含以下内容的JSON格式响应：
{
  "total_score": 85,
  "point_scores": [
    {
      "point": "关键点1",
      "max_score": 5,
      "actual_score": 4,
      "feedback": "评价反馈"
    }
  ],
  "overall_feedback": "总体评价",
  "suggestions": ["改进建议1", "改进建议2"]
}

要求：
1. 评分要客观公正，基于关键点
2. 反馈要具体，指出优点和不足
3. 建议要有针对性，有助于学生改进
`;

    try {
      const response = await this.callAI(prompt, 1500);
      return JSON.parse(response);
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error('AI生成的内容格式错误，请重试');
      }
      throw error;
    }
  }
}

module.exports = new AIGenerator();