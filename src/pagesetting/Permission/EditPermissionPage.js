import React, { useEffect, useState } from "react";
import { Card, Input, Button, Checkbox, Space, message, Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import axios from "axios";

import "../../style/stylePermission/EditPermissionPage.css";

const API_BASE = "http://localhost:8081/api";

export default function EditPermissionPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState([]); 
  const [permissionOptions, setPermissionOptions] = useState([]); 
  const [existingRoles, setExistingRoles] = useState([]); 
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [pageLoading, setPageLoading] = useState(true); 
  
const permissionLabel = {
    view_basic_data: "ดูข้อมูลพื้นฐาน",
    view_reports: "เข้าถึงและสร้างรายงาน",
    manage_settings: "เข้าถึงเมนูตั้งค่าระบบ",
    manage_research: "จัดการข้อมูลงานวิจัย",
    manage_training: "จัดการข้อมูลการอบรม",
    manage_works: "จัดการข้อมูลผลงาน",
    manage_permissions: "จัดการสิทธิ์การใช้งานระบบ",
    manage_surveys: "จัดการแบบประเมิน",
    manage_interns: "จัดการข้อมูลนักศึกษาฝึกงาน (สำหรับ Admin)", 
    view_internship: "ยื่นและดูข้อมูลฝึกงาน (สำหรับนักศึกษา)", 
    manage_users: "จัดการผู้ใช้งาน",
    manage_insurance_reports: "จัดการรายงานสำหรับส่งประกัน" 
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [masterRes, rolesRes] = await Promise.all([
          axios.get(`${API_BASE}/master-permissions`),
          axios.get(`${API_BASE}/permissions`)
        ]);

        setPermissionOptions(masterRes.data);
        setExistingRoles(rolesRes.data);

        const record = rolesRes.data.find((item) => item.id.toString() === id);

        if (!record) {
          message.error("ไม่พบข้อมูลประเภทผู้ใช้งานนี้");
          navigate("/home/setting/permission");
          return;
        }

        setName(record.name);
        setPermissions(record.permissions); 

      } catch (error) {
        console.error("Error loading data:", error);
        message.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (existingRoles.length > 0 && name.trim()) {
      const duplicate = existingRoles.some(
        (item) => 
          item.id.toString() !== id && 
          item.name.toLowerCase() === name.trim().toLowerCase()
      );
      setIsDuplicate(duplicate);
    } else {
        setIsDuplicate(false);
    }
  }, [name, existingRoles, id]);

  const handleSave = async () => {
    if (!name.trim()) {
      message.warning("กรุณากรอกชื่อประเภทผู้ใช้งาน");
      return;
    }
    if (permissions.length === 0) {
      message.warning("กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ");
      return;
    }
    if (isDuplicate) {
      message.error("ชื่อประเภทผู้ใช้งานนี้มีอยู่แล้ว");
      return;
    }

    try {
      setLoading(true);
      await axios.put(`${API_BASE}/permissions/${id}`, {
        name: name.trim(),
        permissions: permissions,
      });

      message.success("แก้ไขข้อมูลเรียบร้อย");
      navigate("/home/setting/permission");
    } catch (error) {
      console.error("Update Error:", error);
      message.error(error.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
      return <div style={{textAlign: 'center', marginTop: '50px'}}><Spin size="large" /></div>;
  }

  return (
    <div className="edit-permission-container">
      <Card title="แก้ไขประเภทผู้ใช้งาน" className="edit-permission-card">
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>ชื่อประเภทผู้ใช้งาน <span style={{color:'red'}}>*</span></label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            status={isDuplicate ? "error" : ""}
            disabled={loading}
          />
          {isDuplicate && (
            <div className="duplicate-warning" style={{color: 'red', marginTop: 5}}>
                * ชื่อประเภทนี้มีอยู่แล้ว
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>สิทธิ์การใช้งาน <span style={{color:'red'}}>*</span></label>
          <div className="checkbox-container">
            <Checkbox.Group
              value={permissions}
              onChange={setPermissions}
              disabled={loading}
            >
              <Space direction="vertical">
                {permissionOptions.length > 0 ? (
                  permissionOptions.map((p) => {
                    const val = typeof p === 'object' ? (p.value || p.name) : p;
                    const defaultLabel = typeof p === 'object' ? p.label : p;
                    
                    return (
                      <Checkbox key={val} value={val}>
                        {permissionLabel[val] || defaultLabel}
                      </Checkbox>
                    );
                  })
                ) : (
                  <span style={{ color: "#999" }}>
                    ไม่พบข้อมูลสิทธิ์ในระบบ
                  </span>
                )}
              </Space>
            </Checkbox.Group>
          </div>
        </div>

        <div className="action-buttons">
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            loading={loading}
            disabled={isDuplicate}
          >
            บันทึก
          </Button>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate("/home/setting/permission")}
            disabled={loading}
          >
            ยกเลิก
          </Button>
        </div>
      </Card>
    </div>
  );
}