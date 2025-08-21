import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Select,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  UserOutlined
} from '@ant-design/icons';
import api from '../../utils/api';

const { Option } = Select;

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();

  useEffect(() => {
    fetchTeachers();
    fetchCourses();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/teachers');
      setTeachers(response.data.teachers || []);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      message.error('获取教师列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/admin/courses');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    form.setFieldsValue({
      username: teacher.username,
      realName: teacher.realName,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingTeacher) {
        // 编辑教师
        await api.put(`/api/admin/teachers/${editingTeacher.id}`, values);
        message.success('教师信息更新成功');
      } else {
        // 添加教师
        await api.post('/api/admin/teachers', {
          ...values,
          password: values.password || '123456' // 默认密码
        });
        message.success('教师添加成功');
      }
      
      setModalVisible(false);
      form.resetFields();
      fetchTeachers();
    } catch (error) {
      console.error('Failed to save teacher:', error);
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleToggleStatus = async (teacher) => {
    try {
      const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
      await api.put(`/api/admin/teachers/${teacher.id}/status`, {
        status: newStatus
      });
      message.success(`教师账号已${newStatus === 'active' ? '启用' : '禁用'}`);
      fetchTeachers();
    } catch (error) {
      console.error('Failed to toggle teacher status:', error);
      message.error('操作失败');
    }
  };

  const handleManagePermissions = async (teacher) => {
    try {
      setSelectedTeacher(teacher);
      
      // 获取教师的课程权限
      const response = await api.get(`/api/admin/teachers/${teacher.id}/permissions`);
      const permissions = response.data.permissions || [];
      
      permissionForm.setFieldsValue({
        courseIds: permissions.map(p => p.courseId)
      });
      
      setPermissionModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch teacher permissions:', error);
      message.error('获取权限信息失败');
    }
  };

  const handleSavePermissions = async (values) => {
    try {
      await api.post(`/api/admin/teachers/${selectedTeacher.id}/permissions`, {
        courseIds: values.courseIds || []
      });
      message.success('权限设置成功');
      setPermissionModalVisible(false);
      permissionForm.resetFields();
    } catch (error) {
      console.error('Failed to save permissions:', error);
      message.error('权限设置失败');
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, teacher) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTeacher(teacher)}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<KeyOutlined />}
            onClick={() => handleManagePermissions(teacher)}
          >
            权限
          </Button>
          <Popconfirm
            title={`确定要${teacher.status === 'active' ? '禁用' : '启用'}该教师吗？`}
            onConfirm={() => handleToggleStatus(teacher)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger={teacher.status === 'active'}
            >
              {teacher.status === 'active' ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <h2>教师管理</h2>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTeacher}
            >
              添加教师
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={teachers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 添加/编辑教师模态框 */}
      <Modal
        title={editingTeacher ? '编辑教师' : '添加教师'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' }
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
          </Row>

          {!editingTeacher && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password placeholder="请输入密码（默认：123456）" />
            </Form.Item>
          )}

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
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="电话"
              >
                <Input placeholder="请输入电话号码" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="department"
            label="部门"
          >
            <Input placeholder="请输入所属部门" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingTeacher ? '更新' : '添加'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限管理模态框 */}
      <Modal
        title={`管理教师权限 - ${selectedTeacher?.realName}`}
        open={permissionModalVisible}
        onCancel={() => {
          setPermissionModalVisible(false);
          permissionForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={handleSavePermissions}
        >
          <Form.Item
            name="courseIds"
            label="授权课程"
            help="选择该教师可以管理的课程"
          >
            <Select
              mode="multiple"
              placeholder="请选择课程"
              style={{ width: '100%' }}
            >
              {courses.map(course => (
                <Option key={course.id} value={course.id}>
                  {course.courseName} ({course.courseCode})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存权限
              </Button>
              <Button onClick={() => {
                setPermissionModalVisible(false);
                permissionForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherManagement;