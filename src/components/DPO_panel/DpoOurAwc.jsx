import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Pagination } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import DPOHeader from "./DPOHeader";
import DPOLeftNav from "./DPOLeftNav";

const DpoOurAwc = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api } = useAuth();
  const [awcData, setAwcData] = useState([]);
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
    const fetchAwcData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/dpo-awc-dropdown/");
        const payload = response.data || {};
        const data = Array.isArray(payload.data) ? payload.data : [];
        setDistrict(payload.district || "");
        setDistrictCode(payload.district_code || "");
        setTotalCount(payload.count || data.length);
        setAwcData(data);
      } catch (err) {
        setError(err.response?.data?.error || err.response?.data?.message || err.message);
        console.error("Failed to fetch DPO AWC dropdown data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAwcData();
  }, [api]);

  useEffect(() => {
    setCurrentPage(1);
  }, [awcData]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const totalPages = Math.max(1, Math.ceil(awcData.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = awcData.slice(startIndex, endIndex);

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    items.push(1);

    let start = Math.max(2, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, currentPage + Math.floor(maxVisible / 2));

    if (currentPage <= Math.floor(maxVisible / 2) + 1) {
      end = Math.min(totalPages - 1, maxVisible);
    }
    if (currentPage >= totalPages - Math.floor(maxVisible / 2)) {
      start = Math.max(2, totalPages - maxVisible + 1);
    }

    if (start > 2) {
      items.push("start-ellipsis");
    }

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (end < totalPages - 1) {
      items.push("end-ellipsis");
    }

    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  };

  const paginationItems = getPaginationItems();

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
              District: {district || "-"} {districtCode ? `(${districtCode})` : ""} | Total AWCs: {totalCount}
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
                        <th>AWC Code</th>
                        <th>AWC</th>
                        <th>AWC Type</th>
                        <th>Grant</th>
                        <th>Sector Name</th>
                        <th>Project Name</th>
                        <th>District</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row, index) => (
                        <tr key={row.awc_code || index}>
                          <td>{startIndex + index + 1}</td>
                          <td>{row.awc_code}</td>
                          <td className="text-start">{row.awc_name}</td>
                          <td>
                            <span className={`badge ${row.awc_type === "AWC" ? "bg-primary" : "bg-secondary"}`}>
                              {row.awc_type}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${row.code1?.startsWith("SCP") ? "bg-warning text-dark" : "bg-info"}`}>
                              {row.code1}
                            </span>
                          </td>
                          <td className="text-start">{row.sector}</td>
                          <td className="text-start">{row.project}</td>
                          <td>{row.district_name}</td>
                        </tr>
                      ))}
                      {paginatedData.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center text-muted py-4">
                            No AWC data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {awcData.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-3 flex-wrap gap-2">
                    <span className="small text-muted">
                      Showing {startIndex + 1}-{Math.min(endIndex, awcData.length)} of {awcData.length}
                    </span>
                    <Pagination size="sm" className="mb-0">
                      <Pagination.First
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      />
                      <Pagination.Prev
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      />

                      {paginationItems.map((item) => {
                        if (item === "start-ellipsis" || item === "end-ellipsis") {
                          return <Pagination.Ellipsis key={item} disabled />;
                        }
                        return (
                          <Pagination.Item
                            key={item}
                            active={item === currentPage}
                            onClick={() => setCurrentPage(item)}
                          >
                            {item}
                          </Pagination.Item>
                        );
                      })}

                      <Pagination.Next
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      />
                      <Pagination.Last
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
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

export default DpoOurAwc;