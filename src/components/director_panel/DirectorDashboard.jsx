import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import {
  FaChartLine,
  FaMapMarkedAlt,
  FaNetworkWired,
  FaBoxOpen,
  FaCalendarAlt,
  FaCalendarCheck,
} from "react-icons/fa";
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



  const statCards = [
    {
      icon: <FaChartLine />,
      title: "Total District",
      value: districtCount !== null ? districtCount : "Loading...",
    },
    {
      icon: <FaMapMarkedAlt />,
      title: "Total Project",
      value: projectCount !== null ? projectCount : "Loading...",
    },
    {
      icon: <FaNetworkWired />,
      title: "Total Sector",
      value: sectorCount !== null ? sectorCount : "Loading...",
    },
    {
      icon: <FaBoxOpen />,
      title: "Distributed Mahalakshmi Kit (2024-2025)",
      value: getDistributionCount("2024-2025"),
    },
    {
      icon: <FaCalendarAlt />,
      title: "Distributed Mahalakshmi Kit (2025-2026)",
      value: getDistributionCount("2025-2026"),
    },
    {
      icon: <FaCalendarCheck />,
      title: "Distributed Mahalakshmi Kit (2026-2027)",
      value: getDistributionCount("2026-2027"),
    },
  ];

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
          <Row className="g-4 mb-3">
            {statCards.map((stat, index) => (
              <Col lg={4} md={4} sm={6} xs={12} key={index}>
                <Card className="h-100 shadow-sm border-0 stats-card">
                  <Card.Body className="text-center">
                    <div className="stats-icon" aria-hidden="true">
                      {stat.icon}
                    </div>
                    <Card.Title className="stats-title">{stat.title}</Card.Title>
                    <Card.Text className="stats-count">{stat.value}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default DirectorDashboard;