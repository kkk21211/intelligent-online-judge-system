import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Table,
  Progress,
  Typography,
  Space,
  Button,
  Divider,
  Alert,
  Tag,
  List,
  Avatar,
  Tooltip,
  Empty
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  // ExclamationCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  UserOutlined
  // BookOutlined,
  // CalendarOutlined
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
// import dayjs from 'dayjs';
import api from '../../utils/api';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const Statistics = () => {
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [courses, setCourses] = useState([]);
  // const [assignments, setAssignments] = useState([]);
  const [overviewData, setOverviewData] = useState({});
  const [scoreDistribution, setScoreDistribution] = useState({});
  const [submissionTrend, setSubmissionTrend] = useState({});
  const [studentRanking, setStudentRanking] = useState([]);
  const [assignmentStats, setAssignmentStats] = useState([]);
  const [difficultyAnalysis, setDifficultyAnalysis] = useState({});

  useEffect(() => {
    fetchCourses();
    fetchOverviewData();
    fetchScoreDistribution();
    fetchSubmissionTrend();
    fetchStudentRanking();
    fetchAssignmentStats();
    fetchDifficultyAnalysis();
  }, [selectedCourse, selectedAssignment, dateRange]);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/teacher/courses');
      setCourses(response.data);
      
      // 模拟数据
      setCourses([
        { id: 1, name: '程序设计基础', code: 'CS101' },
        { id: 2, name: '高级程序设计', code: 'CS201' },
        { id: 3, name: '数据结构', code: 'CS301' }
      ]);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/teacher/statistics/overview', {
        params: { course: selectedCourse, dateRange }
      });
      
      // 模拟数据
      setOverviewData({
        totalStudents: 156,
        totalAssignments: 12,
        totalSubmissions: 1248,
        averageScore: 78.5,
        completionRate: 85.2,
        onTimeRate: 92.3,
        excellentRate: 23.1,
        failureRate: 8.7
      });
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScoreDistribution = async () => {
    try {
      const response = await api.get('/api/teacher/statistics/score-distribution');
      
      // 模拟数据
      setScoreDistribution({
        labels: ['0-59', '60-69', '70-79', '80-89', '90-100'],
        datasets: [{
          label: '学生人数',
          data: [12, 28, 45, 52, 19],
          backgroundColor: [
            '#ff4d4f',
            '#faad14',
            '#1890ff',
            '#52c41a',
            '#722ed1'
          ],
          borderColor: [
            '#ff4d4f',
            '#faad14',
            '#1890ff',
            '#52c41a',
            '#722ed1'
          ],
          borderWidth: 1
        }]
      });
    } catch (error) {
      console.error('Failed to fetch score distribution:', error);
    }
  };

  const fetchSubmissionTrend = async () => {
    try {
      const response = await api.get('/api/teacher/statistics/submission-trend');
      
      // 模拟数据
      setSubmissionTrend({
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        datasets: [
          {
            label: '提交数量',
            data: [65, 78, 90, 81, 95, 102],
            borderColor: '#1890ff',
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: '完成数量',
            data: [58, 72, 85, 75, 88, 95],
            borderColor: '#52c41a',
            backgroundColor: 'rgba(82, 196, 26, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch submission trend:', error);
    }
  };

  const fetchStudentRanking = async () => {
    try {
      const response = await api.get('/api/teacher/statistics/student-ranking');
      
      // 模拟数据
      setStudentRanking([
        {
          id: 1,
          name: '张三',
          studentId: '2021001',
          course: '程序设计基础',
          totalScore: 95.5,
          completedAssignments: 12,
          totalAssignments: 12,
          averageScore: 95.5,
          rank: 1,
          avatar: null
        },
        {
          id: 2,
          name: '李四',
          studentId: '2021002',
          course: '程序设计基础',
          totalScore: 92.3,
          completedAssignments: 11,
          totalAssignments: 12,
          averageScore: 92.3,
          rank: 2,
          avatar: null
        },
        {
          id: 3,
          name: '王五',
          studentId: '2021003',
          course: '程序设计基础',
          totalScore: 89.7,
          completedAssignments: 12,
          totalAssignments: 12,
          averageScore: 89.7,
          rank: 3,
          avatar: null
        },
        {
          id: 4,
          name: '赵六',
          studentId: '2021004',
          course: '程序设计基础',
          totalScore: 87.2,
          completedAssignments: 10,
          totalAssignments: 12,
          averageScore: 87.2,
          rank: 4,
          avatar: null
        },
        {
          id: 5,
          name: '钱七',
          studentId: '2021005',
          course: '程序设计基础',
          totalScore: 85.8,
          completedAssignments: 11,
          totalAssignments: 12,
          averageScore: 85.8,
          rank: 5,
          avatar: null
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch student ranking:', error);
    }
  };

  const fetchAssignmentStats = async () => {
    try {
      const response = await api.get('/api/teacher/statistics/assignments');
      
      // 模拟数据
      setAssignmentStats([
        {
          id: 1,
          title: 'Python基础练习作业',
          course: '程序设计基础',
          totalStudents: 52,
          submissions: 45,
          completed: 38,
          averageScore: 78.5,
          maxScore: 95,
          minScore: 45,
          completionRate: 73.1,
          onTimeRate: 84.4,
          difficulty: 'medium'
        },
        {
          id: 2,
          title: 'C++指针与内存管理',
          course: '高级程序设计',
          totalStudents: 42,
          submissions: 28,
          completed: 20,
          averageScore: 72.3,
          maxScore: 88,
          minScore: 32,
          completionRate: 47.6,
          onTimeRate: 71.4,
          difficulty: 'hard'
        },
        {
          id: 3,
          title: '数据结构期末作业',
          course: '数据结构',
          totalStudents: 62,
          submissions: 62,
          completed: 58,
          averageScore: 85.7,
          maxScore: 98,
          minScore: 58,
          completionRate: 93.5,
          onTimeRate: 95.2,
          difficulty: 'medium'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch assignment stats:', error);
    }
  };

  const fetchDifficultyAnalysis = async () => {
    try {
      const response = await api.get('/api/teacher/statistics/difficulty-analysis');
      
      // 模拟数据
      setDifficultyAnalysis({
        labels: ['简单', '中等', '困难'],
        datasets: [{
          data: [35, 45, 20],
          backgroundColor: [
            '#52c41a',
            '#faad14',
            '#ff4d4f'
          ],
          borderColor: [
            '#52c41a',
            '#faad14',
            '#ff4d4f'
          ],
          borderWidth: 2
        }]
      });
    } catch (error) {
      console.error('Failed to fetch difficulty analysis:', error);
    }
  };

  const handleExportData = () => {
    // 导出统计数据
    console.log('Exporting statistics data...');
  };

  const getDifficultyTag = (difficulty) => {
    const difficultyMap = {
      easy: { color: 'green', text: '简单' },
      medium: { color: 'orange', text: '中等' },
      hard: { color: 'red', text: '困难' }
    };
    const config = difficultyMap[difficulty] || difficultyMap.medium;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <TrophyOutlined style={{ color: '#faad14' }} />;
    if (rank === 2) return <TrophyOutlined style={{ color: '#d9d9d9' }} />;
    if (rank === 3) return <TrophyOutlined style={{ color: '#cd7f32' }} />;
    return <span style={{ color: '#666' }}>{rank}</span>;
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
      title: '完成情况',
      key: 'completion',
      render: (_, record) => (
        <div>
          <Progress
            percent={record.completionRate}
            size="small"
            status={record.completionRate >= 80 ? 'success' : record.completionRate >= 60 ? 'active' : 'exception'}
          />
          <Text style={{ fontSize: '12px' }}>
            {record.completed}/{record.totalStudents} ({record.completionRate.toFixed(1)}%)
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
          color: score >= 85 ? '#52c41a' : score >= 70 ? '#1890ff' : score >= 60 ? '#faad14' : '#f5222d',
          fontWeight: 500
        }}>
          {score.toFixed(1)}
        </span>
      )
    },
    {
      title: '分数范围',
      key: 'scoreRange',
      render: (_, record) => (
        <span>
          {record.minScore} - {record.maxScore}
        </span>
      )
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: getDifficultyTag
    },
    {
      title: '按时率',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      render: (rate) => (
        <span style={{ color: rate >= 90 ? '#52c41a' : rate >= 70 ? '#faad14' : '#f5222d' }}>
          {rate.toFixed(1)}%
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div>
      {/* 筛选条件 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <Select
                placeholder="选择课程"
                allowClear
                style={{ width: 200 }}
                value={selectedCourse}
                onChange={setSelectedCourse}
              >
                {courses.map(course => (
                  <Option key={course.id} value={course.name}>
                    {course.name}
                  </Option>
                ))}
              </Select>
              
              <Select
                placeholder="选择作业"
                allowClear
                style={{ width: 200 }}
                value={selectedAssignment}
                onChange={setSelectedAssignment}
              >
                {assignmentStats.map(assignment => (
                  <Option key={assignment.id} value={assignment.title}>
                    {assignment.title}
                  </Option>
                ))}
              </Select>
              
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                value={dateRange}
                onChange={setDateRange}
              />
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportData}
            >
              导出数据
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 概览统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总学生数"
              value={overviewData.totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总作业数"
              value={overviewData.totalAssignments}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总提交数"
              value={overviewData.totalSubmissions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均分"
              value={overviewData.averageScore}
              precision={1}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 关键指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="完成率"
              value={overviewData.completionRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="按时率"
              value={overviewData.onTimeRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="优秀率"
              value={overviewData.excellentRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="不及格率"
              value={overviewData.failureRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 分数分布图 */}
        <Col xs={24} lg={12}>
          <Card title="分数分布" extra={<BarChartOutlined />}>
            {scoreDistribution.labels ? (
              <Bar data={scoreDistribution} options={chartOptions} height={300} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>

        {/* 提交趋势图 */}
        <Col xs={24} lg={12}>
          <Card title="提交趋势" extra={<LineChartOutlined />}>
            {submissionTrend.labels ? (
              <Line data={submissionTrend} options={chartOptions} height={300} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 学生排行榜 */}
        <Col xs={24} lg={12}>
          <Card title="学生排行榜" extra={<TrophyOutlined />}>
            <List
              dataSource={studentRanking}
              renderItem={(student) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{ display: 'flex', alignItems: 'center', width: 40 }}>
                        {getRankIcon(student.rank)}
                        <Avatar 
                          src={student.avatar} 
                          icon={<UserOutlined />} 
                          size="small"
                          style={{ marginLeft: 8 }}
                        />
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{student.name}</span>
                        <span style={{ color: '#1890ff', fontWeight: 500 }}>
                          {student.averageScore.toFixed(1)}
                        </span>
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary">{student.studentId}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          完成 {student.completedAssignments}/{student.totalAssignments} 项作业
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 难度分析 */}
        <Col xs={24} lg={12}>
          <Card title="题目难度分析" extra={<PieChartOutlined />}>
            {difficultyAnalysis.labels ? (
              <Doughnut data={difficultyAnalysis} options={pieOptions} height={300} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 作业统计表格 */}
      <Card title="作业统计详情" extra={<FileTextOutlined />}>
        <Table
          columns={assignmentColumns}
          dataSource={assignmentStats}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>
    </div>
  );
};

export default Statistics;