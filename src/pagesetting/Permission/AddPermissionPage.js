import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Input, Checkbox, Space, message, Spin } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../style/stylePermission/AddPermissionPage.css";

const API_BASE = "http://localhost:8081/api";

export default function AddPermissionPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [permissionOptions, setPermissionOptions] = useState([]);
  const [existingRoles, setExistingRoles] = useState([]);
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
        const [rolesRes, optionsRes] = await Promise.all([
          axios.get(`${API_BASE}/permissions`),
          axios.get(`${API_BASE}/master-permissions`)
        ]);

        setExistingRoles(rolesRes.data || []);
        setPermissionOptions(optionsRes.data || []);
      } catch (error) {
        console.error(error);
        message.error("ไม่สามารถโหลดข้อมูลระบบได้");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  const isDuplicate = useMemo(() => {
    if (!name.trim()) return false;

    return existingRoles.some(
      (role) =>
        role.name?.toLowerCase() === name.trim().toLowerCase()
    );
  }, [name, existingRoles]);

  const handleSave = async () => {
    if (!name.trim()) {
      return message.warning("กรุณากรอกชื่อประเภทผู้ใช้งาน");
    }

    if (permissions.length === 0) {
      return message.warning("กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ");
    }

    if (isDuplicate) {
      return message.error("ชื่อประเภทผู้ใช้งานนี้มีอยู่แล้ว");
    }

    try {
      setLoading(true);

      await axios.post(`${API_BASE}/permissions`, {
        name: name.trim(),
        permissions 
      });

      message.success("เพิ่มข้อมูลเรียบร้อย");
      navigate("/home/setting/permission");

    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-permission-container">
      <Card className="add-permission-card" title="เพิ่มประเภทผู้ใช้งาน">
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>
            ชื่อประเภทผู้ใช้งาน <span style={{ color: "red" }}>*</span>
          </label>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น admin"
            status={isDuplicate ? "error" : ""}
            disabled={loading}
          />

          {isDuplicate && (
            <div className="duplicate-text">
              * ชื่อนี้มีอยู่ในระบบแล้ว
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>
            สิทธิ์การใช้งาน <span style={{ color: "red" }}>*</span>
          </label>

          {pageLoading ? (
            <div style={{ padding: 20 }}>
              <Spin /> กำลังโหลดตัวเลือก...
            </div>
          ) : (
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
          )}
        </div>

        <div className="action-buttons">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            disabled={pageLoading || isDuplicate}
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