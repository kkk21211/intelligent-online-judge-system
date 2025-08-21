import React from 'react';
import { Card, Typography, Divider, Table, Tag, Space, Alert } from 'antd';
import { ClockCircleOutlined, DatabaseOutlined, CodeOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const ProblemDetail = ({ problem }) => {
  if (!problem) {
    return null;
  }

  const {
    title,
    description,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    timeLimit,
    memoryLimit,
    difficulty,
    tags,
    hints
  } = problem;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  const exampleColumns = [
    {
      title: '输入',
      dataIndex: 'input',
      key: 'input',
      width: '45%',
      render: (text) => (
        <pre style={{ 
          margin: 0, 
          padding: '8px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'Monaco, Consolas, monospace'
        }}>
          {text}
        </pre>
      )
    },
    {
      title: '输出',
      dataIndex: 'output',
      key: 'output',
      width: '45%',
      render: (text) => (
        <pre style={{ 
          margin: 0, 
          padding: '8px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'Monaco, Consolas, monospace'
        }}>
          {text}
        </pre>
      )
    },
    {
      title: '说明',
      dataIndex: 'explanation',
      key: 'explanation',
      width: '10%',
      render: (text) => text && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {text}
        </Text>
      )
    }
  ];

  return (
    <div>
      {/* 题目标题和基本信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            <CodeOutlined style={{ marginRight: 8 }} />
            {title}
          </Title>
          <Space>
            <Tag color={getDifficultyColor(difficulty)}>
              {getDifficultyText(difficulty)}
            </Tag>
            {timeLimit && (
              <Tag icon={<ClockCircleOutlined />}>
                {timeLimit}ms
              </Tag>
            )}
            {memoryLimit && (
              <Tag icon={<DatabaseOutlined />}>
                {memoryLimit}KB
              </Tag>
            )}
          </Space>
        </div>
        
        {tags && tags.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {tags.map(tag => (
              <Tag key={tag} style={{ marginBottom: 4 }}>
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </Card>

      {/* 题目描述 */}
      <Card title="题目描述" size="small" style={{ marginBottom: 16 }}>
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
          {description}
        </Paragraph>
      </Card>

      {/* 输入格式 */}
      {inputFormat && (
        <Card title="输入格式" size="small" style={{ marginBottom: 16 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {inputFormat}
          </Paragraph>
        </Card>
      )}

      {/* 输出格式 */}
      {outputFormat && (
        <Card title="输出格式" size="small" style={{ marginBottom: 16 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {outputFormat}
          </Paragraph>
        </Card>
      )}

      {/* 约束条件 */}
      {constraints && constraints.length > 0 && (
        <Card title="约束条件" size="small" style={{ marginBottom: 16 }}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {constraints.map((constraint, index) => (
              <li key={index} style={{ marginBottom: 4 }}>
                <Text>{constraint}</Text>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 示例 */}
      {examples && examples.length > 0 && (
        <Card title="示例" size="small" style={{ marginBottom: 16 }}>
          <Table
            columns={exampleColumns}
            dataSource={examples.map((example, index) => ({ ...example, key: index }))}
            pagination={false}
            size="small"
            bordered
          />
        </Card>
      )}

      {/* 提示 */}
      {hints && hints.length > 0 && (
        <Card title="提示" size="small" style={{ marginBottom: 16 }}>
          {hints.map((hint, index) => (
            <Alert
              key={index}
              message={hint}
              type="info"
              showIcon
              style={{ marginBottom: index < hints.length - 1 ? 8 : 0 }}
            />
          ))}
        </Card>
      )}
    </div>
  );
};

export default ProblemDetail;