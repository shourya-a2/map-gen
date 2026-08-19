import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyVaultCustomization.css';
import VaultCustomizationChallenge from '../../components/student/VaultCustomizationChallenge';
import { readVaultStorage, writeVaultStorage, VAULT_STORAGE_KEYS } from '../../utils/vaultStorage';

const SKIN_COLORS = {
  pirate:  '#b45309',
  castle:  '#7c3aed',
  volcano: '#dc2626',
  arctic:  '#0ea5e9',
  jungle:  '#15803d',
  default: '#7c3aed',
};

const LobbyVaultCustomization = ({ challengeVariant = 'sheet' }) => {
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [defaultTab,      setDefaultTab]      = useState('create');
  const [appliedSkin,     setAppliedSkin]     = useState(() => readVaultStorage(VAULT_STORAGE_KEYS.activeVault, null));

  const handleCustomize  = useCallback(() => { setDefaultTab('create');   setIsChallengeOpen(true); }, []);
  const handleMyVaults   = useCallback(() => { setDefaultTab('myskins');  setIsChallengeOpen(true); }, []);
  const handleClose      = useCallback(() => setIsChallengeOpen(false), []);

  const handleVaultApplied = useCallback((skin) => {
    setAppliedSkin(skin);
    writeVaultStorage(VAULT_STORAGE_KEYS.activeVault, skin);
  }, []);

  const thumbColor = appliedSkin ? (SKIN_COLORS[appliedSkin.theme] || SKIN_COLORS.default) : null;

  return (
    <div className="vc-lobby">
      <div className="vc-lobby-left">

        {/* Vault hero card */}
        <motion.div
          className="vc-lobby-vault-card"
          initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35 }}
        >
          {appliedSkin ? (
            /* Applied skin colour grid */
            <>
              <div className="vc-lobby-vault-card__skin-thumb">
                {(appliedSkin.colors || []).slice(0, 16).map((c, i) => (
                  <div key={i} style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="vc-lobby-vault-card__badge">ACTIVE SKIN</span>
            </>
          ) : (
            <span className="vc-lobby-vault-icon">🏛️</span>
          )}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── APPLIED STATE ── */}
          {appliedSkin ? (
            <motion.div key="applied"
              className="vc-lobby-applied"
              style={{ '--skin-color': thumbColor }}
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.4, type:'spring', stiffness:280, damping:22 }}
            >
              {/* thumb */}
              <div className="vc-lobby-applied__thumb">
                <div className="vc-lobby-applied__grid">
                  {(appliedSkin.colors || []).slice(0,16).map((c, i) => (
                    <div key={i} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="vc-lobby-applied__info">
                <span className="vc-lobby-applied__badge">✨ Vault Updated!</span>
                <span className="vc-lobby-applied__name">{appliedSkin.name}</span>
                <span className="vc-lobby-applied__sub">Your vault wears this skin now.</span>
              </div>

              <motion.button type="button" className="vc-lobby-applied__change"
                onClick={handleCustomize}
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                title="Design a new vault skin"
              >Change</motion.button>
            </motion.div>

          ) : (

            /* ── PRE-APPLY ── */
            <motion.div key="pre-apply"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.3 }}
              style={{ display:'flex', flexDirection:'column', gap:10 }}
            >
              <motion.p className="vc-lobby-hint"
                initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.3, delay:0.08 }}
              >
                Design a skin for your vault — it's all yours.
              </motion.p>

              <div className="vc-lobby-actions">
                <motion.button type="button" className="vc-lobby-btn"
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.3, delay:0.1 }}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleCustomize}
                >🔐 Customize Your Vault</motion.button>

                <motion.button type="button" className="vc-lobby-btn vc-lobby-btn--secondary"
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.3, delay:0.15 }}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleMyVaults}
                >My Vaults</motion.button>
              </div>

              <div className="vc-lobby-feed">
                <div className="vc-lobby-feed__event">
                  <span className="vc-lobby-feed__icon" aria-hidden="true">✦</span>
                  <span className="vc-lobby-feed__text">Your preview stays private until you apply it.</span>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Keep a useful status message after the vault is applied */}
        {appliedSkin && (
          <div className="vc-lobby-feed">
            <div className="vc-lobby-feed__event">
              <span className="vc-lobby-feed__icon" aria-hidden="true">✓</span>
              <span className="vc-lobby-feed__text">This vault is saved to My Vaults on this device.</span>
            </div>
          </div>
        )}
      </div>  {/* vc-lobby-left */}

      {/* Sheet */}
      <AnimatePresence>
        {isChallengeOpen && (
          <VaultCustomizationChallenge
            isOpen={isChallengeOpen}
            variant={challengeVariant}
            onClose={handleClose}
            onVaultApplied={handleVaultApplied}
            defaultTab={defaultTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LobbyVaultCustomization;
