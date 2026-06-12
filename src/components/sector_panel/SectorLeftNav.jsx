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
   FaFemale,
   FaChild,
   FaTint,
   FaBox
   } from "react-icons/fa";
import axios from "axios";

import "../../assets/css/supervisorleftnav.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaInfoCircle,
  FaBullseye,
  
} from "react-icons/fa";

import { useAuth } from "../all_login/AuthContext";


const SupervisorLeftNav = ({ sidebarOpen, setSidebarOpen, isMobile, isTablet, onNavClick }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user ? user.role : null;
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const toggleSubmenu = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  const isItemActive = (item) => {
    if (item.path && item.path !== "#" && location.pathname === item.path) return true;
    if (item.submenu) {
      return item.submenu.some((sub) => {
        if (sub.path && sub.path !== "#" && location.pathname === sub.path) return true;
        if (sub.submenu) return sub.submenu.some((nested) => nested.path === location.pathname);
        return false;
      });
    }
    return false;
  };

  // Automatically close sidebar when navigating on mobile or tablet views
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile, isTablet, setSidebarOpen]);

  const handleItemClick = (e, path) => {
    if (onNavClick) {
      e.preventDefault();
      onNavClick(path);
    }
  };

const menuItems = [
    {
      icon: <FaTachometerAlt />,
      label: "डैशबोर्ड",
      path: "/SectorDashBoard",
      active: true,
    },
    {
      icon: <FaEdit />,
      label: "पासवर्ड बदलें",
      path: "/SectorProfile",
    },
    {
      icon: <FaBuilding />,
      label: "हमारे आंगनवाड़ी केंद्र",
      path: "/OurAwc",
    },
    {
      icon: <FaTasks />,
      label: "मांग दर्ज करें",
      submenu: [
        {
          label: "महिला पोषण",
          path: "/DemandPoshanFinal",
          icon: <FaFemale />,
        },
        {
          label: "बाल पोषण",
          path: "/DemandBalPoshan",
          icon: <FaChild />,
        },
        {
          label: "अंचल अमृत",
          path: "/DemandanchalAamrit",
          icon: <FaTint />,
        },
      ],
    },
    {
      icon: <FaServer />,
      label: "स्टॉक मैनेजर (वितरण)",
      submenu: [
        {
          label: "महिला पोषण",
          path: "/DistributionMahilaPoshFinal",
          icon: <FaFemale />,
        },
        {
          label: "बाल पोषण",
          path: "/DistributionBalPoshan",
          icon: <FaChild />,
        },
        {
          label: "महालक्ष्मी किट",
          path: "/MahalakshmiKit",
          icon: <FaBox />,
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
                  Sector Panel
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
    <div key={index} className={`nav-item-wrapper ${isItemActive(item) ? "active-parent" : ""}`}>
      {/* If submenu exists */}
      {item.submenu ? (
        <Nav.Link
          className={`nav-item ${isItemActive(item) ? "active" : ""}`}
          onClick={() => toggleSubmenu(index)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-text">{item.label}</span>
          <span className="submenu-arrow">
            {openSubmenu === index ? <FaChevronDown /> : <FaChevronRight />}
          </span>
        </Nav.Link>
      ) : (
         <Link
           to={item.path}
           className={`nav-item nav-link ${isItemActive(item) ? "active" : ""}`}
           onClick={(e) => handleItemClick(e, item.path)}
         >
           <span className="nav-icon">{item.icon}</span>
           <span className="nav-text">{item.label}</span>
         </Link>
      )}

      {/* Submenu */}
      {sidebarOpen && item.submenu && (
        <Collapse in={openSubmenu === index}>
          <div className="submenu-container-user">
            {item.submenu.map((subItem, subIndex) => (
                 <Link
                   key={subIndex}
                   to={subItem.path}
                   className={`submenu-item-user nav-link ${location.pathname === subItem.path ? "active" : ""}`}
                   onClick={(e) => handleItemClick(e, subItem.path)}
                 >
                   <span className="submenu-icon">{subItem.icon}</span>
                   <span className="nav-text br-text-sub">{subItem.label}</span>
                 </Link>
            ))}
          </div>
        </Collapse>
      )}

      {!sidebarOpen && !isMobile && !isTablet && (
        <div className="sidebar-flyout">
          <div className="flyout-header-title">{item.label}</div>
          {item.submenu && item.submenu.length > 0 && (
            <div className="flyout-body">
              {item.submenu.map((subItem, subIndex) => (
                <Link
                  key={subIndex}
                  to={subItem.path}
                  className={`flyout-item ${location.pathname === subItem.path ? "active" : ""}`}
                  onClick={(e) => handleItemClick(e, subItem.path)}
                >
                  {subItem.icon && <span className="flyout-icon-small">{subItem.icon}</span>}
                  <span>{subItem.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ))}

        </Nav>

        <div className="sidebar-footer">
          <div className="nav-item-wrapper">
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
          {!sidebarOpen && !isMobile && !isTablet && (
            <div className="sidebar-flyout">
              <div className="flyout-header-title">Logout</div>
            </div>
          )}
          </div>
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
                {openSubmenu === index ? <FaChevronDown /> : <FaChevronRight />}
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

          {item.submenu && (
            <Collapse in={openSubmenu === index}>
              <div className="submenu-container-user">
                {item.submenu.map((subItem, subIndex) => (
                   <Link
                     key={subIndex}
                     to={subItem.path}
                     className="submenu-item nav-link"
                     onClick={(e) => handleItemClick(e, subItem.path, false)}
                   >
                     <span className="nav-text">{subItem.label}</span>
                   </Link>
                ))}
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

export default SupervisorLeftNav;