import React, { useState, useEffect } from 'react';

const WelcomeBanner = ({ userName = "john", activeTasks = 1, activeMembers = 2 }) => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format Time: 04:04:20 PM
      const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));

      // Format Date: 8 June 2026
      const dateOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[180px] md:h-[200px] rounded-[24px] bg-gradient-to-br from-[#0F3D73] to-[#1F4E8C] p-[40px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 shadow-lg border border-white/10 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-[-30%] right-[-10%] w-[250px] h-[250px] bg-white/5 rounded-full pointer-events-none filter blur-[20px]" />
      
      {/* Left Section */}
      <div className="relative z-10 flex flex-col items-start text-left">
        <h1 className="text-[36px] md:text-[44px] font-bold tracking-tight text-white leading-tight flex items-center gap-3">
          Hello, {userName} <span className="animate-[wave_2.5s_infinite] origin-[70%_70%] inline-block">👋</span>
        </h1>
        <p className="text-[14px] md:text-[15px] text-[#cbd5e1] mt-2 font-medium flex flex-wrap items-center">
          You have{' '}
          <span className="bg-white/12 border border-white/18 text-white px-2.5 py-0.5 mx-1.5 rounded-[6px] font-bold text-[13px] inline-flex items-center justify-center min-w-[20px] h-[22px]">
            {activeTasks}
          </span>{' '}
          active tasks and{' '}
          <span className="bg-white/12 border border-white/18 text-white px-2.5 py-0.5 mx-1.5 rounded-[6px] font-bold text-[13px] inline-flex items-center justify-center min-w-[20px] h-[22px]">
            {activeMembers}
          </span>{' '}
          team members active today.
        </p>
      </div>

      {/* Right Section */}
      <div className="relative z-10 flex flex-col items-start md:items-end gap-2.5 min-w-[140px]">
        {/* Date capsule (glassmorphism style) */}
        <div className="bg-white/8 backdrop-blur-md border border-white/12 text-white text-[13.5px] font-semibold py-1.5 px-4 rounded-[12px] shadow-sm tracking-wide">
          {currentDate || 'Loading date...'}
        </div>
        {/* Time pill (dark slate style) */}
        <div className="bg-[#0b1b2f]/80 backdrop-blur-md border border-white/8 text-[#60a5fa] text-[13.5px] font-semibold py-1.5 px-4 rounded-[12px] shadow-md tracking-wider animate-pulse">
          {currentTime || 'Loading time...'}
        </div>
      </div>

      {/* Wave animation style */}
      <style jsx>{`
        @keyframes wave {
          0% { transform: rotate(0deg) }
          10% { transform: rotate(14deg) }
          20% { transform: rotate(-8deg) }
          30% { transform: rotate(14deg) }
          40% { transform: rotate(-4deg) }
          50% { transform: rotate(10deg) }
          60% { transform: rotate(0deg) }
          100% { transform: rotate(0deg) }
        }
      `}</style>
    </div>
  );
};

export default WelcomeBanner;
