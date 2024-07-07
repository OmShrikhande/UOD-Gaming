import React from 'react';
import './Foote.css'
import facebookLogo from '../assets/facebook.png';
import githubLogo from '../assets/github.png';
import instagramLogo from '../assets/instagram.png';


const Foote = () => {
  return (
    <center>
    <footer>
      <section className="contact-area" id="contact">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 offset-lg-3">
              <div className="contact-content text-center">
                <div className="hr"></div>
                <h2>Made with love ❤️ by UODGaming</h2>
                <h6>Collab with Harshal Honde<span>|</span>+91 89565 14172</h6>
                <div className="contact-social">
                <a href="https://mailto:omshrikhande73@gmail.com/" target="_blank" rel="noopener noreferrer">
                      <img src={facebookLogo} alt="facebook" style={{ width: '4%' }} />
                    </a>
                    <a href="https://github.com/orscoder" target="_blank" rel="noopener noreferrer">
                      <img src={githubLogo} alt="github" style={{ width: '2.8%', paddingBottom: '0.5%' }} />
                    </a>
                    <a href="https://www.instagram.com/om_shrikhande_0803/" target="_blank" rel="noopener noreferrer">
                      <img src={instagramLogo} alt="instagram" style={{ width: '4%' }} />
                    </a></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <p>Copyright &copy; 2024, All Rights Reserved.</p>
    </footer>
    </center>
  );
};

export default Foote;