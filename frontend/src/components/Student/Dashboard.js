import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  List,
  Progress,
  Badge,
  Button
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  TrophyOutlined,
  LogoutOutlined,
  HomeOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'overview',
      icon: <HomeOutlined />,
      label: '概览',
      onClick: () => navigate('/student')
    },
    {
      key: 'courses',
      icon: <BookOutlined />,
      label: '我的课程',
      onClick: () => navigate('/student/courses')
    },
    {
      key: 'assignments',
      icon: <FileTextOutlined />,
      label: '作业列表',
      onClick: () => navigate('/student/assignments')
    },
    {
      key: 'progress',
      icon: <TrophyOutlined />,
      label: '学习进度',
      onClick: () => navigate('/student/progress')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: () => navigate('/student/settings')
    }
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout
    }
  ];

  // 根据当前路径设置选中的菜单项
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'student') {
      setSelectedKey(path);
    } else {
      setSelectedKey('overview');
    }
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        width={250}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'S' : '学生端'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              欢迎回来，{user?.real_name || user?.username}
            </Title>
          </div>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <span>{user?.real_name || user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        
        <Content style={{ margin: '24px', background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentDashboard;