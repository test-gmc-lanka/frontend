import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-inner">
          {/* Quick links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/">About Us</Link>
            <Link to="/">Our Services</Link>
            <Link to="/">CNC Machines</Link>
            <Link to="/">Wood Portfolio</Link>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-contact-item"><FiMail size={16} /> <span>contact@gmclanka.com</span></div>
            <div className="footer-contact-item"><FiPhone size={16} /> <span>+94 11 234 5678</span></div>
            <div className="footer-contact-item"><FiMapPin size={16} /> <span>123 Industrial Zone,<br />Colombo, Sri Lanka</span></div>
          </div>

          {/* Legal */}
          <div className="footer-col">
            <h4>Legal</h4>
            <Link to="/">Privacy Policy</Link>
            <Link to="/">Terms of Service</Link>
            <Link to="/">Cookie Policy</Link>
          </div>
        </div>

        <div className="footer-bottom">
          © 2024 GMC Lanka. Engineered for Excellence.
        </div>
      </div>
    </footer>
  );
}
