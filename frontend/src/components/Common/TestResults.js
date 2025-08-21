import React from 'react';
import { Card, Table, Tag, Progress, Collapse, Typography, Space, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

const TestResults = ({ results, loading = false }) => {
  if (!results) {
    return null;
  }

  const { totalScore, maxScore, passed, passRate, testResults, executionTime, memoryUsage, error } = results;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'passed': { color: 'success', text: '通过' },
      'failed': { color: 'error', text: '失败' },
      'error': { color: 'warning', text: '错误' },
      'timeout': { color: 'warning', text: '超时' },
      'memory_limit': { color: 'warning', text: '内存超限' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const testColumns = [
    {
      title: '测试用例',
      dataIndex: 'testCase',
      key: 'testCase',
      width: 100,
      render: (text, record, index) => `测试 ${index + 1}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Space>
          {getStatusIcon(status)}
          {getStatusTag(status)}
        </Space>
      )
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score, record) => `${score}/${record.maxScore || 10}`
    },
    {
      title: '执行时间',
      dataIndex: 'executionTime',
      key: 'executionTime',
      width: 100,
      render: (time) => time ? `${time}ms` : '-'
    },
    {
      title: '内存使用',
      dataIndex: 'memoryUsage',
      key: 'memoryUsage',
      width: 100,
      render: (memory) => memory ? `${memory}KB` : '-'
    }
  ];

  const expandedRowRender = (record) => {
    return (
      <div style={{ margin: 0 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {record.input && (
            <div>
              <Text strong>输入：</Text>
              <Paragraph code style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                {record.input}
              </Paragraph>
            </div>
          )}
          
          {record.expectedOutput && (
            <div>
              <Text strong>期望输出：</Text>
              <Paragraph code style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                {record.expectedOutput}
              </Paragraph>
            </div>
          )}
          
          {record.actualOutput && (
            <div>
              <Text strong>实际输出：</Text>
              <Paragraph 
                code 
                style={{ 
                  margin: '4px 0', 
                  whiteSpace: 'pre-wrap',
                  backgroundColor: record.status === 'passed' ? '#f6ffed' : '#fff2f0'
                }}
              >
                {record.actualOutput}
              </Paragraph>
            </div>
          )}
          
          {record.error && (
            <div>
              <Text strong style={{ color: '#ff4d4f' }}>错误信息：</Text>
              <Paragraph code style={{ margin: '4px 0', whiteSpace: 'pre-wrap', backgroundColor: '#fff2f0' }}>
                {record.error}
              </Paragraph>
            </div>
          )}
        </Space>
      </div>
    );
  };

  return (
    <Card title="测试结果" loading={loading}>
      {error ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
          <div>
            <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>执行错误</Text>
            <Paragraph code style={{ marginTop: '8px', textAlign: 'left' }}>
              {error}
            </Paragraph>
          </div>
        </div>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 总体结果 */}
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size="large">
                <div>
                  <Text type="secondary">总分</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: passed ? '#52c41a' : '#ff4d4f' }}>
                    {totalScore}/{maxScore}
                  </div>
                </div>
                <div>
                  <Text type="secondary">通过率</Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {(passRate * 100).toFixed(1)}%
                  </div>
                </div>
                {executionTime && (
                  <div>
                    <Text type="secondary">总执行时间</Text>
                    <div style={{ fontSize: '16px' }}>
                      {executionTime}ms
                    </div>
                  </div>
                )}
                {memoryUsage && (
                  <div>
                    <Text type="secondary">内存使用</Text>
                    <div style={{ fontSize: '16px' }}>
                      {memoryUsage}KB
                    </div>
                  </div>
                )}
              </Space>
              <div style={{ width: '200px' }}>
                <Progress
                  percent={(totalScore / maxScore) * 100}
                  status={passed ? 'success' : 'exception'}
                  strokeColor={passed ? '#52c41a' : '#ff4d4f'}
                />
              </div>
            </div>
          </Card>

          <Divider />

          {/* 详细测试结果 */}
          {testResults && testResults.length > 0 && (
            <Table
              columns={testColumns}
              dataSource={testResults.map((result, index) => ({ ...result, key: index }))}
              pagination={false}
              size="small"
              expandable={{
                expandedRowRender,
                expandRowByClick: true,
                rowExpandable: (record) => record.input || record.expectedOutput || record.actualOutput || record.error
              }}
            />
          )}
        </Space>
      )}
    </Card>
  );
};

export default TestResults;