# 智能在线判题系统

一个功能完整的在线教学平台，支持多角色用户管理、AI智能题目生成、代码自动评测等功能。

## 🚀 项目特色

- **多角色权限管理**：支持管理员、教师、学生三种角色
- **AI智能题目生成**：自动生成选择题、填空题、简答题、编程题
- **代码自动评测**：支持C/C++、Python代码在线评测
- **作业管理系统**：支持手工选题和自动选题
- **用户批量管理**：支持Excel批量导入学生信息
- **实时数据统计**：提供详细的学习和教学数据分析

## 🛠️ 技术栈

### 前端
- React 18
- Ant Design
- Axios
- React Router

### 后端
- Node.js
- Express.js
- MySQL
- JWT认证
- bcrypt密码加密

### AI集成
- OpenAI GPT API
- 智能题目生成
- 代码评测算法

## 📦 项目结构

```
intelligent-online-judge-system/
├── frontend/                 # 前端React应用
│   ├── src/
│   │   ├── components/      # 组件目录
│   │   │   ├── Admin/       # 管理员组件
│   │   │   ├── Teacher/     # 教师组件
│   │   │   └── Student/     # 学生组件
│   │   ├── contexts/        # React Context
│   │   ├── utils/           # 工具函数
│   │   └── config/          # 配置文件
│   └── package.json
├── backend/                  # 后端Node.js应用
│   ├── routes/              # 路由文件
│   ├── middleware/          # 中间件
│   ├── services/            # 业务逻辑
│   ├── config/              # 配置文件
│   └── package.json
├── database/                 # 数据库脚本
│   └── init.sql             # 数据库初始化脚本
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/intelligent-online-judge-system.git
cd intelligent-online-judge-system
```

2. **安装依赖**
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. **配置数据库**
```bash
# 创建MySQL数据库
mysql -u root -p
CREATE DATABASE online_judge;

# 导入数据库结构
mysql -u root -p online_judge < database/init.sql
```

4. **配置环境变量**

在 `backend` 目录下创建 `.env` 文件：
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=online_judge
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
PORT=3000
```

5. **启动服务**
```bash
# 启动后端服务
cd backend
npm start

# 启动前端服务（新终端）
cd frontend
npm start
```

6. **访问应用**
- 前端地址：http://localhost:3001
- 后端API：http://localhost:3000

## 👥 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | password | 系统管理员账号 |
| 教师 | teacher1 | password | 教师测试账号 |
| 学生 | student1 | password | 学生测试账号 |

## 🎯 主要功能

### 管理员功能
- 用户管理（添加、删除、修改教师和学生账号）
- 课程管理
- 系统配置
- 数据统计分析

### 教师功能
- 学生管理（批量导入、单独添加）
- 题目管理（手动创建、AI生成）
- 作业布置（手工选题、自动选题）
- 成绩查看和分析

### 学生功能
- 作业查看和提交
- 代码在线编辑和测试
- 成绩查询
- 学习进度跟踪

## 🔧 开发指南

### API文档

主要API端点：

- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息
- `GET /api/problems` - 获取题目列表
- `POST /api/problems` - 创建题目
- `POST /api/ai/generate-question` - AI生成题目
- `POST /api/submissions` - 提交代码
- `GET /api/assignments` - 获取作业列表

### 数据库设计

主要数据表：
- `users` - 用户信息表
- `problems` - 题目表
- `assignments` - 作业表
- `submissions` - 提交记录表
- `courses` - 课程表
- `user_courses` - 用户课程关联表

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues：[GitHub Issues](https://github.com/your-username/intelligent-online-judge-system/issues)
- 邮箱：3541866581@qq.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
