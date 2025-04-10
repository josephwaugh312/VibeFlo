import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-6">About VibeFlo</h1>
      
      <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Our Mission</h2>
        <p className="text-white/90 mb-4">
          VibeFlo was created with a simple mission: to help people work more effectively and maintain a healthy balance between focus and rest. 
          We believe that the way we work matters just as much as what we accomplish.
        </p>
        <p className="text-white/90">
          By implementing the Pomodoro Technique with modern technology, we aim to provide a tool that not only helps you manage your time 
          but also gives you insights into your productivity patterns, allowing you to continuously improve your work habits.
        </p>
      </div>
      
      <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">The Pomodoro Technique</h2>
        <p className="text-white/90 mb-4">
          The Pomodoro Technique was developed by Francesco Cirillo in the late 1980s. It's a time management method that breaks work into intervals, 
          traditionally 25 minutes in length, separated by short breaks.
        </p>
        <p className="text-white/90 mb-4">
          These intervals are known as "pomodoros," named after the tomato-shaped kitchen timer that Cirillo used when he was a university student.
        </p>
        <p className="text-white/90 mb-4">
          <strong>The basic technique involves the following steps:</strong>
        </p>
        <ol className="list-decimal pl-6 mb-4 text-white/90 space-y-2">
          <li>Decide on the task to be done</li>
          <li>Set the timer (traditionally to 25 minutes)</li>
          <li>Work on the task until the timer rings</li>
          <li>Take a short break (5 minutes)</li>
          <li>After four pomodoros, take a longer break (15-30 minutes)</li>
        </ol>
        <p className="text-white/90">
          This technique encourages focused work by breaking it into manageable chunks and ensuring regular breaks to maintain mental freshness.
        </p>
      </div>
      
      <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Features of VibeFlo</h2>
        <ul className="list-disc pl-6 text-white/90 space-y-2">
          <li><strong>Customizable Timers:</strong> Set your own work and break durations to suit your workflow</li>
          <li><strong>Task Management:</strong> Track what you're working on during each session</li>
          <li><strong>Statistics and Insights:</strong> Gain valuable data about your productivity patterns</li>
          <li><strong>Secure Authentication:</strong> Create an account or sign in with your favorite social media platforms</li>
          <li><strong>Cross-device Sync:</strong> Access your data from any device with an internet connection</li>
          <li><strong>Elegant Interface:</strong> Enjoy a distraction-free, beautiful experience designed to help you focus</li>
        </ul>
      </div>
      
      <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-white drop-shadow-md mb-4">Technology Stack</h2>
        <p className="text-white/90 mb-4">
          VibeFlo is built using modern web technologies for reliability, security, and performance:
        </p>
        <ul className="list-disc pl-6 text-white/90 space-y-2">
          <li><strong>Frontend:</strong> React, TypeScript, Tailwind CSS</li>
          <li><strong>Backend:</strong> Node.js, Express.js, TypeScript</li>
          <li><strong>Database:</strong> PostgreSQL</li>
          <li><strong>Authentication:</strong> JWT, Passport.js with OAuth strategies</li>
        </ul>
      </div>
      
      <div className="text-center">
        <p className="text-white/90 mb-4">Ready to experience the benefits of structured work and focused time management?</p>
        <Link
          to="/register"
          className="inline-block bg-purple-600 text-white px-8 py-3 rounded-md font-medium text-lg hover:bg-purple-700 transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
};

export default About; 