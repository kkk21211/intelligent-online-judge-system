import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Divider,
  Switch,
  InputNumber,
  Space,
  Alert,
  Tabs
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ApiOutlined
} from '@ant-design/icons';
import api from '../../utils/api';

const { TextArea } = Input;
const { TabPane } = Tabs;

const SystemSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [generalForm] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [judgeForm] = Form.useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // 这里应该调用获取系统设置的API
      // const response = await axios.get('/api/admin/settings');
      
      // 模拟数据
      const mockSettings = {
        siteName: '智能OJ系统',
        siteDescription: '基于AI的在线编程学习平台',
        maxFileSize: 10,
        allowedFileTypes: '.py,.cpp,.c,.java,.txt',
        enableRegistration: false,
        enableAI: true,
        aiApiKey: '',
        aiModel: 'gpt-3.5-turbo',
        judgeTimeout: 30,
        judgeMemoryLimit: 256,
        maxSubmissionsPerDay: 100
      };
      
      generalForm.setFieldsValue({
        siteName: mockSettings.siteName,
        siteDescription: mockSettings.siteDescription,
        maxFileSize: mockSettings.maxFileSize,
        allowedFileTypes: mockSettings.allowedFileTypes,
        enableRegistration: mockSettings.enableRegistration,
        maxSubmissionsPerDay: mockSettings.maxSubmissionsPerDay
      });
      
      aiForm.setFieldsValue({
        enableAI: mockSettings.enableAI,
        aiApiKey: mockSettings.aiApiKey,
        aiModel: mockSettings.aiModel
      });
      
      judgeForm.setFieldsValue({
        judgeTimeout: mockSettings.judgeTimeout,
        judgeMemoryLimit: mockSettings.judgeMemoryLimit
      });
      
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      message.error('获取系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async (values) => {
    try {
      setSaveLoading(true);
      // await axios.put('/api/admin/settings/general', values);
      message.success('通用设置保存成功');
    } catch (error) {
      console.error('Failed to save general settings:', error);
      message.error('保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveAI = async (values) => {
    try {
      setSaveLoading(true);
      // await axios.put('/api/admin/settings/ai', values);
      message.success('AI设置保存成功');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      message.error('保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveJudge = async (values) => {
    try {
      setSaveLoading(true);
      // await axios.put('/api/admin/settings/judge', values);
      message.success('评测设置保存成功');
    } catch (error) {
      console.error('Failed to save judge settings:', error);
      message.error('保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTestAI = async () => {
    try {
      const values = await aiForm.validateFields();
      // await axios.post('/api/admin/settings/test-ai', values);
      message.success('AI连接测试成功');
    } catch (error) {
      console.error('AI test failed:', error);
      message.error('AI连接测试失败');
    }
  };

  return (
    <div>
      <Card title="系统设置" extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchSettings}
          loading={loading}
        >
          刷新
        </Button>
      }>
        <Tabs defaultActiveKey="general">
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                通用设置
              </span>
            }
            key="general"
          >
            <Form
              form={generalForm}
              layout="vertical"
              onFinish={handleSaveGeneral}
            >
              <Form.Item
                name="siteName"
                label="网站名称"
                rules={[{ required: true, message: '请输入网站名称' }]}
              >
                <Input placeholder="请输入网站名称" />
              </Form.Item>

              <Form.Item
                name="siteDescription"
                label="网站描述"
                rules={[{ max: 200, message: '描述不能超过200个字符' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="请输入网站描述"
                  showCount
                  maxLength={200}
                />
              </Form.Item>

              <Form.Item
                name="maxFileSize"
                label="最大文件大小 (MB)"
                rules={[
                  { required: true, message: '请输入最大文件大小' },
                  { type: 'number', min: 1, max: 100, message: '文件大小必须在1-100MB之间' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="最大文件大小"
                />
              </Form.Item>

              <Form.Item
                name="allowedFileTypes"
                label="允许的文件类型"
                rules={[{ required: true, message: '请输入允许的文件类型' }]}
                help="用逗号分隔，如：.py,.cpp,.c,.java,.txt"
              >
                <Input placeholder=".py,.cpp,.c,.java,.txt" />
              </Form.Item>

              <Form.Item
                name="maxSubmissionsPerDay"
                label="每日最大提交次数"
                rules={[
                  { required: true, message: '请输入每日最大提交次数' },
                  { type: 'number', min: 1, max: 1000, message: '提交次数必须在1-1000之间' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={1000}
                  style={{ width: '100%' }}
                  placeholder="每日最大提交次数"
                />
              </Form.Item>

              <Form.Item
                name="enableRegistration"
                label="允许用户注册"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saveLoading}
                >
                  保存通用设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <ApiOutlined />
                AI设置
              </span>
            }
            key="ai"
          >
            <Alert
              message="AI功能说明"
              description="配置AI API用于智能题目生成和答案评估功能。请确保API密钥的安全性。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={aiForm}
              layout="vertical"
              onFinish={handleSaveAI}
            >
              <Form.Item
                name="enableAI"
                label="启用AI功能"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="aiApiKey"
                label="AI API密钥"
                rules={[{ required: true, message: '请输入AI API密钥' }]}
              >
                <Input.Password placeholder="请输入AI API密钥" />
              </Form.Item>

              <Form.Item
                name="aiModel"
                label="AI模型"
                rules={[{ required: true, message: '请输入AI模型名称' }]}
              >
                <Input placeholder="如：gpt-3.5-turbo" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saveLoading}
                  >
                    保存AI设置
                  </Button>
                  <Button
                    onClick={handleTestAI}
                    icon={<ApiOutlined />}
                  >
                    测试连接
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                评测设置
              </span>
            }
            key="judge"
          >
            <Alert
              message="评测系统配置"
              description="配置代码评测的时间和内存限制，影响所有编程题的评测。"
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={judgeForm}
              layout="vertical"
              onFinish={handleSaveJudge}
            >
              <Form.Item
                name="judgeTimeout"
                label="评测超时时间 (秒)"
                rules={[
                  { required: true, message: '请输入评测超时时间' },
                  { type: 'number', min: 1, max: 300, message: '超时时间必须在1-300秒之间' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={300}
                  style={{ width: '100%' }}
                  placeholder="评测超时时间"
                />
              </Form.Item>

              <Form.Item
                name="judgeMemoryLimit"
                label="内存限制 (MB)"
                rules={[
                  { required: true, message: '请输入内存限制' },
                  { type: 'number', min: 64, max: 1024, message: '内存限制必须在64-1024MB之间' }
                ]}
              >
                <InputNumber
                  min={64}
                  max={1024}
                  style={{ width: '100%' }}
                  placeholder="内存限制"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saveLoading}
                >
                  保存评测设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SystemSettings;