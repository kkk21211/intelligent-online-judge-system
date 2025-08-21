import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  Progress,
  message,
  Modal,
  Descriptions,
  List,
  Statistic,
  Row,
  Col,
  Select,
  DatePicker,
  Input
} from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  EditOutlined,
  SearchOutlined
} from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // 模拟数据，实际应该调用API
      const mockAssignments = [
        {
          id: 1,
          title: 'Java基础语法练习',
          course_name: 'Java程序设计基础',
          description: '完成Java基础语法相关的编程题目',
          total_problems: 5,
          completed_problems: 3,
          total_score: 100,
          current_score: 75,
          status: 'in_progress',
          due_date: '2025-01-25',
          created_at: '2025-01-15',
          progress: 60
        },
        {
          id: 2,
          title: '数据结构实现',
          course_name: '数据结构与算法',
          description: '实现栈、队列、链表等基本数据结构',
          total_problems: 4,
          completed_problems: 4,
          total_score: 100,
          current_score: 95,
          status: 'completed',
          due_date: '2025-01-20',
          created_at: '2025-01-10',
          progress: 100
        },
        {
          id: 3,
          title: 'HTML/CSS布局练习',
          course_name: 'Web前端开发',
          description: '使用HTML和CSS完成响应式网页布局',
          total_problems: 3,
          completed_problems: 0,
          total_score: 100,
          current_score: 0,
          status: 'pending',
          due_date: '2025-01-30',
          created_at: '2025-01-18',
          progress: 0
        },
        {
          id: 4,
          title: '算法设计与分析',
          course_name: '数据结构与算法',
          description: '设计并分析排序和搜索算法的时间复杂度',
          total_problems: 6,
          completed_problems: 2,
          total_score: 100,
          current_score: 40,
          status: 'overdue',
          due_date: '2025-01-18',
          created_at: '2025-01-08',
          progress: 33
        }
      ];
      setAssignments(mockAssignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      message.error('获取作业列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'pending': return 'orange';
      case 'overdue': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'pending': return '未开始';
      case 'overdue': return '已逾期';
      default: return '未知';
    }
  };

  const handleViewDetail = (assignment) => {
    setSelectedAssignment(assignment);
    setDetailVisible(true);
  };

  const handleStartAssignment = (assignmentId) => {
    message.info('跳转到作业详情页面');
    // 实际应该跳转到作业详情页面
  };

  const columns = [
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.course_name}
          </Text>
        </div>
      )
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => (
        <div style={{ width: 120 }}>
          <Progress 
            percent={record.progress} 
            size="small"
            status={record.status === 'overdue' ? 'exception' : 'normal'}
          />
          <Text style={{ fontSize: 12 }}>
            {record.completed_problems}/{record.total_problems} 题
          </Text>
        </div>
      )
    },
    {
      title: '得分',
      key: 'score',
      render: (_, record) => (
        <div>
          <Text strong>{record.current_score}</Text>
          <Text type="secondary">/{record.total_score}</Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '截止时间',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => (
        <div>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {dayjs(date).format('YYYY-MM-DD')}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {record.status !== 'completed' && (
            <Button 
              type="primary" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleStartAssignment(record.id)}
            >
              {record.status === 'pending' ? '开始' : '继续'}
            </Button>
          )}
        </Space>
      )
    }
  ];

  const filteredAssignments = assignments.filter(assignment => {
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesSearch = assignment.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         assignment.course_name.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>作业列表</Title>
        <Text type="secondary">查看和完成您的课程作业</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总作业数"
              value={assignments.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={assignments.filter(a => a.status === 'completed').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={assignments.filter(a => a.status === 'in_progress').length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已逾期"
              value={assignments.filter(a => a.status === 'overdue').length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索作业标题或课程名称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
              placeholder="筛选状态"
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">未开始</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="overdue">已逾期</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 作业列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredAssignments}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 作业详情模态框 */}
      <Modal
        title="作业详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          selectedAssignment?.status !== 'completed' && (
            <Button 
              key="start" 
              type="primary"
              onClick={() => {
                handleStartAssignment(selectedAssignment.id);
                setDetailVisible(false);
              }}
            >
              {selectedAssignment?.status === 'pending' ? '开始作业' : '继续作业'}
            </Button>
          )
        ]}
        width={800}
      >
        {selectedAssignment && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="作业标题" span={2}>
                {selectedAssignment.title}
              </Descriptions.Item>
              <Descriptions.Item label="所属课程">
                {selectedAssignment.course_name}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedAssignment.status)}>
                  {getStatusText(selectedAssignment.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedAssignment.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {dayjs(selectedAssignment.due_date).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="题目数量">
                {selectedAssignment.total_problems} 题
              </Descriptions.Item>
              <Descriptions.Item label="完成进度">
                <Progress percent={selectedAssignment.progress} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="作业描述" span={2}>
                {selectedAssignment.description}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentAssignments;