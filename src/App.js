import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './screens/home/HomePage';
import LobbyModal from './screens/student/LobbyModal';
import LobbySideSheet from './screens/student/LobbySideSheet';
import LobbyCompetition from './screens/student/LobbyCompetition';
import LobbyMystery from './screens/student/LobbyMystery';
import TugOfWarEntry          from './screens/student/TugOfWarEntry';
import LobbyTugOfWar          from './screens/student/LobbyTugOfWar';
import LobbyTugOfWarExpanded  from './screens/student/LobbyTugOfWarExpanded';
import TeacherLobbyTugOfWar   from './screens/teacher/TeacherLobbyTugOfWar';
import TeacherLobby from './screens/teacher/TeacherLobby';
import TeacherLobbyV2 from './screens/teacher/TeacherLobbyV2';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/modal" element={<LobbyModal />} />
      <Route path="/side-sheet" element={<LobbySideSheet />} />
      <Route path="/competition" element={<LobbyCompetition />} />
      <Route path="/mystery" element={<LobbyMystery />} />
      <Route path="/tug-of-war"             element={<TugOfWarEntry />} />
      <Route path="/tug-of-war/side-sheet" element={<LobbyTugOfWar />} />
      <Route path="/tug-of-war/expanded"   element={<LobbyTugOfWarExpanded />} />
      <Route path="/tug-of-war/teacher"   element={<TeacherLobbyTugOfWar />} />
      <Route path="/teacher" element={<TeacherLobby />} />
      <Route path="/teacher2" element={<TeacherLobbyV2 />} />
    </Routes>
  );
};

export default App;
