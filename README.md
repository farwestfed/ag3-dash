# Weather Damage Dashboard

A React-based dashboard for visualizing and analyzing weather-related damage data across military installations.

## Features

- **Damage Forecast**: 
  - 5-year cost projections with upper and lower bounds
  - Historical yearly trends analysis
  - Interactive charts with tooltips

- **Event Analysis**:
  - Cost distribution by weather event type (Pie Chart)
  - Top weather events by cost impact (Bar Chart)
  - Detailed insights and statistics

## Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd ag3-dash
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard

## Data Format

The dashboard expects a CSV file (`ag3_data_v3.csv`) with the following columns:
- Branch
- Weather Event
- Named Storm (optional)
- Date of Weather Event (MM/DD/YY)
- Year
- Cost
- Installation
- State

## Dependencies

- React 18.2.0
- Recharts 2.12.0
- PapaParse 5.5.2
- Lodash 4.17.21

## Known Issues

- React warnings about props in development mode (non-critical)
- Some weather events may need manual categorization

## TODO

- Add geographic analysis tab
- Implement scenario modeling features
- Add export functionality for charts
- Enhance mobile responsiveness
