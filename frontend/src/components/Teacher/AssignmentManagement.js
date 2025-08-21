import React, { useState, useEffect } from 'react';
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
  Tag,
  Drawer,
  Descriptions,
  Typography,
  Row,
  Col,
  DatePicker,
  InputNumber,
  Transfer,
  Progress,
  Statistic,
  List,
  Avatar,
  Divider,
  Alert,
  Steps
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  SendOutlined,
  CopyOutlined,
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RobotOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { Option } = Select;
const { Search, TextArea } = Input;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Step } = Steps;

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchAssignments();
  }, [pagination.current, pagination.pageSize, searchText, selectedCourse, selectedStatus]);

  useEffect(() => {
    fetchQuestions();
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/assignments', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          course_id: courses.find(c => c.name === selectedCourse)?.id,
          status: selectedStatus
        }
      });
      
      setAssignments(response.data.assignments || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.total || 0
      });
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      // 如果API调用失败，使用模拟数据
      const mockData = {
        assignments: [
          {
            id: 1,
            title: 'Python基础练习作业',
            course: '程序设计基础',
            description: '完成Python基础语法相关练习题',
            startTime: '2024-01-10 09:00',
            endTime: '2024-01-20 23:59',
            totalQuestions: 5,
            totalStudents: 52,
            submissions: 45,
            completed: 38,
            status: 'active',
            createdAt: '2024-01-08',
            averageScore: 78.5
          },
          {
            id: 2,
            title: 'C++指针与内存管理',
            course: '高级程序设计',
            description: '掌握C++指针的使用和内存管理',
            startTime: '2024-01-15 09:00',
            endTime: '2024-01-25 23:59',
            totalQuestions: 3,
            totalStudents: 42,
            submissions: 28,
            completed: 20,
            status: 'active',
            createdAt: '2024-01-12',
            averageScore: 72.3
          },
          {
            id: 3,
            title: '数据结构期末作业',
            course: '数据结构',
            description: '综合运用栈、队列、树等数据结构',
            startTime: '2024-01-01 09:00',
            endTime: '2024-01-15 23:59',
            totalQuestions: 8,
            totalStudents: 62,
            submissions: 62,
            completed: 58,
            status: 'completed',
            createdAt: '2023-12-25',
            averageScore: 85.7
          }
        ],
        total: 25
      };
      
      setAssignments(mockData.assignments);
      setPagination(prev => ({ ...prev, total: mockData.total }));
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/api/problems');
      const problems = response.data.problems || [];
      // 转换数据格式以适配Transfer组件
      const formattedQuestions = problems.map(problem => ({
        key: problem.id.toString(),
        title: problem.title,
        type: problem.type,
        difficulty: problem.difficulty,
        id: problem.id,
        course_name: problem.course_name
      }));
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      // 如果API调用失败，使用模拟数据
      setQuestions([
        { key: '1', title: 'Python基础语法练习', type: 'programming', difficulty: 'easy' },
        { key: '2', title: '数据结构选择题', type: 'choice', difficulty: 'medium' },
        { key: '3', title: 'C++指针填空题', type: 'fill', difficulty: 'hard' },
        { key: '4', title: 'Java面向对象编程', type: 'programming', difficulty: 'medium' },
        { key: '5', title: '算法复杂度分析', type: 'essay', difficulty: 'hard' }
      ]);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/teacher/students');
      const students = response.data.students || [];
      // 转换数据格式以适配Transfer组件
      const formattedStudents = students.map(student => ({
        key: student.id.toString(),
        title: `${student.real_name} (${student.username})`,
        course: student.class_name || '未分班',
        id: student.id,
        username: student.username,
        real_name: student.real_name
      }));
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      // 如果API调用失败，使用模拟数据
      setStudents([
        { key: '1', title: '张三 (2021001)', course: '程序设计基础' },
        { key: '2', title: '李四 (2021002)', course: '高级程序设计' },
        { key: '3', title: '王五 (2021003)', course: '数据结构' },
        { key: '4', title: '赵六 (2021004)', course: '程序设计基础' },
        { key: '5', title: '钱七 (2021005)', course: '高级程序设计' }
      ]);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/teacher/courses');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      // 如果API调用失败，使用模拟数据
      setCourses([
        { id: 1, name: '程序设计基础', code: 'CS101' },
        { id: 2, name: '高级程序设计', code: 'CS201' },
        { id: 3, name: '数据结构', code: 'CS301' }
      ]);
    }
  };

  const handleAddAssignment = () => {
    setSelectedAssignment(null);
    form.resetFields();
    setCurrentStep(0);
    setSelectedQuestions([]);
    setSelectedStudents([]);
    setModalVisible(true);
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    form.setFieldsValue({
      ...assignment,
      timeRange: [dayjs(assignment.startTime), dayjs(assignment.endTime)]
    });
    setCurrentStep(0);
    setModalVisible(true);
  };

  const handleViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setDrawerVisible(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await api.delete(`/api/assignments/${assignmentId}`);
      message.success('删除作业成功');
      fetchAssignments();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      message.error(error.response?.data?.error || '删除作业失败');
    }
  };

  const handlePublishAssignment = async (assignmentId) => {
    try {
      await api.put(`/api/assignments/${assignmentId}`, { status: 'active' });
      message.success('发布作业成功');
      fetchAssignments();
    } catch (error) {
      console.error('Failed to publish assignment:', error);
      message.error(error.response?.data?.error || '发布作业失败');
    }
  };

  const handleCopyAssignment = (assignment) => {
    const newAssignment = { ...assignment };
    delete newAssignment.id;
    newAssignment.title = `${assignment.title} (副本)`;
    form.setFieldsValue({
      ...newAssignment,
      timeRange: [dayjs(), dayjs().add(7, 'day')]
    });
    setSelectedAssignment(null);
    setCurrentStep(0);
    setModalVisible(true);
  };

  const handleNextStep = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const assignmentData = {
        title: values.title,
        description: values.description,
        start_time: values.timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
        end_time: values.timeRange[1].format('YYYY-MM-DD HH:mm:ss'),
        instructions: values.instructions || '',
        course_id: courses.find(c => c.name === values.course)?.id,
        problems: selectedQuestions.map((questionId, index) => ({
          problem_id: parseInt(questionId),
          score: 100, // 默认分数
          order_index: index + 1
        })),
        students: selectedStudents.map(studentId => parseInt(studentId))
      };
      
      if (selectedAssignment) {
        await api.put(`/api/assignments/${selectedAssignment.id}`, assignmentData);
        message.success('更新作业成功');
      } else {
        await api.post('/api/assignments', assignmentData);
        message.success('创建作业成功');
      }
      
      setModalVisible(false);
      fetchAssignments();
    } catch (error) {
      console.error('Failed to save assignment:', error);
      message.error(error.response?.data?.error || '保存失败');
    }
  };

  const handleAISelect = async () => {
    try {
      const values = await form.validateFields(['course', 'difficulty', 'questionCount']);
      
      // 调用后端AI智能选题接口
      const response = await api.post('/api/ai/select-problems', {
        count: values.questionCount || 5,
        difficulty: values.difficulty || 'medium',
        topics: [], // 可以根据课程添加主题
        types: ['code', 'choice', 'fill_blank'], // 支持的题目类型
        description: `为${values.course}课程智能选择题目`,
        course_id: courses.find(c => c.name === values.course)?.id
      });
      
      // 将AI推荐的题目设置为已选
      const aiSelectedQuestions = response.data.available_problems.slice(0, values.questionCount || 5).map(p => p.id.toString());
      setSelectedQuestions(aiSelectedQuestions);
      
      message.success(`AI智能选题完成，已为您推荐${aiSelectedQuestions.length}道题目`);
    } catch (error) {
      console.error('AI selection failed:', error);
      message.error('AI智能选题失败，请检查网络连接或稍后重试');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      draft: { color: 'default', text: '草稿' },
      active: { color: 'processing', text: '进行中' },
      completed: { color: 'success', text: '已完成' },
      expired: { color: 'error', text: '已过期' }
    };
    const config = statusMap[status] || statusMap.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.course}
          </Text>
        </div>
      )
    },
    {
      title: '时间安排',
      key: 'timeRange',
      render: (_, record) => (
        <div>
          <div>开始：{record.startTime}</div>
          <div>截止：{record.endTime}</div>
        </div>
      )
    },
    {
      title: '题目/学生',
      key: 'counts',
      render: (_, record) => (
        <div>
          <div>{record.totalQuestions} 道题目</div>
          <div>{record.totalStudents} 名学生</div>
        </div>
      )
    },
    {
      title: '完成情况',
      key: 'progress',
      render: (_, record) => (
        <div>
          <Progress
            percent={Math.round((record.completed / record.totalStudents) * 100)}
            size="small"
            status={record.completed === record.totalStudents ? 'success' : 'active'}
          />
          <Text style={{ fontSize: '12px' }}>
            {record.completed}/{record.totalStudents} 已完成
          </Text>
        </div>
      )
    },
    {
      title: '平均分',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (score) => (
        <span style={{ 
          color: score >= 85 ? '#52c41a' : score >= 70 ? '#1890ff' : score >= 60 ? '#faad14' : '#f5222d'
        }}>
          {score?.toFixed(1) || '-'}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '进行中', value: 'active' },
        { text: '已完成', value: 'completed' },
        { text: '已过期', value: 'expired' }
      ]
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewAssignment(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditAssignment(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyAssignment(record)}
          >
            复制
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handlePublishAssignment(record.id)}
            >
              发布
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<BarChartOutlined />}
          >
            统计
          </Button>
          <Popconfirm
            title="确定要删除这个作业吗？"
            onConfirm={() => handleDeleteAssignment(record.id)}
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

  const steps = [
    {
      title: '基本信息',
      content: (
        <div>
          <Form.Item
            name="title"
            label="作业标题"
            rules={[{ required: true, message: '请输入作业标题' }]}
          >
            <Input placeholder="请输入作业标题" />
          </Form.Item>
          
          <Form.Item
            name="course"
            label="所属课程"
            rules={[{ required: true, message: '请选择课程' }]}
          >
            <Select placeholder="选择课程">
              {courses.map(course => (
                <Option key={course.id} value={course.name}>
                  {course.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="作业描述"
            rules={[{ required: true, message: '请输入作业描述' }]}
          >
            <TextArea rows={4} placeholder="请输入作业描述" />
          </Form.Item>
          
          <Form.Item
            name="timeRange"
            label="时间安排"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>
        </div>
      )
    },
    {
      title: '选择题目',
      content: (
        <div>
          <Alert
            message="选择题目"
            description="您可以手动选择题目，或使用AI智能选题功能。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="难度要求"
              >
                <Select placeholder="选择难度" allowClear>
                  <Option value="easy">简单</Option>
                  <Option value="medium">中等</Option>
                  <Option value="hard">困难</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="questionCount"
                label="题目数量"
              >
                <InputNumber
                  min={1}
                  max={20}
                  style={{ width: '100%' }}
                  placeholder="题目数量"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label=" ">
                <Button
                  icon={<RobotOutlined />}
                  onClick={handleAISelect}
                  style={{ width: '100%' }}
                >
                  AI智能选题
                </Button>
              </Form.Item>
            </Col>
          </Row>
          
          <Transfer
            dataSource={questions}
            titles={['可选题目', '已选题目']}
            targetKeys={selectedQuestions}
            onChange={setSelectedQuestions}
            render={item => `${item.title} (${item.type})`}
            listStyle={{
              width: 300,
              height: 300,
            }}
          />
        </div>
      )
    },
    {
      title: '选择学生',
      content: (
        <div>
          <Alert
            message="选择学生"
            description="选择参与此次作业的学生。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Transfer
            dataSource={students}
            titles={['全部学生', '参与学生']}
            targetKeys={selectedStudents}
            onChange={setSelectedStudents}
            render={item => item.title}
            listStyle={{
              width: 300,
              height: 300,
            }}
          />
        </div>
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
                  placeholder="搜索作业标题"
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
                <Select
                  placeholder="状态"
                  allowClear
                  style={{ width: 120 }}
                  onChange={setSelectedStatus}
                >
                  <Option value="draft">草稿</Option>
                  <Option value="active">进行中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="expired">已过期</Option>
                </Select>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddAssignment}
              >
                创建作业
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={assignments}
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

      {/* 创建/编辑作业模态框 */}
      <Modal
        title={selectedAssignment ? '编辑作业' : '创建作业'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        
        <Form
          form={form}
          layout="vertical"
        >
          {steps[currentStep].content}
        </Form>
        
        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrevStep}>
                上一步
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={handleNextStep}>
                下一步
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" onClick={handleSubmit}>
                {selectedAssignment ? '更新作业' : '创建作业'}
              </Button>
            )}
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
          </Space>
        </div>
      </Modal>

      {/* 作业详情抽屉 */}
      <Drawer
        title="作业详情"
        placement="right"
        width={700}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedAssignment && (
          <div>
            <Title level={4}>{selectedAssignment.title}</Title>
            
            <Space style={{ marginBottom: 16 }}>
              {getStatusTag(selectedAssignment.status)}
              <Tag color="blue">{selectedAssignment.course}</Tag>
            </Space>
            
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="开始时间">
                {selectedAssignment.startTime}
              </Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {selectedAssignment.endTime}
              </Descriptions.Item>
              <Descriptions.Item label="题目数量">
                {selectedAssignment.totalQuestions}
              </Descriptions.Item>
              <Descriptions.Item label="参与学生">
                {selectedAssignment.totalStudents}
              </Descriptions.Item>
              <Descriptions.Item label="提交数量">
                {selectedAssignment.submissions}
              </Descriptions.Item>
              <Descriptions.Item label="完成数量">
                {selectedAssignment.completed}
              </Descriptions.Item>
              <Descriptions.Item label="平均分">
                {selectedAssignment.averageScore?.toFixed(1) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedAssignment.createdAt}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider>作业描述</Divider>
            
            <div style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 6,
              marginBottom: 16
            }}>
              <Text>{selectedAssignment.description}</Text>
            </div>
            
            <Divider>完成统计</Divider>
            
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="总提交数"
                  value={selectedAssignment.submissions}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="已完成"
                  value={selectedAssignment.completed}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="完成率"
                  value={Math.round((selectedAssignment.completed / selectedAssignment.totalStudents) * 100)}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
            
            <div style={{ marginTop: 16 }}>
              <Progress
                percent={Math.round((selectedAssignment.completed / selectedAssignment.totalStudents) * 100)}
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

export default AssignmentManagement;