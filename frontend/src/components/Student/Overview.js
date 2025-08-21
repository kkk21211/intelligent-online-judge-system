import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Avatar,
  Tag,
  Typography,
  Space,
  Button,
  Calendar,
  Badge,
  Divider,
  Timeline,
  Alert,
  Empty
} from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  StarOutlined,
  CalendarOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const { Title: AntTitle, Text, Paragraph } = Typography;

const StudentOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [studyProgress, setStudyProgress] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState({});

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      // 模拟API调用
      setTimeout(() => {
        setStats({
          totalCourses: 6,
          completedAssignments: 28,
          pendingAssignments: 5,
          averageScore: 87.5,
          studyStreak: 12,
          totalStudyTime: 156
        });

        setRecentAssignments([
          {
            id: 1,
            title: '数据结构 - 链表实现',
            course: '数据结构与算法',
            dueDate: '2024-01-20',
            status: 'completed',
            score: 95,
            submittedAt: '2024-01-18'
          },
          {
            id: 2,
            title: 'Python基础 - 函数练习',
            course: 'Python程序设计',
            dueDate: '2024-01-22',
            status: 'pending',
            score: null,
            submittedAt: null
          },
          {
            id: 3,
            title: '数据库设计 - ER图绘制',
            course: '数据库原理',
            dueDate: '2024-01-25',
            status: 'in_progress',
            score: null,
            submittedAt: null
          }
        ]);

        setUpcomingDeadlines([
          {
            id: 1,
            title: 'Python基础 - 函数练习',
            course: 'Python程序设计',
            dueDate: '2024-01-22',
            daysLeft: 2,
            priority: 'high'
          },
          {
            id: 2,
            title: '数据库设计 - ER图绘制',
            course: '数据库原理',
            dueDate: '2024-01-25',
            daysLeft: 5,
            priority: 'medium'
          },
          {
            id: 3,
            title: '算法分析 - 时间复杂度',
            course: '算法设计与分析',
            dueDate: '2024-01-28',
            daysLeft: 8,
            priority: 'low'
          }
        ]);

        setAchievements([
          {
            id: 1,
            title: '连续学习达人',
            description: '连续学习12天',
            icon: <FireOutlined />,
            color: '#ff4d4f',
            earnedAt: '2024-01-15'
          },
          {
            id: 2,
            title: '编程新星',
            description: '完成10个编程题目',
            icon: <StarOutlined />,
            color: '#faad14',
            earnedAt: '2024-01-10'
          },
          {
            id: 3,
            title: '优秀学员',
            description: '平均分达到85分以上',
            icon: <TrophyOutlined />,
            color: '#52c41a',
            earnedAt: '2024-01-08'
          }
        ]);

        setStudyProgress([
          { course: 'Python程序设计', progress: 85, total: 20, completed: 17 },
          { course: '数据结构与算法', progress: 72, total: 25, completed: 18 },
          { course: '数据库原理', progress: 60, total: 15, completed: 9 },
          { course: '算法设计与分析', progress: 45, total: 22, completed: 10 },
          { course: 'Web开发技术', progress: 90, total: 18, completed: 16 },
          { course: '软件工程', progress: 55, total: 20, completed: 11 }
        ]);

        setWeeklyActivity({
          labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
          datasets: [
            {
              label: '学习时长(小时)',
              data: [3.5, 2.8, 4.2, 3.1, 2.5, 1.8, 2.2],
              borderColor: '#1890ff',
              backgroundColor: 'rgba(24, 144, 255, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        });

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取概览数据失败:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'in_progress': return 'processing';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'pending': return '待提交';
      case 'in_progress': return '进行中';
      case 'overdue': return '已逾期';
      default: return '未知';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 欢迎信息 */}
      <div style={{ marginBottom: 24 }}>
        <AntTitle level={2} style={{ margin: 0, marginBottom: 8 }}>
          欢迎回来！
        </AntTitle>
        <Text type="secondary">
          今天是学习的第 {stats.studyStreak} 天，继续保持！
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="选修课程"
              value={stats.totalCourses}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成作业"
              value={stats.completedAssignments}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待完成作业"
              value={stats.pendingAssignments}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均分"
              value={stats.averageScore}
              precision={1}
              suffix="分"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 左侧列 */}
        <Col xs={24} lg={16}>
          {/* 最近作业 */}
          <Card 
            title="最近作业" 
            style={{ marginBottom: 16 }}
            extra={
              <Button 
                type="link" 
                onClick={() => navigate('/student/assignments')}
                icon={<RightOutlined />}
              >
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentAssignments}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Tag color={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Tag>,
                    item.score && <Text strong>{item.score}分</Text>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<FileTextOutlined />} 
                        style={{ 
                          backgroundColor: item.status === 'completed' ? '#52c41a' : '#1890ff' 
                        }}
                      />
                    }
                    title={item.title}
                    description={
                      <Space direction="vertical" size={4}>
                        <Text type="secondary">{item.course}</Text>
                        <Space>
                          <ClockCircleOutlined />
                          <Text type="secondary">截止: {item.dueDate}</Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* 学习进度 */}
          <Card title="课程学习进度">
            <List
              dataSource={studyProgress}
              renderItem={item => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: 8 
                    }}>
                      <Text strong>{item.course}</Text>
                      <Text type="secondary">
                        {item.completed}/{item.total}
                      </Text>
                    </div>
                    <Progress 
                      percent={item.progress} 
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068'
                      }}
                      size="small"
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 右侧列 */}
        <Col xs={24} lg={8}>
          {/* 即将到期 */}
          <Card 
            title="即将到期" 
            style={{ marginBottom: 16 }}
            size="small"
          >
            {upcomingDeadlines.length > 0 ? (
              <Timeline size="small">
                {upcomingDeadlines.map(item => (
                  <Timeline.Item
                    key={item.id}
                    color={getPriorityColor(item.priority)}
                    dot={
                      <Badge 
                        count={item.daysLeft} 
                        style={{ 
                          backgroundColor: getPriorityColor(item.priority) === 'red' ? '#ff4d4f' : 
                                         getPriorityColor(item.priority) === 'orange' ? '#faad14' : '#52c41a'
                        }}
                      />
                    }
                  >
                    <div>
                      <Text strong style={{ fontSize: 12 }}>
                        {item.title}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {item.course}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {item.dueDate}
                      </Text>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="暂无即将到期的作业"
                style={{ margin: '20px 0' }}
              />
            )}
          </Card>

          {/* 成就徽章 */}
          <Card title="最近成就" style={{ marginBottom: 16 }} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {achievements.map(achievement => (
                <Card.Grid 
                  key={achievement.id}
                  style={{ 
                    width: '100%', 
                    padding: 12,
                    textAlign: 'center'
                  }}
                  hoverable
                >
                  <div style={{ color: achievement.color, fontSize: 24, marginBottom: 8 }}>
                    {achievement.icon}
                  </div>
                  <Text strong style={{ display: 'block', fontSize: 12 }}>
                    {achievement.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {achievement.description}
                  </Text>
                </Card.Grid>
              ))}
            </Space>
          </Card>

          {/* 本周学习时长 */}
          <Card title="本周学习时长" size="small">
            <div style={{ height: 200 }}>
              {weeklyActivity.labels && (
                <Line data={weeklyActivity} options={chartOptions} />
              )}
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Statistic
                title="本周总计"
                value={stats.totalStudyTime}
                suffix="小时"
                valueStyle={{ fontSize: 16 }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentOverview;