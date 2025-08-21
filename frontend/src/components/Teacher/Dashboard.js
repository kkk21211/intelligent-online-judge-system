import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Button, Breadcrumb } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const Dashboard = () => {
  const [selectedKey, setSelectedKey] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: '概览',
    },
    {
      key: 'students',
      icon: <TeamOutlined />,
      label: '学生管理',
    },
    {
      key: 'questions',
      icon: <BookOutlined />,
      label: '题目管理',
    },
    {
      key: 'assignments',
      icon: <FileTextOutlined />,
      label: '作业管理',
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: '统计分析',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '个人设置',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => {
        setSelectedKey('settings');
        navigate('/teacher/settings');
      }
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout
    },
  ];

  // 根据当前路径设置选中的菜单项
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'teacher') {
      setSelectedKey(path);
    } else {
      setSelectedKey('overview');
    }
  }, [location.pathname]);

  // 处理菜单点击事件
  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
    navigate(`/teacher/${key}`);
  };

  const getBreadcrumbItems = () => {
    const breadcrumbMap = {
      overview: ['首页', '概览'],
      students: ['首页', '学生管理'],
      questions: ['首页', '题目管理'],
      assignments: ['首页', '作业管理'],
      statistics: ['首页', '统计分析'],
      settings: ['首页', '个人设置']
    };
    
    return breadcrumbMap[selectedKey] || ['首页'];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={250}
      >
        <div className="logo" style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'OJ' : '智能OJ系统'}
          </Title>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 16 }}
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
          <Breadcrumb>
            {getBreadcrumbItems().map((item, index) => (
              <Breadcrumb.Item key={index}>{item}</Breadcrumb.Item>
            ))}
          </Breadcrumb>
          
          <Space size="middle">
            <Button
              type="text"
              icon={<BellOutlined />}
              size="large"
            />
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span>{user?.name || '教师'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;