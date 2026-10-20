import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { CONTACT, telHref } from '../../utils/contact';
import logo from '../../assets/gmc-logo.png';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-inner">
          <div className="footer-col">
            <Link to="/" aria-label="GMC Lanka home" className="footer-logo-plate" style={{ width: 'fit-content' }}>
              <img src={logo} alt="GMC Lanka" style={{ height: 52, width: 'auto', display: 'block' }} />
            </Link>
            <h4>Shop</h4>
            <Link to="/products">All products</Link>
            <Link to="/orders">My orders</Link>
            <Link to="/appointments">Book a consultation</Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact us</Link>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <a className="footer-contact-item" href={`mailto:${CONTACT.email}`}>
              <FiMail size={16} /> <span>{CONTACT.email}</span>
            </a>
            <a className="footer-contact-item" href={telHref(CONTACT.phone)}>
              <FiPhone size={16} /> <span>{CONTACT.phone}</span>
            </a>
            <div className="footer-contact-item">
              <FiMapPin size={16} />
              <span>
                {CONTACT.addressLines.map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">© {new Date().getFullYear()} GMC Lanka. Engineered for Excellence.</div>
      </div>
    </footer>
  );
}
