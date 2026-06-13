import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, InputGroup, FormControl, Spinner, Badge, Button, Alert } from "react-bootstrap";
import Pagination from "react-bootstrap/Pagination";
import { useAuth } from "../../../all_login/AuthContext";
// import "../../../assets/css/supervisorleftnav.css";
import DPOHeader from "../../DPOHeader";
import DPOLeftNav from "../../DPOLeftNav";

const financialYears = ["2024-25", "2025-26", "2026-27"];
const quarters = [
  { value: "All", label: "All Quarters" },
  { value: "Apr-May-June", label: "First Quarter(Apr/May/June)" },
  { value: "July-Aug-Sept", label: "Second Quarter(July/Aug/Sept)" },
  { value: "Oct-Nov-Dec", label: "Third Quarter(Oct/Nov/Dec)" },
  { value: "Jan-Feb-March", label: "Fourth Quarter(Jan/Feb/March)" },
];

const BalPosDemandProj = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalDemands, setTotalDemands] = useState(null);

  const [selectedFinYear, setSelectedFinYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("All");
  const [fetchKey, setFetchKey] = useState(0);
  const [hasAppliedFilter, setHasAppliedFilter] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    if (!api || !hasAppliedFilter) return;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedFinYear) params.fin_yr = selectedFinYear;
        if (selectedQuarter) params.qtr = selectedQuarter;
        const response = await api.get("/bal-poshan-project-wise/", { params });
        if (cancelled) return;
        const payload = response.data;
        setTotalDemands(payload?.total_demands ?? null);
        setData(Array.isArray(payload?.data) ? payload.data : []);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch Bal Poshan project-wise data:", err);
          setData([]);
          setTotalDemands(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    setCurrentPage(1);
    return () => { cancelled = true; };
  }, [api, fetchKey, hasAppliedFilter]);

  const filteredData = data.filter((item) => {
    const itemFinancialYear = String(item.financial_year || "").replace(
      /^(\d{4})-(\d{2})(\d{2})$/,
      "$1-$3"
    );
    const itemQuarter = String(item.quarter || "").replace(/\//g, "-").toLowerCase();
    const selectedQuarterValue = selectedQuarter.toLowerCase();

    if (selectedFinYear && itemFinancialYear !== selectedFinYear && !itemFinancialYear.includes(selectedFinYear)) {
      return false;
    }

    if (
      selectedQuarter &&
      selectedQuarter !== "All" &&
      itemQuarter !== selectedQuarterValue &&
      !itemQuarter.includes(selectedQuarterValue)
    ) {
      return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.project_name || "").toLowerCase().includes(term) ||
      (item.sector || "").toLowerCase().includes(term) ||
      (item.financial_year || "").toLowerCase().includes(term) ||
      (item.quarter || "").toLowerCase().includes(term) ||
      String(item.demand_id || "").toLowerCase().includes(term)
    );
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getVariant = (status) => {
    if (!status) return "secondary";
    const s = String(status).toLowerCase();
    if (s === "approve") return "success";
    if (s === "pending") return "warning";
    if (s === "rejected" || s === "reject") return "danger";
    return "secondary";
  };

  const handleFilterClick = () => {
    if (!selectedFinYear && selectedQuarter === "All") return;
    setHasAppliedFilter(true);
    setFetchKey((prev) => prev + 1);
  };

  const emptyMessage = hasAppliedFilter ? "No records found." : "Select Financial Year or Quarter and click Filter.";

  const renderPaginationItems = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let page = 1; page <= totalPages; page++) {
        pages.push(
          <Pagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Pagination.Item>
        );
      }
      return pages;
    }

    pages.push(
      <Pagination.Item
        key={1}
        active={1 === currentPage}
        onClick={() => setCurrentPage(1)}
      >
        1
      </Pagination.Item>
    );

    if (currentPage > 4) {
      pages.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let page = start; page <= end; page++) {
      pages.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    if (currentPage < totalPages - 3) {
      pages.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
    }

    pages.push(
        
      <Pagination.Item
        key={totalPages}
        active={totalPages === currentPage}
        onClick={() => setCurrentPage(totalPages)}
      >
        {totalPages}
      </Pagination.Item>
    );

    return pages;
  };

  const renderDistributionTable = (distribution) => {
    if (!Array.isArray(distribution) || distribution.length === 0) {
      return <span className="text-muted">No distribution</span>;
    }

    return (
      <Table bordered size="sm" className="mb-0" style={{ fontSize: "11px" }}>
        <thead className="table-light">
          <tr>
            <th>Month</th>
            <th>Allotted Kela</th>
            <th>Kela Bene</th>
            <th>Kela Dist Bene</th>
            <th>Kela Dist</th>
            <th>Allotted Egg</th>
            <th>Egg Bene</th>
            <th>Egg Dist Bene</th>
            <th>Egg Dist</th>
            <th>Allotted Khajur</th>
            <th>Khajur Bene</th>
            <th>Khajur Dist Bene</th>
            <th>Khajur Dist</th>
          </tr>
        </thead>
        <tbody>
          {distribution.map((dist) => (
            <tr key={dist.distribution_id || dist.month}>
              <td>{dist.month || "-"}</td>
              <td>{dist.allotted_kela ?? "-"}</td>
              <td>{dist.kela_beneficiary ?? "-"}</td>
              <td>{dist.kela_distribution_beneficiary ?? "-"}</td>
              <td>{dist.kela_distribution ?? "-"}</td>
              <td>{dist.allotted_egg ?? "-"}</td>
              <td>{dist.egg_beneficiary ?? "-"}</td>
              <td>{dist.egg_distribution_beneficiary ?? "-"}</td>
              <td>{dist.egg_distribution ?? "-"}</td>
              <td>{dist.allotted_khajur ?? "-"}</td>
              <td>{dist.khajur_beneficiary ?? "-"}</td>
              <td>{dist.khajur_distribution_beneficiary ?? "-"}</td>
              <td>{dist.khajur_distribution ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
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
          <Row className="g-3 mb-3 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">
                  Choose Financial Year
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedFinYear}
                  onChange={(e) => setSelectedFinYear(e.target.value)}
                >
                  <option value="">Select Financial Year</option>
                  {financialYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">
                  Choose Quarter
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                >
                  <option value="">Select Quarter to view report</option>
                  {quarters.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            {(selectedFinYear || selectedQuarter !== "All") && (
              <Col md={2}>
                <Button size="sm" variant="primary" onClick={handleFilterClick} disabled={loading} style={{ fontSize: "8px" }}>
                  Filter
                </Button>
              </Col>
            )}
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : data.length === 0 ? (
            <Alert variant="info" className="mt-2">
              {emptyMessage}
            </Alert>
          ) : (
            <>
              <Row className="g-3 mb-3">
                <Col md={3}>
                  <Card className="border-0 shadow-sm stats-card h-100">
                    <Card.Body className="text-center">
                      <Card.Title className="stats-title">Total Demand</Card.Title>
                      <Card.Text className="stats-count">
                        {typeof totalDemands === "number" ? totalDemands : "-"}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <InputGroup className="mb-3">
                <FormControl
                  placeholder="Search by Project, Sector, Demand ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <div className="table-responsive">
                <Table bordered hover size="sm" className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>S.No</th>
                      <th>Demand ID</th>
                      <th>Project Name</th>
                      <th>Sector</th>
                      <th>Financial Year</th>
                      <th>Quarter</th>
                      <th>Old Balance</th>
                      <th>Distribution Details</th>
                      <th>Kela Chips Beneficiary</th>
                      <th>Egg Beneficiary</th>
                      <th>Not Eat Egg Beneficiary</th>
                      <th>Sector Status</th>
                      <th>CDPO Status</th>
                      <th>Director Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, idx) => (
                      <tr key={item.demand_id || idx}>
                        <td>{startIndex + idx + 1}</td>
                        <td>{item.demand_id}</td>
                        <td>{item.project_name}</td>
                        <td>{item.sector}</td>
                        <td>{item.financial_year}</td>
                        <td>{item.quarter}</td>
                        <td>{item.old_balance ?? "-"}</td>
                        <td>{renderDistributionTable(item.distribution)}</td>
                        <td>{item.kela_chips_beneficiary ?? "-"}</td>
                        <td>{item.egg_beneficiary ?? "-"}</td>
                        <td>{item.not_eat_egg_beneficiary ?? "-"}</td>
                        <td>
                          <Badge bg={getVariant(item.sector_status)}>
                            {item.sector_status || "-"}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getVariant(item.cdpo_status)}>
                            {item.cdpo_status || "-"}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getVariant(item.director_status)}>
                            {item.director_status || "-"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {paginatedData.length === 0 && (
                      <tr>
                        <td colSpan={14} className="text-center">
                          No matching records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              <Row className="mt-3">
                <Col className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">
                    Showing {filteredData.length ? startIndex + 1 : 0}-
                    {Math.min(endIndex, filteredData.length)} of {filteredData.length}
                  </span>
                  <Pagination size="sm">
                    <Pagination.First
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    />
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    />
                    {renderPaginationItems()}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    />
                    <Pagination.Last
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    />
                  </Pagination>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>
    </div>
  );
};

export default BalPosDemandProj;
