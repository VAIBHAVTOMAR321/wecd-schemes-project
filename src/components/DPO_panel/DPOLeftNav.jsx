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
  FaClock
} from "react-icons/fa";
import axios from "axios";

import "../../assets/css/supervisorleftnav.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaInfoCircle,
  FaBullseye,
  
} from "react-icons/fa";

import { useAuth } from "../all_login/AuthContext";


const DPOLeftNav = ({ sidebarOpen, setSidebarOpen, isMobile, isTablet, onNavClick }) => {
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
        path: "/DPODashboard",
        active: true,
      },

       {
        icon: <FaTachometerAlt />,
        label: "Our Projects  ",
        path: "#",
   
      },
      {
        icon: <FaTachometerAlt />,
        label: "Our Sectors  ",
        path: "#",
     
      },
       {
        icon: <FaTachometerAlt />,
        label: "Our AWC Centers  ",
        path: "#",
      
      },
      {
        icon: <FaTachometerAlt />,
        label: "AWC Kalyan Kosh    ",
        path: "#",
      
      },
      {
        icon: <FaTachometerAlt />,
        label: " Mahalaxmi Beneficiary     ",
        path: "#",
   
      },
    
     
  {
    icon: <FaUsers />,
    label: "Demand Request",
    submenu: [
      {
        label: "Mahalakshmi Kit",
        path: "#",
        icon: <FaPlusSquare />,
      },
       {
        label: "Mahila Poshan",
        path: "#",
        icon: <FaPlusSquare />,
      },
       {
        label: "Bal Poshan",
        path: "#",
        icon: <FaPlusSquare />,
      },
      {
        label: "Anchal Amrit",
        path: "#",
        icon: <FaPlusSquare />,
      },
    ],
  },

   {
    icon: <FaUsers />,
    label: "Demand & Distribution",
    submenu: [
      {
        label: "Mahila Poshan",
        path: "#",
        icon: <FaPlusSquare />,
        submenu: [
          {
            label: "Project Wise",
            path: "#",
          },
          {
            label: "District Wise",
            path: "#",
          },
        ],
      },
      {
        label: "Bal Poshan",
        path: "#",
        icon: <FaPlusSquare />,
        submenu: [
          {
            label: "Project Wise",
            path: "#",
          },
          {
            label: "District Wise",
            path: "#",
          },
        ],
      },
      {
        label: "Mahalaxmi Kit",
        path: "#",
        icon: <FaPlusSquare />,
        submenu: [
          {
            label: "Project Wise",
            path: "#",
          },
          {
            label: "District Wise",
            path: "#",
          },
        ],
      },
    ],
  },

      {
        icon: <FaComments />,
        label: "Employee Details",
        path: "#",
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
                  District Panel
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

export default DPOLeftNav;