import React from 'react'
import { Link } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'

function Footer() {
  const footerContent = {
   
    aboutText: "माता एवं शिशु के स्वास्थ्य एवं पोषण की निगरानी के लिए एक एकीकृत डैशबोर्ड। 1000 दिनों (गर्भावधि से 2 वर्ष तक) के दौरान की जाँच, पोषण एवं टीकाकरण की निगरानी।",
    quickLinks: [
      { path: "/", label: "होम" },
      { path: "/", label: "परिचय" },
      { path: "/", label: "सेवाएँ" },
      { path: "/", label: "संपर्क" }
    ],
    services: [
      { path: "/", label: "गर्भावधि सहायता" },
      { path: "/", label: "पोषण सहायता" },
      { path: "/", label: "टीकाकरण" },
      { path: "/", label: "हेल्पलाइन" }
    ],
    contact: {
      address: "स्वास्थ्य एवं परिवार कल्याण मंत्रालय, भारत सरकार",
      phone: "****-**-****",
      email: "****@****.in"
    },
    copyright: "© 2024 स्वास्थ्य एवं पोषण दशक।  सर्वाधिकार सुरक्षित।"
  }

  return (
    <footer className="gov-footer pt-5 pb-4">
      <Container>
        <Row className="g-4">
          <Col lg={4} md={6}>
            <div className="footer-brand mb-3">
              <div className="d-flex align-items-center gap-2 mb-3">
               
               
              </div>
              <p className="text-white-50 small mb-0">{footerContent.aboutText}</p>
            </div>
          </Col>

          <Col lg={2} md={6}>
            <h6 className="text-white fw-bold mb-3">त्वरित लिंक</h6>
            <ul className="list-unstyled">
              {footerContent.quickLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="text-white-50 text-decoration-none small hover-opacity">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          <Col lg={3} md={6}>
            <h6 className="text-white fw-bold mb-3">सेवाएँ</h6>
            <ul className="list-unstyled">
              {footerContent.services.map((service, index) => (
                <li key={index}>
                  <Link to={service.path} className="text-white-50 text-decoration-none small hover-opacity">
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          <Col lg={3} md={6}>
            <h6 className="text-white fw-bold mb-3">संपर्क</h6>
            <div className="text-white-50 small">
              <p className="mb-2">{footerContent.contact.address}</p>
              <p className="mb-1">
                <i className="bi bi-telephone me-2"></i>
                {footerContent.contact.phone}
              </p>
              <p className="mb-0">
                <i className="bi bi-envelope me-2"></i>
                {footerContent.contact.email}
              </p>
            </div>
          </Col>
        </Row>

        <hr className="my-4 opacity-25" />

        <Row className="align-items-center">
          <Col md={6}>
            <p className="text-white-50 small mb-0 mb-md-0">
              {footerContent.copyright}
            </p>
          </Col>
          <Col md={6} className="text-md-end mt-3 mt-md-0">
            <div className="d-flex gap-3 justify-content-md-end flex-wrap">
              <Link to="/privacy" className="text-white-50 text-decoration-none small hover-opacity">
                प्राइवेसी पॉलिसी
              </Link>
              <Link to="/terms" className="text-white-50 text-decoration-none small hover-opacity">
                उपयोग की शर्तें
              </Link>
              <Link to="/disclaimer" className="text-white-50 text-decoration-none small hover-opacity">
                अस्वीकरण
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer