import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  message,
  Tabs,
  Switch,
  Select,
  Divider,
  Row,
  Col,
  Typography,
  Space,
  Modal,
  Table,
  Tag
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  LockOutlined,
  BellOutlined,
  SafetyOutlined,
  HistoryOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const StudentSettings = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [notifications, setNotifications] = useState({
    assignment: true,
    grade: true,
    announcement: false,
    email: true,
    sms: false
  });

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        real_name: user.real_name,
        email: user.email,
        class_name: user.class_name,
        major: user.major,
        school: user.school,
        phone: user.phone || '',
        bio: user.bio || ''
      });
    }
    fetchLoginHistory();
  }, [user, form]);

  const fetchLoginHistory = async () => {
    // 模拟登录历史数据
    const mockHistory = [
      {
        id: 1,
        login_time: '2025-01-19 14:30:25',
        ip_address: '192.168.1.100',
        device: 'Chrome 120.0 / Windows 10',
        location: '北京市',
        status: 'success'
      },
      {
        id: 2,
        login_time: '2025-01-19 08:15:42',
        ip_address: '192.168.1.100',
        device: 'Chrome 120.0 / Windows 10',
        location: '北京市',
        status: 'success'
      },
      {
        id: 3,
        login_time: '2025-01-18 20:45:18',
        ip_address: '10.0.0.50',
        device: 'Safari 17.0 / macOS',
        location: '上海市',
        status: 'failed'
      },
      {
        id: 4,
        login_time: '2025-01-18 16:22:33',
        ip_address: '192.168.1.100',
        device: 'Chrome 120.0 / Windows 10',
        location: '北京市',
        status: 'success'
      }
    ];
    setLoginHistory(mockHistory);
  };

  const handleProfileUpdate = async (values) => {
    try {
      setLoading(true);
      // 这里应该调用API更新用户信息
      console.log('更新用户信息:', values);
      message.success('个人信息更新成功');
    } catch (error) {
      console.error('更新失败:', error);
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      setLoading(true);
      // 这里应该调用API修改密码
      console.log('修改密码:', values);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      console.error('密码修改失败:', error);
      message.error('密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setLoading(false);
      setAvatar(info.file.response?.url);
      message.success('头像上传成功');
    }
    if (info.file.status === 'error') {
      setLoading(false);
      message.error('头像上传失败');
    }
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
    message.success('通知设置已更新');
  };

  const loginHistoryColumns = [
    {
      title: '登录时间',
      dataIndex: 'login_time',
      key: 'login_time',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address'
    },
    {
      title: '设备信息',
      dataIndex: 'device',
      key: 'device'
    },
    {
      title: '登录地点',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      )
    }
  ];

  const uploadButton = (
    <div>
      <CameraOutlined />
      <div style={{ marginTop: 8 }}>更换头像</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>个人设置</Title>
        <Text type="secondary">管理您的个人信息和系统设置</Text>
      </div>

      <Tabs defaultActiveKey="profile" type="card">
        {/* 个人信息 */}
        <TabPane tab={<span><UserOutlined />个人信息</span>} key="profile">
          <Row gutter={24}>
            <Col span={8}>
              <Card title="头像设置" style={{ textAlign: 'center' }}>
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
                  {avatar ? (
                    <img src={avatar} alt="avatar" style={{ width: '100%' }} />
                  ) : (
                    <Avatar size={100} icon={<UserOutlined />} />
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Button icon={<UploadOutlined />}>更换头像</Button>
                  </div>
                </Upload>
              </Card>
            </Col>
            
            <Col span={16}>
              <Card title="基本信息">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="用户名"
                        name="username"
                        rules={[{ required: true, message: '请输入用户名' }]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="真实姓名"
                        name="real_name"
                        rules={[{ required: true, message: '请输入真实姓名' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="邮箱地址"
                        name="email"
                        rules={[
                          { required: true, message: '请输入邮箱地址' },
                          { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="手机号码"
                        name="phone"
                        rules={[
                          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="班级"
                        name="class_name"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="专业"
                        name="major"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="学校"
                        name="school"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    label="个人简介"
                    name="bio"
                  >
                    <TextArea rows={4} placeholder="介绍一下自己..." />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存更改
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* 密码安全 */}
        <TabPane tab={<span><LockOutlined />密码安全</span>} key="security">
          <Row gutter={24}>
            <Col span={12}>
              <Card title="修改密码">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordChange}
                >
                  <Form.Item
                    label="当前密码"
                    name="currentPassword"
                    rules={[{ required: true, message: '请输入当前密码' }]}
                  >
                    <Input.Password />
                  </Form.Item>
                  
                  <Form.Item
                    label="新密码"
                    name="newPassword"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码长度至少6位' }
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                  
                  <Form.Item
                    label="确认新密码"
                    name="confirmPassword"
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
                    <Input.Password />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="安全设置">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div>
                    <Text strong>两步验证</Text>
                    <br />
                    <Text type="secondary">为您的账户添加额外的安全保护</Text>
                    <br />
                    <Button type="link" style={{ padding: 0 }}>设置两步验证</Button>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text strong>登录通知</Text>
                    <br />
                    <Text type="secondary">当有新设备登录时通知您</Text>
                    <br />
                    <Switch defaultChecked />
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text strong>会话管理</Text>
                    <br />
                    <Text type="secondary">管理您在其他设备上的登录会话</Text>
                    <br />
                    <Button type="link" style={{ padding: 0 }}>查看活跃会话</Button>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* 通知设置 */}
        <TabPane tab={<span><BellOutlined />通知设置</span>} key="notifications">
          <Card title="通知偏好">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>作业通知</Text>
                  <br />
                  <Text type="secondary">新作业发布时通知我</Text>
                </Col>
                <Col>
                  <Switch
                    checked={notifications.assignment}
                    onChange={(checked) => handleNotificationChange('assignment', checked)}
                  />
                </Col>
              </Row>
              
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>成绩通知</Text>
                  <br />
                  <Text type="secondary">作业评分完成时通知我</Text>
                </Col>
                <Col>
                  <Switch
                    checked={notifications.grade}
                    onChange={(checked) => handleNotificationChange('grade', checked)}
                  />
                </Col>
              </Row>
              
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>课程公告</Text>
                  <br />
                  <Text type="secondary">课程有新公告时通知我</Text>
                </Col>
                <Col>
                  <Switch
                    checked={notifications.announcement}
                    onChange={(checked) => handleNotificationChange('announcement', checked)}
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <Title level={5}>通知方式</Title>
              
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>邮件通知</Text>
                  <br />
                  <Text type="secondary">通过邮件接收通知</Text>
                </Col>
                <Col>
                  <Switch
                    checked={notifications.email}
                    onChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </Col>
              </Row>
              
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>短信通知</Text>
                  <br />
                  <Text type="secondary">通过短信接收重要通知</Text>
                </Col>
                <Col>
                  <Switch
                    checked={notifications.sms}
                    onChange={(checked) => handleNotificationChange('sms', checked)}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </TabPane>

        {/* 登录历史 */}
        <TabPane tab={<span><HistoryOutlined />登录历史</span>} key="history">
          <Card title="最近登录记录">
            <Table
              columns={loginHistoryColumns}
              dataSource={loginHistory}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default StudentSettings;