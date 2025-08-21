import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 调用真实的登录API
      const response = await api.post('/api/auth/login', {
        username: values.username,
        password: values.password,
        role: values.role
      });
      
      if (response.data.token && response.data.user) {
        const { user, token } = response.data;
        
        // 保存token到cookie
        document.cookie = `token=${token}; path=/; max-age=86400`;
        
        // 更新用户状态
        login(user, token);
        message.success(response.data.message || '登录成功！');
        
        // 根据角色跳转到对应的仪表板
        switch (user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'teacher':
            navigate('/teacher');
            break;
          case 'student':
            navigate('/student');
            break;
          default:
            navigate('/');
        }
      } else {
        message.error(response.data.error || response.data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
            智能在线评测系统
          </Title>
          <Text type="secondary">请选择身份并登录</Text>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择登录身份!' }]}
          >
            <Select placeholder="选择登录身份">
              <Option value="admin">管理员</Option>
              <Option value="teacher">教师</Option>
              <Option value="student">学生</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Space direction="vertical" size="small">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              测试账号：
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              管理员: admin/admin | 教师: teacher/teacher | 学生: student/student
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Login;