import React from 'react'
import { Container } from 'react-bootstrap'
import "../../assets/css/footer.css";

function Footer() {
  return (
    <footer className="gov-footer pt-3 pb-3">
      <Container>
        <div className="text-center">
          <p className="text-white-50 small mb-0">
            © 2026 State Portal WECD Uttarakhand. Developed by BRAINROCK
          </p>
        </div>
      </Container>
    </footer>
  )
}

export default Footer