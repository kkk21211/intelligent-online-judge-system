import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  List,
  Avatar,
  Space,
  Button,
  Typography,
  Alert
} from 'antd';
import {
  TeamOutlined,
  BookOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  RiseOutlined
} from '@ant-design/icons';
import api from '../../utils/api';

const { Title, Text } = Typography;

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [courseProgress, setCourseProgress] = useState([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      // 这里应该调用实际的API
      // const [statsRes, assignmentsRes, studentsRes, progressRes] = await Promise.all([
      //   api.get('/api/teacher/stats'),
      //   api.get('/api/teacher/recent-assignments'),
      //   api.get('/api/teacher/top-students'),
      //   api.get('/api/teacher/course-progress')
      // ]);
      
      // 模拟数据
      setTimeout(() => {
        setStats({
          totalStudents: 156,
          totalCourses: 3,
          totalAssignments: 12,
          pendingSubmissions: 23,
          completedAssignments: 89,
          averageScore: 78.5
        });
        
        setRecentAssignments([
          {
            id: 1,
            title: 'Python基础练习',
            course: '程序设计基础',
            dueDate: '2024-01-20',
            submissions: 45,
            totalStudents: 52,
            status: 'active'
          },
          {
            id: 2,
            title: 'C++指针与内存管理',
            course: '高级程序设计',
            dueDate: '2024-01-18',
            submissions: 38,
            totalStudents: 42,
            status: 'active'
          },
          {
            id: 3,
            title: '数据结构实验',
            course: '数据结构',
            dueDate: '2024-01-15',
            submissions: 62,
            totalStudents: 62,
            status: 'completed'
          }
        ]);
        
        setTopStudents([
          {
            id: 1,
            name: '张三',
            studentId: '2021001',
            course: '程序设计基础',
            score: 95,
            submissions: 12
          },
          {
            id: 2,
            name: '李四',
            studentId: '2021002',
            course: '高级程序设计',
            score: 92,
            submissions: 10
          },
          {
            id: 3,
            name: '王五',
            studentId: '2021003',
            course: '数据结构',
            score: 89,
            submissions: 15
          }
        ]);
        
        setCourseProgress([
          {
            course: '程序设计基础',
            totalStudents: 52,
            activeStudents: 48,
            averageProgress: 75,
            assignments: 4
          },
          {
            course: '高级程序设计',
            totalStudents: 42,
            activeStudents: 39,
            averageProgress: 68,
            assignments: 3
          },
          {
            course: '数据结构',
            totalStudents: 62,
            activeStudents: 58,
            averageProgress: 82,
            assignments: 5
          }
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
      setLoading(false);
    }
  };

  const assignmentColumns = [
    {
      title: '作业名称',
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
      title: '截止时间',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => {
        const isOverdue = new Date(date) < new Date();
        return (
          <Text type={isOverdue ? 'danger' : 'default'}>
            {date}
          </Text>
        );
      }
    },
    {
      title: '提交情况',
      key: 'submissions',
      render: (_, record) => (
        <div>
          <Progress
            percent={Math.round((record.submissions / record.totalStudents) * 100)}
            size="small"
            status={record.submissions === record.totalStudents ? 'success' : 'active'}
          />
          <Text style={{ fontSize: '12px' }}>
            {record.submissions}/{record.totalStudents}
          </Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          active: { color: 'processing', text: '进行中' },
          completed: { color: 'success', text: '已完成' },
          overdue: { color: 'error', text: '已逾期' }
        };
        const config = statusConfig[status] || statusConfig.active;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    }
  ];

  return (
    <div>
      <Title level={3}>教师工作台</Title>
      
      <Alert
        message="欢迎回来！"
        description="今天有 3 个作业即将截止，23 份作业待批改。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="学生总数"
              value={stats.totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="课程数量"
              value={stats.totalCourses}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="作业总数"
              value={stats.totalAssignments}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待批改"
              value={stats.pendingSubmissions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近作业 */}
        <Col xs={24} lg={14}>
          <Card
            title="最近作业"
            extra={
              <Button type="link" size="small">
                查看全部
              </Button>
            }
          >
            <Table
              columns={assignmentColumns}
              dataSource={recentAssignments}
              pagination={false}
              size="small"
              loading={loading}
              rowKey="id"
            />
          </Card>
        </Col>
        
        {/* 优秀学生 */}
        <Col xs={24} lg={10}>
          <Card
            title="优秀学生"
            extra={
              <Button type="link" size="small">
                查看更多
              </Button>
            }
          >
            <List
              loading={loading}
              dataSource={topStudents}
              renderItem={(student, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: index === 0 ? '#faad14' : index === 1 ? '#52c41a' : '#1890ff'
                        }}
                        icon={index < 3 ? <TrophyOutlined /> : null}
                      >
                        {index >= 3 ? index + 1 : null}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <span>{student.name}</span>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {student.studentId}
                        </Text>
                      </Space>
                    }
                    description={
                      <div>
                        <div>{student.course}</div>
                        <Space>
                          <Text strong>平均分: {student.score}</Text>
                          <Text type="secondary">提交: {student.submissions}次</Text>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 课程进度 */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="课程进度概览">
            <Row gutter={[16, 16]}>
              {courseProgress.map((course, index) => (
                <Col xs={24} md={8} key={index}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Title level={5}>{course.course}</Title>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Statistic
                        title="学生数量"
                        value={course.totalStudents}
                        suffix={`/ ${course.activeStudents} 活跃`}
                      />
                      <div>
                        <Text>平均进度</Text>
                        <Progress
                          percent={course.averageProgress}
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                      </div>
                      <Text type="secondary">
                        {course.assignments} 个作业
                      </Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Overview;