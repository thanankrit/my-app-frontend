import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Table, Input, Select, Space, Button, message, Modal, Tooltip, Badge, Tag, Dropdown } from "antd";
import { EyeOutlined, ExclamationCircleFilled, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import "../../style/styleaddintern/InternshipPages.css";

const { Search, TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

export default function InternStudentListPage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [dataSource, setDataSource] = useState([]);
  const [studentYears, setStudentYears] = useState([]);
  const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);
  const [reviewItem, setReviewItem] = useState(null); 
  const [rejectComment, setRejectComment] = useState("");

  const fetchInternships = async () => {
  try {
    const response = await fetch("http://localhost:8081/api/internships");
    if (response.ok) {
      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error("ข้อมูลที่ส่งมาจาก API ไม่ใช่ Array:", data);
        throw new Error("รูปแบบข้อมูลผิดพลาด");
      }

      const formattedData = data.map(item => {
        const prefix = (item.prefix_th || "").trim();
        const fName = (item.first_name_th || "").trim();
        const lName = (item.last_name_th || "").trim();
        const fullNameDisplay = (fName || lName) 
          ? `${prefix}${fName} ${lName}`.trim() 
          : `นักศึกษารหัส: ${item.student_id}`;
        
        const studentCodeSafe = item.student_id ? String(item.student_id) : "-";

        return {
          key: item.internship_id,
          internshipId: item.internship_id,
          studentCode: studentCodeSafe, 
          fullName: fullNameDisplay, 
          placeName: item.place_name || "-",
          type: item.internship_type,
          fileName: item.file_name, 
          filePath: item.file_path,
          status: item.status || 'pending', 
          rejectComment: item.reject_comment
        };
      });

      setDataSource(formattedData);
      const years = Array.from(new Set(formattedData.map(d => {
          const code = d.studentCode.replace(/\D/g, ''); 
          return code.length >= 2 ? Number(code.substring(0, 2)) : NaN;
        })))
        .filter(y => !isNaN(y))
        .sort((a, b) => b - a);
                   
      setStudentYears(years);
    } else {
      message.error("ไม่สามารถดึงข้อมูลได้");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    message.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว หรือรูปแบบข้อมูลผิดพลาด");
  }
};

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleDelete = async (internshipId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/internships/${internshipId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDataSource((prev) => prev.filter((item) => item.internshipId !== internshipId));
        message.success("ลบข้อมูลเรียบร้อยแล้ว");
      } else {
        message.error("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      message.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    }
  };

  const handleApprove = async (internshipId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/internships/approve/${internshipId}`, { method: "PUT" });
      if (response.ok) {
        message.success("อนุมัติรายการสำเร็จ!");
        setReviewItem(null); 
        fetchInternships(); 
      } else {
        message.error("เกิดข้อผิดพลาดในการอนุมัติ");
      }
    } catch (error) {
      message.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    }
  };

  const handleReject = async (internshipId) => {
    if (!rejectComment.trim()) {
      message.warning("กรุณากรอกข้อความตอบกลับให้นักศึกษาแก้ไข");
      return;
    }
    try {
      const response = await fetch(`http://localhost:8081/api/internships/reject/${internshipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: rejectComment })
      });
      if (response.ok) {
        message.success("ส่งข้อความให้นักศึกษาแก้ไขสำเร็จ");
        setReviewItem(null);
        setRejectComment("");
        fetchInternships();
      } else {
        message.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch (error) {
      message.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    }
  };

  const approvedData = dataSource.filter(item => item.status === 'approved');
  const pendingData = dataSource.filter(item => item.status === 'pending');

  const filteredData = approvedData.filter((item) => {
    const searchString = searchText.toLowerCase();
    const matchSearch =
      (item.fullName && item.fullName.toLowerCase().includes(searchString)) ||
      (item.placeName && item.placeName.toLowerCase().includes(searchString));
    const matchType = filterType === "all" ? true : item.type === filterType;
    const matchYear = filterYear === "all" ? true : String(item.studentCode).startsWith(filterYear.toString());
    
    return matchSearch && matchType && matchYear;
  });

  const showDeleteConfirm = (internshipId) => {
    confirm({
      title: 'ยืนยันการลบข้อมูล',
      icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />,
      content: 'คุณแน่ใจหรือไม่ที่จะลบข้อมูลนักศึกษาฝึกงานคนนี้? (ไม่สามารถกู้คืนได้)',
      okText: 'ลบ',
      okButtonProps: { type: 'primary', danger: true }, 
      cancelText: 'ยกเลิก',
      centered: true, 
      onOk() {
        handleDelete(internshipId); 
      },
    });
  };

  const renderFileDropdown = (filePath, fileName) => {
    if (!filePath) return <span style={{ color: "#aaa" }}>ไม่มีไฟล์</span>;

    const paths = filePath.split(',');
    const names = fileName && fileName !== "-" ? fileName.split(',') : [];

    if (paths.length === 1) {
      return (
        <Tooltip title={names[0] || "ดูไฟล์แนบ"}>
          <a 
            href={`http://localhost:8081/uploads/internships/${encodeURIComponent(paths[0].trim())}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#1890ff', fontSize: '20px' }} 
          >
            <EyeOutlined />
          </a>
        </Tooltip>
      );
    }

    const menuItems = paths.map((path, index) => {
      const displayName = names[index] ? names[index].trim() : `ไฟล์ที่ ${index + 1}`;
      return {
        key: index,
        icon: <EyeOutlined />,
        label: (
          <a 
            href={`http://localhost:8081/uploads/internships/${encodeURIComponent(path.trim())}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {displayName}
          </a>
        ),
      };
    });

    return (
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomLeft">
        <Button size="small" icon={<EyeOutlined />}>
          {paths.length} ไฟล์
        </Button>
      </Dropdown>
    );
  };

  const columns = [
    { title: "รหัสนักศึกษา", dataIndex: "studentCode" },
    { title: "ชื่อ-สกุล", dataIndex: "fullName" },
    { title: "สถานที่ฝึกงาน", dataIndex: "placeName" },
    {
      title: "ประเภท",
      dataIndex: "type",
      render: (type) => (type === "domestic" ? "ภายในประเทศ" : type === "international" ? "ต่างประเทศ" : ""),
    },
    {
      title: "ไฟล์แนบ",
      dataIndex: "filePath", 
      align: "center",
      render: (_, record) => renderFileDropdown(record.filePath, record.fileName),
    },
    {
      title: "สถานะ",
      render: () => <Tag color="green">อนุมัติแล้ว</Tag>,
    },
    {
      title: "จัดการ",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => navigate(`/home/setting/internship/edit/${record.internshipId}`)}>แก้ไข</Button>
          <Button type="primary" danger onClick={() => showDeleteConfirm(record.internshipId)}>ลบ</Button>
        </Space>
      ),
    },
  ];

  const pendingColumns = [
    { title: "รหัสนักศึกษา", dataIndex: "studentCode" },
    { title: "ชื่อ-สกุล", dataIndex: "fullName" },
    { title: "สถานที่", dataIndex: "placeName" },
    {
      title: "จัดการ",
      align: "center",
      render: (_, record) => (
        <Button type="primary" ghost onClick={() => setReviewItem(record)}>
          ตรวจสอบข้อมูล
        </Button>
      ),
    },
  ];

  return (
    <div className="internship-list-container">
      <Card
        title={<span className="card-header-title">ข้อมูลนักศึกษาฝึกงาน (อนุมัติแล้ว)</span>}
        className="list-card"
        extra={
          <Space>
            <Badge count={pendingData.length} overflowCount={99}>
              <Button type="default" onClick={() => setIsPendingModalVisible(true)}>
                รายการขออนุมัติ
              </Button>
            </Badge>
            <Button type="primary" onClick={() => navigate("/home/setting/internship/create")}>
              เพิ่มนักศึกษาฝึกงาน
            </Button>
          </Space>
        }
      >
        <div className="filter-wrapper" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search
              placeholder="ค้นหาชื่อหรือสถานที่ฝึกงาน"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="filter-search"
              style={{ width: 300 }}
            />
            <Select value={filterType} onChange={setFilterType} className="filter-select" style={{ width: 150 }}>
              <Option value="all">ทุกประเภท</Option>
              <Option value="domestic">ภายในประเทศ</Option>
              <Option value="international">ต่างประเทศ</Option>
            </Select>
            <Select value={filterYear} onChange={setFilterYear} className="filter-select" style={{ width: 150 }}>
              <Option value="all">ทุกรหัสปี</Option>
              {studentYears.map((year) => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }} 
        />
      </Card>

      <Modal
        title="รายการนักศึกษาขออนุมัติฝึกงาน"
        open={isPendingModalVisible}
        onCancel={() => setIsPendingModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table 
          columns={pendingColumns} 
          dataSource={pendingData} 
          pagination={{ pageSize: 5 }} 
        />
      </Modal>

      <Modal
        title="ตรวจสอบและอนุมัติข้อมูล"
        open={!!reviewItem}
        onCancel={() => { setReviewItem(null); setRejectComment(""); }}
        footer={null}
      >
        {reviewItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <p><strong>รหัสนักศึกษา:</strong> {reviewItem.studentCode}</p>
            <p><strong>ชื่อ-สกุล:</strong> {reviewItem.fullName}</p>
            <p><strong>สถานที่ฝึกงาน:</strong> {reviewItem.placeName}</p>
            <p><strong>ประเภท:</strong> {reviewItem.type === "domestic" ? "ภายในประเทศ" : "ต่างประเทศ"}</p>
            <p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong>ไฟล์แนบ:</strong>{" "}
              {renderFileDropdown(reviewItem.filePath, reviewItem.fileName)}
            </p>

            <hr />

            <div>
              <p style={{ marginBottom: "5px" }}><strong>ข้อความให้แก้ไข (กรณีไม่อนุมัติ):</strong></p>
              <TextArea 
                rows={3} 
                placeholder="พิมพ์ข้อความที่ต้องการให้นักศึกษาแก้ไข (เช่น ไฟล์ไม่ชัดเจน, พิมพ์ชื่อบริษัทผิด)" 
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <Button 
                danger 
                icon={<CloseOutlined />} 
                onClick={() => handleReject(reviewItem.internshipId)}
              >
                ส่งกลับให้แก้ไข
              </Button>
              <Button 
                type="primary" 
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                icon={<CheckOutlined />} 
                onClick={() => handleApprove(reviewItem.internshipId)}
              >
                อนุมัติข้อมูล
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}