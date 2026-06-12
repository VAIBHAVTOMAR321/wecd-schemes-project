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
  const [projectCount, setProjectCount] = useState(null);
  const [sectorCount, setSectorCount] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProjectsTable, setShowProjectsTable] = useState(false);
  const [showSectorsTable, setShowSectorsTable] = useState(false);

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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    if (!api) return;
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const response = await api.get("https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/district-project-sector-details/");
        if (response.data?.success) {
          setProjectCount(response.data.project_count);
          setSectorCount(response.data.sector_count);
          setProjects(response.data.projects || []);
          setSectors(response.data.sectors || []);
        }
      } catch (err) {
        console.error("Failed to fetch counts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, [api]);

  const handleProjectClick = () => {
    setShowProjectsTable((prev) => !prev);
    setShowSectorsTable(false);
  };

  const handleSectorClick = () => {
    setShowSectorsTable((prev) => !prev);
    setShowProjectsTable(false);
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
              <Card className="h-100 shadow-sm border-0 stats-card" style={{ cursor: "pointer" }} onClick={handleProjectClick}>
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Total Project</Card.Title>
                  <Card.Text className="stats-count">{projectCount !== null ? projectCount : "Loading..."}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} md={6} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card" style={{ cursor: "pointer" }} onClick={handleSectorClick}>
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Total Sector</Card.Title>
                  <Card.Text className="stats-count">{sectorCount !== null ? sectorCount : "Loading..."}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="mb-4 border-0 shadow-sm bg-white">
            <Card.Body>
              <h4 className="fw-bold mb-3">Our Schemes & Beneficiaries</h4>
            </Card.Body>
          </Card>

          <Row className="g-4 mb-4">
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Distributed Mahalakshmi Kit (2024-2025)</Card.Title>
                  <Card.Text className="stats-count">2475</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Distributed Mahalakshmi Kit (2025-2026)</Card.Title>
                  <Card.Text className="stats-count">3150</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={4} sm={6} xs={12}>
              <Card className="h-100 shadow-sm border-0 stats-card">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Anganwadi Establishment Stats</Card.Title>
                  <Card.Text className="stats-count">View</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {showProjectsTable && (
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table striped bordered hover size="sm" className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>S.no</th>
                        <th>District</th>
                        <th>Project Name</th>
                        <th>Project Code</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            <Spinner animation="border" size="sm" /> Loading...
                          </td>
                        </tr>
                      ) : projects.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">No data available</td>
                        </tr>
                      ) : (
                        projects.map((item, index) => (
                          <tr key={item.project_code || index}>
                            <td>{index + 1}</td>
                            <td>{item.district}</td>
                            <td>{item.project_name}</td>
                            <td>{item.project_code}</td>
                            <td>{item.status ? "Active" : "Inactive"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}

          {showSectorsTable && (
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table striped bordered hover size="sm" className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>S.no</th>
                        <th>District</th>
                        <th>Project Name</th>
                        <th>Sector Name</th>
                        <th>Supervisor Incharge</th>
                        <th>Supervisor Mobile</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <Spinner animation="border" size="sm" /> Loading...
                          </td>
                        </tr>
                      ) : sectors.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">No data available</td>
                        </tr>
                      ) : (
                        sectors.map((item, index) => (
                          <tr key={item.sector_name + item.project_name + index}>
                            <td>{index + 1}</td>
                            <td>{item.district}</td>
                            <td>{item.project_name}</td>
                            <td>{item.sector_name}</td>
                            <td>{item.supervisor_incharge}</td>
                            <td>{item.supervisor_mobile}</td>
                            <td>{item.status ? "Active" : "Inactive"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>
    </div>
  );
};

export default DPODashboard;
