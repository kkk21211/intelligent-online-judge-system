-- 智能OJ系统数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS smart_oj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_oj;

-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    real_name VARCHAR(100) NOT NULL COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    role ENUM('admin', 'teacher', 'student') NOT NULL COMMENT '角色',
    class_name VARCHAR(100) COMMENT '班级',
    major VARCHAR(100) COMMENT '专业',
    school VARCHAR(100) COMMENT '学校',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_by INT COMMENT '创建者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 课程表
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '课程名称',
    description TEXT COMMENT '课程描述',
    teacher_id INT NOT NULL COMMENT '授课教师ID',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- 教师课程权限表
CREATE TABLE teacher_courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    course_id INT NOT NULL,
    assigned_by INT NOT NULL COMMENT '分配者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_teacher_course (teacher_id, course_id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- 题目表
CREATE TABLE problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '题目标题',
    description TEXT NOT NULL COMMENT '题目描述',
    type ENUM('choice', 'fill', 'essay', 'code', 'code_fragment') NOT NULL COMMENT '题目类型',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '难度',
    language VARCHAR(50) COMMENT '编程语言(code类型)',
    time_limit INT DEFAULT 1000 COMMENT '时间限制(ms)',
    memory_limit INT DEFAULT 128 COMMENT '内存限制(MB)',
    template_code TEXT COMMENT '代码模板',
    answer TEXT COMMENT '参考答案',
    keywords TEXT COMMENT '关键词(JSON格式)',
    scoring_criteria TEXT COMMENT '评分标准',
    created_by INT NOT NULL COMMENT '创建者ID',
    course_id INT COMMENT '所属课程ID',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_difficulty (difficulty),
    INDEX idx_course (course_id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 测试用例表
CREATE TABLE test_cases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    problem_id INT NOT NULL,
    input_data TEXT COMMENT '输入数据',
    expected_output TEXT COMMENT '期望输出',
    is_sample BOOLEAN DEFAULT FALSE COMMENT '是否为样例',
    score INT DEFAULT 10 COMMENT '分值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- 作业表
CREATE TABLE assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '作业标题',
    description TEXT COMMENT '作业描述',
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL COMMENT '开始时间',
    end_time TIMESTAMP NOT NULL COMMENT '结束时间',
    status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- 作业题目关联表
CREATE TABLE assignment_problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    problem_id INT NOT NULL,
    score INT DEFAULT 100 COMMENT '题目分值',
    order_num INT DEFAULT 1 COMMENT '题目顺序',
    UNIQUE KEY unique_assignment_problem (assignment_id, problem_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id)
);

-- 学生作业表
CREATE TABLE student_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'submitted') DEFAULT 'not_started',
    total_score DECIMAL(5,2) DEFAULT 0 COMMENT '总分',
    submit_time TIMESTAMP NULL COMMENT '提交时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_assignment (assignment_id, student_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 提交记录表
CREATE TABLE submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    problem_id INT NOT NULL,
    student_id INT NOT NULL,
    assignment_id INT COMMENT '所属作业ID',
    code TEXT COMMENT '提交代码(加密)',
    answer TEXT COMMENT '答案内容',
    language VARCHAR(50) COMMENT '编程语言',
    status ENUM('pending', 'judging', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compile_error') DEFAULT 'pending',
    score DECIMAL(5,2) DEFAULT 0 COMMENT '得分',
    execution_time INT COMMENT '执行时间(ms)',
    memory_usage INT COMMENT '内存使用(KB)',
    error_message TEXT COMMENT '错误信息',
    judge_result TEXT COMMENT '评测结果详情(JSON)',
    submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    judge_time TIMESTAMP NULL COMMENT '评测完成时间',
    INDEX idx_problem_student (problem_id, student_id),
    INDEX idx_status (status),
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id)
);

-- 系统配置表
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入默认管理员账号
INSERT INTO users (username, password, real_name, role) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', 'admin');

-- 插入系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES 
('system_name', '智能OJ系统', '系统名称'),
('max_code_length', '10000', '代码最大长度'),
('default_time_limit', '1000', '默认时间限制(ms)'),
('default_memory_limit', '128', '默认内存限制(MB)');