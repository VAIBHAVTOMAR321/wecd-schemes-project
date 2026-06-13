import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import "../../assets/css/dashboard.css";
import DirectorHeader from "./DirectorHeader";
import DirectorLeftNav from "./DirectorLeftNav";

const DIRECTOR_DASHBOARD_API = "director/dashboard/";

const DirectorDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api, isReady } = useAuth();
  const [districtCount, setDistrictCount] = useState(null);
  const [projectCount, setProjectCount] = useState(null);
  const [sectorCount, setSectorCount] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [loading, setLoading] = useState(false);



  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (!api || !isReady) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await api.get(DIRECTOR_DASHBOARD_API);
        const dashboard = response.data?.dashboard;

        if (response.data?.success && dashboard) {
          setDistrictCount(dashboard.total_districts);
          setProjectCount(dashboard.total_projects);
          setSectorCount(dashboard.total_sectors);
          setDistributionData(dashboard.financial_year_wise_distribution || []);
        }
      } catch (err) {
        console.error("Failed to fetch director dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [api, isReady]);

  const getDistributionCount = (financialYear) => {
    if (loading) return "Loading...";

    const data = distributionData?.find((item) => item.financial_year === financialYear);
    return data?.distributed_mahalaxmi_kits ?? "No data available";
  };



  return (
    <div className="dashboard-container">
      <DirectorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <DirectorHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3">
          <Row className="g-4 mb-4">
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Total District</Card.Title>
                  <Card.Text className="stats-count">{districtCount !== null ? districtCount : "Loading..."}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Total Project</Card.Title>
                  <Card.Text className="stats-count">{projectCount !== null ? projectCount : "Loading..."}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Total Sector</Card.Title>
                  <Card.Text className="stats-count">{sectorCount !== null ? sectorCount : "Loading..."}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Distributed Mahalakshmi Kit (2024-2025)</Card.Title>
                  <Card.Text className="stats-count">{getDistributionCount("2024-2025")}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Distributed Mahalakshmi Kit (2025-2026)</Card.Title>
                  <Card.Text className="stats-count">{getDistributionCount("2025-2026")}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Distributed Mahalakshmi Kit (2026-2027)</Card.Title>
                  <Card.Text className="stats-count">{getDistributionCount("2026-2027")}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

        </Container>
       

        
      </div>
    </div>
  );
};

export default DirectorDashboard;