import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Progress,
  Button,
  Empty,
  Spin,
  message,
  Avatar,
  Statistic
} from 'antd';
import {
  BookOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import api from '../../utils/api';

const { Title, Text } = Typography;
const { Meta } = Card;

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/student/courses');
      setCourses(response.data);
      // 模拟数据，实际应该调用API
      const mockCourses = [
        {
          id: 1,
          name: 'Java程序设计基础',
          description: '学习Java编程语言的基础知识，包括面向对象编程、数据结构等',
          teacher_name: '张教授',
          total_assignments: 8,
          completed_assignments: 5,
          total_problems: 24,
          solved_problems: 18,
          status: 'active',
          progress: 75
        },
        {
          id: 2,
          name: '数据结构与算法',
          description: '深入学习各种数据结构和算法设计与分析',
          teacher_name: '李老师',
          total_assignments: 6,
          completed_assignments: 3,
          total_problems: 18,
          solved_problems: 12,
          status: 'active',
          progress: 50
        },
        {
          id: 3,
          name: 'Web前端开发',
          description: '学习HTML、CSS、JavaScript等前端技术',
          teacher_name: '王老师',
          total_assignments: 10,
          completed_assignments: 8,
          total_problems: 30,
          solved_problems: 25,
          status: 'active',
          progress: 83
        }
      ];
      setCourses(mockCourses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'pending': return '未开始';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>我的课程</Title>
        <Text type="secondary">查看您已注册的所有课程和学习进度</Text>
      </div>

      {courses.length === 0 ? (
        <Empty
          description="暂无课程"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Row gutter={[24, 24]}>
          {courses.map(course => (
            <Col xs={24} sm={12} lg={8} key={course.id}>
              <Card
                hoverable
                actions={[
                  <Button type="primary" key="enter">
                    进入课程
                  </Button>,
                  <Button key="assignments">
                    查看作业
                  </Button>
                ]}
                style={{ height: '100%' }}
              >
                <Meta
                  avatar={<Avatar icon={<BookOutlined />} size={64} />}
                  title={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        {course.name}
                        <Tag 
                          color={getStatusColor(course.status)} 
                          style={{ marginLeft: 8 }}
                        >
                          {getStatusText(course.status)}
                        </Tag>
                      </div>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        {course.description}
                      </Text>
                      
                      <div style={{ marginBottom: 12 }}>
                        <UserOutlined style={{ marginRight: 4 }} />
                        <Text>授课教师：{course.teacher_name}</Text>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <Text strong>学习进度</Text>
                        <Progress 
                          percent={course.progress} 
                          size="small" 
                          style={{ marginTop: 4 }}
                        />
                      </div>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="作业完成"
                            value={course.completed_assignments}
                            suffix={`/ ${course.total_assignments}`}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="题目完成"
                            value={course.solved_problems}
                            suffix={`/ ${course.total_problems}`}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                      </Row>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default StudentCourses;