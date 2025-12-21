'use client';

import { useEffect, useState } from 'react';
import { Heart, RefreshCw } from 'lucide-react';

const MOTIVATIONS = [
  "You're doing great! Keep up the amazing work! 💪",
  "Every day is a fresh start. Make it count! 🌟",
  "You've got this! Believe in yourself! ✨",
  "Small steps lead to big achievements! 🎯",
  "Your positive attitude makes a difference! 😊",
  "Today is full of possibilities! 🌈",
  "You're stronger than you think! 💙",
  "Keep moving forward, one step at a time! 👣",
  "Your hard work doesn't go unnoticed! 🌟",
  "Remember: progress, not perfection! 📈",
  "You bring joy to those around you! ❤️",
  "Every challenge is an opportunity to grow! 🌱",
  "You're making a difference! 🎉",
  "Stay positive and keep smiling! 😄",
  "You have the power to make today great! ⚡",
  "You’re doing more right than you realize. 💪",
  "Your consistency is your superpower. 🔁",
  "One good decision today is enough. 👍",
  "The people around you are better because of you. ❤️",
  "You’ve built something to be proud of. 🧱",
  "Your calm strength carries more weight than words. ⚖️",
  "Every day you show up matters. 👊",
  "You set the standard just by being you. 🎯",
  "Your effort counts — even on quiet days. 🌤️",
  "You lead by example more than you know. 🧭",
  "Progress is happening, even if it’s subtle. 📈",
  "Your patience is a gift to others. 🤍",
  "You’ve earned the respect you have. 🏆",
  "Hard work done the right way always adds up. 🔨",
  "You’ve handled tougher days than this before. 💥",
  "Your presence makes things feel steadier. 🪨",
  "You don’t need perfection to be impressive. ⭐",
  "The habits you keep are building something solid. 🧱",
  "Your values show in how you live, not what you say. 🌱",
  "You make the people around you feel safe. 🏠",
  "Even slow progress is still progress. 🐢",
  "You’re trusted for a reason. 🤝",
  "Your discipline sets you apart. 📏",
  "What you do every day matters more than big moments. 📅",
  "You’ve got a good head on your shoulders. 🧠",
  "Your reliability means more than you realize. 🛠️",
  "You’re building a life worth being proud of. 🏗️",
  "The example you set lasts longer than advice. 🧭",
  "You make hard things look manageable. 💼",
  "Your steady pace wins in the long run. 🏃‍♂️",
  "You’ve earned your confidence. 💙",
  "Your work ethic speaks for itself. 🔧",
  "You’re someone people can count on. 📞",
  "You’ve already come a long way. 🛣️",
  "Your integrity shows up in the details. 🔍",
  "You make good things happen quietly. 🌿",
  "Your persistence is paying off. 💰",
  "You don’t quit — and that matters. 🧱",
  "You’ve got the right priorities. 🎯",
  "Your effort today makes tomorrow easier. 📦",
  "You bring stability wherever you go. ⚓",
  "Your consistency is noticed, even if unsaid. 👀",
  "You’ve built trust the right way. 🤝",
  "You’re doing exactly what you need to be doing. ✅",
  "You’ve handled responsibility with grace. 🎩",
  "Your example matters more than you think. 🔁",
  "You make tough days easier for others. ☀️",
  "You’re stronger because you keep going. 💪",
  "Your quiet leadership is powerful. 🧭",
  "You’ve earned every bit of respect you have. 🏅",
  "You do the right thing — even when it’s hard. ✔️",
  "Your effort today is enough. 🤍"
];

export default function DailyMotivation() {
  const [motivation, setMotivation] = useState('');
  const [lastDate, setLastDate] = useState('');

  useEffect(() => {
    const loadMotivation = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      try {
        // Fetch from server (universal across devices)
        const response = await fetch('/api/user-data?section=dailyMotivation');
        if (response.ok) {
          const data = await response.json();
          const storedMotivation = data.dailyMotivation || data.motivation;
          const storedDate = data.dailyMotivationDate || data.date;
          
          if (storedMotivation && storedDate === today) {
            setMotivation(storedMotivation);
            setLastDate(today);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching motivation:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('daily-motivation');
        const storedDate = localStorage.getItem('daily-motivation-date');
        if (stored && storedDate === today) {
          setMotivation(stored);
          setLastDate(today);
          return;
        }
      }
      
      // Get a new motivation for today
      const todayIndex = new Date().getDate() % MOTIVATIONS.length;
      const newMotivation = MOTIVATIONS[todayIndex];
      setMotivation(newMotivation);
      setLastDate(today);
      
      // Save to server
      try {
        await fetch('/api/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'dailyMotivation',
            data: { motivation: newMotivation, date: today },
          }),
        });
      } catch (error) {
        console.error('Error saving motivation:', error);
        // Fallback to localStorage
        localStorage.setItem('daily-motivation', newMotivation);
        localStorage.setItem('daily-motivation-date', today);
      }
    };
    
    loadMotivation();
  }, []);

  const refreshMotivation = async () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONS.length);
    const newMotivation = MOTIVATIONS[randomIndex];
    const today = new Date().toISOString().split('T')[0];
    setMotivation(newMotivation);
    setLastDate(today);
    
    // Save to server
    try {
      await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'dailyMotivation',
          data: { motivation: newMotivation, date: today },
        }),
      });
    } catch (error) {
      console.error('Error saving motivation:', error);
      // Fallback to localStorage
      localStorage.setItem('daily-motivation', newMotivation);
      localStorage.setItem('daily-motivation-date', today);
    }
  };

  if (!motivation) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Daily Motivation</h2>
          </div>
          <button
            onClick={refreshMotivation}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Get new motivation"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <p className="text-lg">{motivation}</p>
      </div>
    </div>
  );
}

