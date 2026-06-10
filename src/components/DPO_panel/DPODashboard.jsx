import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import DPOHeader from "./DPOHeader";
import DPOLeftNav from "./DPOLeftNav";

const DPODashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const { user, api, uniqueId } = useAuth();



  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };



  return (
    <div className="dashboard-container">
      <DPOLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <DPOHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3">
          <Row className="g-4 mb-4">
            <Col lg={6} md={6} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Total Project</Card.Title>
                  <Card.Text className="stats-count">11</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} md={6} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Total Sector</Card.Title>
                  <Card.Text className="stats-count">49</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <div className="dashboard-header-title mb-3">
            <h1>Our Schemes & Beneficiaries</h1>
          </div>
          <Row className="g-4">
            <Col lg={4} md={6} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Distributed Mahalakshmi Kit (2024-2025)</Card.Title>
                  <Card.Text className="stats-count">2475</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Distributed Mahalakshmi Kit (2025-2026)</Card.Title>
                  <Card.Text className="stats-count">3150</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={12} sm={12} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Anganwadi Establishment Stats</Card.Title>
                  <Card.Text className="stats-count">View</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>


        </Container>

        
      </div>
    </div>
  );
};

export default DPODashboard;