import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { CONTACT } from '../../utils/contact';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-inner">
          <div className="footer-col">
            <h4>Shop</h4>
            <Link to="/">All products</Link>
            <Link to="/orders">My orders</Link>
            <Link to="/appointments">Book a consultation</Link>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <a className="footer-contact-item" href={`mailto:${CONTACT.email}`}><FiMail size={16} /> <span>{CONTACT.email}</span></a>
            <a className="footer-contact-item" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}><FiPhone size={16} /> <span>{CONTACT.phone}</span></a>
            <div className="footer-contact-item">
              <FiMapPin size={16} />
              <span>{CONTACT.addressLines.map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} GMC Lanka. Engineered for Excellence.
        </div>
      </div>
    </footer>
  );
}
