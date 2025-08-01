import React from 'react';

import {BrowserRouter as Router,Route,Routes} from 'react-router-dom';
import Login from './pages/Login.tsx';
import Home from './pages/Home.tsx';
import Quiz from './pages/Quiz.tsx';
import Sign from './pages/Sign.tsx';
import Qq from './pages/QuizHistoryView.tsx'; 
import Profile from './pages/Profile.tsx'; 
import Verify from './pages/VerifyEmail.tsx';
import Reset from './pages/ResetPassword.tsx';
function App(){
  return(
    <Router>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/home' element={<Home/>}/>
        <Route path='/Quiz' element={<Quiz/>}/>
        <Route path='/Sign' element={<Sign/>}/>
        <Route path='/QuizHistoryView' element={<Qq/>}/>
        <Route path='/Profile' element={<Profile/>}/>
        <Route path='/verify-email' element={<Verify/>}/>
        <Route path='/reset-password' element={<Reset/>}/>
        
      </Routes>
      </Router>
  );
}



export default App;