import React from "react";
import { Card, Statistic, Row, Col } from "antd"; 
import { StarOutlined, TeamOutlined } from "@ant-design/icons"; 
/**
 * @param {Object} survey 
 */
export default function SurveySummaryCard({ survey }) {
  return (
    <Card 
      style={{ 
        marginBottom: 16, 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
      }} 
      bodyStyle={{ padding: '24px' }}
    >
      <Row gutter={[16, 16]} align="middle">
        {/* จำนวนผู้ตอบ */}
        <Col xs={12} style={{ borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>
          <Statistic 
            title="จำนวนผู้ตอบทั้งหมด" 
            value={survey?.response_count || 0} 
            suffix="คน" 
            prefix={<TeamOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
            valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
          />
        </Col>

        {/* คะแนนเฉลี่ย */}
        <Col xs={12} style={{ textAlign: 'center' }}>
          <Statistic 
            title="คะแนนเฉลี่ยรวม" 
            value={survey?.average_score || 0} 
            precision={2} 
            prefix={<StarOutlined style={{ color: '#faad14', marginRight: 8 }} />}
            suffix="/ 5"
            valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
          />
        </Col>
      </Row>
    </Card>
  );
}