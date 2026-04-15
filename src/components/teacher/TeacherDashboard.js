import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TeacherDashboard.css';

const MOCK_SUBMISSIONS = [
  { id: 1, studentName: 'Alex Chen', colors: ['#1a1a2e', '#16213e', '#0f3460', '#2d2d44', '#1f1f2e', '#252540'] },
  { id: 2, studentName: 'Sarah Miller', colors: ['#4a1a1a', '#6b2d2d', '#8b4513', '#2d1a1a', '#3d2424', '#5c3030'] },
  { id: 3, studentName: 'Sarah Miller', colors: ['#5a2a2a', '#7b3d3d', '#9b5523', '#3d2a2a', '#4d3434', '#6c4040'] },
  { id: 4, studentName: 'Sarah Miller', colors: ['#6a3a3a', '#8b4d4d', '#ab6533', '#4d3a3a', '#5d4444', '#7c5050'] },
  { id: 5, studentName: 'Marcus Johnson', colors: ['#0a2a3a', '#1a4a5a', '#2a6a7a', '#0a3a4a', '#1a5a6a', '#0a4a5a'] },
  { id: 6, studentName: 'Emma Davis', colors: ['#1a2e1a', '#2d442d', '#1f2e1f', '#254025', '#1a3a1a', '#2a4a2a'] },
  { id: 7, studentName: 'Emma Davis', colors: ['#2a3e2a', '#3d543d', '#2f3e2f', '#355035', '#2a4a2a', '#3a5a3a'] },
  { id: 8, studentName: 'James Wilson', colors: ['#3d2e1a', '#4a3a2a', '#5c4a3a', '#6b5a4a', '#4a3d2d', '#5c4d3d'] },
  { id: 9, studentName: 'Olivia Brown', colors: ['#2a1a4a', '#3d2d6b', '#4a3d8b', '#1a1a3d', '#2d2d5c', '#3a3a7a'] },
  { id: 10, studentName: 'Liam Garcia', colors: ['#1a1a1a', '#2d2d2d', '#3d3d3d', '#1f1f2a', '#2a2a35', '#353540'] },
  { id: 11, studentName: 'Liam Garcia', colors: ['#2a2a2a', '#3d3d3d', '#4d4d4d', '#2f2f3a', '#3a3a45', '#454550'] },
  { id: 12, studentName: 'Sophia Martinez', colors: ['#4a6a8a', '#5a7a9a', '#6a8aaa', '#3a5a7a', '#4a6a8a', '#5a7a9a'] },
  { id: 13, studentName: 'Noah Anderson', colors: ['#2a4a2a', '#3d5c3d', '#4a6b4a', '#1f3d1f', '#2d4d2d', '#3a5d3a'] },
  { id: 14, studentName: 'Isabella Thomas', colors: ['#a0d8ef', '#87ceeb', '#add8e6', '#b0e0e6', '#afeeee', '#e0ffff'] },
  { id: 15, studentName: 'Ethan Jackson', colors: ['#2a1a0a', '#3d2d1a', '#4a3d2a', '#5c4a3a', '#1a1a0a', '#2d2d1a'] },
  { id: 16, studentName: 'Ethan Jackson', colors: ['#3a2a1a', '#4d3d2a', '#5a4d3a', '#6c5a4a', '#2a2a1a', '#3d3d2a'] },
  { id: 17, studentName: 'Ethan Jackson', colors: ['#4a3a2a', '#5d4d3a', '#6a5d4a', '#7c6a5a', '#3a3a2a', '#4d4d3a'] },
  { id: 18, studentName: 'Mia White', colors: ['#ff9ec4', '#ffb6c1', '#ffc0cb', '#ffb347', '#ff69b4', '#ff1493'] },
  { id: 19, studentName: 'Aiden Harris', colors: ['#0a0a1a', '#1a1a2d', '#0f0f3d', '#2a2a4a', '#1f1f3a', '#15152a'] },
  { id: 20, studentName: 'Charlotte Clark', colors: ['#8b4513', '#a0522d', '#cd853f', '#d2691e', '#deb887', '#f4a460'] },
  { id: 21, studentName: 'Lucas Lewis', colors: ['#ff00ff', '#00ffff', '#ff0080', '#8000ff', '#0080ff', '#ff8000'] },
  { id: 22, studentName: 'Amelia Robinson', colors: ['#98fb98', '#90ee90', '#8fbc8f', '#3cb371', '#2e8b57', '#228b22'] },
  { id: 23, studentName: 'Mason Walker', colors: ['#8b0000', '#a52a2a', '#b22222', '#cd5c5c', '#dc143c', '#ff6347'] },
  { id: 24, studentName: 'Harper Young', colors: ['#006994', '#008b8b', '#20b2aa', '#40e0d0', '#48d1cc', '#00ced1'] },
];

const springTransition = { type: 'spring', stiffness: 400, damping: 17 };
const sheetSpring = { type: 'spring', damping: 22, stiffness: 170, mass: 0.8 };

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'count-asc', label: 'Fewest Maps' },
  { value: 'count-desc', label: 'Most Maps' },
];

const TeacherDashboard = ({
  isOpen,
  onClose,
  onMapConfirmed,
  currentWinner,
  mapEnabled = true,
  initialSubmissions = MOCK_SUBMISSIONS
}) => {
  const [submissions] = useState(initialSubmissions);
  const [selectedMapId, setSelectedMapId] = useState(currentWinner?.id || null);
  const [isRolling, setIsRolling] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [filterStudent, setFilterStudent] = useState('all');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const rollIntervalRef = useRef(null);

  const studentCounts = useMemo(() => {
    const counts = {};
    submissions.forEach(s => {
      counts[s.studentName] = (counts[s.studentName] || 0) + 1;
    });
    return counts;
  }, [submissions]);

  const studentList = useMemo(() => {
    return Object.entries(studentCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [studentCounts]);

  const sortedAndFilteredSubmissions = useMemo(() => {
    let result = [...submissions];
    
    if (filterStudent !== 'all') {
      result = result.filter(s => s.studentName === filterStudent);
    }
    
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.studentName.localeCompare(b.studentName));
        break;
      case 'name-desc':
        result.sort((a, b) => b.studentName.localeCompare(a.studentName));
        break;
      case 'count-asc':
        result.sort((a, b) => studentCounts[a.studentName] - studentCounts[b.studentName]);
        break;
      case 'count-desc':
        result.sort((a, b) => studentCounts[b.studentName] - studentCounts[a.studentName]);
        break;
      default:
        break;
    }
    
    return result;
  }, [submissions, sortBy, filterStudent, studentCounts]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleSelectMap = (id) => {
    if (isRolling) return;
    setSelectedMapId(id);
  };

  const handleConfirmSelection = () => {
    const selectedMap = submissions.find(s => s.id === selectedMapId);
    if (selectedMap && onMapConfirmed) {
      onMapConfirmed(selectedMap);
    }
  };

  const handleBackToSelection = () => {
    setSelectedMapId(null);
  };

  const handleStudentSelect = (studentName) => {
    setFilterStudent(studentName);
    setShowStudentDropdown(false);
  };

  const handleRandomPick = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setSelectedMapId(null);
    
    const targetSubmissions = sortedAndFilteredSubmissions;
    let iterations = 0;
    const maxIterations = 20;
    let delay = 50;
    
    const roll = () => {
      const randomIndex = Math.floor(Math.random() * targetSubmissions.length);
      setHighlightedId(targetSubmissions[randomIndex].id);
      iterations++;
      
      if (iterations < maxIterations) {
        delay += 15;
        rollIntervalRef.current = setTimeout(roll, delay);
      } else {
        const finalIndex = Math.floor(Math.random() * targetSubmissions.length);
        const winnerId = targetSubmissions[finalIndex].id;
        setHighlightedId(winnerId);
        setSelectedMapId(winnerId);
        setIsRolling(false);
      }
    };
    
    roll();
  };

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) {
        clearTimeout(rollIntervalRef.current);
      }
    };
  }, []);

  const selectedMap = submissions.find(s => s.id === selectedMapId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="teacher-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.aside
            className="teacher-sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={sheetSpring}
          >
            <div className="teacher-sheet__handle" />

            <div className="teacher-header">
              <div className="teacher-header__left">
                <h2 className="teacher-header__title">Select a Map</h2>
                <span className="teacher-header__count">{submissions.length} maps</span>
              </div>

              <div className="teacher-header__right">
                <motion.button
                  className="teacher-close"
                  onClick={handleClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✕
                </motion.button>
              </div>
            </div>

            <div className="teacher-body">
              <AnimatePresence mode="wait">
                {selectedMapId ? (
                  <motion.div
                    key="selection-confirm"
                    className="teacher-confirm-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="teacher-confirm-view__card"
                      initial={{ scale: 0.8, opacity: 0, y: 30 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                      <div className="teacher-confirm-view__preview">
                        <div className="teacher-confirm-view__grid">
                          {selectedMap?.colors.map((color, i) => (
                            <div
                              key={i}
                              className="teacher-confirm-view__pixel"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="teacher-confirm-view__info">
                        <h2 className="teacher-confirm-view__name">{selectedMap?.studentName}</h2>
                        <p className="teacher-confirm-view__question">Use this map for the challenge?</p>
                      </div>
                    </motion.div>
                    <div className="teacher-confirm-view__actions">
                      <motion.button
                        className="teacher-confirm-btn--back"
                        onClick={handleBackToSelection}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ← Back
                      </motion.button>
                      <motion.button
                        className="teacher-confirm-btn teacher-confirm-btn--confirm"
                        onClick={handleConfirmSelection}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                      >
                        <span className="teacher-confirm-btn__glow" />
                        <span className="teacher-confirm-btn__face">✓ Confirm</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="teacher-controls">
                      <div className="teacher-controls__left">
                        <div className="teacher-student-filter">
                          <button 
                            className="teacher-student-filter__btn"
                            onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                          >
                            <span>👤</span>
                            <span>{filterStudent === 'all' ? 'All Students' : filterStudent}</span>
                            <span className="teacher-student-filter__arrow">▼</span>
                          </button>
                          
                          <AnimatePresence>
                            {showStudentDropdown && (
                              <motion.div 
                                className="teacher-student-dropdown"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                              >
                                <button 
                                  className={`teacher-student-dropdown__item ${filterStudent === 'all' ? 'active' : ''}`}
                                  onClick={() => handleStudentSelect('all')}
                                >
                                  <span>All Students</span>
                                  <span className="teacher-student-dropdown__count">{submissions.length}</span>
                                </button>
                                {studentList.map(({ name, count }) => (
                                  <button 
                                    key={name}
                                    className={`teacher-student-dropdown__item ${filterStudent === name ? 'active' : ''} ${count === 1 ? 'low-activity' : ''}`}
                                    onClick={() => handleStudentSelect(name)}
                                  >
                                    <span>{name}</span>
                                    <span className={`teacher-student-dropdown__count ${count === 1 ? 'low' : ''}`}>
                                      {count}
                                    </span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <select 
                          className="teacher-sort"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <motion.button
                        className={`teacher-random-btn ${isRolling ? 'rolling' : ''}`}
                        onClick={handleRandomPick}
                        disabled={isRolling}
                        whileHover={!isRolling ? { y: -2 } : {}}
                        whileTap={!isRolling ? { y: 0 } : {}}
                      >
                        <span className="teacher-random-btn__glow" />
                        <span className="teacher-random-btn__face">
                          <span>🎲</span>
                          <span>{isRolling ? 'Picking...' : 'Random'}</span>
                        </span>
                      </motion.button>
                    </div>

                    <div className={`teacher-grid ${!mapEnabled ? 'disabled' : ''}`}>
                      {sortedAndFilteredSubmissions.map((submission) => {
                        const isHighlighted = highlightedId === submission.id && isRolling;
                        const mapCount = studentCounts[submission.studentName];
                        const isLowActivity = mapCount === 1;
                        
                        return (
                          <motion.div
                            key={submission.id}
                            className={`teacher-card ${isHighlighted ? 'teacher-card--highlight' : ''} ${isLowActivity ? 'teacher-card--low-activity' : ''}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={!isRolling ? { scale: 1.05 } : {}}
                            whileTap={!isRolling ? { scale: 0.98 } : {}}
                            transition={springTransition}
                            onClick={() => handleSelectMap(submission.id)}
                          >
                            {isLowActivity && (
                              <div className="teacher-card__badge teacher-card__badge--low">1st</div>
                            )}
                            <div className="teacher-card__preview">
                              <div className="teacher-card__grid">
                                {submission.colors.map((color, i) => (
                                  <div
                                    key={i}
                                    className="teacher-card__pixel"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="teacher-card__info">
                              <p className="teacher-card__student">{submission.studentName}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default TeacherDashboard;
