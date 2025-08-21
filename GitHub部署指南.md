# GitHub部署指南

## 📋 准备工作

### 1. 确保已安装Git
```bash
# 检查Git是否已安装
git --version

# 如果未安装，请访问 https://git-scm.com/ 下载安装
```

### 2. 配置Git用户信息（如果未配置）
```bash
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱@example.com"
```

## 🚀 部署步骤

### 步骤1：在GitHub上创建新仓库

1. 登录你的GitHub账号
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `intelligent-online-judge-system`
   - **Description**: `智能在线判题系统 - 支持多角色用户管理、AI题目生成、代码评测的在线教学平台`
   - **Visibility**: 选择 Public（公开）或 Private（私有）
   - **不要勾选** "Add a README file"（我们已经创建了）
   - **不要勾选** "Add .gitignore"（我们已经创建了）
4. 点击 "Create repository"

### 步骤2：初始化本地Git仓库

在项目根目录（E:\f1）打开终端，执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加所有文件到暂存区
git add .

# 创建初始提交
git commit -m "Initial commit: 智能在线判题系统完整项目"

# 设置主分支名称为main
git branch -M main
```

### 步骤3：连接远程仓库

将 `your-username` 替换为你的GitHub用户名：

```bash
# 添加远程仓库
git remote add origin https://github.com/your-username/intelligent-online-judge-system.git

# 推送代码到GitHub
git push -u origin main
```

### 步骤4：验证部署

1. 刷新GitHub仓库页面
2. 确认所有文件都已上传
3. 检查README.md是否正确显示

## 📁 上传的文件结构

```
intelligent-online-judge-system/
├── .gitignore                   # Git忽略文件
├── README.md                    # 项目说明文档
├── GitHub部署指南.md            # 本指南文件
├── 测试账号.md                  # 测试账号信息
├── package.json                 # 根目录依赖
├── frontend/                    # 前端项目
│   ├── src/                    # 源代码
│   ├── public/                 # 静态资源
│   └── package.json            # 前端依赖
├── backend/                     # 后端项目
│   ├── routes/                 # 路由文件
│   ├── middleware/             # 中间件
│   ├── services/               # 业务逻辑
│   ├── config/                 # 配置文件
│   └── package.json            # 后端依赖
└── database/                    # 数据库脚本
    └── init.sql                # 数据库初始化
```

## 🔧 后续维护

### 推送新的更改
```bash
# 添加更改的文件
git add .

# 提交更改
git commit -m "描述你的更改"

# 推送到GitHub
git push origin main
```

### 创建新分支进行开发
```bash
# 创建并切换到新分支
git checkout -b feature/new-feature

# 开发完成后推送分支
git push origin feature/new-feature

# 在GitHub上创建Pull Request
```

## 🌟 项目亮点

- ✅ 完整的前后端分离架构
- ✅ 多角色权限管理系统
- ✅ AI智能题目生成功能
- ✅ 代码自动评测系统
- ✅ 用户批量管理功能
- ✅ 响应式UI设计
- ✅ 完整的API文档
- ✅ 详细的部署指南

## 📞 技术支持

如果在部署过程中遇到问题：

1. 检查Git是否正确安装和配置
2. 确认GitHub仓库权限设置
3. 检查网络连接是否正常
4. 查看Git错误信息并搜索解决方案

## 🎉 部署完成

恭喜！你的智能在线判题系统项目已成功部署到GitHub。

现在你可以：
- 与他人分享你的项目
- 接受其他开发者的贡献
- 使用GitHub Pages部署静态版本
- 设置CI/CD自动部署流程

---

**记住**：定期备份你的代码，并保持良好的提交习惯！