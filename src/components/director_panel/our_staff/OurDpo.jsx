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
  FormControl,
} from "react-bootstrap";
import {
  FaBuilding,
  FaMedal,
  FaSearch,
  FaCopy,
  FaFileExcel,
  FaFilePdf,
  FaColumns,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { useAuth } from "../../all_login/AuthContext";
import "../../../assets/css/supervisorleftnav.css";
import "../../../assets/css/dashboard.css";
import DirectorLeftNav from "../DirectorLeftNav";
import DirectorHeader from "../DirectorHeader";

const OurDpo = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "district",
    direction: "asc",
  });
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const tableRef = useRef(null);

  const rowsPerPage = 10;

  // ─── Column Definition (DpoOurAwc style) ───
  const columns = [
    { key: "sno", label: "S.No", sortable: false },
    { key: "district", label: "District", sortable: true },
    { key: "code", label: "District Code", sortable: true },
    { key: "dpo_incharge", label: "DPO Incharge", sortable: false },
    { key: "dpo_mobile", label: "DPO Mobile", sortable: false },
    { key: "status", label: "Status", sortable: true, dataKey: "stat_fin" },
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      initial[col.key] = true;
    });
    return initial;
  });

  // ─── Fetch Data ───
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        "/director/districts/"
      );
      if (response.data?.success) {
        setData(response.data.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message
      );
      console.error("Error fetching districts:", err);
    } finally {
      setLoading(false);
    }
  };

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
    fetchData();
    return () => window.removeEventListener("resize", handleResize);
  }, [api]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ─── Sort Logic ───
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ colKey }) => (
    <span className="ms-1" style={{ fontSize: "10px", color: "#94a3b8" }}>
      {sortConfig.key === colKey ? (
        sortConfig.direction === "asc" ? (
          <FaArrowUp />
        ) : (
          <FaArrowDown />
        )
      ) : (
        <>
          <FaArrowUp />
          <FaArrowDown />
        </>
      )}
    </span>
  );

  // ─── Filtered & Sorted Data ───
  const filteredData = (() => {
    let result = data.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code?.includes(searchTerm);
      return matchesSearch;
    });

    return result.sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      return sortConfig.direction === "asc"
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });
  })();

  // ─── Pagination ───
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

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

  // ─── Helper: get value from row for a column ───
  const getCellValue = (row, col, index) => {
    const dataKey = col.dataKey || col.key;
    switch (col.key) {
      case "sno":
        return startIndex + index + 1;
      case "dpo_incharge":
        return row.dpo_incharge || "-";
      case "dpo_mobile":
        return row.dpo_mobile || "-";
      case "status":
        return row[dataKey] || "active";
      default:
        return row[dataKey] || "";
    }
  };

  // ─── COPY to Clipboard (DpoOurAwc style) ───
  const handleCopy = async () => {
    if (filteredData.length === 0) return;
    const mHeaders = columns
      .filter((c) => visibleColumns[c.key])
      .map((c) => c.label);
    const mRows = filteredData.map((item, idx) => {
      const row = [];
      columns
        .filter((c) => visibleColumns[c.key])
        .forEach((col) => {
          row.push(getCellValue(item, col, idx));
        });
      return row.join("\t");
    });
    const text =
      "District | DPO Incharge Report\n" +
      [mHeaders.join("\t"), ...mRows].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── EXCEL Export (DpoOurAwc style) ───
  const handleExcel = () => {
    if (filteredData.length === 0) return;
    const mHeaders = columns
      .filter((c) => visibleColumns[c.key])
      .map((c) => c.label);
    let csv =
      "District | DPO Incharge Report\n" + mHeaders.join(",") + "\n";
    filteredData.forEach((item, idx) => {
      const row = [];
      columns
        .filter((c) => visibleColumns[c.key])
        .forEach((col) => {
          const val = getCellValue(item, col, idx);
          row.push(`"${val}"`);
        });
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DPO_Districts_Report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
  };

  // ─── PDF Export (DpoOurAwc style) ───
  const handlePDF = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    const mHeaders = columns
      .filter((c) => visibleColumns[c.key])
      .map((c) => `<th>${c.label}</th>`)
      .join("");
    const mRows = filteredData
      .map((item, idx) => {
        let row = "<tr>";
        columns
          .filter((c) => visibleColumns[c.key])
          .forEach((col) => {
            const val = getCellValue(item, col, idx);
            row += `<td>${val}</td>`;
          });
        row += "</tr>";
        return row;
      })
      .join("");
    printWindow.document.write(`
      <html>
        <head><title>Report</title><style>
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
          h2, h4 { text-align: center; font-family: sans-serif; }
          .text-lowercase { text-transform: lowercase; }
        </style></head>
        <body>
          <h2>District | DPO Incharge Report</h2>
          <h4>Total Districts: ${filteredData.length} | Date: ${new Date().toLocaleDateString()}</h4>
          <table><thead><tr>${mHeaders}</tr></thead><tbody>${mRows}</tbody></table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ─── Render Cell ───
  const renderCell = (row, col, index) => {
    const val = getCellValue(row, col, index);
    if (col.key === "status") {
      return (
        <td>
          <span className="text-lowercase text-muted">{val}</span>
        </td>
      );
    }
    if (col.key === "district") {
      return <td>{val}</td>;
    }
    return <td>{val}</td>;
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
          <div className="main-heading mb-4 d-flex align-items-center">
            <div
              className="p-2 rounded me-3 d-flex align-items-center justify-content-center"
              style={{
                backgroundColor: "#e0f2f1",
                width: "40px",
                height: "40px",
              }}
            >
              <FaBuilding style={{ color: "#14b8a6" }} size={18} />
              <FaMedal
                style={{ color: "#14b8a6", marginLeft: "-4px", marginTop: "4px" }}
                size={12}
              />
            </div>
            <div>
              <h3 className="fw-bold mb-0" style={{ letterSpacing: "-0.5px" }}>
                District | DPO Incharge
              </h3>
              <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
                Total Districts: {data.length}
              </p>
            </div>
          </div>

          {error && <div className="alert alert-danger mb-3">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              {/* ─── Toolbar Buttons (DpoOurAwc style) ─── */}
              <Row className="mb-3 align-items-center">
                <Col md={6} className="d-flex gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    disabled={filteredData.length === 0}
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
                    disabled={filteredData.length === 0}
                  >
                    <FaFileExcel className="me-1" /> Excel
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePDF}
                    disabled={filteredData.length === 0}
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
                <Col
                  md={6}
                  className="d-flex align-items-center justify-content-md-end gap-2 mt-2 mt-md-0"
                >
                  <span
                    className="small fw-bold text-muted"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <FaSearch className="me-1" />
                    Search:
                  </span>
                  <FormControl
                    size="sm"
                    style={{ width: "200px" }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="District or code..."
                  />
                </Col>
              </Row>

              {/* ─── Table Card (DpoOurAwc style) ─── */}
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
                      style={{ fontSize: "13px" }}
                    >
                      <thead className="table-light">
                        <tr>
                          {columns
                            .filter((c) => visibleColumns[c.key])
                            .map((col) => (
                              <th
                                key={col.key}
                                style={
                                  col.sortable
                                    ? { cursor: "pointer", userSelect: "none" }
                                    : {}
                                }
                                onClick={() =>
                                  col.sortable && handleSort(col.dataKey || col.key)
                                }
                              >
                                {col.label}
                                {col.sortable && (
                                  <SortIcon colKey={col.dataKey || col.key} />
                                )}
                              </th>
                            ))}
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
                              No district data found
                            </td>
                          </tr>
                        ) : (
                          paginatedData.map((row, index) => (
                            <tr key={row.code || index}>
                              {columns
                                .filter((c) => visibleColumns[c.key])
                                .map((col) => renderCell(row, col, index))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>

                {filteredData.length > 0 && (
                  <Card.Footer className="bg-white border-0 py-2">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <small className="text-muted">
                        Showing{" "}
                        {filteredData.length === 0
                          ? 0
                          : startIndex + 1}{" "}
                        to {Math.min(endIndex, filteredData.length)} of{" "}
                        {filteredData.length.toLocaleString()} entries
                      </small>
                      <Pagination size="sm" className="mb-0">
                        <Pagination.First
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(1)}
                        />
                        <Pagination.Prev
                          disabled={currentPage === 1}
                          onClick={() =>
                            setCurrentPage((page) => Math.max(1, page - 1))
                          }
                        />

                        {paginationItems.map((item) => {
                          if (
                            item === "start-ellipsis" ||
                            item === "end-ellipsis"
                          ) {
                            return (
                              <Pagination.Ellipsis key={item} disabled />
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

      {/* ─── Column Visibility Modal (DpoOurAwc style with Select All) ─── */}
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

export default OurDpo;