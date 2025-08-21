import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Progress,
  Statistic,
  Table,
  Tag,
  Timeline,
  Select,
  DatePicker,
  Space,
  Button,
  Tooltip
} from 'antd';
import {
  TrophyOutlined,
  BookOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  CalendarOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';
import dayjs from 'dayjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  ArcElement
);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const StudentProgress = () => {
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [dateRange, setDateRange] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [courses, setCourses] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    fetchProgressData();
    fetchCourses();
    fetchRecentActivities();
    fetchAchievements();
  }, [selectedCourse, dateRange]);

  const fetchProgressData = async () => {
    // 模拟数据
    const mockData = {
      overall: {
        totalCourses: 3,
        completedAssignments: 16,
        totalAssignments: 24,
        solvedProblems: 55,
        totalProblems: 72,
        averageScore: 85.5,
        studyHours: 128
      },
      courseProgress: [
        { course: 'Java程序设计', progress: 75, score: 88 },
        { course: '数据结构', progress: 60, score: 82 },
        { course: 'Web前端', progress: 90, score: 92 }
      ],
      weeklyProgress: {
        labels: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'],
        datasets: [
          {
            label: '完成题目数',
            data: [8, 12, 15, 10, 18, 14],
            borderColor: '#1890ff',
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            tension: 0.4
          },
          {
            label: '学习时长(小时)',
            data: [12, 18, 22, 15, 25, 20],
            borderColor: '#52c41a',
            backgroundColor: 'rgba(82, 196, 26, 0.1)',
            tension: 0.4
          }
        ]
      },
      scoreDistribution: {
        labels: ['0-60', '60-70', '70-80', '80-90', '90-100'],
        datasets: [
          {
            data: [2, 5, 12, 18, 18],
            backgroundColor: [
              '#ff4d4f',
              '#fa8c16',
              '#fadb14',
              '#52c41a',
              '#1890ff'
            ]
          }
        ]
      },
      problemTypes: {
        labels: ['选择题', '填空题', '简答题', '编程题'],
        datasets: [
          {
            data: [15, 12, 8, 20],
            backgroundColor: ['#1890ff', '#52c41a', '#fadb14', '#722ed1']
          }
        ]
      }
    };
    setProgressData(mockData);
  };

  const fetchCourses = async () => {
    const mockCourses = [
      { id: 1, name: 'Java程序设计基础' },
      { id: 2, name: '数据结构与算法' },
      { id: 3, name: 'Web前端开发' }
    ];
    setCourses(mockCourses);
  };

  const fetchRecentActivities = async () => {
    const mockActivities = [
      {
        id: 1,
        type: 'assignment_completed',
        title: '完成作业：Java基础语法练习',
        time: '2025-01-19 14:30',
        score: 95
      },
      {
        id: 2,
        type: 'problem_solved',
        title: '解决编程题：二分查找算法',
        time: '2025-01-19 10:15',
        score: 88
      },
      {
        id: 3,
        type: 'course_progress',
        title: 'Web前端开发课程进度达到90%',
        time: '2025-01-18 16:45'
      },
      {
        id: 4,
        type: 'achievement',
        title: '获得成就：编程新手',
        time: '2025-01-18 09:20'
      }
    ];
    setRecentActivities(mockActivities);
  };

  const fetchAchievements = async () => {
    const mockAchievements = [
      {
        id: 1,
        name: '编程新手',
        description: '完成第一道编程题',
        icon: '🎯',
        earned: true,
        earnedDate: '2025-01-15'
      },
      {
        id: 2,
        name: '勤奋学习者',
        description: '连续7天完成学习任务',
        icon: '📚',
        earned: true,
        earnedDate: '2025-01-18'
      },
      {
        id: 3,
        name: '算法大师',
        description: '完成10道算法题',
        icon: '🧠',
        earned: false
      },
      {
        id: 4,
        name: '满分达人',
        description: '获得5次满分成绩',
        icon: '⭐',
        earned: false
      }
    ];
    setAchievements(mockAchievements);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'assignment_completed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'problem_solved': return <BookOutlined style={{ color: '#1890ff' }} />;
      case 'course_progress': return <BarChartOutlined style={{ color: '#722ed1' }} />;
      case 'achievement': return <TrophyOutlined style={{ color: '#fadb14' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  const courseProgressColumns = [
    {
      title: '课程名称',
      dataIndex: 'course',
      key: 'course'
    },
    {
      title: '完成进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <Progress percent={progress} size="small" />
      )
    },
    {
      title: '平均分数',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Text strong style={{ color: score >= 90 ? '#52c41a' : score >= 80 ? '#1890ff' : '#fadb14' }}>
          {score}
        </Text>
      )
    }
  ];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>学习进度</Title>
        <Text type="secondary">查看您的学习统计和进度分析</Text>
      </div>

      {/* 筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Space>
              <Text>课程筛选：</Text>
              <Select
                value={selectedCourse}
                onChange={setSelectedCourse}
                style={{ width: 200 }}
              >
                <Option value="all">全部课程</Option>
                {courses.map(course => (
                  <Option key={course.id} value={course.id}>
                    {course.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={8}>
            <Space>
              <Text>时间范围：</Text>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: 240 }}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 总体统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总课程数"
              value={progressData.overall?.totalCourses}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成作业"
              value={progressData.overall?.completedAssignments}
              suffix={`/ ${progressData.overall?.totalAssignments}`}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="解决题目"
              value={progressData.overall?.solvedProblems}
              suffix={`/ ${progressData.overall?.totalProblems}`}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均分数"
              value={progressData.overall?.averageScore}
              precision={1}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* 学习进度趋势 */}
        <Col span={16}>
          <Card title="学习进度趋势" extra={<CalendarOutlined />}>
            {progressData.weeklyProgress && (
              <Line data={progressData.weeklyProgress} options={chartOptions} />
            )}
          </Card>
        </Col>

        {/* 课程进度 */}
        <Col span={8}>
          <Card title="课程进度" style={{ height: '100%' }}>
            <Table
              columns={courseProgressColumns}
              dataSource={progressData.courseProgress}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* 分数分布 */}
        <Col span={12}>
          <Card title="分数分布">
            {progressData.scoreDistribution && (
              <Bar data={progressData.scoreDistribution} options={chartOptions} />
            )}
          </Card>
        </Col>

        {/* 题目类型分布 */}
        <Col span={12}>
          <Card title="题目类型分布">
            {progressData.problemTypes && (
              <Doughnut data={progressData.problemTypes} options={doughnutOptions} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 最近活动 */}
        <Col span={12}>
          <Card title="最近活动" extra={<Button type="link">查看全部</Button>}>
            <Timeline>
              {recentActivities.map(activity => (
                <Timeline.Item key={activity.id} dot={getActivityIcon(activity.type)}>
                  <div>
                    <Text strong>{activity.title}</Text>
                    {activity.score && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {activity.score}分
                      </Tag>
                    )}
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {activity.time}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* 成就系统 */}
        <Col span={12}>
          <Card title="成就系统" extra={<TrophyOutlined />}>
            <Row gutter={[16, 16]}>
              {achievements.map(achievement => (
                <Col span={12} key={achievement.id}>
                  <Card
                    size="small"
                    style={{
                      opacity: achievement.earned ? 1 : 0.5,
                      border: achievement.earned ? '2px solid #52c41a' : '1px solid #d9d9d9'
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>
                        {achievement.icon}
                      </div>
                      <Text strong>{achievement.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {achievement.description}
                      </Text>
                      {achievement.earned && (
                        <div style={{ marginTop: 4 }}>
                          <Tag color="green" size="small">
                            {dayjs(achievement.earnedDate).format('MM-DD')}
                          </Tag>
                        </div>
                      )}
                    </div>
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

export default StudentProgress;