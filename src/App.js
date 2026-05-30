import React from 'react';

import {BrowserRouter as Router,Route,Routes,Navigate} from 'react-router-dom';
import { ThemeProvider } from './ThemeContext.tsx';
import Login from './pages/Login.tsx';
import Home from './pages/Home.tsx';
import Quiz from './pages/Quiz.tsx';
import Qq from './pages/QuizHistoryView.tsx'; 
import Profile from './pages/Profile.tsx'; 
import Verify from './pages/VerifyEmail.tsx';
import Reset from './pages/ResetPassword.tsx';
import CollabLobby from './pages/CollabLobby.tsx';
import CollabQuiz from './pages/CollabQuiz.tsx';
import SearchUsers from './pages/SearchUsers.tsx';
import Groups from './pages/Groups.tsx';
import GroupDetail from './pages/GroupDetail.tsx';
import ModuleDetail from './pages/ModuleDetail.tsx';
import ModuleQuiz from './pages/ModuleQuiz.tsx';
import UserProfile from './pages/UserProfile.tsx';

function App(){
  return(
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path='/' element={<Login/>}/>
          <Route path='/home' element={<Home/>}/>
          <Route path='/Quiz' element={<Quiz/>}/>
          <Route path='/Sign' element={<Navigate to="/" replace />}/>
          <Route path='/QuizHistoryView' element={<Qq/>}/>
          <Route path='/Profile' element={<Profile/>}/>
          <Route path='/verify-email' element={<Verify/>}/>
          <Route path='/reset-password' element={<Reset/>}/>
          <Route path='/collab' element={<CollabLobby/>}/>
          <Route path='/collab/:roomCode' element={<CollabQuiz/>}/>
          <Route path='/search' element={<SearchUsers/>}/>
          <Route path='/groups' element={<Groups/>}/>
          <Route path='/groups/:groupCode' element={<GroupDetail/>}/>
          <Route path='/module/:moduleId' element={<ModuleDetail/>}/>
          <Route path='/module/:moduleId/quiz/:quizIndex' element={<ModuleQuiz/>}/>
          <Route path='/profile/:userId' element={<UserProfile/>}/>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

