import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import "../../assets/css/dashboard.css";
import SectorHeader from "./SectorHeader";
import SectorLeftNav from "./SectorLeftNav";

const SectorDashBoard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const { user, api, uniqueId } = useAuth();



  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth <= 768;
    const tablet = window.innerWidth > 768 && window.innerWidth <= 992;

    setIsMobile(mobile);
    setIsTablet(tablet);

    if (mobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  };

  handleResize();

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);

  return (
    <div className="dashboard-container">
      <SectorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <SectorHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3">
          <Row className="g-4 mb-4">
           
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">हमारे कुल आंगनवाड़ी केंद्र</Card.Title>
                  <Card.Text className="stats-count">32</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">महालक्ष्मी लाभार्थी वित्तीय वर्ष (2026-27)</Card.Title>
                  <Card.Text className="stats-count">0</Card.Text>
                </Card.Body>
              </Card>
            </Col>
        
       
             <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">महालक्ष्मी लाभार्थी वित्तीय वर्ष (2025-26)</Card.Title>
                  <Card.Text className="stats-count">57</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">महालक्ष्मी लाभार्थी वित्तीय वर्ष (2024-2025)</Card.Title>
                  <Card.Text className="stats-count">39</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

        
        </Container>

        
      </div>
    </div>
  );
};

export default SectorDashBoard;