import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Button, Card, Input, message, Modal, Tag, Upload, Select, Form, Space } from "antd";
import {  
  DeleteOutlined, 
  SearchOutlined, 
  UploadOutlined,
  UserAddOutlined,
  FilterOutlined
} from "@ant-design/icons";
import axios from "axios";
import "../../style/StudentManagement/StudentManagementPage.css"; 

export default function AddstudentTypeSelectionPage() {
  const [students, setStudents] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, contextHolder] = Modal.useModal();
  const [selectedYear, setSelectedYear] = useState(null); 
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 
  const [addForm] = Form.useForm(); 
  const [uploadFile, setUploadFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8081/api/students"); 
      const formattedData = res.data.map(item => {
        const prefix = (item.prefix_th || "").trim();
        const fName = (item.first_name_th || "").trim();
        const lName = (item.last_name_th || "").trim();
        const fullNameDisplay = (fName || lName) ? `${prefix}${fName} ${lName}`.trim() : null;
        return {
          ...item,
          fullName: fullNameDisplay,
          status: item.status || 'active'
        };
      });
      setStudents(formattedData.sort((a, b) => String(a.student_id).localeCompare(String(b.student_id), undefined, { numeric: true })));
    } catch (error) {
      message.error("ไม่สามารถดึงข้อมูลนักศึกษาได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const yearOptions = useMemo(() => {
    const years = students.map(s => String(s.student_id).substring(0, 2));
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a); 
    return uniqueYears.map(y => ({ label: `รุ่น ${y}`, value: y }));
  }, [students]);

  const filteredStudents = students.filter((s) => {
    const searchStr = searchText.toLowerCase();
    const nameMatch = s.fullName ? s.fullName.toLowerCase().includes(searchStr) : false;
    const idMatch = String(s.student_id).includes(searchStr);
    const matchesYear = !selectedYear || String(s.student_id).startsWith(selectedYear);
    return (nameMatch || idMatch) && matchesYear;
  });

  const handleBulkDelete = () => {
    modal.confirm({
      title: 'ยืนยันการลบข้อมูล',
      content: `ต้องการลบข้อมูลที่เลือกทั้งหมด ${selectedRowKeys.length} รายการใช่หรือไม่?`,
      okText: 'ลบรายการที่เลือก', okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await axios.post("http://localhost:8081/api/students/bulk-delete", { studentIds: selectedRowKeys });
          message.success("ลบข้อมูลสำเร็จ");
          setSelectedRowKeys([]); fetchStudents();
        } catch (error) { message.error("ล้มเหลว"); }
      },
    });
  };

  const columns = [
    { title: "รหัสนักศึกษา", dataIndex: "student_id", width: 150, render: (text) => <b>{text}</b> },
    { 
      title: "ชื่อ-นามสกุล", 
      render: (_, r) => r.fullName ? <span>{r.fullName}</span> : <span style={{ color: '#aaa', fontStyle: 'italic' }}>รหัส: {r.student_id} (ไม่มีชื่อ)</span>
    },
    { 
        title: "สถานะ", dataIndex: "status", align: "center", width: 130,
        render: (s) => (
            <Tag color={s === "active" ? "green" : s === "graduated" ? "blue" : "orange"}>
                {s === "active" ? "กำลังศึกษา" : s === "graduated" ? "สำเร็จการศึกษา" : "พักการเรียน"}
            </Tag>
        )
    },
    { 
        title: "จัดการ", align: "center", width: 80,
        render: (_, r) => (
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => {
            modal.confirm({
              title: 'ลบข้อมูล',
              content: `ลบคุณ ${r.fullName || r.student_id}?`,
              onOk: () => axios.delete(`http://localhost:8081/api/students/${r.student_id}`).then(() => { message.success("สำเร็จ"); fetchStudents(); }),
            });
          }} />
        )
    },
  ];

  return (
    <div className="student-management-container" style={{ padding: '20px' }}>
      {contextHolder}
      <Card title={<Space><UserAddOutlined /> จัดการข้อมูลนักศึกษา ({filteredStudents.length} รายการ)</Space>}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <Space wrap>
            {/* ตัวเลือกปี/รุ่น */}
            <Select 
              placeholder="เลือกรุ่น (ปี)" 
              style={{ width: 120 }} 
              options={[{ label: 'ทุกรุ่น', value: null }, ...yearOptions]}
              onChange={(val) => {
                setSelectedYear(val);
                setSelectedRowKeys([]); 
              }}
              allowClear
              suffixIcon={<FilterOutlined />}
            />

            <Input 
                placeholder="ค้นหาชื่อหรือรหัส..." 
                prefix={<SearchOutlined />} 
                style={{ width: 220 }}
                onChange={(e) => setSearchText(e.target.value)} 
                allowClear
            />
            
            {selectedRowKeys.length > 0 && (
              <Button danger type="primary" icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                ลบที่เลือก ({selectedRowKeys.length})
              </Button>
            )}
          </Space>

          <Space>
            <Button icon={<UserAddOutlined />} onClick={() => {
              addForm.setFieldsValue({ status: 'active' }); 
              setIsAddModalOpen(true);
            }}>เพิ่มรายบุคคล</Button>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setIsUploadModalOpen(true)}>นำเข้า Excel</Button>
          </Space>
        </div>

        <Table 
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          dataSource={filteredStudents} 
          columns={columns} 
          rowKey="student_id" 
          loading={loading} 
          bordered 
          pagination={false} 
          scroll={{ x: 800, y: 'calc(100vh - 350px)' }} 
        />
      </Card>

      {/* เพิ่มนักศึกษา */}
      <Modal 
        title="เพิ่มนักศึกษาใหม่" 
        open={isAddModalOpen} 
        onOk={() => addForm.submit()} 
        onCancel={() => setIsAddModalOpen(false)}
        confirmLoading={submitting}
        okText="บันทึก" cancelText="ยกเลิก"
      >
        <Form form={addForm} layout="vertical" onFinish={async (v) => {
           setSubmitting(true);
           try { 
             await axios.post("http://localhost:8081/api/students", v); 
             message.success("บันทึกสำเร็จ"); 
             setIsAddModalOpen(false); 
             addForm.resetFields();
             fetchStudents(); 
           } catch(e) { message.error("บันทึกล้มเหลว"); } finally { setSubmitting(false); }
        }}>
          <Form.Item name="student_id" label="รหัสนักศึกษา" rules={[{required:true}]}><Input placeholder="เช่น 67xxxxxx"/></Form.Item>
          <Form.Item name="first_name_th" label="ชื่อ" rules={[{required:true}]}><Input/></Form.Item>
          <Form.Item name="last_name_th" label="นามสกุล" rules={[{required:true}]}><Input/></Form.Item>
          <Form.Item name="status" label="สถานะ" rules={[{required:true}]}>
            <Select>
              <Select.Option value="active">กำลังศึกษา</Select.Option>
              <Select.Option value="graduated">สำเร็จการศึกษา</Select.Option>
              <Select.Option value="suspended">พักการเรียน</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/*  นำเข้า Excel */}
      <Modal title="นำเข้า Excel" open={isUploadModalOpen} onOk={async () => {
         const fd = new FormData(); fd.append("file", uploadFile);
         try { await axios.post("http://localhost:8081/api/students/upload", fd); message.success("สำเร็จ"); setIsUploadModalOpen(false); fetchStudents(); } catch(e) { message.error("ล้มเหลว"); }
      }} onCancel={() => setIsUploadModalOpen(false)}>
        <Upload beforeUpload={f => { setUploadFile(f); return false; }} maxCount={1}><Button icon={<UploadOutlined />}>เลือกไฟล์ .xlsx</Button></Upload>
      </Modal>
    </div>
  );
}