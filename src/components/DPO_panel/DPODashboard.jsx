import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Pagination } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import DPOHeader from "./DPOHeader";
import DPOLeftNav from "./DPOLeftNav";

const DPO_DASHBOARD_API = "dpo-dashboard/";
const ITEMS_PER_PAGE = 20;

const DPODashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api } = useAuth();
  const [projectCount, setProjectCount] = useState(null);
  const [sectorCount, setSectorCount] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [distributionData, setDistributionData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentProjectPage, setCurrentProjectPage] = useState(1);
  const [currentSectorPage, setCurrentSectorPage] = useState(1);
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

    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      try {
        const response = await api.get(DPO_DASHBOARD_API);
        const dashboard = response.data?.dashboard;

        if (response.data?.success && dashboard) {
          setProjectCount(dashboard.total_projects);
          setSectorCount(dashboard.total_sectors);
          setDistributionData(dashboard.financial_year_wise_distribution || []);
        }
      } catch (err) {
        console.error("Failed to fetch DPO dashboard data:", err);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const fetchDistrictDetails = async () => {
      setDetailsLoading(true);
      try {
        const response = await api.get("district-project-sector-details/");
        if (response.data?.success) {
          setProjects(response.data.projects || []);
          setSectors(response.data.sectors || []);
        }
      } catch (err) {
        console.error("Failed to fetch district project sector details:", err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDistrictDetails();
  }, [api]);

  const getDistributionCount = (financialYear) => {
    if (dashboardLoading) return "Loading...";

    const data = distributionData?.find((item) => item.financial_year === financialYear);
    return data?.distributed_mahalaxmi_kits ?? "No data available";
  };

  const projectTotalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const sectorTotalPages = Math.ceil(sectors.length / ITEMS_PER_PAGE);
  const projectPageItems = projects.slice(
    (currentProjectPage - 1) * ITEMS_PER_PAGE,
    currentProjectPage * ITEMS_PER_PAGE
  );
  const sectorPageItems = sectors.slice(
    (currentSectorPage - 1) * ITEMS_PER_PAGE,
    currentSectorPage * ITEMS_PER_PAGE
  );

  const renderPagination = (currentPage, totalPages, setCurrentPage) => {
    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-center mt-3">
        <Pagination>
          <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
          <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
          {Array.from({ length: totalPages }, (_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
          <Pagination.Last
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </div>
    );
  };

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
                      {detailsLoading ? (
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
                        projectPageItems.map((item, index) => (
                          <tr key={item.project_code || index}>
                            <td>{(currentProjectPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
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
                {renderPagination(currentProjectPage, projectTotalPages, setCurrentProjectPage)}
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
                      {detailsLoading ? (
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
                        sectorPageItems.map((item, index) => (
                          <tr key={item.sector_name + item.project_name + index}>
                            <td>{(currentSectorPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
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
                {renderPagination(currentSectorPage, sectorTotalPages, setCurrentSectorPage)}
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>
    </div>
  );
};

export default DPODashboard;
