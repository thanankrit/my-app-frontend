import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Button, Select, Upload, message, Modal, Divider, Card, Row, Col } from "antd"; 
import { UploadOutlined, PlusOutlined, DeleteOutlined, LinkOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios"; 

const PREFIX_OPTIONS = [
  { value: "นาย", label: "นาย" },
  { value: "นาง", label: "นาง" },
  { value: "นางสาว", label: "นางสาว" },
  { value: "ผู้ช่วยศาสตราจารย์", label: "ผู้ช่วยศาสตราจารย์" },
  { value: "ผู้ช่วยศาสตราจารย์ ดร.", label: "ผู้ช่วยศาสตราจารย์ ดร." },
  { value: "รองศาสตราจารย์", label: "รองศาสตราจารย์" },
  { value: "รองศาสตราจารย์ ดร." , label: "รองศาสตราจารย์ ดร." },
  { value: "ศาสตราจารย์", label: "ศาสตราจารย์" },
  { value: "ศาสตราจารย์ ดร.", label: "ศาสตราจารย์ ดร." },
  { value: "อาจารย์", label: "อาจารย์" },
  { value: "ดร.", label: "ดร." },
];

const PREFIX_EN_OPTIONS = [
  { value: "Mr.", label: "Mr." },
  { value: "Mrs.", label: "Mrs." },
  { value: "Ms.", label: "Ms." },
  { value: "Dr.", label: "Dr." },
  { value: "Asst. Prof.", label: "Asst. Prof." },
  { value: "Assoc. Prof.", label: "Assoc. Prof." },
  { value: "Prof.", label: "Prof." },
];

const COUNTRY_OPTIONS = [
    { value: "USA", label: "United States" },
    { value: "UK", label: "United Kingdom" },
    { value: "Japan", label: "Japan" },
    { value: "China", label: "China" },
    { value: "Singapore", label: "Singapore" },
    { value: "Malaysia", label: "Malaysia" },
    { value: "Australia", label: "Australia" },
    { value: "Germany", label: "Germany" },
    { value: "France", label: "France" },
    { value: "Other", label: "Other" },
];

export default function ResearchForm({
  type,
  onSuccess,
  mode = "create",
  initialValues = {},
  disabled 
}) {
  const [form] = Form.useForm();
  const [authorForm] = Form.useForm();
  
  const API_URL = "http://localhost:8081/api";

  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [teacherList, setTeacherList] = useState([]);
  const [previewId, setPreviewId] = useState("");
  const [fileList, setFileList] = useState([]);
  const [conferenceLevel, setConferenceLevel] = useState("national");
  const isView = mode === "view" || disabled;
  const requiredMessage = (field) => `กรุณากรอก${field}`;

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get(`${API_URL}/teachers`);
        const teachersData = res.data;

        setTeacherList(
          teachersData.map((t) => ({
            value: t.id,
            label: `${t.prefix_th || ''}${t.first_name_th} ${t.last_name_th}`,
            teacherName: `${t.prefix_th || ''}${t.first_name_th} ${t.last_name_th}`,
            code: t.teacher_code
          }))
        );
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    };
    fetchTeachers();
  }, [API_URL]);

  useEffect(() => {
    if (!initialValues || !Object.keys(initialValues).length) return;

    let values = { ...initialValues };

    if (values.file && Array.isArray(values.file)) {
        const formattedFiles = values.file.map((f, index) => ({
            uid: f.uid || index, 
            name: f.name || f.url || `file-${index}`,
            status: 'done',
            url: f.url, 
            ...f
        }));
        setFileList(formattedFiles);
    } else {
        setFileList([]);
    }

    values.fileLink = values.fileLink || values.external_link || values.document_link || values.externalLink || values.documentLink || "";
    const dateFields = ["date", "printDate", "startDate", "publishDate", "conferenceDate"];
    dateFields.forEach((field) => {
      if (values[field]) values[field] = dayjs(values[field]); 
    });

    if (type === "research") {
        values.printDate = values.publishDate || values.printDate;
        values.researchNameEn = values.researchNameEn || values.research_name_en || ""; 
        if (values.authors && values.authors.length > 0) {
           const a = values.authors[0];

           if (!values.authorEn && (a.first_name_en || a.last_name_en)) {
             values.authorEn = `${a.first_name_en || ''} ${a.last_name_en || ''}`.trim();
           }
        }
    } else if (type === "conference") {
        values.conferenceLevel = values.conference_level || values.conferenceLevel || "national";
        setConferenceLevel(values.conferenceLevel);
        
        values.articleTitleEn = values.articleTitleEn || values.article_title_en || "";
        values.conferenceNameEn = values.conferenceNameEn || values.conference_name_en || ""; 

    } else if (type === "journal") {
        values.titleNameEn = values.titleNameEn || values.title_name_en || ""; 
        values.journalNameEn = values.journalNameEn || values.journal_name_en || ""; 

    } else if (type === "book") {
        values.bookNameEn = values.bookNameEn || values.book_name_en || ""; 
    }

    form.setFieldsValue(values);
    setPreviewId(values.work_code || values.id || "");
    
  }, [initialValues, type, form]);

  const handleTeacherChange = async (teacherId) => {
    if (isView || mode === "edit") return;
    
    const teacher = teacherList.find((t) => t.value === teacherId);
    
    try {
        const res = await axios.get(`${API_URL}/researches/count`, {
          params: { teacher_id: teacherId, type: type } 
        });

        let count = res.data.count !== undefined ? res.data.count : (typeof res.data === 'number' ? res.data : 0);
        const index = String(count + 1).padStart(3, "0");

        let prefix = "";
        if (type === "research") prefix = "R";
        else if (type === "journal") prefix = "J";
        else if (type === "conference") prefix = "C";
        else if (type === "book") prefix = "B";

        const teacherCode = teacher?.code || ""; 
        const newWorkCode = `${prefix}${teacherCode}${index}`;

        setPreviewId(newWorkCode);
        form.setFieldsValue({
          work_code: newWorkCode,
          teacherName: teacher?.teacherName,
        });
    } catch (err) {
        console.error("Error generating ID", err);
    }
  };

  const handleOpenAuthorModal = () => {
    authorForm.resetFields();
    setIsAuthorModalOpen(true);
  };

  const handleConfirmAuthor = async () => {
    try {
      const values = await authorForm.validateFields();
      
      const newAuthorObj = {
        prefix: values.prefix,
        firstName: values.firstName, 
        lastName: values.lastName,
        prefixEn: values.prefixEn,
        firstNameEn: values.firstNameEn,
        lastNameEn: values.lastNameEn,
        
        position: values.position,
      };

      const currentAuthors = form.getFieldValue("authors") || [];
      const newAuthors = [...currentAuthors, newAuthorObj];

      form.setFieldsValue({ authors: newAuthors });
      setIsAuthorModalOpen(false);
    } catch (error) {
      console.log("Validate Failed:", error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();

      formData.append("type", type);
      formData.append("teacher_id", String(values.teacherId)); 
      formData.append("work_code", previewId);
      const linkValue = values.fileLink || ""; 

      if (fileList && fileList.length > 0) {
        fileList.forEach((file) => {
          if (file.originFileObj) formData.append("files", file.originFileObj); 
          else formData.append("existingFiles", JSON.stringify(file));
        });
      }

      const mapAuthors = (auths) => (auths || []).map(a => ({
          prefix: a.prefix,
          first_name: a.firstName,
          last_name: a.lastName,
          prefix_en: a.prefixEn || "",
          first_name_en: a.firstNameEn || "",
          last_name_en: a.lastNameEn || "",
          position: a.position
      }));

      if (type === "research") {
        formData.append("external_link", linkValue); 
        formData.append("research_name", values.researchName);
        formData.append("research_name_en", values.researchNameEn || "");
        formData.append("academic_year", values.year);
        formData.append("volume", values.volume || "");
        formData.append("order_no", values.order || "");
        formData.append("location", values.location || "");
        formData.append("edition_year", values.editionYear || "");
        formData.append("budget", values.budget || 0);
        formData.append("organization", values.organization || "");
        formData.append("project_name", values.projectName || "");
        if (values.date) formData.append("start_date", values.date.format("YYYY-MM-DD"));
        if (values.printDate) formData.append("publish_date", values.printDate.format("YYYY-MM-DD"));

        const fullName = values.author ? values.author.trim().split(/\s+/) : []; 
        const fullNameEn = values.authorEn ? values.authorEn.trim().split(/\s+/) : [];

        const singleAuthor = [{ 
            prefix: "", 
            first_name: fullName[0] || "-", 
            last_name: fullName.slice(1).join(" ") || "-", 
            prefix_en: "",
            first_name_en: fullNameEn[0] || "",
            last_name_en: fullNameEn.slice(1).join(" ") || "",
            position: "ผู้เขียนหลัก" 
        }];
        formData.append("authors", JSON.stringify(singleAuthor));

      } else if (type === "journal") {
        formData.append("document_link", linkValue); 
        formData.append("title_name", values.titleName);
        formData.append("title_name_en", values.titleNameEn || "");
        formData.append("journal_name", values.journalName);
        formData.append("journal_name_en", values.journalNameEn || "");
        formData.append("academic_year", values.academicYear);
        formData.append("author_org", values.authorOrg || "");
        formData.append("volume", values.volume || "");
        formData.append("edition_year", values.editionYear || "");
        formData.append("page_no", values.page || "");
        formData.append("authors", JSON.stringify(mapAuthors(values.authors)));

      } else if (type === "conference") {
        formData.append("document_link", linkValue); 
        formData.append("article_title", values.articleTitle);
        formData.append("article_title_en", values.articleTitleEn || "");
        formData.append("conference_name", values.conferenceName);
        formData.append("conference_name_en", values.conferenceNameEn || "");
        
        formData.append("conference_level", values.conferenceLevel);
        if (values.conferenceLevel === "international") {
            formData.append("country", values.country || "");
        } else {
            formData.append("country", "Thailand");
        }

        formData.append("academic_year", values.academicYear);
        formData.append("location", values.conferenceLocation || values.location);
        formData.append("edition_year", values.editionYear || "");
        if (values.date) formData.append("conference_date", values.date.format("YYYY-MM-DD"));
        formData.append("authors", JSON.stringify(mapAuthors(values.authors)));

      } else if (type === "book") { 
        formData.append("document_link", linkValue);
        formData.append("book_name", values.bookName);
        formData.append("book_name_en", values.bookNameEn || ""); 
        
        formData.append("semester", values.semester || ""); 
        formData.append("subject", values.subject || ""); 
        formData.append("credits", values.credits || ""); 
        formData.append("academic_year", values.academicYear);
        
        formData.append("authors", JSON.stringify(mapAuthors(values.authors)));
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (mode === "create") {
        await axios.post(`${API_URL}/research`, formData, config);
        message.success("เพิ่มข้อมูลเรียบร้อย");
      } else {
        const targetId = initialValues.id || values.id; 
        await axios.put(`${API_URL}/research/${type}/${targetId}`, formData, config);
        message.success("บันทึกการแก้ไขเรียบร้อย");
      }
      onSuccess && onSuccess();

    } catch (err) {
      console.error("Submit Error:", err);
      message.error("บันทึกไม่สำเร็จ: " + (err.response?.data?.message || err.message));
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => setFileList(newFileList);
  const rowStyle = { marginBottom: 8 };

  return (
    <>
      <Form layout="vertical" form={form} onFinish={handleSubmit} disabled={isView}>
        <Row gutter={16} style={rowStyle}>
            <Col xs={24} sm={12}>
                <Form.Item label="รหัสผลงาน" name="work_code">
                    <Input value={previewId} disabled placeholder="ระบบสร้างให้อัตโนมัติ" />
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item label="ชื่ออาจารย์" name="teacherId" rules={[{ required: true, message: requiredMessage("ชื่ออาจารย์") }]}>
                    <Select options={teacherList} placeholder="เลือกอาจารย์" onChange={handleTeacherChange} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                </Form.Item>
            </Col>
        </Row>

        <Divider style={{ margin: '10px 0' }} />
        {type === "research" && (
            <>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                         <Form.Item label="ชื่องานวิจัย (ภาษาไทย)" name="researchName" rules={[{ required: true, message: requiredMessage("ชื่องานวิจัย") }]}><Input.TextArea rows={2} /></Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label="ชื่องานวิจัย (ภาษาอังกฤษ)" name="researchNameEn"><Input.TextArea rows={2} /></Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="ผู้เขียน (ชื่อ-สกุล ภาษาไทย)" name="author" rules={[{ required: true, message: requiredMessage("ผู้เขียน") }]}><Input placeholder="เช่น นายสมชาย ใจดี" /></Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                         <Form.Item label="ผู้เขียน (ชื่อ-สกุล ภาษาอังกฤษ)" name="authorEn"><Input placeholder="e.g. Mr. Somchai Jaidee" /></Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item label="ปีการศึกษา" name="year" rules={[{ required: true, message: requiredMessage("ปีการศึกษา") }]}><Input /></Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item label="เล่มที่" name="volume"><Input /></Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item label="ฉบับที่" name="order"><Input /></Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item label="หน้า" name="editionYear"><Input /></Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="สถานที่" name="location"><Input /></Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                         <Form.Item label="หน่วยงาน" name="organization"><Input /></Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="โครงการที่ทำ" name="projectName"><Input /></Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label="งบประมาณ" name="budget"><Input type="number" /></Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                         <Form.Item label="วันเริ่มโครงการ" name="date"><DatePicker className="research-form-datepicker" style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                         <Form.Item label="วันเผยแพร่" name="printDate"><DatePicker className="research-form-datepicker" style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                    </Col>
                </Row>
            </>
        )}
        {(type === "journal" || type === "conference" || type === "book") && (
            <>
                <Row gutter={16}>
                    <Col span={24}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 500 }}>รายชื่อผู้แต่ง :</label>
                            {!isView && <Button type="dashed" onClick={handleOpenAuthorModal} icon={<PlusOutlined />} size="small">เพิ่มผู้แต่ง</Button>}
                        </div>
                        <Form.List name="authors">
                            {(fields, { remove }) => (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    {fields.map(({ key, name, ...restField }, index) => {
                                        const authorData = form.getFieldValue(['authors', name]) || {};
                                        return (
                                            <Card key={key} size="small" bodyStyle={{ padding: '8px 12px' }} style={{ borderLeft: '3px solid #1890ff', backgroundColor: '#f9f9f9' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ wordBreak: 'break-word' }}>
                                                        <span style={{ fontWeight: 600 }}>{index + 1}. {authorData.prefix}{authorData.firstName} {authorData.lastName}</span>
                                                        {(authorData.firstNameEn || authorData.lastNameEn) && <span style={{ marginLeft: 8, color: '#666' }}>({authorData.prefixEn} {authorData.firstNameEn} {authorData.lastNameEn})</span>}
                                                        {authorData.position && <span style={{ marginLeft: 8, color: '#888', fontStyle: 'italic' }}>— {authorData.position}</span>}
                                                    </div>
                                                    {!isView && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} size="small" />}
                                                </div>
                                                <Form.Item {...restField} name={[name, "firstName"]} noStyle><Input type="hidden" /></Form.Item>
                                            </Card>
                                        );
                                    })}
                                    {fields.length === 0 && <div style={{ color: '#999', padding: '8px', textAlign: 'center', border: '1px dashed #d9d9d9', borderRadius: '4px' }}>ยังไม่มีรายชื่อผู้แต่ง</div>}
                                </div>
                            )}
                        </Form.List>
                    </Col>
                </Row>

                {type === "journal" && (
                    <>
                         <Row gutter={16}>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ชื่อเรื่อง (ภาษาไทย)" name="titleName"><Input.TextArea rows={2} /></Form.Item>
                             </Col>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ชื่อเรื่อง (ภาษาอังกฤษ)" name="titleNameEn"><Input.TextArea rows={2} /></Form.Item>
                             </Col>
                         </Row>
                         <Row gutter={16}>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ชื่อวารสาร (ภาษาไทย)" name="journalName"><Input /></Form.Item>
                             </Col>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ชื่อวารสาร (ภาษาอังกฤษ)" name="journalNameEn"><Input /></Form.Item>
                             </Col>
                         </Row>
                         <Row gutter={16}>
                             <Col xs={24} sm={12} md={6}>
                                <Form.Item label="ปีการศึกษา" name="academicYear"><Input /></Form.Item>
                             </Col>
                             <Col xs={24} sm={12} md={6}>
                                <Form.Item label="ฉบับที่" name="volume"><Input /></Form.Item>
                             </Col>
                             <Col xs={24} sm={12} md={6}>
                                <Form.Item label="ปีที่" name="editionYear"><Input /></Form.Item>
                             </Col>
                             <Col xs={24} sm={12} md={6}>
                                <Form.Item label="เลขหน้า" name="page"><Input /></Form.Item>
                             </Col>
                         </Row>
                         <Row gutter={16}>
                             <Col span={24}>
                                <Form.Item label="หน่วยงานผู้แต่ง" name="authorOrg"><Input /></Form.Item>
                             </Col>
                         </Row>
                    </>
                )}

                {type === "conference" && (
                    <>
                        <Row gutter={16}>
                             <Col xs={24} sm={12}>
                                <Form.Item label="รูปแบบงานประชุม" name="conferenceLevel" initialValue="national">
                                    <Select onChange={(val) => setConferenceLevel(val)}>
                                        <Select.Option value="national">ระดับชาติ</Select.Option>
                                        <Select.Option value="international">ระดับนานาชาติ</Select.Option>
                                    </Select>
                                </Form.Item>
                             </Col>
                             <Col xs={24} sm={12}>
                                {conferenceLevel === 'international' ? (
                                    <Form.Item label="ประเทศ" name="country" rules={[{ required: true, message: "กรุณาระบุประเทศ" }]}>
                                         <Select showSearch placeholder="เลือกประเทศ" options={COUNTRY_OPTIONS} />
                                    </Form.Item>
                                ) : (
                                    <Form.Item label="ประเทศ">
                                        <Input disabled value="Thailand" />
                                    </Form.Item>
                                )}
                             </Col>
                        </Row>
                        <Row gutter={16}>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ชื่อบทความ (ภาษาไทย)" name="articleTitle"><Input.TextArea rows={2} /></Form.Item>
                             </Col>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ชื่อบทความ (ภาษาอังกฤษ)" name="articleTitleEn"><Input.TextArea rows={2} /></Form.Item>
                             </Col>
                        </Row>
                        <Row gutter={16}>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ชื่องานประชุม (ภาษาไทย)" name="conferenceName"><Input /></Form.Item>
                             </Col>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ชื่องานประชุม (ภาษาอังกฤษ)" name="conferenceNameEn"><Input /></Form.Item>
                             </Col>
                        </Row>
                        <Row gutter={16}>
                             <Col xs={24} sm={12}>
                                <Form.Item label="สถานที่ประชุม" name="conferenceLocation"><Input /></Form.Item>
                             </Col>
                             <Col xs={24} sm={12}>
                                <Form.Item label="วันที่จัด" name="date"><DatePicker className="research-form-datepicker" style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                             </Col>
                        </Row>
                        <Row gutter={16}>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ปีการศึกษา" name="academicYear"><Input /></Form.Item>
                             </Col>
                             <Col xs={24} sm={12}>
                                <Form.Item label="ปีที่" name="editionYear"><Input /></Form.Item>
                             </Col>
                        </Row>
                    </>
                )}


                {type === "book" && (
                    <>
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item label="ชื่อหนังสือ (ภาษาไทย)" name="bookName" rules={[{ required: true, message: requiredMessage("ชื่อหนังสือ") }]}><Input /></Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label="ชื่อหนังสือ (ภาษาอังกฤษ)" name="bookNameEn"><Input /></Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                             <Col xs={24} sm={12} md={8}>
                                <Form.Item label="ภาคเรียนที่" name="semester">
                                    <Select placeholder="เลือกเทอม">
                                        <Select.Option value="1">1</Select.Option>
                                        <Select.Option value="2">2</Select.Option>
                                        <Select.Option value="Summer">ฤดูร้อน</Select.Option>
                                    </Select>
                                </Form.Item>
                             </Col>
                             <Col xs={24} sm={12} md={8}>
                                <Form.Item label="ปีการศึกษา" name="academicYear" rules={[{ required: true, message: requiredMessage("ปีการศึกษา") }]}>
                                    <Input placeholder="เช่น 2567" />
                                </Form.Item>
                             </Col>
                             <Col xs={24} sm={12} md={8}>
                                <Form.Item label="จำนวนหน่วยกิต" name="credits"><Input type="number" placeholder="เช่น 3" /></Form.Item>
                             </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item label="ประกอบวิชา" name="subject"><Input placeholder="เช่น 000000 Algorithm" /></Form.Item>
                            </Col>
                        </Row>
                    </>
                )}
            </>
        )}

        <Divider style={{ margin: '10px 0' }} />

        <Row gutter={16}>
             <Col xs={24} sm={12}>
                <Form.Item label="ไฟล์แนบ" name="file">
                    <Upload beforeUpload={() => false} multiple={true} fileList={fileList} onChange={handleFileChange} disabled={isView} listType="text" onPreview={(f) => window.open(f.url || URL.createObjectURL(f.originFileObj), '_blank')}>
                        <Button icon={<UploadOutlined />}>{isView ? "ดาวน์โหลดไฟล์" : "เลือกไฟล์/เพิ่มไฟล์"}</Button>
                    </Upload>
                </Form.Item>
             </Col>
             <Col xs={24} sm={12}>
               <Form.Item label="ลิงก์เอกสาร" shouldUpdate={(p, c) => p.fileLink !== c.fileLink}>
                {({ getFieldValue }) => {
                  const link = getFieldValue("fileLink");
                  return isView ? (
                      link ? (
                          <a href={link} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                              <LinkOutlined /> เปิดดูเอกสาร
                          </a>
                      ) : "-"
                  ) : (
                    <Form.Item name="fileLink" noStyle>
                        <Input prefix={<LinkOutlined />} placeholder="https://..." />
                    </Form.Item>
                  );
                }}
              </Form.Item>
             </Col>
        </Row>

        {!isView && <Button type="primary" htmlType="submit" block className="research-form-submit" style={{ marginTop: 16 }}>บันทึกข้อมูล</Button>}
      </Form>

      <Modal
        title={<><UserOutlined /> เพิ่มข้อมูลผู้แต่ง</>}
        open={isAuthorModalOpen}
        onOk={handleConfirmAuthor}
        onCancel={() => setIsAuthorModalOpen(false)}
        okText="ตกลง"
        cancelText="ยกเลิก"
        centered
        width={400}
      >
        <Form form={authorForm} layout="vertical">
          <Row gutter={16}>
              <Col span={24}>
                  <Form.Item name="prefix" label="คำนำหน้า" rules={[{ required: true, message: "ระบุคำนำหน้า" }]}>
                    <Select options={PREFIX_OPTIONS} placeholder="เลือกคำนำหน้า" />
                  </Form.Item>
              </Col>
          </Row>
          <Row gutter={16}>
             <Col xs={24} sm={12}>
                 <Form.Item name="firstName" label="ชื่อ (TH)" rules={[{ required: true, message: "ระบุชื่อภาษาไทย" }]}>
                    <Input />
                 </Form.Item>
             </Col>
             <Col xs={24} sm={12}>
                 <Form.Item name="lastName" label="สกุล (TH)" rules={[{ required: true, message: "ระบุนามสกุลภาษาไทย" }]}>
                    <Input />
                 </Form.Item>
             </Col>
          </Row>

          <Divider style={{ margin: '12px 0', fontSize: '13px', color: '#888' }}>ข้อมูลภาษาอังกฤษ (ถ้ามี)</Divider>
          
          <Row gutter={16}>
              <Col span={24}>
                  <Form.Item name="prefixEn" label="Prefix">
                    <Select options={PREFIX_EN_OPTIONS} placeholder="Select Prefix" />
                  </Form.Item>
              </Col>
          </Row>
          <Row gutter={16}>
              <Col xs={24} sm={12}>
                  <Form.Item name="firstNameEn" label="First Name"><Input /></Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                  <Form.Item name="lastNameEn" label="Last Name"><Input /></Form.Item>
              </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />
          
          <Form.Item name="position" label="ตำแหน่ง / บทบาท">
            <Input placeholder="เช่น ผู้เขียนหลัก" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}