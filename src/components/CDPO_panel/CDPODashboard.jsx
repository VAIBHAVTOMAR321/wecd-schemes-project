import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import {
  FaNetworkWired,
  FaBuilding,
  FaBoxOpen,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChartLine,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import "../../assets/css/dashboard.css";
import CDPOHeader from "./CDPOHeader";
import CDPOLeftNav from "./CDPOLeftNav";

const CDPODashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const { api } = useAuth();
  const navigate = useNavigate();
  const [awcCount, setAwcCount] = useState(null);
  const [awcLoading, setAwcLoading] = useState(false);
  const [fyData, setFyData] = useState(null);
  const [fyLoading, setFyLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth > 768 && window.innerWidth <= 992;
      setIsMobile(mobile);
      setIsTablet(tablet);
      setSidebarOpen(mobile ? false : true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!api) return;

    const fetchAwcCount = async () => {
      setAwcLoading(true);
      try {
        const response = await api.get("/cdpo-awc-dropdown/");
        if (response.data?.success) {
          setAwcCount(response.data?.count ?? response.data?.data?.length ?? 0);
        }
      } catch (err) {
        console.error("Failed to fetch CDPO AWC count:", err);
      } finally {
        setAwcLoading(false);
      }
    };

    fetchAwcCount();
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const fetchFyCount = async () => {
      setFyLoading(true);
      try {
        const response = await api.get("/cdpo/financial-year-count/");
        if (response.data?.success) {
          setFyData(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch FY count:", err);
      } finally {
        setFyLoading(false);
      }
    };

    fetchFyCount();
  }, [api]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSectorClick = () => {
    navigate("/OURSector");
  };

  const handleAwcClick = () => {
    navigate("/OurAwcProject");
  };



  return (
    <div className="dashboard-container">
      <CDPOLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <CDPOHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3">
          <Row className="g-4 mb-4">
            <Col lg={6} md={6} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card" style={{ cursor: "pointer" }} onClick={handleSectorClick}>
                <Card.Body className="text-center">
                  <div className="stats-icon" aria-hidden="true">
                    <FaNetworkWired />
                  </div>
                  <Card.Title className="stats-title">Total Sector</Card.Title>
                  <Card.Text className="stats-count">2</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} md={12} sm={12} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card" style={{ cursor: "pointer" }} onClick={handleAwcClick}>
                <Card.Body className="text-center">
                  <div className="stats-icon" aria-hidden="true">
                    <FaBuilding />
                  </div>
                  <Card.Title className="stats-title">Total Anganwadi </Card.Title>
                  <Card.Text className="stats-count">{awcLoading || awcCount === null ? "Loading..." : awcCount}</Card.Text>
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
                  <div className="stats-icon" aria-hidden="true">
                    <FaBoxOpen />
                  </div>
                  <Card.Title className="stats-title">Mahalakshmi Kit Beneficiary (2024-2025)</Card.Title>
                  <Card.Text className="stats-count">{fyLoading ? "Loading..." : (fyData?.data?.["2024-2025"] ?? "-")}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <div className="stats-icon" aria-hidden="true">
                    <FaCalendarAlt />
                  </div>
                  <Card.Title className="stats-title">Mahalakshmi Kit Beneficiary (2025-2026)</Card.Title>
                  <Card.Text className="stats-count">{fyLoading ? "Loading..." : (fyData?.data?.["2025-2026"] ?? "-")}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <div className="stats-icon" aria-hidden="true">
                    <FaCalendarCheck />
                  </div>
                  <Card.Title className="stats-title">Mahalakshmi Kit Beneficiary (2026-2027)</Card.Title>
                  <Card.Text className="stats-count">{fyLoading ? "Loading..." : (fyData?.data?.["2026-2027"] ?? "-")}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
             <Col lg={4} md={12} sm={12} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <div className="stats-icon" aria-hidden="true">
                    <FaChartLine />
                  </div>
                  <Card.Title className="stats-title">Total Mahalakshmi Kit Beneficiary Count</Card.Title>
                  <Card.Text className="stats-count">{fyLoading ? "Loading..." : (fyData ? Object.values(fyData.data).reduce((a, b) => a + b, 0) : "-")}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
         

        
        </Container>

        
      </div>
    </div>
  );
};

export default CDPODashboard;