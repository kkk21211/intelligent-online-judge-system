import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, message, Spin } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import api from '../../utils/api';

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalTeachers: 0,
    totalCourses: 0,
    totalProblems: 0,
    totalSubmissions: 0
  });
  const [recentTeachers, setRecentTeachers] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 获取统计数据
      const [teachersRes, coursesRes] = await Promise.all([
        api.get('/api/admin/teachers'),
        api.get('/api/admin/courses')
      ]);

      setStatistics({
        totalTeachers: teachersRes.data.teachers?.length || 0,
        totalCourses: coursesRes.data.courses?.length || 0,
        totalProblems: 0, // 这里可以添加题目统计API
        totalSubmissions: 0 // 这里可以添加提交统计API
      });

      // 获取最近的教师和课程
      setRecentTeachers(teachersRes.data.teachers?.slice(0, 5) || []);
      setRecentCourses(coursesRes.data.courses?.slice(0, 5) || []);
      
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const teacherColumns = [
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
  ];

  const courseColumns = [
    {
      title: '课程名称',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: '课程代码',
      dataIndex: 'courseCode',
      key: 'courseCode',
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
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '活跃' : '非活跃'}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统概览</h2>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="教师总数"
              value={statistics.totalTeachers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="课程总数"
              value={statistics.totalCourses}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="题目总数"
              value={statistics.totalProblems}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="提交总数"
              value={statistics.totalSubmissions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近数据 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近添加的教师" size="small">
            <Table
              columns={teacherColumns}
              dataSource={recentTeachers}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近创建的课程" size="small">
            <Table
              columns={courseColumns}
              dataSource={recentCourses}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Overview;