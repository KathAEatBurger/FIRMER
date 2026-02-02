import React, { useState, useEffect } from 'react';
import { Table, Tag, Layout, Input, Select, DatePicker, Space, Typography, Button, Card, Form, message, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, LogoutOutlined, UserOutlined, LockOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 


import userDataRaw from './internQuest.user.json';
import logDataRaw from './internQuest.log.json';

dayjs.extend(isBetween);

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;


const ACTION_PRIORITY = [
  "labOrder", "labResult", "receive", "accept", "approve", "reapprove",
  "unapprove", "unreceive", "rerun", "save", "listTransactions",
  "getTransaction", "analyzerResult", "analyzerRequest"
];

const App = () => {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [data, setData] = useState([]); 
  const [displayData, setDisplayData] = useState([]); 
  const [loading, setLoading] = useState(false);

  
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('logFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        if (parsed.timeRange && parsed.timeRange[0]) {
          parsed.timeRange = [dayjs(parsed.timeRange[0]), dayjs(parsed.timeRange[1])];
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing filters", e);
      }
    }
    
    return {
      actions: [], 
      timeRange: [dayjs().startOf('day'), dayjs().endOf('day')],
      users: [], 
      status: '',
      labSearch: '',
    };
  });

  
  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  
  useEffect(() => {
    localStorage.setItem('logFilters', JSON.stringify(filters));
  }, [filters]);

  

  const handleLogin = (values) => {
    const user = userDataRaw.find(u => u.username === values.username && !u.isDel);
    if (user && values.password === `${user.username}123`) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      message.success(`ยินดีต้อนรับ ${user.prefix}${user.firstname}`);
      
      
      if (user.level === 'user') {
        setFilters(prev => ({ ...prev, users: [user._id.$oid] }));
      }
    } else {
      message.error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const loadData = () => {
    setLoading(true);
    const activeUsers = userDataRaw.filter(u => !u.isDel);
    const activeUserIds = activeUsers.map(u => u._id.$oid);

    const mergedData = logDataRaw
      .filter(log => activeUserIds.includes(log.userId.$oid))
      .map((log, index) => {
        const user = activeUsers.find(u => u._id.$oid === log.userId.$oid);
        return {
          key: index,
          userObj: user,
          userName: `${user.prefix}${user.firstname} ${user.lastname}`,
          endpoint: log.endpoint,
          method: log.method,
          timestamp: dayjs(log.timestamp.$date),
          labnumber: log.labnumber, 
          action: log.action,
          statusCode: log.response.statusCode,
          message: log.response.message,
          timeMs: log.response.timeMs,
        };
      });

    setData(mergedData);
    applyFilters(mergedData, filters);
    setLoading(false);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleSearch = () => {
    applyFilters(data, filters);
  };

  const handleReset = () => {
    const resetFilters = {
      actions: [],
      timeRange: [dayjs().startOf('day'), dayjs().endOf('day')],
      users: currentUser.level === 'user' ? [currentUser._id.$oid] : [],
      status: '',
      labSearch: '',
    };
    setFilters(resetFilters);
    applyFilters(data, resetFilters);
  };

  const applyFilters = (sourceData, currentFilters) => {
    let result = [...sourceData];

    
    if (currentFilters.actions && currentFilters.actions.length > 0) {
      result = result.filter(item => currentFilters.actions.includes(item.action));
    }

    
    if (currentFilters.timeRange && currentFilters.timeRange[0]) {
      result = result.filter(item => 
        item.timestamp.isBetween(currentFilters.timeRange[0], currentFilters.timeRange[1], null, '[]')
      );
    }

    
    if (currentUser.level === 'user') {
      result = result.filter(item => item.userObj._id.$oid === currentUser._id.$oid);
    } else if (currentFilters.users && currentFilters.users.length > 0) {
      result = result.filter(item => currentFilters.users.includes(item.userObj._id.$oid));
    }

    
    if (currentFilters.status) {
      result = result.filter(item => String(item.statusCode).includes(currentFilters.status));
    }

    
    if (currentFilters.labSearch) {
      const searchLower = currentFilters.labSearch.toLowerCase();
      result = result.filter(item => 
        item.labnumber.some(num => num.toLowerCase().includes(searchLower))
      );
    }

    setDisplayData(result);
  };

  
  const exportToExcel = () => {
    const exportData = displayData.map(item => ({
      User: item.userName,
      Endpoint: item.endpoint,
      Method: item.method,
      Timestamp: item.timestamp.format('DD/MM/YYYY HH:mm:ss'),
      LabNumber: item.labnumber.join(', '),
      Action: item.action,
      Status: item.statusCode,
      TimeMs: item.timeMs
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Logs");
    XLSX.writeFile(wb, `Log_Report_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
  };

  
  const exportToPDF = () => {
    try {
        const doc = new jsPDF();
        const tableColumn = ["User", "Action", "Lab No.", "Time", "Status"];
        const tableRows = displayData.map(item => [
            item.userName,
            item.action,
            item.labnumber.join(', '),
            item.timestamp.format('DD/MM/YYYY HH:mm:ss'),
            item.statusCode
        ]);

        
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 8 }, 
            headStyles: { fillColor: [22, 119, 255] }, 
            didDrawPage: (data) => {
                doc.text("Log Management Report", 14, 15);
            }
        });

        doc.save(`Log_Report_${dayjs().format('YYYYMMDD_HHmm')}.pdf`);
        message.success("ดาวน์โหลด PDF สำเร็จ");
    } catch (error) {
        console.error("PDF Error:", error);
        message.error("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  
  const columns = [
    {
      title: 'User Name',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      responsive: ['md'],
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: text => <Tag color={text === 'GET' ? 'blue' : text === 'POST' ? 'green' : 'orange'}>{text}</Tag>
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: time => time.format('DD/MM/YYYY HH:mm:ss'),
      sorter: (a, b) => a.timestamp.valueOf() - b.timestamp.valueOf(),
      width: 170,
    },
    {
      title: 'Lab Number',
      dataIndex: 'labnumber',
      key: 'labnumber',
      render: labs => labs.join(', '),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: action => <Tag color="geekblue">{action}</Tag>,
      sorter: (a, b) => ACTION_PRIORITY.indexOf(a.action) - ACTION_PRIORITY.indexOf(b.action),
    },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      render: code => <Tag color={code === 200 ? 'success' : 'error'}>{code}</Tag>
    },
    {
      title: 'Time (ms)',
      dataIndex: 'timeMs',
      key: 'timeMs',
      sorter: (a, b) => a.timeMs - b.timeMs,
    },
  ];

  

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
        <Card title="Log System Login" style={{ width: 350 }}>
          <Form onFinish={handleLogin} layout="vertical">
            <Form.Item name="username" rules={[{ required: true, message: 'กรุณากรอก Username' }]}>
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'กรุณากรอก Password' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>เข้าสู่ระบบ</Button>
            <div style={{marginTop: 10, fontSize: 12, color: '#888', textAlign: 'center'}}>
              (Hint: alice/alice123, bob/bob123)
            </div>
          </Form>
        </Card>
      </div>
    );
  }

  const activeUserOptions = userDataRaw.filter(u => !u.isDel);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', background: '#fff', boxShadow: '0 2px 8px #f0f1f2' }}>
        <Title level={4} style={{ margin: 0 }}>Log Management System</Title>
        <Space>
          <Text strong>{currentUser.prefix}{currentUser.firstname} ({currentUser.level})</Text>
          <Button icon={<LogoutOutlined />} onClick={() => setIsLoggedIn(false)} danger>Logout</Button>
        </Space>
      </Header>
      
      <Content style={{ padding: '20px' }}>
        <Card title="Advanced Filter" style={{ marginBottom: 20 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8} lg={6}>
              <Text>ช่วงเวลา Timestamp</Text>
              <RangePicker 
                showTime 
                style={{ width: '100%' }}
                value={filters.timeRange}
                onChange={(dates) => handleFilterChange('timeRange', dates)}
              />
            </Col>
            <Col xs={24} md={8} lg={6}>
              <Text>Action</Text>
              <Select
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                placeholder="แสดงทั้งหมด"
                value={filters.actions}
                onChange={(val) => handleFilterChange('actions', val)}
              >
                {ACTION_PRIORITY.map(act => <Option key={act} value={act}>{act}</Option>)}
              </Select>
            </Col>
            <Col xs={24} md={8} lg={6}>
              <Text>User</Text>
              <Select
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                placeholder="แสดงทั้งหมด"
                value={filters.users}
                onChange={(val) => handleFilterChange('users', val)}
                disabled={currentUser.level === 'user'} 
              >
                {activeUserOptions.map(u => (
                  <Option key={u._id.$oid} value={u._id.$oid}>{u.firstname} {u.lastname}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={8} lg={3}>
              <Text>Status Code</Text>
              <Input 
                placeholder="Status" 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              />
            </Col>
            <Col xs={24} md={8} lg={3}>
              <Text>Lab Number</Text>
              <Input 
                placeholder="Lab No." 
                value={filters.labSearch}
                onChange={(e) => handleFilterChange('labSearch', e.target.value)}
              />
            </Col>
          </Row>
          <Row justify="end" style={{ marginTop: 20 }}>
            <Space>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>Reset</Button>
              <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>ค้นหา</Button>
            </Space>
          </Row>
        </Card>

        <Card>
           <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
             <Space>
               <Button icon={<FileExcelOutlined />} onClick={exportToExcel} style={{ borderColor: 'green', color: 'green' }}>Export Excel</Button>
               <Button icon={<FilePdfOutlined />} onClick={exportToPDF} style={{ borderColor: 'red', color: 'red' }}>Export PDF</Button>
             </Space>
           </div>
           
           <Table 
             columns={columns} 
             dataSource={displayData} 
             loading={loading}
             pagination={{ 
               defaultPageSize: 50, 
               showSizeChanger: true, 
               pageSizeOptions: ['10', '20', '50', '100'] 
             }}
             bordered
             scroll={{ x: 1000 }}
           />
        </Card>
      </Content>
    </Layout>
  );
};

export default App;