import { useState } from "react";
import {
  Alert,
  App,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Radio,
  Row,
  Segmented,
  Select,
  Slider,
  Space,
  Statistic,
  Steps,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "./component-standards-page.css";

const tokenItems = [
  { label: "主色", value: "#1677FF", className: "primary" },
  { label: "成功", value: "#52C41A", className: "success" },
  { label: "警告", value: "#FAAD14", className: "warning" },
  { label: "错误", value: "#FF4D4F", className: "error" },
  { label: "正文", value: "#1F1F1F", className: "text" },
  { label: "边框", value: "#D9D9D9", className: "border" },
];
const tableRows = [
  {
    key: "1",
    card: "Y261109001",
    order: "BS7H-35",
    color: "测试826",
    owner: "水木",
    status: "进行中",
  },
  {
    key: "2",
    card: "Y261109002",
    order: "平月1501",
    color: "M26053-21",
    owner: "甲班",
    status: "待审核",
  },
  {
    key: "3",
    card: "Y261109003",
    order: "东华泰9474",
    color: "带布",
    owner: "乙班",
    status: "已完成",
  },
];
const statusColor: Record<string, string> = {
  进行中: "processing",
  待审核: "warning",
  已完成: "success",
};

export default function ComponentStandardsPage() {
  const { message, notification } = App.useApp();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false),
    [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="component-standards-page">
      <header className="component-standards-header">
        <div>
          <Breadcrumb items={[{ title: "试样管理" }, { title: "组件规范" }]} />
          <h1>组件规范</h1>
        </div>
        <Tag color="blue">Ant Design</Tag>
      </header>

      <section className="component-standards-grid foundations">
        <Card title="颜色与状态" size="small">
          <div className="component-token-grid">
            {tokenItems.map((item) => (
              <div className="component-token" key={item.label}>
                <i className={item.className} />
                <span>{item.label}</span>
                <code>{item.value}</code>
              </div>
            ))}
          </div>
        </Card>
        <Card title="数据概览" size="small">
          <Row gutter={16}>
            {[
              ["待审核", 12],
              ["进行中", 6],
              ["已完成", 28],
            ].map(([title, value], index) => (
              <Col span={8} key={String(title)}>
                <Statistic
                  title={title}
                  value={value}
                  suffix="项"
                  valueStyle={{
                    color:
                      index === 0
                        ? "#d48806"
                        : index === 1
                          ? "#1677ff"
                          : "#389e0d",
                  }}
                />
              </Col>
            ))}
          </Row>
        </Card>
      </section>

      <Card title="按钮" size="small" className="component-section">
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />}>
            主要操作
          </Button>
          <Button>次要操作</Button>
        <Button type="dashed">虚线按钮</Button>
          <Button type="text">文字按钮</Button>
          <Button type="link">链接按钮</Button>
          <Button danger icon={<DeleteOutlined />}>
            删除
          </Button>
          <Button disabled>禁用</Button>
          <Button loading>处理中</Button>
        </Space>
      </Card>

      <Card title="表单控件" size="small" className="component-section">
        <Form layout="vertical" className="component-form">
          <Form.Item label="查询内容">
            <Input
              prefix={<SearchOutlined />}
              placeholder="订字 / 流程卡号 / 配方号"
              allowClear
            />
          </Form.Item>
          <Form.Item label="任务状态">
            <Select
              defaultValue="进行中"
              options={["全部", "待审核", "进行中", "已完成"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </Form.Item>
          <Form.Item label="创建时间">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item label="数量">
            <InputNumber min={0} defaultValue={12} />
          </Form.Item>
          <Form.Item label="班组">
            <Radio.Group
              defaultValue="甲班"
              options={["甲班", "乙班", "丙班"]}
            />
          </Form.Item>
          <Form.Item label="业务选项">
            <Space wrap>
              <Checkbox defaultChecked>包含回修</Checkbox>
              <Switch
                defaultChecked
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </Space>
          </Form.Item>
          <Form.Item label="显示密度">
            <Segmented options={["紧凑", "默认", "宽松"]} defaultValue="默认" />
          </Form.Item>
          <Form.Item label="完成度">
            <Slider defaultValue={68} />
          </Form.Item>
        </Form>
      </Card>

      <section className="component-standards-grid">
        <Card title="标签与徽标" size="small">
          <Space wrap>
            <Tag>默认</Tag>
            <Tag color="blue">进行中</Tag>
            <Tag color="green" icon={<CheckCircleOutlined />}>
              已完成
            </Tag>
            <Tag color="orange" icon={<WarningOutlined />}>
              待审核
            </Tag>
            <Tag color="red" icon={<CloseCircleOutlined />}>
              异常
            </Tag>
            <Badge status="processing" text="处理中" />
            <Badge count={12} />
          </Space>
        </Card>
        <Card title="进度与步骤" size="small">
          <Progress percent={68} size="small" />
          <Steps
            size="small"
            current={1}
            items={[{ title: "创建" }, { title: "审核" }, { title: "完成" }]}
          />
        </Card>
      </section>

      <Card title="数据表格" size="small" className="component-section">
        <Table
          size="small"
          bordered
          rowKey="key"
          pagination={false}
          dataSource={tableRows}
          columns={[
            { title: "流程卡号", dataIndex: "card", width: 150 },
            { title: "订字", dataIndex: "order" },
            { title: "色号", dataIndex: "color" },
            { title: "负责人", dataIndex: "owner", width: 100 },
            {
              title: "状态",
              dataIndex: "status",
              width: 100,
              render: (value) => (
                <Badge
                  status={
                    statusColor[value] as "processing" | "warning" | "success"
                  }
                  text={value}
                />
              ),
            },
            {
              title: "操作",
              width: 130,
              render: () => (
                <Space size={4}>
                  <Button type="link" icon={<EditOutlined />}>
                    编辑
                  </Button>
                  <Popconfirm
                    title="确认删除该记录？"
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button type="link" danger>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
        <div className="component-pagination">
          <Pagination
            size="small"
            current={1}
            total={28}
            showSizeChanger
            showTotal={(total) => `共 ${total} 条`}
          />
        </div>
      </Card>

      <section className="component-standards-grid">
        <Card title="信息展示" size="small">
          <Descriptions
            bordered
            size="small"
            column={2}
            items={[
              { key: "card", label: "流程卡号", children: "Y261109001" },
              { key: "order", label: "订字", children: "BS7H-35" },
              { key: "team", label: "班组", children: "甲班" },
              {
                key: "status",
                label: "状态",
                children: <Tag color="blue">进行中</Tag>,
              },
            ]}
          />
          <Divider />
          <Tabs
            defaultActiveKey="formula"
            items={[
              {
                key: "formula",
                label: "配方信息",
                children: "当前配方号：C261109001",
              },
              {
                key: "process",
                label: "打样过程",
                children: "当前阶段：第 2 枪",
              },
              { key: "basic", label: "基础信息", children: "创建人：水木" },
            ]}
          />
        </Card>
        <Card title="反馈提示" size="small">
          <Space direction="vertical" className="component-feedback">
            <Alert type="success" showIcon message="保存成功" />
            <Alert type="warning" showIcon message="数据尚未确认" />
            <Alert type="error" showIcon message="审核未通过" />
            <Space wrap>
              <Button onClick={() => message.success("操作成功")}>消息</Button>
              <Button
                onClick={() =>
                  notification.info({
                    message: "任务通知",
                    description: "配方审核任务已更新",
                  })
                }
              >
                通知
              </Button>
              <Button onClick={() => setModalOpen(true)}>弹窗</Button>
              <Button onClick={() => setDrawerOpen(true)}>抽屉</Button>
              <Tooltip title="刷新当前数据">
                <Button aria-label="刷新当前数据" icon={<ReloadOutlined />} />
              </Tooltip>
              <Tooltip title="页面设置">
                <Button aria-label="页面设置" icon={<SettingOutlined />} />
              </Tooltip>
            </Space>
          </Space>
        </Card>
      </section>

      <Card title="弹窗信息显示规范" size="small" className="component-section"
        extra={<Button onClick={() => setDetailModalOpen(true)}>查看信息弹窗示例</Button>}
      >
        <Descriptions bordered size="small" column={1} items={[
          { key: "usage", label: "适用场景", children: "用于查看当前任务详情、展示重要提示或确认操作；普通成功反馈使用消息提示，持续性通知使用通知组件。" },
          { key: "title", label: "标题", children: "使用明确的业务名称，如“配方详情”“确认审核”；标题保持简短，同一弹窗只承载一个主题。" },
          { key: "content", label: "信息层级", children: "先展示状态和关键标识，再按业务分组展示详情；字段标签与内容对齐，单位随数值展示，缺失值统一显示“—”。" },
          { key: "layout", label: "尺寸与排版", children: "简短提示宽度 520px，信息详情宽度 720px；小屏幕适配可用宽度，多字段使用描述列表，长内容在正文区域滚动。" },
          { key: "status", label: "状态与异常", children: "状态使用文字配合标签或图标，不仅依赖颜色；加载中展示加载状态，空数据说明原因，失败提示说明原因并提供重试入口。" },
          { key: "actions", label: "底部操作", children: "只读详情使用“关闭”；确认操作使用“取消”和明确的动作名称，主要操作放右侧；危险操作使用红色按钮并说明影响。" },
          { key: "close", label: "关闭与交互", children: "只读详情可通过关闭按钮、Esc 或遮罩关闭；有未保存内容时，关闭前提示确认；提交中显示加载状态并防止重复提交，失败时保留内容。" },
        ]} />
      </Card>

      <Modal
        title="配方详情"
        open={detailModalOpen}
        width={720}
        onCancel={() => setDetailModalOpen(false)}
        styles={{ body: { maxHeight: "60vh", overflowY: "auto" } }}
        footer={<Button type="primary" onClick={() => setDetailModalOpen(false)}>关闭</Button>}
      >
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} items={[
          { key: "formula", label: "配方号", children: "C261109001" },
          { key: "status", label: "状态", children: <Tag color="blue">进行中</Tag> },
          { key: "card", label: "流程卡号", children: "Y261109001" },
          { key: "order", label: "订字", children: "BS7H-35" },
          { key: "color", label: "色号", children: "测试826" },
          { key: "team", label: "班组", children: "甲班" },
          { key: "owner", label: "负责人", children: "水木" },
          { key: "remark", label: "备注", children: "—" },
        ]} />
      </Modal>

      <Modal
        title="确认操作"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => {
          setModalOpen(false);
          message.success("已确认");
        }}
        okText="确认"
        cancelText="取消"
      >
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="确认后将保存当前修改。"
        />
      </Modal>
      <Drawer
        title="任务详情"
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" onClick={() => setDrawerOpen(false)}>
            完成
          </Button>
        }
      >
        <Descriptions
          bordered
          column={1}
          items={[
            { key: "card", label: "流程卡号", children: "Y261109001" },
            { key: "order", label: "订字", children: "BS7H-35" },
            {
              key: "status",
              label: "状态",
              children: <Badge status="processing" text="进行中" />,
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
