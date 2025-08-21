import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Avatar,
  Upload,
  Row,
  Col,
  Divider,
  Switch,
  Select,
  TimePicker,
  Typography,
  Space,
  Alert,
  Modal,
  Descriptions,
  Tag,
  List,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  LockOutlined,
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  HistoryOutlined,
  LogoutOutlined,
  EditOutlined,
  SaveOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { confirm } = Modal;

const Settings = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [loginHistory, setLoginHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({});

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        title: user.title,
        bio: user.bio
      });
      setAvatarUrl(user.avatar);
    }
    fetchLoginHistory();
    fetchSessions();
    fetchNotificationSettings();
  }, [user, profileForm]);

  const fetchLoginHistory = async () => {
    try {
      // const response = await api.get('/api/teacher/login-history');
      // setLoginHistory(response.data);
      
      // 模拟数据
      setLoginHistory([
        {
          id: 1,
          loginTime: '2024-01-15 09:30:25',
          ip: '192.168.1.100',
          location: '北京市海淀区',
          device: 'Chrome 120.0 on Windows 10',
          status: 'success'
        },
        {
          id: 2,
          loginTime: '2024-01-14 14:22:18',
          ip: '192.168.1.100',
          location: '北京市海淀区',
          device: 'Chrome 120.0 on Windows 10',
          status: 'success'
        },
        {
          id: 3,
          loginTime: '2024-01-13 08:45:12',
          ip: '10.0.0.50',
          location: '北京市朝阳区',
          device: 'Safari 17.0 on macOS',
          status: 'success'
        },
        {
          id: 4,
          loginTime: '2024-01-12 16:30:45',
          ip: '192.168.1.100',
          location: '北京市海淀区',
          device: 'Chrome 120.0 on Windows 10',
          status: 'failed'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch login history:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      // const response = await api.get('/api/teacher/sessions');
      // setSessions(response.data);
      
      // 模拟数据
      setSessions([
        {
          id: 1,
          device: 'Chrome 120.0 on Windows 10',
          ip: '192.168.1.100',
          location: '北京市海淀区',
          lastActive: '2024-01-15 10:30:25',
          current: true
        },
        {
          id: 2,
          device: 'Safari 17.0 on macOS',
          ip: '10.0.0.50',
          location: '北京市朝阳区',
          lastActive: '2024-01-13 08:45:12',
          current: false
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      // const response = await api.get('/api/teacher/notification-settings');
      // setNotificationSettings(response.data);
      
      // 模拟数据
      const settings = {
        emailNotifications: true,
        smsNotifications: false,
        assignmentReminders: true,
        submissionAlerts: true,
        systemUpdates: false,
        weeklyReports: true,
        quietHours: {
          enabled: true,
          start: dayjs('22:00', 'HH:mm'),
          end: dayjs('08:00', 'HH:mm')
        }
      };
      setNotificationSettings(settings);
      notificationForm.setFieldsValue(settings);
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    }
  };

  const handleProfileSubmit = async (values) => {
    try {
      setLoading(true);
      await updateProfile(values);
      message.success('个人信息更新成功');
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values) => {
    try {
      setPasswordLoading(true);
      await changePassword(values.currentPassword, values.newPassword);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Failed to change password:', error);
      message.error('密码修改失败，请检查当前密码是否正确');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNotificationSubmit = async (values) => {
    try {
      // await api.put('/api/teacher/notification-settings', values);
      setNotificationSettings(values);
      message.success('通知设置保存成功');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      message.error('保存失败，请重试');
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setAvatarUrl(info.file.response.url);
      setLoading(false);
      message.success('头像上传成功');
    }
    if (info.file.status === 'error') {
      setLoading(false);
      message.error('头像上传失败');
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      // await api.delete(`/api/teacher/sessions/${sessionId}`);
      setSessions(sessions.filter(session => session.id !== sessionId));
      message.success('会话已终止');
    } catch (error) {
      console.error('Failed to terminate session:', error);
      message.error('终止会话失败');
    }
  };

  const handleLogoutAllDevices = () => {
    confirm({
      title: '确认退出所有设备？',
      content: '这将终止您在所有设备上的登录会话，您需要重新登录。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          // await api.post('/api/teacher/logout-all');
          logout();
          message.success('已退出所有设备');
        } catch (error) {
          console.error('Failed to logout all devices:', error);
          message.error('操作失败');
        }
      }
    });
  };

  const uploadButton = (
    <div>
      <CameraOutlined />
      <div style={{ marginTop: 8 }}>上传头像</div>
    </div>
  );

  const tabList = [
    {
      key: 'profile',
      tab: (
        <span>
          <UserOutlined />
          个人信息
        </span>
      )
    },
    {
      key: 'security',
      tab: (
        <span>
          <LockOutlined />
          安全设置
        </span>
      )
    },
    {
      key: 'notifications',
      tab: (
        <span>
          <BellOutlined />
          通知设置
        </span>
      )
    },
    {
      key: 'sessions',
      tab: (
        <span>
          <SecurityScanOutlined />
          登录管理
        </span>
      )
    }
  ];

  const renderProfileTab = () => (
    <Row gutter={24}>
      <Col span={8}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <Avatar
              size={120}
              src={avatarUrl}
              icon={<UserOutlined />}
              style={{ marginBottom: 16 }}
            />
            <br />
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              action="/api/upload/avatar"
              beforeUpload={(file) => {
                const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                if (!isJpgOrPng) {
                  message.error('只能上传 JPG/PNG 格式的图片!');
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message.error('图片大小不能超过 2MB!');
                }
                return isJpgOrPng && isLt2M;
              }}
              onChange={handleAvatarChange}
            >
              <Button icon={<CameraOutlined />} size="small">
                更换头像
              </Button>
            </Upload>
          </div>
        </Card>
      </Col>
      <Col span={16}>
        <Card title="基本信息">
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[{ required: true, message: '请输入手机号' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="department"
                  label="部门"
                >
                  <Select placeholder="选择部门">
                    <Option value="计算机学院">计算机学院</Option>
                    <Option value="软件学院">软件学院</Option>
                    <Option value="信息学院">信息学院</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="职称"
                >
                  <Select placeholder="选择职称">
                    <Option value="助教">助教</Option>
                    <Option value="讲师">讲师</Option>
                    <Option value="副教授">副教授</Option>
                    <Option value="教授">教授</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="bio"
              label="个人简介"
            >
              <TextArea rows={4} placeholder="请输入个人简介" />
            </Form.Item>
            
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );

  const renderSecurityTab = () => (
    <Row gutter={24}>
      <Col span={12}>
        <Card title="修改密码">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
          >
            <Form.Item
              name="currentPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password placeholder="请输入当前密码" />
            </Form.Item>
            
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少6位' }
              ]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordLoading}
                icon={<LockOutlined />}
              >
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      
      <Col span={12}>
        <Card title="安全提示">
          <Alert
            message="密码安全建议"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>密码长度至少8位</li>
                <li>包含大小写字母、数字和特殊字符</li>
                <li>不要使用常见的密码组合</li>
                <li>定期更换密码</li>
                <li>不要在多个平台使用相同密码</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Card>
        
        <Card title="账户安全" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>两步验证</span>
              <Switch defaultChecked={false} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>登录提醒</span>
              <Switch defaultChecked={true} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>异常登录保护</span>
              <Switch defaultChecked={true} />
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  );

  const renderNotificationsTab = () => (
    <Card title="通知设置">
      <Form
        form={notificationForm}
        layout="vertical"
        onFinish={handleNotificationSubmit}
        initialValues={notificationSettings}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Card title="通知方式" size="small">
              <Form.Item name="emailNotifications" valuePropName="checked">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>邮件通知</span>
                  <Switch />
                </div>
              </Form.Item>
              
              <Form.Item name="smsNotifications" valuePropName="checked">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>短信通知</span>
                  <Switch />
                </div>
              </Form.Item>
            </Card>
            
            <Card title="免打扰时间" size="small" style={{ marginTop: 16 }}>
              <Form.Item name={['quietHours', 'enabled']} valuePropName="checked">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>启用免打扰</span>
                  <Switch />
                </div>
              </Form.Item>
              
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name={['quietHours', 'start']} label="开始时间">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['quietHours', 'end']} label="结束时间">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="通知内容" size="small">
              <Form.Item name="assignmentReminders" valuePropName="checked">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>作业提醒</span>
                  <Switch />
                </div>
              </Form.Item>
              
              <Form.Item name="submissionAlerts" valuePropName="checked">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>提交提醒</span>
                  <Switch />
                </div>
              </Form.Item>
              
              <Form.Item name="systemUpdates" valuePropName="checked">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>系统更新</span>
                  <Switch />
                </div>
              </Form.Item>
              
              <Form.Item name="weeklyReports" valuePropName="checked">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>周报推送</span>
                  <Switch />
                </div>
              </Form.Item>
            </Card>
          </Col>
        </Row>
        
        <Form.Item style={{ marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
          >
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderSessionsTab = () => (
    <div>
      <Card title="当前登录会话" style={{ marginBottom: 16 }}>
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              actions={[
                session.current ? (
                  <Tag color="green">当前会话</Tag>
                ) : (
                  <Popconfirm
                    title="确定要终止这个会话吗？"
                    onConfirm={() => handleTerminateSession(session.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                      终止
                    </Button>
                  </Popconfirm>
                )
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<SecurityScanOutlined />} />}
                title={session.device}
                description={
                  <div>
                    <div>IP: {session.ip}</div>
                    <div>位置: {session.location}</div>
                    <div>最后活动: {session.lastActive}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
        
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogoutAllDevices}
          >
            退出所有设备
          </Button>
        </div>
      </Card>
      
      <Card title="登录历史">
        <List
          dataSource={loginHistory}
          renderItem={(record) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={<HistoryOutlined />} 
                    style={{ 
                      backgroundColor: record.status === 'success' ? '#52c41a' : '#f5222d' 
                    }} 
                  />
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{record.loginTime}</span>
                    <Tag color={record.status === 'success' ? 'green' : 'red'}>
                      {record.status === 'success' ? '成功' : '失败'}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div>IP: {record.ip}</div>
                    <div>位置: {record.location}</div>
                    <div>设备: {record.device}</div>
                  </div>
                }
              />
            </List.Item>
          )}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true
          }}
        />
      </Card>
    </div>
  );

  const contentMap = {
    profile: renderProfileTab(),
    security: renderSecurityTab(),
    notifications: renderNotificationsTab(),
    sessions: renderSessionsTab()
  };

  return (
    <div>
      <Card
        tabList={tabList}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
        tabBarExtraContent={
          <Space>
            <Text type="secondary">最后登录: {user?.lastLogin || '未知'}</Text>
          </Space>
        }
      >
        {contentMap[activeTab]}
      </Card>
    </div>
  );
};

export default Settings;