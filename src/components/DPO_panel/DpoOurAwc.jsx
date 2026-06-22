import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Card,
  Spinner,
  Table,
  Pagination,
  Button,
  Form,
  Modal,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaColumns } from "react-icons/fa";
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
  const rowsPerPage = 50;

  // Column Visibility State (object style like DemandMahalakshmi)
  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    awc_code: true,
    awc_name: true,
    awc_type: true,
    code1: true,
    sector: true,
    project: true,
    district_name: true,
  });

  const columns = [
    { key: "sno", label: "S.No" },
    { key: "awc_code", label: "AWC Code" },
    { key: "awc_name", label: "AWC" },
    { key: "awc_type", label: "AWC Type" },
    { key: "code1", label: "Grant" },
    { key: "sector", label: "Sector Name" },
    { key: "project", label: "Project Name" },
    { key: "district_name", label: "District" },
  ];

  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const tableRef = useRef(null);

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
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            err.message
        );
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

  // ─── COPY to Clipboard (DemandMahalakshmi style) ───
  const handleCopy = async () => {
    if (awcData.length === 0) return;
    const mHeaders = columns
      .filter((c) => visibleColumns[c.key])
      .map((c) => c.label);
    const mRows = awcData.map((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(startIndex + idx + 1);
      if (visibleColumns.awc_code) row.push(item.awc_code || "-");
      if (visibleColumns.awc_name) row.push(item.awc_name || "-");
      if (visibleColumns.awc_type) row.push(item.awc_type || "-");
      if (visibleColumns.code1) row.push(item.code1 || "-");
      if (visibleColumns.sector) row.push(item.sector || "-");
      if (visibleColumns.project) row.push(item.project || "-");
      if (visibleColumns.district_name) row.push(item.district_name || "-");
      return row.join("\t");
    });
    const text =
      "Anganwadi Centers List\n" +
      [mHeaders.join("\t"), ...mRows].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── EXCEL Export (DemandMahalakshmi style) ───
  const handleExcel = () => {
    if (awcData.length === 0) return;
    const mHeaders = columns
      .filter((c) => visibleColumns[c.key])
      .map((c) => c.label);
    let csv =
      "Anganwadi Centers List\n" + mHeaders.join(",") + "\n";
    awcData.forEach((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(startIndex + idx + 1);
      if (visibleColumns.awc_code) row.push(`"${item.awc_code || "-"}"`);
      if (visibleColumns.awc_name) row.push(`"${item.awc_name || "-"}"`);
      if (visibleColumns.awc_type) row.push(`"${item.awc_type || "-"}"`);
      if (visibleColumns.code1) row.push(`"${item.code1 || "-"}"`);
      if (visibleColumns.sector) row.push(`"${item.sector || "-"}"`);
      if (visibleColumns.project) row.push(`"${item.project || "-"}"`);
      if (visibleColumns.district_name)
        row.push(`"${item.district_name || "-"}"`);
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `AWC_List_${district || "Export"}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
  };

  // ─── PDF Export (DemandMahalakshmi style) ───
  const handlePDF = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    const mHeaders = columns
      .filter((c) => visibleColumns[c.key])
      .map((c) => `<th>${c.label}</th>`)
      .join("");
    const mRows = awcData
      .map((item, idx) => {
        let row = "<tr>";
        if (visibleColumns.sno) row += `<td>${startIndex + idx + 1}</td>`;
        if (visibleColumns.awc_code)
          row += `<td>${item.awc_code || "-"}</td>`;
        if (visibleColumns.awc_name)
          row += `<td>${item.awc_name || "-"}</td>`;
        if (visibleColumns.awc_type)
          row += `<td>${item.awc_type || "-"}</td>`;
        if (visibleColumns.code1) row += `<td>${item.code1 || "-"}</td>`;
        if (visibleColumns.sector) row += `<td>${item.sector || "-"}</td>`;
        if (visibleColumns.project) row += `<td>${item.project || "-"}</td>`;
        if (visibleColumns.district_name)
          row += `<td>${item.district_name || "-"}</td>`;
        row += "</tr>";
        return row;
      })
      .join("");
    printWindow.document.write(`
      <html>
        <head><title>Report</title><style>
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
          h2, h4 { text-align: center; font-family: sans-serif; }
        </style></head>
        <body>
          <h2>Anganwadi Centers</h2>
          <h4>District: ${district || "-"} ${districtCode ? `(${districtCode})` : ""} | Total AWCs: ${totalCount} | Date: ${new Date().toLocaleDateString()}</h4>
          <table><thead><tr>${mHeaders}</tr></thead><tbody>${mRows}</tbody></table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ─── Pagination Logic ───
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

  // ─── Render Cell ───
  const renderCell = (row, col, index) => {
    const val = (() => {
      switch (col.key) {
        case "sno":
          return startIndex + index + 1;
        case "awc_code":
          return row.awc_code || "";
        case "awc_name":
          return row.awc_name || "";
        case "awc_type":
          return row.awc_type || "";
        case "code1":
          return row.code1 || "";
        case "sector":
          return row.sector || "";
        case "project":
          return row.project || "";
        case "district_name":
          return row.district_name || "";
        default:
          return "";
      }
    })();

    if (col.key === "awc_name" || col.key === "sector" || col.key === "project") {
      return <td className="text-start">{val}</td>;
    }
    return <td>{val}</td>;
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
          <div className="main-heading mb-4">
            <h3 className="fw-bold mb-2">Anganwadi Centers</h3>
            <p className="text-muted mb-0">
              District: {district || "-"}{" "}
              {districtCode ? `(${districtCode})` : ""} | Total AWCs:{" "}
              {totalCount}
            </p>
          </div>

          {error && <div className="alert alert-danger mb-3">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <>
              {/* ─── Toolbar Buttons (DemandMahalakshmi style) ─── */}
              <Row className="mb-3 align-items-center">
                <Col md={6} className="d-flex gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    disabled={awcData.length === 0}
                  >
                    {copySuccess ? (
                      <Badge bg="success">Copied!</Badge>
                    ) : (
                      <>
                        <FaCopy className="me-1" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExcel}
                    disabled={awcData.length === 0}
                  >
                    <FaFileExcel className="me-1" /> Excel
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePDF}
                    disabled={awcData.length === 0}
                  >
                    <FaFilePdf className="me-1" /> PDF
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowColumnModal(true)}
                  >
                    <FaColumns className="me-1" /> Column visibility
                  </Button>
                </Col>
              </Row>

              {/* ─── Table Card ─── */}
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table
                      ref={tableRef}
                      striped
                      bordered
                      hover
                      className="mb-0 text-center align-middle"
                      size="sm"
                    >
                      <thead className="table-light">
                        <tr>
                          {visibleColumns.sno && <th>S.No</th>}
                          {visibleColumns.awc_code && <th>AWC Code</th>}
                          {visibleColumns.awc_name && <th>AWC</th>}
                          {visibleColumns.awc_type && <th>AWC Type</th>}
                          {visibleColumns.code1 && <th>Grant</th>}
                          {visibleColumns.sector && <th>Sector Name</th>}
                          {visibleColumns.project && <th>Project Name</th>}
                          {visibleColumns.district_name && <th>District</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={
                                Object.values(visibleColumns).filter(Boolean)
                                  .length
                              }
                              className="text-center text-muted py-4"
                            >
                              No AWC data found
                            </td>
                          </tr>
                        ) : (
                          paginatedData.map((row, index) => (
                            <tr key={row.awc_code || index}>
                              {visibleColumns.sno && (
                                <td>{startIndex + index + 1}</td>
                              )}
                              {visibleColumns.awc_code && (
                                <td>{row.awc_code || ""}</td>
                              )}
                              {visibleColumns.awc_name && (
                                <td className="text-start">
                                  {row.awc_name || ""}
                                </td>
                              )}
                              {visibleColumns.awc_type && (
                                <td>{row.awc_type || ""}</td>
                              )}
                              {visibleColumns.code1 && (
                                <td>{row.code1 || ""}</td>
                              )}
                              {visibleColumns.sector && (
                                <td className="text-start">
                                  {row.sector || ""}
                                </td>
                              )}
                              {visibleColumns.project && (
                                <td className="text-start">
                                  {row.project || ""}
                                </td>
                              )}
                              {visibleColumns.district_name && (
                                <td>{row.district_name || ""}</td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>

                {awcData.length > 0 && (
                  <Card.Footer className="bg-white border-0 py-2">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <small className="text-muted">
                        Showing{" "}
                        {awcData.length === 0
                          ? 0
                          : startIndex + 1}{" "}
                        to {Math.min(endIndex, awcData.length)} of{" "}
                        {awcData.length} entries
                      </small>
                      <Pagination size="sm" className="mb-0">
                        <Pagination.First
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(1)}
                        />
                        <Pagination.Prev
                          disabled={currentPage === 1}
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.max(1, page - 1)
                            )
                          }
                        />

                        {paginationItems.map((item) => {
                          if (
                            item === "start-ellipsis" ||
                            item === "end-ellipsis"
                          ) {
                            return (
                              <Pagination.Ellipsis
                                key={item}
                                disabled
                              />
                            );
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
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.min(totalPages, page + 1)
                            )
                          }
                        />
                        <Pagination.Last
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                        />
                      </Pagination>
                    </div>
                  </Card.Footer>
                )}
              </Card>
            </>
          )}
        </Container>
      </div>

      {/* ─── Column Visibility Modal (DemandMahalakshmi style) ─── */}
      <Modal
        show={showColumnModal}
        onHide={() => setShowColumnModal(false)}
        size="sm"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px" }}>
            Column Visibility
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Check
            type="checkbox"
            label="Select All"
            className="mb-2 fw-bold border-bottom pb-2"
            checked={Object.values(visibleColumns).every((val) => val)}
            onChange={(e) => {
              const isChecked = e.target.checked;
              const newVisibility = {};
              columns.forEach((col) => {
                newVisibility[col.key] = isChecked;
              });
              setVisibleColumns(newVisibility);
            }}
          />
          {columns.map((col) => (
            <Form.Check
              key={col.key}
              type="checkbox"
              label={col.label}
              checked={visibleColumns[col.key]}
              onChange={() =>
                setVisibleColumns((prev) => ({
                  ...prev,
                  [col.key]: !prev[col.key],
                }))
              }
            />
          ))}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DpoOurAwc;