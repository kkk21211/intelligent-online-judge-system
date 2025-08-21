const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const CryptoJS = require('crypto-js');

class CodeEvaluator {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  // 确保临时目录存在
  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // 代码解密
  decryptCode(encryptedCode) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedCode, process.env.ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      return encryptedCode;
    }
  }

  // 恢复关键字
  restoreKeywords(code) {
    const keywordMap = {
      'sys_tem': 'system',
      'ex_ec': 'exec',
      'ev_al': 'eval',
      'imp_ort': 'import',
      'inc_lude': 'include',
      'req_uire': 'require',
      'pr_intf': 'printf',
      'sc_anf': 'scanf',
      'st_dio': 'stdio',
      'st_dlib': 'stdlib',
      'ma_in': 'main',
      'vo_id': 'void',
      'in_t': 'int',
      'ch_ar': 'char',
      'fl_oat': 'float',
      'do_uble': 'double'
    };
    
    let processedCode = code;
    for (const [replacement, keyword] of Object.entries(keywordMap)) {
      processedCode = processedCode.replace(new RegExp(replacement, 'gi'), keyword);
    }
    
    return processedCode;
  }

  // 创建临时文件
  createTempFile(content, extension) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `temp_${timestamp}_${randomStr}${extension}`;
    const filepath = path.join(this.tempDir, filename);
    
    fs.writeFileSync(filepath, content, 'utf8');
    return filepath;
  }

  // 清理临时文件
  cleanupTempFile(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }

  // 提取Java类名
  extractJavaClassName(code) {
    const match = code.match(/public\s+class\s+(\w+)/);
    return match ? match[1] : 'Main';
  }

  // 运行单个测试用例
  async runSingleTest(code, language, testCase, timeLimit = 5000, memoryLimit = 128) {
    let filepath = null;
    let executablePath = null;
    let classFiles = [];
    
    try {
      const input = testCase.input_data || '';
      const expected = testCase.expected_output || '';
      
      let command = '';
      let extension = '';
      
      switch (language.toLowerCase()) {
        case 'python':
        case 'python3':
          extension = '.py';
          filepath = this.createTempFile(code, extension);
          command = `python "${filepath}"`;
          break;
          
        case 'c':
          extension = '.c';
          filepath = this.createTempFile(code, extension);
          executablePath = filepath.replace('.c', '.exe');
          command = `gcc -std=c99 -O2 "${filepath}" -o "${executablePath}" && "${executablePath}"`;
          break;
          
        case 'cpp':
        case 'c++':
          extension = '.cpp';
          filepath = this.createTempFile(code, extension);
          executablePath = filepath.replace('.cpp', '.exe');
          command = `g++ -std=c++17 -O2 "${filepath}" -o "${executablePath}" && "${executablePath}"`;
          break;
          
        case 'java':
          extension = '.java';
          const className = this.extractJavaClassName(code);
          const javaCode = code.replace(/public\s+class\s+\w+/, `public class ${className}`);
          filepath = path.join(this.tempDir, `${className}.java`);
          fs.writeFileSync(filepath, javaCode, 'utf8');
          classFiles.push(filepath.replace('.java', '.class'));
          const javaDir = path.dirname(filepath);
          command = `javac "${filepath}" && java -cp "${javaDir}" ${className}`;
          break;
          
        default:
          throw new Error(`不支持的编程语言: ${language}`);
      }
      
      // 执行代码
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command, {
        timeout: timeLimit,
        maxBuffer: 1024 * 1024, // 1MB
        input: input
      });
      const executionTime = Date.now() - startTime;
      
      if (stderr && stderr.trim() && !stderr.includes('Note:')) {
        throw new Error(`编译/运行错误: ${stderr}`);
      }
      
      const actual = stdout.trim();
      const expectedTrimmed = expected.trim();
      const passed = actual === expectedTrimmed;
      
      return {
        input,
        expected: expectedTrimmed,
        actual,
        passed,
        executionTime,
        score: passed ? (testCase.score || 10) : 0,
        maxScore: testCase.score || 10,
        error: null
      };
      
    } catch (error) {
      return {
        input: testCase.input_data || '',
        expected: testCase.expected_output || '',
        actual: '',
        passed: false,
        executionTime: 0,
        score: 0,
        maxScore: testCase.score || 10,
        error: error.message
      };
    } finally {
      // 清理临时文件
      if (filepath) this.cleanupTempFile(filepath);
      if (executablePath) this.cleanupTempFile(executablePath);
      classFiles.forEach(file => this.cleanupTempFile(file));
    }
  }

  // 评测代码
  async evaluateCode(code, language, testCases, timeLimit = 5000, memoryLimit = 128) {
    const results = [];
    let totalScore = 0;
    let maxScore = 0;
    
    // 解密和恢复关键字
    let processedCode = code;
    try {
      processedCode = this.restoreKeywords(this.decryptCode(code));
    } catch (error) {
      console.error('代码处理失败:', error);
      processedCode = code;
    }
    
    for (const testCase of testCases) {
      maxScore += testCase.score || 10;
      
      const result = await this.runSingleTest(
        processedCode, 
        language, 
        testCase, 
        timeLimit, 
        memoryLimit
      );
      
      results.push(result);
      totalScore += result.score;
    }
    
    return {
      results,
      totalScore,
      maxScore,
      passed: totalScore === maxScore,
      passRate: maxScore > 0 ? (totalScore / maxScore) : 0
    };
  }

  // 验证代码语法
  async validateSyntax(code, language) {
    let filepath = null;
    
    try {
      let command = '';
      let extension = '';
      
      switch (language.toLowerCase()) {
        case 'python':
        case 'python3':
          extension = '.py';
          filepath = this.createTempFile(code, extension);
          command = `python -m py_compile "${filepath}"`;
          break;
          
        case 'c':
          extension = '.c';
          filepath = this.createTempFile(code, extension);
          command = `gcc -fsyntax-only "${filepath}"`;
          break;
          
        case 'cpp':
        case 'c++':
          extension = '.cpp';
          filepath = this.createTempFile(code, extension);
          command = `g++ -fsyntax-only "${filepath}"`;
          break;
          
        case 'java':
          extension = '.java';
          const className = this.extractJavaClassName(code);
          const javaCode = code.replace(/public\s+class\s+\w+/, `public class ${className}`);
          filepath = path.join(this.tempDir, `${className}.java`);
          fs.writeFileSync(filepath, javaCode, 'utf8');
          command = `javac "${filepath}"`;
          break;
          
        default:
          return { valid: false, error: `不支持的编程语言: ${language}` };
      }
      
      await execAsync(command, { timeout: 10000 });
      return { valid: true, error: null };
      
    } catch (error) {
      return { 
        valid: false, 
        error: error.stderr || error.message || '语法检查失败' 
      };
    } finally {
      if (filepath) {
        this.cleanupTempFile(filepath);
        // 清理Java编译产生的class文件
        if (language.toLowerCase() === 'java') {
          this.cleanupTempFile(filepath.replace('.java', '.class'));
        }
      }
    }
  }

  // 生成测试用例
  generateTestCases(problemType, difficulty = 'medium') {
    const testCases = [];
    
    switch (problemType) {
      case 'basic_io':
        testCases.push(
          { input_data: '5', expected_output: '5', score: 20 },
          { input_data: '10', expected_output: '10', score: 20 },
          { input_data: '0', expected_output: '0', score: 20 },
          { input_data: '-5', expected_output: '-5', score: 20 },
          { input_data: '100', expected_output: '100', score: 20 }
        );
        break;
        
      case 'arithmetic':
        testCases.push(
          { input_data: '3 4', expected_output: '7', score: 20 },
          { input_data: '10 5', expected_output: '15', score: 20 },
          { input_data: '0 0', expected_output: '0', score: 20 },
          { input_data: '-5 3', expected_output: '-2', score: 20 },
          { input_data: '100 200', expected_output: '300', score: 20 }
        );
        break;
        
      case 'loop':
        testCases.push(
          { input_data: '5', expected_output: '1 2 3 4 5', score: 20 },
          { input_data: '3', expected_output: '1 2 3', score: 20 },
          { input_data: '1', expected_output: '1', score: 20 },
          { input_data: '10', expected_output: '1 2 3 4 5 6 7 8 9 10', score: 20 },
          { input_data: '7', expected_output: '1 2 3 4 5 6 7', score: 20 }
        );
        break;
        
      default:
        // 默认测试用例
        testCases.push(
          { input_data: '', expected_output: 'Hello World', score: 50 },
          { input_data: '', expected_output: 'Hello World', score: 50 }
        );
    }
    
    return testCases;
  }

  // 清理所有临时文件
  cleanupAllTempFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filepath = path.join(this.tempDir, file);
        const stats = fs.statSync(filepath);
        
        // 删除超过1小时的临时文件
        if (now - stats.mtime.getTime() > 3600000) {
          this.cleanupTempFile(filepath);
        }
      });
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }
}

module.exports = new CodeEvaluator();