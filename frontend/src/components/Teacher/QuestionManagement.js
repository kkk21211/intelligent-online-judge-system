import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  Typography,
  Upload,
  Radio,
  Checkbox,
  InputNumber,
  Divider,
  Switch,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  DownloadOutlined,
  EyeOutlined,
  CopyOutlined,
  BulbOutlined,
  CodeOutlined,
  FileTextOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import api from '../../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Search } = Input;

const QuestionManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    choice: 0,
    fillBlank: 0,
    shortAnswer: 0,
    programming: 0
  });
  const [aiGenerateVisible, setAiGenerateVisible] = useState(false);
  const [aiForm] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  useEffect(() => {
    fetchQuestions();
    fetchStatistics();
  }, [pagination.current, pagination.pageSize, searchText, selectedType, selectedDifficulty]);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/questions', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          search: searchText,
          type: selectedType,
          difficulty: selectedDifficulty
        }
      });
      
      if (response.data.success) {
        setQuestions(response.data.data.questions);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.total
        }));
      }
    } catch (error) {
      console.error('获取题目失败:', error);
      // 使用模拟数据
      const mockQuestions = [
        {
          id: 1,
          title: 'Python基础语法',
          type: 'choice',
          difficulty: 'easy',
          content: '以下哪个是Python的正确语法？',
          options: ['print("Hello World")', 'printf("Hello World")', 'echo "Hello World"', 'console.log("Hello World")'],
          correct_answer: 'A',
          explanation: 'Python使用print()函数输出内容',
          tags: ['Python', '基础语法'],
          created_at: '2025-01-19 10:00:00',
          usage_count: 15
        },
        {
          id: 2,
          title: '数据结构-栈',
          type: 'programming',
          difficulty: 'medium',
          content: '请实现一个栈的基本操作（push、pop、peek）',
          test_cases: [
            { input: 'push(1), push(2), pop()', output: '2' },
            { input: 'push(3), peek()', output: '3' }
          ],
          tags: ['数据结构', '栈'],
          created_at: '2025-01-19 09:30:00',
          usage_count: 8
        },
        {
          id: 3,
          title: '算法复杂度',
          type: 'short_answer',
          difficulty: 'hard',
          content: '请解释时间复杂度O(n²)和O(log n)的区别，并举例说明',
          reference_answer: '时间复杂度描述算法执行时间与输入规模的关系...',
          tags: ['算法', '复杂度'],
          created_at: '2025-01-19 09:00:00',
          usage_count: 12
        }
      ];
      setQuestions(mockQuestions);
      setPagination(prev => ({ ...prev, total: mockQuestions.length }));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, selectedType, selectedDifficulty]);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/api/questions/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 使用模拟数据
      setStatistics({
        total: 156,
        choice: 68,
        fillBlank: 32,
        shortAnswer: 28,
        programming: 28
      });
    }
  };

  const handleAdd = () => {
    setEditingQuestion(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingQuestion(record);
    form.setFieldsValue({
      ...record,
      options: record.options || [],
      tags: record.tags || []
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/questions/${id}`);
      message.success('删除成功');
      fetchQuestions();
      fetchStatistics();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingQuestion) {
        await api.put(`/api/questions/${editingQuestion.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/api/questions', values);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchQuestions();
      fetchStatistics();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async (values) => {
    try {
      setLoading(true);
      const response = await api.post('/api/questions/ai-generate', values);
      if (response.data.success) {
        message.success(`成功生成 ${response.data.data.count} 道题目`);
        setAiGenerateVisible(false);
        aiForm.resetFields();
        fetchQuestions();
        fetchStatistics();
      }
    } catch (error) {
      console.error('AI生成失败:', error);
      message.error('AI生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (record) => {
    setPreviewQuestion(record);
    setPreviewVisible(true);
  };

  const handleCopy = (record) => {
    const newQuestion = { ...record };
    delete newQuestion.id;
    newQuestion.title = `${record.title} (副本)`;
    form.setFieldsValue(newQuestion);
    setEditingQuestion(null);
    setModalVisible(true);
  };

  const handleTableChange = (paginationInfo) => {
    setPagination({
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
      total: pagination.total
    });
  };

  const getTypeTag = (type) => {
    const typeMap = {
      choice: { color: 'blue', text: '选择题' },
      fill_blank: { color: 'green', text: '填空题' },
      short_answer: { color: 'orange', text: '简答题' },
      programming: { color: 'purple', text: '编程题' }
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getDifficultyTag = (difficulty) => {
    const difficultyMap = {
      easy: { color: 'green', text: '简单' },
      medium: { color: 'orange', text: '中等' },
      hard: { color: 'red', text: '困难' }
    };
    const config = difficultyMap[difficulty] || { color: 'default', text: difficulty };
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
      title: '题目标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={text}>
          <Button type="link" onClick={() => handlePreview(record)}>
            {text}
          </Button>
        </Tooltip>
      )
    },
    {
      title: '题目类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: getTypeTag
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: getDifficultyTag
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags) => (
        <>
          {tags?.map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
        </>
      )
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 80,
      sorter: true
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      sorter: true
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这道题目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const renderQuestionForm = () => {
    const questionType = form.getFieldValue('type');
    
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'choice',
          difficulty: 'medium'
        }}
      >
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              label="题目标题"
              name="title"
              rules={[{ required: true, message: '请输入题目标题' }]}
            >
              <Input placeholder="请输入题目标题" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="题目类型"
              name="type"
              rules={[{ required: true, message: '请选择题目类型' }]}
            >
              <Select placeholder="请选择题目类型">
                <Option value="choice">选择题</Option>
                <Option value="fill_blank">填空题</Option>
                <Option value="short_answer">简答题</Option>
                <Option value="programming">编程题</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="难度等级"
              name="difficulty"
              rules={[{ required: true, message: '请选择难度等级' }]}
            >
              <Select placeholder="请选择难度等级">
                <Option value="easy">简单</Option>
                <Option value="medium">中等</Option>
                <Option value="hard">困难</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="标签"
              name="tags"
            >
              <Select
                mode="tags"
                placeholder="请输入标签"
                tokenSeparators={[',']}
              >
                <Option value="Python">Python</Option>
                <Option value="Java">Java</Option>
                <Option value="C++">C++</Option>
                <Option value="算法">算法</Option>
                <Option value="数据结构">数据结构</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          label="题目内容"
          name="content"
          rules={[{ required: true, message: '请输入题目内容' }]}
        >
          <TextArea rows={4} placeholder="请输入题目内容" />
        </Form.Item>
        
        {questionType === 'choice' && (
          <>
            <Form.Item label="选项">
              <Form.List name="options">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name]}
                          rules={[{ required: true, message: '请输入选项内容' }]}
                        >
                          <Input placeholder={`选项 ${String.fromCharCode(65 + name)}`} />
                        </Form.Item>
                        <Button type="link" onClick={() => remove(name)}>删除</Button>
                      </Space>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        添加选项
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>
            
            <Form.Item
              label="正确答案"
              name="correct_answer"
              rules={[{ required: true, message: '请选择正确答案' }]}
            >
              <Radio.Group>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
                <Radio value="C">C</Radio>
                <Radio value="D">D</Radio>
              </Radio.Group>
            </Form.Item>
          </>
        )}
        
        {questionType === 'programming' && (
          <Form.Item
            label="测试用例"
            name="test_cases"
          >
            <TextArea
              rows={6}
              placeholder="请输入测试用例，格式：输入|期望输出，每行一个用例"
            />
          </Form.Item>
        )}
        
        {(questionType === 'short_answer' || questionType === 'fill_blank') && (
          <Form.Item
            label="参考答案"
            name="reference_answer"
          >
            <TextArea rows={4} placeholder="请输入参考答案" />
          </Form.Item>
        )}
        
        <Form.Item
          label="解析说明"
          name="explanation"
        >
          <TextArea rows={3} placeholder="请输入解析说明（可选）" />
        </Form.Item>
      </Form>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>题目管理</Title>
        <Text type="secondary">管理系统中的所有题目，支持手动添加和AI智能生成</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="题目总数"
              value={statistics.total}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="选择题"
              value={statistics.choice}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="编程题"
              value={statistics.programming}
              prefix={<CodeOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="简答题"
              value={statistics.shortAnswer}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Search
                placeholder="搜索题目标题或内容"
                allowClear
                style={{ width: 300 }}
                onSearch={setSearchText}
              />
              <Select
                placeholder="题目类型"
                allowClear
                style={{ width: 120 }}
                onChange={setSelectedType}
              >
                <Option value="choice">选择题</Option>
                <Option value="fill_blank">填空题</Option>
                <Option value="short_answer">简答题</Option>
                <Option value="programming">编程题</Option>
              </Select>
              <Select
                placeholder="难度等级"
                allowClear
                style={{ width: 120 }}
                onChange={setSelectedDifficulty}
              >
                <Option value="easy">简单</Option>
                <Option value="medium">中等</Option>
                <Option value="hard">困难</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<BulbOutlined />}
                onClick={() => setAiGenerateVisible(true)}
              >
                AI智能生成
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                添加题目
              </Button>
              <Button icon={<UploadOutlined />}>批量导入</Button>
              <Button icon={<DownloadOutlined />}>导出题目</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 题目列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={questions}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 道题目`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 添加/编辑题目弹窗 */}
      <Modal
        title={editingQuestion ? '编辑题目' : '添加题目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
            {editingQuestion ? '更新' : '添加'}
          </Button>
        ]}
        width={800}
        destroyOnHidden
      >
        {renderQuestionForm()}
      </Modal>

      {/* AI生成题目弹窗 */}
      <Modal
        title="AI智能生成题目"
        open={aiGenerateVisible}
        onCancel={() => setAiGenerateVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAiGenerateVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={() => aiForm.submit()}>
            开始生成
          </Button>
        ]}
        width={600}
      >
        <Form
          form={aiForm}
          layout="vertical"
          onFinish={handleAIGenerate}
        >
          <Alert
            message="AI智能生成"
            description="基于您提供的主题和要求，AI将自动生成高质量的题目"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            label="生成主题"
            name="topic"
            rules={[{ required: true, message: '请输入生成主题' }]}
          >
            <Input placeholder="例如：Python基础语法、数据结构与算法" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="题目类型"
                name="type"
                rules={[{ required: true, message: '请选择题目类型' }]}
              >
                <Select placeholder="请选择题目类型">
                  <Option value="choice">选择题</Option>
                  <Option value="fill_blank">填空题</Option>
                  <Option value="short_answer">简答题</Option>
                  <Option value="programming">编程题</Option>
                  <Option value="mixed">混合类型</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="难度等级"
                name="difficulty"
                rules={[{ required: true, message: '请选择难度等级' }]}
              >
                <Select placeholder="请选择难度等级">
                  <Option value="easy">简单</Option>
                  <Option value="medium">中等</Option>
                  <Option value="hard">困难</Option>
                  <Option value="mixed">混合难度</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="生成数量"
            name="count"
            rules={[{ required: true, message: '请输入生成数量' }]}
          >
            <InputNumber min={1} max={50} placeholder="1-50" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            label="详细要求"
            name="requirements"
          >
            <TextArea
              rows={4}
              placeholder="请描述具体要求，例如：重点考查循环语句、包含实际应用场景等"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 题目预览弹窗 */}
      <Modal
        title="题目预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary" onClick={() => {
            setPreviewVisible(false);
            handleEdit(previewQuestion);
          }}>
            编辑题目
          </Button>
        ]}
        width={700}
      >
        {previewQuestion && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                {getTypeTag(previewQuestion.type)}
                {getDifficultyTag(previewQuestion.difficulty)}
                {previewQuestion.tags?.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </div>
            
            <Title level={4}>{previewQuestion.title}</Title>
            
            <div style={{ marginBottom: 16 }}>
              <Text>{previewQuestion.content}</Text>
            </div>
            
            {previewQuestion.type === 'choice' && previewQuestion.options && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>选项：</Text>
                {previewQuestion.options.map((option, index) => (
                  <div key={index} style={{ marginLeft: 16 }}>
                    <Text>{String.fromCharCode(65 + index)}. {option}</Text>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <Text strong>正确答案：</Text>
                  <Text type="success">{previewQuestion.correct_answer}</Text>
                </div>
              </div>
            )}
            
            {previewQuestion.explanation && (
              <div>
                <Text strong>解析：</Text>
                <div style={{ marginLeft: 16, marginTop: 8 }}>
                  <Text>{previewQuestion.explanation}</Text>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuestionManagement;