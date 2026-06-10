import React, { useState, useEffect } from "react";
import { Nav, Offcanvas, Collapse } from "react-bootstrap";
import {
  FaTachometerAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight,
  FaImages,
  FaUsers,
  FaBook,
  FaBuilding,
  FaImage,
  FaTools,
  FaComments,
  FaCube,
  FaProjectDiagram,
  FaServer,
  FaUserCircle,
  FaCalendarAlt,
  FaPlusSquare,
  FaEdit,
  FaMusic,
  FaGlassCheers,
  FaIndustry,
  FaQuestionCircle,
  FaTrophy,
  FaBriefcase,
  FaGraduationCap,
  FaTasks,
  FaClock,
  FaKey,
  FaFemale,
  FaChild,
  FaBox,
  FaLeaf,
  FaGift
} from "react-icons/fa";
import axios from "axios";

import "../../assets/css/supervisorleftnav.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaInfoCircle,
  FaBullseye,
  
} from "react-icons/fa";

import { useAuth } from "../all_login/AuthContext";


const CDPOLeftNav = ({ sidebarOpen, setSidebarOpen, isMobile, isTablet, onNavClick }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userRole, setUserRole] = useState(user ? user.role : null);
  const [openSubmenu, setOpenSubmenu] = useState([]);
  const toggleSubmenu = (index) => {
    setOpenSubmenu((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Automatically close sidebar when navigating on mobile or tablet views
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile, isTablet, setSidebarOpen]);

  const handleItemClick = (e, path, isActive) => {
    if (onNavClick) {
      e.preventDefault();
      onNavClick(path);
    } else if (!isActive) {
      // Only close sidebar if navigating to a different page
      setSidebarOpen(false);
    }
  };

  const menuItems = [
       {
         icon: <FaTachometerAlt />,
         label: "DashBoard",
         path: "/CDPODashboard",
         active: true,
       },
       {
         icon: <FaKey />,
         label: "Change Password",
         path: "/CDPOProfile",
       },
       {
         icon: <FaUsers />,
         label: "State Schemes",
         submenu: [
           {
             icon: <FaFemale />,
             label: "Mahila Poshan",
        path: "#",
        icon: <FaPlusSquare />,
        submenu: [
          {
            label: "Demand",
            path: "/DemandMahilaPoshanProject",
          },
          {
            label: "Distribution",
            path: "/Stockmahila",
          },
        ],
      },
      {
        icon: <FaChild />,
        label: "Bal Poshan",
        path: "#",
        icon: <FaPlusSquare />,
        submenu: [
          {
            label: "Demand",
            path: "/DemandBalPoshanProject",
          },
          {
            label: "Distribution",
            path: "/StockBal",
          },
        ],
      },
      {
        label: "Mahalaxmi Kit",
        path: "#",
        icon: <FaPlusSquare />,
       submenu: [
          {
            label: "Demand",
            path: "/MahalaxmiYear",
          },
          {
            label: "Distribution",
            path: "/StockMahalakshmi",
          },
          {
            label: "Request",
            path: "/MahalakshmiBen",
          },
          {
            label: "Beneficiary",
            path: "/OurBenReq",
          },
        ],
      },

         {
        label: "Anchal Amrit",
        path: "#",
        icon: <FaPlusSquare />,
       submenu: [
          {
            label: "Demand",
            path: "/DemandAmritAnchalProject",
          },
          {
            label: "Distribution",
            path: "/StockAnchal",
          },
        ],
      },
    ],
  },

    
      
       
      
     ];

  //  Auto-close sidebar when switching to mobile or tablet

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`user-left-nav ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        <div className="sidebar-header">
          {sidebarOpen ? (
            <div className="logo-container">
              <div className="logo">
                  Project Panel
              </div>
            </div>
          ) : (
            <div className="logo-container logo-collapsed">
            </div>
          )}
        </div>

        <Nav className="sidebar-nav flex-column">
          
         {menuItems
  .filter(item =>
    item.allowedRoles ? item.allowedRoles.includes(userRole) : true
  )
  .map((item, index) => (
    <div key={index}>
      {/* If submenu exists */}
      {item.submenu ? (
        <Nav.Link
          className={`nav-item ${item.active ? "active" : ""}`}
          onClick={() => toggleSubmenu(index)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-text">{item.label}</span>
          <span className="submenu-arrow">
            {openSubmenu.includes(index) ? <FaChevronDown /> : <FaChevronRight />}
          </span>
        </Nav.Link>
      ) : (
         <Link
           to={item.path}
           className={`nav-item nav-link ${item.active ? "active" : ""}`}
           onClick={(e) => handleItemClick(e, item.path, item.active)}
         >
           <span className="nav-icon">{item.icon}</span>
           <span className="nav-text">{item.label}</span>
         </Link>
      )}

      {/* Submenu */}
       {item.submenu && item.submenu.length > 0 && (
         <Collapse in={openSubmenu.includes(index)}>
           <div className="submenu-container-user">
             {item.submenu.map((subItem, subIndex) => {
               const subItemId = `${index}-${subIndex}`;
               return (
                 <div key={subIndex}>
                   {subItem.submenu ? (
                      <Nav.Link
                        className="submenu-item-user nav-link"
                        onClick={() => toggleSubmenu(subItemId)}
                      >
                        <span className="submenu-icon">{subItem.icon}</span>
                        <span className="nav-text br-text-sub">{subItem.label}</span>
                        <span className="submenu-arrow">
                          {openSubmenu.includes(subItemId) ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                      </Nav.Link>
                    ) : (
                      <Link
                        to={subItem.path}
                        className="submenu-item-user nav-link"
                        onClick={(e) => handleItemClick(e, subItem.path, false)}
                      >
                        <span className="submenu-icon">{subItem.icon}</span>
                        <span className="nav-text br-text-sub">{subItem.label}</span>
                      </Link>
                    )}
                    {/* Nested submenu collapse */}
                    {subItem.submenu && (
                      <Collapse in={openSubmenu.includes(subItemId)}>
                       <div className="submenu-container-user">
                         {subItem.submenu.map((nestedItem, nestedIndex) => (
                           <Link
                             key={nestedIndex}
                             to={nestedItem.path}
                             className="submenu-item-user nav-link"
                             onClick={(e) => handleItemClick(e, nestedItem.path, false)}
                           >
                             <span className="submenu-icon">{nestedItem.icon}</span>
                             <span className="nav-text br-text-sub">{nestedItem.label}</span>
                           </Link>
                         ))}
                       </div>
                     </Collapse>
                   )}
                 </div>
               );
             })}
           </div>
         </Collapse>
       )}
    </div>
  ))}

        </Nav>

        <div className="sidebar-footer">
          <Nav.Link
            className="nav-item logout-btn"
            onClick={() => {
              if (typeof logout === "function") {
                logout();
                navigate("/login");
              }
            }}
          >
            <span className="nav-icon">
              <FaSignOutAlt />
            </span>
            <span className="nav-text">Logout</span>
          </Nav.Link>
        </div>
      </div>

      {/*  Mobile / Tablet Sidebar (Offcanvas) */}
  <Offcanvas
  show={(isMobile || isTablet) && sidebarOpen}
  onHide={() => setSidebarOpen(false)}
  className="user-mobile-offcanvas"
  placement="start"
  backdrop={true}
  scroll={false}
  enforceFocus={false} //  ADD THIS LINE — fixes close button focus issue
>
  <Offcanvas.Header closeButton className="user-offcanvas-header">
    <Offcanvas.Title className="br-off-title">Menu</Offcanvas.Title>
  </Offcanvas.Header>

  <Offcanvas.Body className="user-offcanvas-body">
    <Nav className="flex-column">
      {menuItems.map((item, index) => (
        <div key={index}>
          {item.submenu ? (
            <Nav.Link
              className={`nav-item ${item.active ? "active" : ""}`}
              onClick={() => toggleSubmenu(index)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text br-nav-text-mob">{item.label}</span>
              <span className="submenu-arrow">
            {openSubmenu.includes(index) ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            </Nav.Link>
          ) : (
             <Link
               to={item.path}
               className={`nav-item nav-link ${item.active ? "active" : ""}`}
               onClick={(e) => handleItemClick(e, item.path, item.active)}
             >
               <span className="nav-icon">{item.icon}</span>
               <span className="nav-text br-nav-text-mob">{item.label}</span>
             </Link>
          )}

          {item.submenu && item.submenu.length > 0 && (
            <Collapse in={openSubmenu.includes(index)}>
              <div className="submenu-container-user">
                {item.submenu.map((subItem, subIndex) => {
                  const subItemId = `${index}-${subIndex}`;
                  return (
                    <div key={subIndex}>
                      {subItem.submenu ? (
                          <Nav.Link
                            className="submenu-item-user nav-link"
                            onClick={() => toggleSubmenu(subItemId)}
                          >
                            <span className="nav-text">{subItem.label}</span>
                            <span className="submenu-arrow">
                              {openSubmenu.includes(subItemId) ? <FaChevronDown /> : <FaChevronRight />}
                            </span>
                          </Nav.Link>
                      ) : (
                        <Link
                          to={subItem.path}
                          className="submenu-item nav-link"
                          onClick={(e) => handleItemClick(e, subItem.path, false)}
                        >
                          <span className="nav-text">{subItem.label}</span>
                        </Link>
                      )}
                      {subItem.submenu && (
                        <Collapse in={openSubmenu.includes(Number(subItemId))}>
                          <div className="submenu-container-user">
                            {subItem.submenu.map((nestedItem, nestedIndex) => (
                              <Link
                                key={nestedIndex}
                                to={nestedItem.path}
                                className="submenu-item nav-link"
                                onClick={(e) => handleItemClick(e, nestedItem.path, false)}
                              >
                                <span className="nav-text">{nestedItem.label}</span>
                              </Link>
                            ))}
                          </div>
                        </Collapse>
                      )}
                    </div>
                  );
                })}
              </div>
            </Collapse>
          )}
        </div>
      ))}
    </Nav>
  </Offcanvas.Body>
</Offcanvas>

    </>
  );
};

export default CDPOLeftNav;