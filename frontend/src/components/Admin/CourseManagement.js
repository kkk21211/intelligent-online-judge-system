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
  Select
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import api from '../../utils/api';

const { Option } = Select;
const { TextArea } = Input;

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/courses');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    form.setFieldsValue({
      courseName: course.courseName,
      courseCode: course.courseCode,
      description: course.description,
      credits: course.credits,
      semester: course.semester,
      status: course.status
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCourse) {
        // 编辑课程
        await api.put(`/api/admin/courses/${editingCourse.id}`, values);
        message.success('课程信息更新成功');
      } else {
        // 添加课程
        await api.post('/api/admin/courses', values);
        message.success('课程添加成功');
      }
      
      setModalVisible(false);
      form.resetFields();
      fetchCourses();
    } catch (error) {
      console.error('Failed to save course:', error);
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await api.delete(`/api/admin/courses/${courseId}`);
      message.success('课程删除成功');
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'courseName',
      key: 'courseName',
      width: 200,
    },
    {
      title: '课程代码',
      dataIndex: 'courseCode',
      key: 'courseCode',
      width: 120,
    },
    {
      title: '学分',
      dataIndex: 'credits',
      key: 'credits',
      width: 80,
      align: 'center',
    },
    {
      title: '学期',
      dataIndex: 'semester',
      key: 'semester',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '活跃' : '非活跃'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, course) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditCourse(course)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该课程吗？"
            description="删除后将无法恢复，且会影响相关的作业和权限设置。"
            onConfirm={() => handleDeleteCourse(course.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
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
            <h2>课程管理</h2>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCourse}
            >
              添加课程
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={courses}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 添加/编辑课程模态框 */}
      <Modal
        title={editingCourse ? '编辑课程' : '添加课程'}
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
          initialValues={{
            status: 'active',
            credits: 3
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="courseName"
                label="课程名称"
                rules={[
                  { required: true, message: '请输入课程名称' },
                  { min: 2, message: '课程名称至少2个字符' }
                ]}
              >
                <Input placeholder="请输入课程名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="courseCode"
                label="课程代码"
                rules={[
                  { required: true, message: '请输入课程代码' },
                  { pattern: /^[A-Z0-9]+$/, message: '课程代码只能包含大写字母和数字' }
                ]}
              >
                <Input placeholder="如：CS101" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="credits"
                label="学分"
                rules={[
                  { required: true, message: '请输入学分' },
                  { type: 'number', min: 1, max: 10, message: '学分必须在1-10之间' }
                ]}
              >
                <Input type="number" placeholder="学分" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="semester"
                label="学期"
                rules={[{ required: true, message: '请选择学期' }]}
              >
                <Select placeholder="请选择学期">
                  <Option value="2024春">2024春</Option>
                  <Option value="2024夏">2024夏</Option>
                  <Option value="2024秋">2024秋</Option>
                  <Option value="2024冬">2024冬</Option>
                  <Option value="2025春">2025春</Option>
                  <Option value="2025夏">2025夏</Option>
                  <Option value="2025秋">2025秋</Option>
                  <Option value="2025冬">2025冬</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="active">活跃</Option>
                  <Option value="inactive">非活跃</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="课程描述"
            rules={[{ max: 500, message: '描述不能超过500个字符' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入课程描述（可选）"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingCourse ? '更新' : '添加'}
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
    </div>
  );
};

export default CourseManagement;