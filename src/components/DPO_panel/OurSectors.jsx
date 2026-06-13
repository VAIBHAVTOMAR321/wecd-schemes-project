import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Pagination } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import DPOHeader from "./DPOHeader";
import DPOLeftNav from "./DPOLeftNav";

const OurSectors = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api } = useAuth();
  const [sectorData, setSectorData] = useState([]);
  const [district, setDistrict] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

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
    const fetchSectorData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/dpo-sector-list/");
        const payload = response.data || {};
        const data = Array.isArray(payload.data) ? payload.data : [];
        setDistrict(payload.district || "");
        setDistrictCode(payload.district_code || "");
        setTotalCount(payload.count || data.length);
        setSectorData(data);
      } catch (err) {
        setError(err.response?.data?.error || err.response?.data?.message || err.message);
        console.error("Failed to fetch DPO sector data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSectorData();
  }, [api]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sectorData]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const totalPages = Math.max(1, Math.ceil(sectorData.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sectorData.slice(startIndex, endIndex);

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
          <div className="main-heading mb-4">
            <h3 className="fw-bold mb-2">Our Sectors</h3>
            <p className="text-muted mb-0">
              District: {district || "-"} {districtCode ? `(${districtCode})` : ""} | Total Sectors: {totalCount}
            </p>
          </div>

          {error && <div className="alert alert-danger mb-3">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table bordered hover className="mb-0 text-center align-middle" size="sm">
                    <thead className="table-light">
                      <tr>
                        <th>S.No</th>
                        <th>ID</th>
                        <th>SD Name</th>
                        <th>District</th>
                        <th>Project Code</th>
                        <th>Project Name</th>
                        <th>Sector</th>
                        <th>Sector Incharge</th>
                        <th>Incharge Mob</th>
                        <th>Updated On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row, index) => (
                        <tr key={row.id || index}>
                          <td>{startIndex + index + 1}</td>
                          <td>{row.id}</td>
                          <td>{row.sdname}</td>
                          <td>{row.district}</td>
                          <td>{row.project_code}</td>
                          <td>{row.project_name}</td>
                          <td>{row.sector}</td>
                          <td>{row.sector_incharge}</td>
                          <td>{row.incharge_mob}</td>
                          <td>{row.updated_on}</td>
                        </tr>
                      ))}
                      {paginatedData.length === 0 && (
                        <tr>
                          <td colSpan={10} className="text-center text-muted py-4">
                            No sector data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {sectorData.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <span className="small text-muted">
                      Showing {startIndex + 1}-{Math.min(endIndex, sectorData.length)} of {sectorData.length}
                    </span>
                    <Pagination size="sm" className="mb-0">
                      <Pagination.Prev
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      />
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      />
                    </Pagination>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>
    </div>
  );
};

export default OurSectors;
