import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LobbyScreen from './LobbyScreen';
import LobbyScreenSideSheet from './LobbyScreenSideSheet';
import CompetitionDemoPage from './pages/CompetitionDemoPage';
import LobbyScreenMystery from './LobbyScreenMystery';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/modal" element={<LobbyScreen />} />
      <Route path="/side-sheet" element={<LobbyScreenSideSheet />} />
      <Route path="/competition" element={<CompetitionDemoPage />} />
      <Route path="/mystery" element={<LobbyScreenMystery />} />
    </Routes>
  );
};

export default App;
