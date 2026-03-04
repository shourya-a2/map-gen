import { useState, useCallback, useRef, useEffect } from 'react';
import { MOCK_THUMBNAILS } from '../data/mockData';

const COMPETITION_DURATION = 20; // seconds
const MAX_GENERATIONS = 3;

/**
 * useCompetition - Unified competition hook with timer, state machine, and generation limits
 * 
 * States: idle -> active -> review -> ended -> idle
 * Timer states: normal (>10s) -> warning (<=10s) -> critical (<=5s) -> ended (0s)
 */
export const useCompetition = () => {
  // Competition state: idle, active, review, ended
  const [state, setState] = useState('idle');
  
  // Timer state
  const [remaining, setRemaining] = useState(COMPETITION_DURATION);
  const [timerState, setTimerState] = useState('normal'); // normal, warning, critical, ended
  const timerRef = useRef(null);
  
  // Generation tracking
  const [generationsLeft, setGenerationsLeft] = useState(MAX_GENERATIONS);
  
  // Submissions tracking
  const [submissionCount, setSubmissionCount] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [currentDraft, setCurrentDraft] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedMap, setSubmittedMap] = useState(null);
  
  // Winner info
  const [winner, setWinner] = useState(null);
  const [isCurrentUserWinner, setIsCurrentUserWinner] = useState(false);
  
  // Current user ID (mock)
  const currentUserId = useRef('current_user_' + Math.random().toString(36).substr(2, 9));
  
  // Mock submission simulation refs
  const mockTimeoutsRef = useRef([]);

  // Derived values
  const formattedTime = `0:${remaining.toString().padStart(2, '0')}`;
  const progress = (remaining / COMPETITION_DURATION) * 100;

  // Update timer state based on remaining time
  useEffect(() => {
    if (state !== 'active') return;
    
    if (remaining <= 0) {
      setTimerState('ended');
    } else if (remaining <= 5) {
      setTimerState('critical');
    } else if (remaining <= 10) {
      setTimerState('warning');
    } else {
      setTimerState('normal');
    }
  }, [remaining, state]);

  // Handle timer reaching zero
  useEffect(() => {
    if (state === 'active' && remaining <= 0) {
      // Auto-submit if there's a draft
      if (currentDraft && !hasSubmitted) {
        setHasSubmitted(true);
        setSubmittedMap(currentDraft);
        setSubmissions(prev => [...prev, currentDraft]);
        setSubmissionCount(c => c + 1);
      }
      // Move to review state
      setState('review');
    }
  }, [remaining, state, currentDraft, hasSubmitted]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      mockTimeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Simulate other students submitting
  const simulateOtherSubmissions = useCallback(() => {
    const mockStudents = [
      { id: 'student_1', name: 'Katherine A.' },
      { id: 'student_2', name: 'Chris B.' },
      { id: 'student_3', name: 'Jenny A.' },
      { id: 'student_4', name: 'Jack O.' },
      { id: 'student_5', name: 'Chen L.' },
    ];
    
    // Clear any existing mock timeouts
    mockTimeoutsRef.current.forEach(t => clearTimeout(t));
    mockTimeoutsRef.current = [];
    
    // Random submissions over 20 seconds
    mockStudents.forEach((student, index) => {
      const delay = Math.random() * 15000 + 3000; // 3-18 seconds
      const timeout = setTimeout(() => {
        setSubmissions(prev => {
          if (prev.length < 10) {
            const newSubmission = {
              id: student.id,
              name: student.name,
              prompt: ['Volcano island', 'Candy castle', 'Space base', 'Ocean depths', 'Jungle maze'][index],
              imageUrl: MOCK_THUMBNAILS[index % MOCK_THUMBNAILS.length],
              timestamp: Date.now(),
            };
            setSubmissionCount(c => c + 1);
            return [...prev, newSubmission];
          }
          return prev;
        });
      }, delay);
      mockTimeoutsRef.current.push(timeout);
    });
  }, []);

  // Start competition
  const start = useCallback(() => {
    // Reset everything
    setState('active');
    setRemaining(COMPETITION_DURATION);
    setTimerState('normal');
    setGenerationsLeft(MAX_GENERATIONS);
    setSubmissionCount(0);
    setSubmissions([]);
    setCurrentDraft(null);
    setHasSubmitted(false);
    setSubmittedMap(null);
    setWinner(null);
    setIsCurrentUserWinner(false);
    
    // Start the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Simulate other students
    simulateOtherSubmissions();
  }, [simulateOtherSubmissions]);

  // Generate a map (uses one generation, returns the map)
  const generate = useCallback((prompt) => {
    if (generationsLeft <= 0 || hasSubmitted || state !== 'active') {
      return null;
    }
    
    // Decrement generations
    setGenerationsLeft(prev => prev - 1);
    
    // Create the map
    const randomThumb = MOCK_THUMBNAILS[Math.floor(Math.random() * MOCK_THUMBNAILS.length)];
    const newMap = {
      id: currentUserId.current,
      name: 'You',
      prompt: prompt.trim(),
      imageUrl: randomThumb,
      timestamp: Date.now(),
    };
    
    // Save as draft
    setCurrentDraft(newMap);
    
    return newMap;
  }, [generationsLeft, hasSubmitted, state]);

  // Submit map
  const submit = useCallback((map) => {
    if (hasSubmitted || state !== 'active' || !map) return false;
    
    setHasSubmitted(true);
    setSubmittedMap(map);
    setSubmissions(prev => [...prev, map]);
    setSubmissionCount(c => c + 1);
    
    return true;
  }, [hasSubmitted, state]);

  // Select winner (teacher action)
  const selectWinner = useCallback((winnerId = null) => {
    let selectedWinner;
    
    if (winnerId) {
      selectedWinner = submissions.find(s => s.id === winnerId);
    } else if (submissions.length > 0) {
      const randomIndex = Math.floor(Math.random() * submissions.length);
      selectedWinner = submissions[randomIndex];
    }
    
    if (selectedWinner) {
      setWinner(selectedWinner);
      setIsCurrentUserWinner(selectedWinner.id === currentUserId.current);
      setState('ended');
    }
  }, [submissions]);

  // Select current user as winner (for demo)
  const selectCurrentUserAsWinner = useCallback(() => {
    if (submittedMap) {
      setWinner(submittedMap);
      setIsCurrentUserWinner(true);
      setState('ended');
    }
  }, [submittedMap]);

  // Reset to idle state
  const reset = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Clear mock timeouts
    mockTimeoutsRef.current.forEach(t => clearTimeout(t));
    mockTimeoutsRef.current = [];
    
    setState('idle');
    setRemaining(COMPETITION_DURATION);
    setTimerState('normal');
    setGenerationsLeft(MAX_GENERATIONS);
    setSubmissionCount(0);
    setSubmissions([]);
    setCurrentDraft(null);
    setHasSubmitted(false);
    setSubmittedMap(null);
    setWinner(null);
    setIsCurrentUserWinner(false);
  }, []);

  return {
    // Competition state
    state,
    
    // Timer
    remaining,
    formattedTime,
    progress,
    timerState,
    
    // Generation limits
    generationsLeft,
    maxGenerations: MAX_GENERATIONS,
    
    // Submissions
    submissionCount,
    submissions,
    currentDraft,
    hasSubmitted,
    submittedMap,
    
    // Winner
    winner,
    isCurrentUserWinner,
    currentUserId: currentUserId.current,
    
    // Actions
    start,
    generate,
    submit,
    selectWinner,
    selectCurrentUserAsWinner,
    reset,
  };
};

export default useCompetition;
