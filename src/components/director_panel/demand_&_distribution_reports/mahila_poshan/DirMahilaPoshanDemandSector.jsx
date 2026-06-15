import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button, InputGroup, Table, Pagination, Badge, Alert } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaColumns, FaSearch, FaExpand, FaBell, FaBars } from "react-icons/fa";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";
import "../../../../assets/css/dashboard.css";
import DirectorHeader from "../../DirectorHeader";
import DirectorLeftNav from "../../DirectorLeftNav";

const DirMahilaPoshanDemandSector = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const { api } = useAuth();

  // State for filters and data
  const [financialYear, setFinancialYear] = useState("All");
  const [quarter, setQuarter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [error, setError] = useState(null);

  const entriesPerPage = 100;

  const filteredData = tableData.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      item.district?.toLowerCase().includes(search) ||
      item.project_name?.toLowerCase().includes(search) ||
      item.sector?.toLowerCase().includes(search) ||
      item.fin_yr?.toLowerCase().includes(search)
    );
    const matchesYear = financialYear === "All" || item.fin_yr === financialYear;
    const matchesQuarter = quarter === "All" || item.qtr_dmd === quarter;

    return matchesSearch && matchesYear && matchesQuarter;
  });

  const totalPages = Math.ceil(
    (filteredData.length > entriesPerPage ? filteredData.length : totalEntries) / entriesPerPage
  );

  const fetchDemandData = useCallback(async (page = 1) => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const params = { page: page, page_size: 5000 }; // Fetching a larger set to handle grouping correctly
      if (financialYear !== "All") params.fin_yr = financialYear;
      if (quarter !== "All") params.qtr_dmd = quarter;

      const response = await api.get(`director/mp-sector-wise-demand/`, { params });
      
      const fetchedData = response.data?.data || [];
      setTableData(fetchedData);
      setTotalEntries(response.data?.count || 0);

      // Extract unique financial years for the dropdown from the API response
      if (fetchedData.length > 0 && (financialYear === "All" || uniqueYears.length === 0)) {
        const years = [...new Set(fetchedData.map(item => item.fin_yr))].filter(Boolean);
        if (years.length >= uniqueYears.length) {
            setUniqueYears(years.sort());
        }
      }
    } catch (err) {
      console.error("Error fetching demand data:", err);
      setError("Failed to fetch demand records. Please try again.");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [api, financialYear, quarter, uniqueYears.length]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth > 768 && window.innerWidth <= 992;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchDemandData(currentPage);
  }, [currentPage, fetchDemandData]);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchDemandData(1);
  };

  // Logic to insert subtotal rows when project_name changes
  const renderTableRows = (data) => {
    if (data.length === 0) return null;

    const rows = [];
    let currentProject = data[0].project_name;
    let currentDistrict = data[0].district;
    
    let projectTotal = 0, projectEgg = 0, projectNonEgg = 0;
    let districtTotal = 0, districtEgg = 0, districtNonEgg = 0;

    data.forEach((row, index) => {
      const nextRow = data[index + 1];

      projectTotal += parseInt(row.khajur_bene || 0);
      projectEgg += parseInt(row.egg_bene || 0);
      projectNonEgg += parseInt(row.tot_noteat_egg_bene || 0);

      districtTotal += parseInt(row.khajur_bene || 0);
      districtEgg += parseInt(row.egg_bene || 0);
      districtNonEgg += parseInt(row.tot_noteat_egg_bene || 0);

      rows.push(
        <tr key={row.id || index}>
          <td className="text-center">{(currentPage - 1) * entriesPerPage + index + 1}</td>
          <td>{row.district}</td>
          <td>{row.project_name}</td>
          <td>{row.sector}</td>
          <td className="text-center">{row.fin_yr}</td>
          <td className="text-center">{row.qtr_dmd}</td>
          <td className="text-center">{row.khajur_bene}</td>
          <td className="text-center">{row.egg_bene}</td>
          <td className="text-center">{row.tot_noteat_egg_bene}</td>
          <td className="text-center">
            <Badge bg={row.dir_status === "Approve" ? "success" : "warning"}>{row.dir_status}</Badge>
          </td>
        </tr>
      );

      const isProjectChanged = !nextRow || nextRow.project_name !== currentProject;
      const isDistrictChanged = !nextRow || nextRow.district !== currentDistrict;

      if (isProjectChanged) {
        rows.push(
          <tr key={`proj-sub-${currentProject}-${index}`} style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan="6" className="text-end">Total for Project: {currentProject}</td>
            <td className="text-center">{projectTotal}</td>
            <td className="text-center">{projectEgg}</td>
            <td className="text-center">{projectNonEgg}</td>
            <td></td>
          </tr>
        );
        projectTotal = 0; projectEgg = 0; projectNonEgg = 0;
        if (nextRow) currentProject = nextRow.project_name;
      }

      if (isDistrictChanged) {
        rows.push(
          <tr key={`dist-sub-${currentDistrict}-${index}`} style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
            <td colSpan="6" className="text-end">Total for District: {currentDistrict}</td>
            <td className="text-center">{districtTotal}</td>
            <td className="text-center">{districtEgg}</td>
            <td className="text-center">{districtNonEgg}</td>
            <td></td>
          </tr>
        );
        districtTotal = 0; districtEgg = 0; districtNonEgg = 0;
        if (nextRow) currentDistrict = nextRow.district;
      }
    });
    return rows;
  };

  const renderPaginationItems = () => {
    const pages = [];
    const maxPageButtons = 5; // Number of page buttons to show (excluding First/Last/Prev/Next/Ellipses)
    const halfMaxPageButtons = Math.floor(maxPageButtons / 2);

    if (totalPages <= maxPageButtons + 2) { // If total pages are few, show all
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
    } else {
      // Page 1
      pages.push(
        <Pagination.Item key={1} active={1 === currentPage} onClick={() => setCurrentPage(1)}>1</Pagination.Item>
      );

      // Start ellipsis
      if (currentPage > halfMaxPageButtons + 2) {
        pages.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
      }

      // Pages around current page
      let startPage = Math.max(2, currentPage - halfMaxPageButtons);
      let endPage = Math.min(totalPages - 1, currentPage + halfMaxPageButtons);

      // Adjust start/end if near boundaries
      if (currentPage <= halfMaxPageButtons + 1) {
        endPage = maxPageButtons;
      } else if (currentPage >= totalPages - halfMaxPageButtons) {
        startPage = totalPages - maxPageButtons + 1;
      }

      for (let page = startPage; page <= endPage; page++) {
        pages.push(
          <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
            {page}
          </Pagination.Item>
        );
      }

      // End ellipsis
      if (currentPage < totalPages - halfMaxPageButtons - 1) {
        pages.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
      }

      // Last page
      pages.push(
        <Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => setCurrentPage(totalPages)}>{totalPages}</Pagination.Item>
      );
    }

    return pages;
  };

  return (
    <div className="dashboard-container" style={{ backgroundColor: "#f4f7f6" }}>
      <DirectorLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      
      <div className="main-content-dash">
        <DirectorHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <Container fluid className="mt-3">
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: "#004d4d", letterSpacing: "1px" }}>
              Mahila Poshan Demand Data | Sector wise
            </h2>
            <div style={{ height: "3px", width: "80px", backgroundColor: "#fd7e14", margin: "10px auto" }}></div>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <Row className="g-3 align-items-end justify-content-center">
                <Col md={3}>
                  <Form.Label className="fw-bold small">Choose Financial Year</Form.Label>
                  <Form.Select size="sm" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                    <option value="All">All Financial Years</option>
                    {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-bold small">Choose Quarter</Form.Label>
                  <Form.Select size="sm" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                    <option value="All">All Quarters</option>
                    <option value="Apr-May-June">Apr-May-June</option>
                    <option value="July-Aug-Sept">July-Aug-Sept</option>
                    <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                    <option value="Jan-Feb-March">Jan-Feb-March</option>
                  </Form.Select>
                </Col>
                <Col md="auto">
                  <Button variant="warning" size="sm" className="px-4 fw-bold text-white shadow-sm" onClick={handleFilter} disabled={loading} style={{ backgroundColor: "#fd7e14", border: "none" }}>
                    Filter Now
                  </Button>
                </Col>
              </Row>
              <div className="text-center mt-3">
                <h6 className="mb-0">
                  For the year : <span className="text-danger fw-bold">{financialYear}</span> and Quarter : <span className="text-danger fw-bold">{quarter}</span>
                </h6>
              </div>
            </Card.Body>
          </Card>

          <div className="bg-white p-3 rounded shadow-sm">
            <Row className="mb-3 align-items-center">
              <Col md={6} className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" className="px-3"><FaCopy className="me-1" /> Copy</Button>
                <Button variant="outline-secondary" size="sm" className="px-3"><FaFileExcel className="me-1" /> Excel</Button>
                <Button variant="outline-secondary" size="sm" className="px-3"><FaFilePdf className="me-1" /> PDF</Button>
                <Button variant="outline-secondary" size="sm" className="px-3"><FaColumns className="me-1" /> Column visibility</Button>
              </Col>
              <Col md={6}>
                <InputGroup size="sm" className="justify-content-end">
                  <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                  <Form.Control placeholder="Search..." className="border-start-0" style={{ maxWidth: "250px" }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </InputGroup>
              </Col>
            </Row>

            <div className="table-responsive">
              <Table striped bordered hover size="sm" className="mb-0">
                <thead style={{ backgroundColor: "#004d4d", color: "#fff" }}>
                  <tr className="text-center">
                    <th className="py-2">S.no</th>
                    <th className="py-2">District</th>
                    <th className="py-2">Project</th>
                    <th className="py-2">Sector</th>
                    <th className="py-2">Financial Year</th>
                    <th className="py-2">Quarter</th>
                    <th className="py-2">Total Beneficiary</th>
                    <th className="py-2">Egg Beneficiary</th>
                    <th className="py-2">Non Egg Eating Beneficiary</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="10" className="text-center py-5"><Spinner animation="border" variant="teal" /></td></tr>
                  ) : filteredData.length > 0 ? (
                    renderTableRows(
                      filteredData.length > entriesPerPage
                        ? filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
                        : filteredData
                    )
                  ) : (
                    <tr><td colSpan="10" className="text-center py-4 text-muted">No records found.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">
                Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredData.length || totalEntries)} of {filteredData.length || totalEntries} entries
              </div>
              <Pagination size="sm" className="mb-0">
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                {renderPaginationItems()}
                <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default DirMahilaPoshanDemandSector;
