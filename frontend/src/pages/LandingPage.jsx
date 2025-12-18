'use client';
import Navbar from '../components/Navbar/Navbar'
import HeroSection from '../components/Landing/HeroSection'
// import MoreInfo from '../components/Landing/MoreInfo'
import Features from '../components/Landing/Features'

const LandingPage = () => {
  return (
    <div
    // style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '100vh' }}
    >
        <Navbar/>
        {/* <hr /> */}
        <HeroSection/>
        <Features/>
       
    </div>
  )
}

export default LandingPage