# Army Weather Damage Dashboard

## Overview
This prototype dashboard provides decision support for infrastructure investment decisions at US Army bases, based on historical weather damage data. It visualizes weather-related damages and costs to help prioritize infrastructure investments.

## Features
- Interactive dashboard showing weather damage costs across Army installations
- Filtering by year and weather event type
- Visualizations including:
  - Cost distribution by weather event type (pie chart)
  - Top 10 impacted installations (bar chart)
  - Monthly damage cost trends (area chart)
  - Year-over-year cost trends (line chart)
- Key metrics summary
- Decision support recommendations

## Data
The dashboard uses historical weather damage data stored in CSV format (converted from the original Excel file `army_wx_data.xlsx`).

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server:
```
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production
To build the application for production:
```
npm run build
```

## Technologies Used
- React.js
- Recharts (for data visualization)
- Tailwind CSS (for styling)
- PapaParse (for CSV parsing)
- Lodash (for data manipulation)

## Project Purpose
This prototype demonstrates how weather damage data can be leveraged to make informed infrastructure investment decisions across Army installations. By visualizing historical damage patterns, decision-makers can:

1. Identify installations with highest financial impact from weather events
2. Understand seasonal weather damage patterns
3. Prioritize investments based on weather event types causing most damage
4. Forecast future infrastructure needs based on historical trends

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
