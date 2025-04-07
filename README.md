
Overview
A React-based web application that analyzes WhatsApp group chat exports, providing visual insights into group activity including:

Number of new users joining each day (orange bars)

Number of active users messaging each day (blue bars)

List of highly active users (active 4+ days in last 7 days)

Features
📊 Interactive bar chart showing daily activity

📅 Automatically analyzes last 7 days of chat history

👥 Tracks both admin-added and invite-link joins

⚡ Fast client-side processing - no data leaves your browser

📱 Responsive design works on desktop and mobile

How to Use
Export your WhatsApp chat:

Open the WhatsApp group you want to analyze

Tap on the group name to open group info

Scroll down and select "Export chat"

Choose "Without media"

Upload the exported file:

Click "Upload WhatsApp Chat Export"

Select the .txt file you exported

View your analysis:

See the chart of daily activity

Check the list of highly active users

Technical Details
Built With
React - Frontend framework

Chart.js - Data visualization

date-fns - Date handling

Vanilla CSS - No CSS frameworks used

Data Processing
The analyzer detects:

User join events (both admin-added and invite-link joins)

Message activity

User participation patterns

All processing happens in your browser - your chat data never leaves your device.

Installation
To run this project locally:

Clone the repository

bash
Copy
git clone [https://github.com/your-username/whatsapp-chat-analyzer.git](https://github.com/DhruvPatel9924/first500days/)
Install dependencies

bash
Copy
cd whatsapp-chat-analyzer
npm install
Start the development server

bash
Copy
npm start
Open http://localhost:3000 in your browser

File Structure
Copy
whatsapp-chat-analyzer/
├── public/


├── src/


│   ├── App.css


│   ├── App.js


│   ├── index.js


│   └── ...


├── package.json


└── README.md
Contributing
Contributions are welcome! Please open an issue or submit a pull request.

License
This project is licensed under the MIT License - see the LICENSE file for details.

Screenshot
Example chart showing active users and new users over 7 days
