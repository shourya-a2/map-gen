import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './TugOfWarEntry.css';
import TowLogo from '../../assets/StudentSide_Thumbnail_TOW_Logo.png';
import TowGif  from '../../assets/download.gif';

const springTransition = { type: 'spring', stiffness: 320, damping: 22 };

const TugOfWarEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="tow-entry">
      {/* Logo */}
      <motion.img
        src={TowLogo}
        alt="Tug of War"
        className="tow-entry__logo"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      />

      <motion.p
        className="tow-entry__subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Choose a prototype view
      </motion.p>

      <div className="tow-entry__cards">

        {/* Side Sheet card */}
        <motion.button
          className="tow-entry__card"
          onClick={() => navigate('/tug-of-war/side-sheet')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.15 }}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Preview thumbnail */}
          <div className="tow-entry__card-preview">
            <img src={TowGif} alt="Side sheet preview" className="tow-entry__card-gif" />
            {/* Sheet overlay hint */}
            <div className="tow-entry__card-sheet-hint">
              <div className="tow-entry__card-sheet-bar" />
            </div>
          </div>
          <div className="tow-entry__card-info">
            <span className="tow-entry__card-title">SIDE SHEET</span>
            <span className="tow-entry__card-desc">
              Panel slides in from the left — game world stays visible
            </span>
          </div>
          <div className="tow-entry__card-arrow">→</div>
        </motion.button>

        {/* Expanded view card */}
        <motion.button
          className="tow-entry__card tow-entry__card--expanded"
          onClick={() => navigate('/tug-of-war/expanded')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.22 }}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="tow-entry__card-preview">
            <img src={TowGif} alt="Expanded preview" className="tow-entry__card-gif" />
            {/* Full-width overlay hint */}
            <div className="tow-entry__card-expanded-hint">
              <div className="tow-entry__card-expanded-bar" />
            </div>
          </div>
          <div className="tow-entry__card-info">
            <span className="tow-entry__card-title">EXPANDED VIEW</span>
            <span className="tow-entry__card-desc">
              Full-screen experience — wider canvas, more immersive
            </span>
          </div>
          <div className="tow-entry__card-arrow">→</div>
        </motion.button>

      </div>
    </div>
  );
};

export default TugOfWarEntry;
