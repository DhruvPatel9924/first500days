import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format, subDays, isWithinInterval, parse, eachDayOfInterval } from 'date-fns';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [chatData, setChatData] = useState(null);
  const [error, setError] = useState(null);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  const parseWhatsAppFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          const lines = content.split('\n');
          const usersJoined = {};
          const messages = {};
          const userActivity = {};
          
          // Find the latest date in the chat
          let latestDate = null;
          lines.forEach(line => {
            const dateMatch = line.match(/^(\d+\/\d+\/\d+),\s(\d+:\d+\s[AP]M)/);
            if (dateMatch) {
              const dateStr = dateMatch[1];
              const timeStr = dateMatch[2];
              const datetimeStr = `${dateStr}, ${timeStr}`;
              const date = parse(datetimeStr, 'M/d/yy, h:mm a', new Date());
              if (!latestDate || date > latestDate) {
                latestDate = date;
              }
            }
          });

          if (!latestDate) {
            throw new Error('No valid dates found in chat');
          }

          // Get date range for last 7 days
          const sevenDaysAgo = subDays(latestDate, 7);
          const dateRange = eachDayOfInterval({ 
            start: sevenDaysAgo, 
            end: latestDate 
          });
          
          // Initialize data structures
          dateRange.forEach(day => {
            const dayKey = format(day, 'M/d/yy');
            usersJoined[dayKey] = new Set();
            messages[dayKey] = new Set();
            userActivity[dayKey] = {};
          });

          // Process each line
          lines.forEach(line => {
            const dateMatch = line.match(/^(\d+\/\d+\/\d+),\s(\d+:\d+\s[AP]M)/);
            if (!dateMatch) return;
            
            const dateStr = dateMatch[1];
            const timeStr = dateMatch[2];
            const datetimeStr = `${dateStr}, ${timeStr}`;
            const date = parse(datetimeStr, 'M/d/yy, h:mm a', new Date());
            
            if (!isWithinInterval(date, { start: sevenDaysAgo, end: latestDate })) return;
            
            const dayKey = format(date, 'M/d/yy');
            
            // Check for user joined via invite link
            const joinedViaInviteMatch = line.match(/(\+\d+ \d+ \d+) joined using this group's invite link/);
            if (joinedViaInviteMatch) {
              const user = joinedViaInviteMatch[1].trim();
              usersJoined[dayKey].add(user);
              return;
            }
            
            // Check for user added by admin
            const addedByAdminMatch = line.match(/(\+\d+ \d+ \d+) added (.+)$/);
            if (addedByAdminMatch) {
              const user = addedByAdminMatch[2].trim();
              usersJoined[dayKey].add(user);
              return;
            }
            
            // Check for "added you"
            const addedYouMatch = line.match(/added you/);
            if (addedYouMatch) {
              usersJoined[dayKey].add("You");
              return;
            }
            
            // Check for group creation
            const groupCreatedMatch = line.match(/(\+\d+ \d+ \d+) created group/);
            if (groupCreatedMatch) {
              usersJoined[dayKey].add(groupCreatedMatch[1]);
              return;
            }
            
            // Check for messages
            const messageMatch = line.match(/-\s([^:]+):/);
            if (messageMatch) {
              const user = messageMatch[1].trim();
              messages[dayKey].add(user);
              
              if (!userActivity[dayKey][user]) {
                userActivity[dayKey][user] = 0;
              }
              userActivity[dayKey][user]++;
            }
          });

          // Find highly active users
          const userDaysActive = {};
          dateRange.forEach(day => {
            const dayKey = format(day, 'M/d/yy');
            Object.keys(userActivity[dayKey]).forEach(user => {
              if (!userDaysActive[user]) {
                userDaysActive[user] = 0;
              }
              userDaysActive[user]++;
            });
          });
          
          const highlyActiveUsers = Object.keys(userDaysActive).filter(
            user => userDaysActive[user] >= 4
          );

          setActiveUsersList(highlyActiveUsers);

          // Prepare chart data
          const labels = dateRange.map(day => format(day, 'MMM d'));
          const newUsersData = dateRange.map(day => {
            const dayKey = format(day, 'M/d/yy');
            return usersJoined[dayKey].size;
          });
          const activeUsersData = dateRange.map(day => {
            const dayKey = format(day, 'M/d/yy');
            return messages[dayKey].size;
          });

          resolve({
            labels,
            datasets: [
              {
                label: 'Active Users',
                data: activeUsersData,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
              },
              {
                label: 'New Users',
                data: newUsersData,
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
              },
            ],
          });
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
          reject(new Error('Error parsing file. Please ensure you uploaded a valid WhatsApp chat export.'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setError(null);
    try {
      const chartData = await parseWhatsAppFile(file);
      setChatData(chartData);
    } catch (err) {
      setError(err.message);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'WhatsApp Group Activity (Last 7 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Users',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  return (
    <div className="app">
      <header className="header">
        <h1>WhatsApp Chat Analyzer</h1>
        <p>Analyze your WhatsApp group chat activity</p>
      </header>
      
      <main className="main-content">
        <div className="upload-section">
          <label htmlFor="file-upload" className="upload-button">
            Upload WhatsApp Chat Export
            <input 
              id="file-upload" 
              type="file" 
              accept=".txt" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
          </label>
          {error && <p className="error">{error}</p>}
        </div>
        
        {chatData && (
          <div className="results">
            <div className="chart-container">
              <Bar 
                ref={chartRef}
                data={chatData} 
                options={chartOptions}
                redraw={true}
              />
            </div>
            
            {activeUsersList.length > 0 && (
              <div className="active-users">
                <h3>Highly Active Users (4+ days in last 7)</h3>
                <ul>
                  {activeUsersList.map((user, index) => (
                    <li key={index}>{user}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="instructions">
          <h3>How to export your WhatsApp chat:</h3>
          <ol>
            <li>Open the WhatsApp group you want to analyze</li>
            <li>Tap on the group name to open group info</li>
            <li>Scroll down and select "Export chat"</li>
            <li>Choose "Without media"</li>
            <li>Share/Save the file and upload it here</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

export default App;