import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Upload,
  Tag,
  Drawer,
  Descriptions,
  Avatar,
  Progress,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  UserOutlined,
  EyeOutlined
} from '@ant-design/icons';
import api from '../../utils/api';

const { Option } = Select;
const { Search } = Input;

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/teacher/students', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          class_name: selectedCourse
        }
      });
      
      setStudents(response.data.students || []);
      setPagination(prev => ({ 
        ...prev, 
        total: response.data.pagination?.total || 0 
      }));
    } catch (error) {
      console.error('Failed to fetch students:', error);
      message.error('获取学生列表失败');
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedCourse, pagination.current, pagination.pageSize]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get('/api/teacher/courses');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [fetchStudents, fetchCourses]);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    form.setFieldsValue({
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      phone: student.phone,
      courses: student.courses
    });
    setModalVisible(true);
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setDrawerVisible(true);
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await api.delete(`/api/teacher/students/${studentId}`);
      message.success('删除学生成功');
      fetchStudents();
    } catch (error) {
      console.error('Failed to delete student:', error);
      message.error('删除学生失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (selectedStudent) {
        await api.put(`/api/teacher/students/${selectedStudent.id}`, values);
        message.success('更新学生信息成功');
      } else {
        await api.post('/api/teacher/students', values);
        message.success('添加学生成功');
      }
      setModalVisible(false);
      fetchStudents();
    } catch (error) {
      console.error('Failed to save student:', error);
      message.error('保存失败');
    }
  };

  const handleBatchImport = (info) => {
    if (info.file.status === 'done') {
      if (info.file.response && info.file.response.success) {
        message.success('批量导入成功');
        fetchStudents();
      } else {
        message.error(info.file.response?.message || '批量导入失败');
      }
    } else if (info.file.status === 'error') {
      message.error('批量导入失败');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/api/teacher/students/export', {
          responseType: 'blob'
        });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      console.error('Failed to export:', error);
      message.error('导出失败');
    }
  };

  const columns = [
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 120,
      sorter: true
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {text}
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '课程',
      dataIndex: 'courses',
      key: 'courses',
      render: (courses) => (
        <div>
          {courses.map(course => (
            <Tag key={course} color="blue" style={{ marginBottom: 2 }}>
              {course}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: '提交/完成',
      key: 'progress',
      render: (_, record) => (
        <div>
          <div>{record.totalSubmissions} / {record.completedAssignments}</div>
          <Progress
            percent={Math.round((record.completedAssignments / record.totalSubmissions) * 100)}
            size="small"
            showInfo={false}
          />
        </div>
      )
    },
    {
      title: '平均分',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (score) => (
        <span style={{ 
          color: score >= 90 ? '#52c41a' : score >= 80 ? '#1890ff' : score >= 60 ? '#faad14' : '#f5222d'
        }}>
          {score.toFixed(1)}
        </span>
      ),
      sorter: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewStudent(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditStudent(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个学生吗？"
            onConfirm={() => handleDeleteStudent(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space>
                <Search
                  placeholder="搜索学号、姓名或邮箱"
                  allowClear
                  style={{ width: 250 }}
                  onSearch={setSearchText}
                />
                <Select
                  placeholder="选择课程"
                  allowClear
                  style={{ width: 150 }}
                  onChange={setSelectedCourse}
                >
                  {courses.map(course => (
                    <Option key={course.id} value={course.name}>
                      {course.name}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col>
              <Space>
                <Upload
                  accept=".xlsx,.xls"
                  showUploadList={false}
                  onChange={handleBatchImport}
                  action="/api/teacher/students/import"
                  headers={{
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }}
                >
                  <Button icon={<UploadOutlined />}>
                    批量导入
                  </Button>
                </Upload>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                >
                  导出
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddStudent}
                >
                  添加学生
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={students}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            }
          }}
        />
      </Card>

      {/* 添加/编辑学生模态框 */}
      <Modal
        title={selectedStudent ? '编辑学生' : '添加学生'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
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
                name="studentId"
                label="学号"
                rules={[
                  { required: true, message: '请输入学号' },
                  { pattern: /^\d{7}$/, message: '学号必须是7位数字' }
                ]}
              >
                <Input placeholder="请输入学号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          
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
          
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          
          <Form.Item
            name="courses"
            label="选课"
            rules={[{ required: true, message: '请选择至少一门课程' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择课程"
              style={{ width: '100%' }}
            >
              {courses.map(course => (
                <Option key={course.id} value={course.name}>
                  {course.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {selectedStudent ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 学生详情抽屉 */}
      <Drawer
        title="学生详情"
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedStudent && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} icon={<UserOutlined />} />
              <div style={{ marginTop: 16 }}>
                <h3>{selectedStudent.name}</h3>
                <p style={{ color: '#666' }}>{selectedStudent.studentId}</p>
              </div>
            </div>
            
            <Descriptions column={1} bordered>
              <Descriptions.Item label="邮箱">
                {selectedStudent.email}
              </Descriptions.Item>
              <Descriptions.Item label="手机号">
                {selectedStudent.phone}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {selectedStudent.lastLogin}
              </Descriptions.Item>
              <Descriptions.Item label="选课">
                {selectedStudent.courses.map(course => (
                  <Tag key={course} color="blue">{course}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider>学习统计</Divider>
            
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="总提交数"
                  value={selectedStudent.totalSubmissions}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="完成作业"
                  value={selectedStudent.completedAssignments}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="平均分"
                  value={selectedStudent.averageScore}
                  precision={1}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
            
            <div style={{ marginTop: 16 }}>
              <p>完成率</p>
              <Progress
                percent={Math.round((selectedStudent.completedAssignments / selectedStudent.totalSubmissions) * 100)}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default StudentManagement;