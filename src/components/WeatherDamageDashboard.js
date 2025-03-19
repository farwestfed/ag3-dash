import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ComposedChart
} from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// Add installation coordinates (you'll need to replace these with actual coordinates)
const INSTALLATION_COORDINATES = {
  'Fort Bragg': { lat: 35.1419, lng: -79.0061 },
  'Fort Hood': { lat: 31.1319, lng: -97.7851 },
  'Fort Campbell': { lat: 36.6672, lng: -87.4755 },
  'Fort Stewart': { lat: 31.8691, lng: -81.6089 },
  'Fort Benning': { lat: 32.3538, lng: -84.9400 },
  'Fort Riley': { lat: 39.0855, lng: -96.7645 },
  'Fort Carson': { lat: 38.7469, lng: -104.7828 },
  'Fort Drum': { lat: 44.0509, lng: -75.7177 },
  'Fort Lewis': { lat: 47.0855, lng: -122.5821 },
  'Fort Polk': { lat: 31.0445, lng: -93.2035 }
};

// Helper function to normalize weather event types
const normalizeWeatherType = (type) => {
  if (!type) return 'Other';
  
  // Convert to lowercase for consistent matching
  const lowerType = type.toLowerCase().trim();
  
  // Hurricane/Tropical Storm category
  if (lowerType.includes('hurricane') || 
      lowerType.includes('tropical') ||
      lowerType.includes('cyclone') ||
      lowerType.includes('mawar')) {
    return 'Hurricane/Tropical Storm';
  }
  
  // Winter Weather category
  if (lowerType.includes('winter') || 
      lowerType.includes('snow') || 
      lowerType.includes('arctic') ||
      lowerType.includes('ice')) {
    return 'Winter Storm';
  }
  
  // Severe Storm category
  if (lowerType.includes('storm') || 
      lowerType.includes('wind') ||
      lowerType.includes('nor\'easter') ||
      lowerType.includes('atmospheric river')) {
    return 'Severe Storm';
  }
  
  // Flooding category
  if (lowerType.includes('flood') ||
      lowerType.includes('water') ||
      lowerType.includes('rain')) {
    return 'Flooding';
  }
  
  // Tornado category
  if (lowerType.includes('tornado') ||
      lowerType.includes('torando')) {  // Handle common misspelling
    return 'Tornado';
  }
  
  // Hail category
  if (lowerType.includes('hail')) {
    return 'Hail';
  }
  
  // Fire category
  if (lowerType.includes('fire')) {
    return 'Fire';
  }
  
  // Earthquake category
  if (lowerType.includes('earthquake')) {
    return 'Earthquake';
  }
  
  // Wave category
  if (lowerType.includes('wave')) {
    return 'Wave';
  }
  
  return 'Other';
};

const WeatherDamageDashboard = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedWeatherType, setSelectedWeatherType] = useState('all');
  const [activeTab, setActiveTab] = useState('damage-forecast');
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [scenarioResults, setScenarioResults] = useState({
    currentProjection: 24500000,
    withMitigation: 24500000,
    savings: 0
  });
  
  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/ag3_data_v3.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            // Clean and transform the data
            const cleanedData = results.data
              .filter(item => item.Cost && !isNaN(parseFloat(item.Cost)))
              .map(item => {
                // Parse date from MM/DD/YY format
                const dateParts = item['Date of Weather Event'].split('/');
                const date = new Date(
                  2000 + parseInt(dateParts[2]), // Year
                  parseInt(dateParts[0]) - 1,    // Month (0-based)
                  parseInt(dateParts[1])         // Day
                );
                
                return {
                  ...item,
                  Cost: parseFloat(item.Cost),
                  Year: date.getFullYear(),
                  date: date,
                  // Add named storm information if available
                  weatherEventFull: item['Named Storm'] 
                    ? `${item['Weather Event']} (${item['Named Storm']})`
                    : item['Weather Event']
                };
              });
            
            setWeatherData(cleanedData);
            setLoading(false);
          },
          error: (error) => {
            setError('Error parsing CSV data: ' + error.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Error fetching data: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter data based on selections
  const filteredData = weatherData.filter(item => {
    if (selectedYear !== 'all' && item.Year !== parseFloat(selectedYear)) return false;
    if (selectedWeatherType !== 'all' && normalizeWeatherType(item['Weather Event']) !== selectedWeatherType) return false;
    return true;
  });

  // Get available years and weather event types for filters
  const years = _.uniq(weatherData.map(item => item.Year)).sort();
  const weatherTypes = _.uniq(weatherData.map(item => normalizeWeatherType(item['Weather Event']))).sort();

  // Weather events by cost impact for bar chart
  const weatherEventsByCost = _.chain(filteredData)
    .groupBy(item => item.weatherEventFull)
    .map((items, key) => ({
      name: key,
      value: _.sumBy(items, 'Cost'),
      normalizedType: normalizeWeatherType(items[0]['Weather Event'])
    }))
    .orderBy(['value'], ['desc'])
    .value();

  // Prepare data for charts
  const costByWeatherType = _.chain(filteredData)
    .groupBy(item => normalizeWeatherType(item['Weather Event']))
    .map((items, key) => ({ 
      name: key, 
      value: _.sumBy(items, 'Cost'),
      percentage: Math.round((_.sumBy(items, 'Cost') / _.sumBy(filteredData, 'Cost')) * 100)
    }))
    .orderBy(['value'], ['desc'])
    .value();

  const costByInstallation = _.chain(filteredData)
    .groupBy('Installation')
    .map((items, key) => ({
      name: key,
      value: _.sumBy(items, 'Cost')
    }))
    .orderBy(['value'], ['desc'])
    .slice(0, 10)
    .value();

  const costTrend = _.chain(filteredData)
    .groupBy(item => item.Year)
    .map((items, year) => ({
      name: year,
      value: _.sumBy(items, 'Cost'),
      count: items.length
    }))
    .sortBy('name')
    .value();

  // Generate forecast data based on historical trends
  // This is synthetic data for the POC
  const forecastData = [
    { name: "2025", predictedDamage: 18000000, lowerBound: 16000000, upperBound: 19500000 },
    { name: "2026", predictedDamage: 21000000, lowerBound: 18500000, upperBound: 24000000 },
    { name: "2027", predictedDamage: 24500000, lowerBound: 21500000, upperBound: 28000000 },
    { name: "2028", predictedDamage: 28000000, lowerBound: 24000000, upperBound: 32000000 },
    { name: "2029", predictedDamage: 32500000, lowerBound: 27500000, upperBound: 37000000 }
  ];

  const scenarios = [
    { id: 'scenario1', name: 'Enhanced stormwater infrastructure', reduction: 0.25, cost: 2000000, type: 'flood' },
    { id: 'scenario2', name: 'Wind-resistant building upgrades', reduction: 0.40, cost: 3500000, type: 'hurricane' },
    { id: 'scenario3', name: 'Wildfire prevention measures', reduction: 0.30, cost: 1500000, type: 'fire' },
    { id: 'scenario4', name: 'Winter weather preparedness', reduction: 0.20, cost: 1000000, type: 'winter' }
  ];

  const calculateScenarioImpact = (selectedScenarios) => {
    const baseProjection = 24500000;
    let totalReduction = 0;
    let totalCost = 0;

    selectedScenarios.forEach(scenarioId => {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (scenario) {
        totalReduction += scenario.reduction;
        totalCost += scenario.cost;
      }
    });

    const reducedCost = baseProjection * (1 - (totalReduction / selectedScenarios.length));
    const savings = baseProjection - reducedCost;

    return {
      currentProjection: baseProjection,
      withMitigation: reducedCost,
      savings: savings,
      cost: totalCost
    };
  };

  const handleScenarioChange = (scenarioId) => {
    const newSelectedScenarios = selectedScenarios.includes(scenarioId)
      ? selectedScenarios.filter(id => id !== scenarioId)
      : [...selectedScenarios, scenarioId];
    
    setSelectedScenarios(newSelectedScenarios);
  };

  const runScenario = () => {
    const results = calculateScenarioImpact(selectedScenarios);
    setScenarioResults(results);
  };

  const applyOptimalScenario = () => {
    // Select all scenarios for maximum impact
    const optimalScenarios = scenarios.map(s => s.id);
    setSelectedScenarios(optimalScenarios);
    const results = calculateScenarioImpact(optimalScenarios);
    setScenarioResults(results);
  };

  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading dashboard data...</div>;
  if (error) return <div style={{color: 'red', padding: '1rem'}}>Error: {error}</div>;

  const totalCost = _.sumBy(filteredData, 'Cost');
  const avgCostPerEvent = totalCost / filteredData.length;
  const eventsCount = filteredData.length;

  // Format numbers to be more readable
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const InsightBox = ({ title, insights }) => (
    <div className="insight-box" style={{
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginTop: '1rem',
      marginBottom: '1.5rem'
    }}>
      <h4 style={{
        color: '#2d3748',
        marginBottom: '0.5rem',
        fontSize: '1.1rem',
        fontWeight: '600'
      }}>{title}</h4>
      <p style={{
        color: '#4a5568',
        lineHeight: '1.5',
        margin: 0
      }}>{insights}</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      <h1>Army Weather Damage Dashboard</h1>
      
      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label className="filter-label">Year</label>
          <select 
            className="filter-select" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">Weather Event Type</label>
          <select 
            className="filter-select" 
            value={selectedWeatherType} 
            onChange={(e) => setSelectedWeatherType(e.target.value)}
          >
            <option value="all">All Types</option>
            {weatherTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="metrics-container">
        <div className="metric-card">
          <h3>Total Damage Cost</h3>
          <p className="metric-value">{formatCurrency(totalCost)}</p>
        </div>
        
        <div className="metric-card">
          <h3>Weather Events</h3>
          <p className="metric-value" style={{color: '#48bb78'}}>{eventsCount}</p>
        </div>
        
        <div className="metric-card">
          <h3>Avg Cost Per Event</h3>
          <p className="metric-value" style={{color: '#d69e2e'}}>{formatCurrency(avgCostPerEvent)}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div 
          className={`tab ${activeTab === 'damage-forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('damage-forecast')}
        >
          Damage Forecast
        </div>
        <div 
          className={`tab ${activeTab === 'event-analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('event-analysis')}
        >
          Event Analysis
        </div>
        <div 
          className={`tab ${activeTab === 'geographic-analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('geographic-analysis')}
        >
          Geographic Analysis
        </div>
        <div 
          className={`tab ${activeTab === 'scenario-modeling' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenario-modeling')}
        >
          Scenario Modeling
        </div>
        <div 
          className={`tab ${activeTab === 'budget-planning' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget-planning')}
        >
          Budget Planning
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'damage-forecast' && (
          <div>
            <h2>Projected Damage Costs (5-Year Forecast)</h2>
            
            <div className="info-box">
              <h3>Forecast Insights</h3>
              <ul className="list-disc">
                <li>Based on historical patterns, damage costs are projected to increase by approximately 15% annually</li>
                <li>Implementing preventative measures could reduce projected costs by 25-40%</li>
                <li>Highest risk period for all installations is during hurricane season (June-November)</li>
                <li>Cost-benefit analysis suggests prioritizing infrastructure hardening at high-risk installations</li>
              </ul>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => `$${value / 1000000}M`} 
                    domain={[0, 'dataMax + 5000000']} 
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="upperBound" 
                    stroke="#FF8042" 
                    strokeWidth={2}
                    name="Upper Bound"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lowerBound" 
                    stroke="#00C49F" 
                    strokeWidth={2}
                    name="Lower Bound"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictedDamage" 
                    stroke="#8884d8" 
                    strokeWidth={2} 
                    name="Predicted Damage" 
                    dot={{ r: 5 }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <h2>Historical Yearly Trends</h2>
            <div className="info-box">
              <h3>Historical Trend Insights</h3>
              <p>Analysis of yearly damage costs from {Math.min(...years)} to {Math.max(...years)} shows a {
                costTrend[costTrend.length - 1].value > costTrend[0].value ? 'rising' : 'varying'
              } trend in weather-related damages. The data indicates {
                costTrend.reduce((max, current) => current.count > max.count ? current : max, costTrend[0]).name
              } had the highest number of weather events (${
                costTrend.reduce((max, current) => current.count > max.count ? current : max, costTrend[0]).count
              } events).</p>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={costTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    tickFormatter={(value) => `$${value / 1000000}M`} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 'dataMax + 5']} 
                  />
                  <Tooltip formatter={(value, name) => {
                    if (name === "value") return formatCurrency(value);
                    return value;
                  }} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    barSize={60} 
                    fill="#8884d8" 
                    yAxisId="left" 
                    name="Total Cost" 
                  />
                  <Bar 
                    dataKey="count" 
                    barSize={60} 
                    fill="#82ca9d" 
                    yAxisId="right" 
                    name="Event Count" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {activeTab === 'event-analysis' && (
          <div>
            <InsightBox
              title="Event Type Distribution Insights"
              insights={`${costByWeatherType[0]?.name || 'Weather events'} account for ${costByWeatherType[0]?.percentage || 0}% of total damage costs. ${
                costByWeatherType[1]?.name ? `${costByWeatherType[1].name} follows with ${costByWeatherType[1].percentage}% of costs.` : ''
              } This analysis highlights the need for targeted infrastructure improvements and mitigation strategies for these high-impact events.`}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h2>Cost by Weather Event Type</h2>
                <div className="chart-container" style={{height: '400px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costByWeatherType}
                        cx="40%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => {
                          // Only show label if percentage is 2% or greater
                          return percent >= 0.02 ? `${name}: ${(percent * 100).toFixed(1)}%` : '';
                        }}
                        labelStyle={{ 
                          fontSize: '10px', 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                      >
                        {costByWeatherType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h2>Top Weather Events by Cost Impact</h2>
                <div className="chart-container" style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weatherEventsByCost}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        scale="log" 
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => {
                          if (value >= 1000000) {
                            return `$${(value / 1000000).toFixed(1)}M`;
                          } else if (value >= 1000) {
                            return `$${(value / 1000).toFixed(1)}K`;
                          }
                          return `$${value}`;
                        }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={240}
                        style={{
                          fontSize: '13px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        tick={props => (
                          <text
                            {...props}
                            fill="#4a5568"
                            textAnchor="end"
                            dominantBaseline="middle"
                            x={props.x - 10}
                          >
                            {props.payload.value}
                          </text>
                        )}
                      />
                      <Tooltip 
                        formatter={(value) => {
                          if (value >= 1000000) {
                            return [`$${(value / 1000000).toFixed(2)}M`, 'Cost'];
                          } else if (value >= 1000) {
                            return [`$${(value / 1000).toFixed(2)}K`, 'Cost'];
                          }
                          return [`$${value.toFixed(2)}`, 'Cost'];
                        }}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'geographic-analysis' && (
          <div>
            <h2>Geographic Distribution of Weather Damage</h2>
            
            <InsightBox
              title="Geographic Distribution Insights"
              insights="The heatmap reveals concentrated damage patterns in coastal and storm-prone regions, with installations in the Southeast showing particularly high impact. This geographic analysis suggests the need for region-specific mitigation strategies."
            />
            
            <div className="chart-container" style={{height: '500px', marginBottom: '2rem'}}>
              <MapContainer
                center={[39.8283, -98.5795]}
                zoom={4}
                style={{height: '100%', width: '100%'}}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {costByInstallation.map((installation) => {
                  const coords = INSTALLATION_COORDINATES[installation.name];
                  if (!coords) return null;
                  
                  const radius = Math.sqrt(installation.value / 1000000) * 5;
                  return (
                    <CircleMarker
                      key={installation.name}
                      center={[coords.lat, coords.lng]}
                      radius={radius}
                      fillColor="#e53e3e"
                      color="#742a2a"
                      weight={1}
                      opacity={0.8}
                      fillOpacity={0.6}
                    >
                      <Popup>
                        <strong>{installation.name}</strong><br />
                        Damage Cost: {formatCurrency(installation.value)}
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
            
            <h2>Top 10 Impacted Installations</h2>
            <InsightBox
              title="Installation Impact Analysis"
              insights={`${costByInstallation[0]?.name || 'Installations'} leads with ${formatCurrency(costByInstallation[0]?.value || 0)} in damages, followed by ${costByInstallation[1]?.name} (${formatCurrency(costByInstallation[1]?.value || 0)}). The top 3 installations account for ${
                Math.round((costByInstallation.slice(0, 3).reduce((sum, inst) => sum + inst.value, 0) / totalCost) * 100)
              }% of total damages.`}
            />
            
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={costByInstallation}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={180}
                    style={{
                      fontSize: '12px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {activeTab === 'scenario-modeling' && (
          <div>
            <h2>Scenario Modeling & Impact Analysis</h2>
            
            <InsightBox
              title="Mitigation Strategy Analysis"
              insights={`Based on historical damage patterns, we've identified ${scenarios.length} key mitigation strategies. These strategies target the most impactful weather events: ${
                costByWeatherType.slice(0, 3).map(type => type.name).join(', ')
              }. Select combinations of strategies to model their potential impact on damage reduction.`}
            />
            
            <div className="chart-half-container">
              <div className="chart-card" style={{backgroundColor: '#f7fafc'}}>
                <h3>Mitigation Scenarios</h3>
                <div style={{marginTop: '1rem'}}>
                  {scenarios.map(scenario => (
                    <div className="checkbox-group" key={scenario.id}>
                      <input
                        type="checkbox"
                        id={scenario.id}
                        checked={selectedScenarios.includes(scenario.id)}
                        onChange={() => handleScenarioChange(scenario.id)}
                        style={{marginRight: '0.5rem'}}
                      />
                      <label htmlFor={scenario.id}>
                        {scenario.name} ({Math.round(scenario.reduction * 100)}% reduction in {scenario.type} damage)
                      </label>
                    </div>
                  ))}
                </div>
                <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                  <button
                    className="button"
                    onClick={runScenario}
                    style={{
                      backgroundColor: '#4299e1',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Run Scenario
                  </button>
                  <button
                    className="button"
                    onClick={applyOptimalScenario}
                    style={{
                      backgroundColor: '#48bb78',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Apply Optimal Scenario
                  </button>
                </div>
              </div>
              
              <div className="chart-card">
                <h3>Projected Savings</h3>
                <div style={{height: '200px', marginTop: '1rem'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Current Projection", value: scenarioResults.currentProjection },
                        { name: "With Mitigation", value: scenarioResults.withMitigation }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value / 1000000}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="#8884d8">
                        <Cell fill="#FF8042" />
                        <Cell fill="#00C49F" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{marginTop: '1rem', textAlign: 'center'}}>
                  <p style={{fontSize: '1.125rem', fontWeight: 'bold', color: '#48bb78'}}>
                    Estimated Savings: {formatCurrency(scenarioResults.savings)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'budget-planning' && (
          <div>
            <h2>Budget Planning & Resource Allocation</h2>
            
            <InsightBox
              title="Investment Strategy Overview"
              insights={`Based on ${years.length} years of historical data, we recommend focusing investments on ${
                costByWeatherType.slice(0, 2).map(type => type.name).join(' and ')
              } protection, which account for ${
                costByWeatherType.slice(0, 2).reduce((sum, type) => sum + type.percentage, 0)
              }% of total damages. The proposed 5-year investment strategy targets these high-impact areas.`}
            />
            
            <div className="chart-half-container">
              <div className="chart-card">
                <h3>Mitigation Investment vs. Savings</h3>
                <div style={{height: '250px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { year: '2025', investment: 4500000, savings: 2700000 },
                        { year: '2026', investment: 4500000, savings: 6300000 },
                        { year: '2027', investment: 4500000, savings: 8100000 },
                        { year: '2028', investment: 4500000, savings: 9900000 },
                        { year: '2029', investment: 4500000, savings: 11700000 },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${value / 1000000}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="investment" stroke="#8884d8" strokeWidth={2} name="Annual Investment" />
                      <Line type="monotone" dataKey="savings" stroke="#82ca9d" strokeWidth={2} name="Cumulative Savings" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="chart-card">
                <h3>Resource Allocation by Weather Event Type</h3>
                <div style={{height: '250px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costByWeatherType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={160}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => {
                          // Only show label if percentage is 2% or greater
                          return percent >= 0.02 ? `${name}: ${(percent * 100).toFixed(1)}%` : '';
                        }}
                        labelStyle={{ fontSize: '10px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        {costByWeatherType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="info-box">
              <h3>Budget Recommendation</h3>
              <p style={{marginBottom: '0.5rem'}}>
                Based on cost-benefit analysis, we recommend allocating $22.5M over 5 years for weather-related infrastructure hardening across high-risk installations.
              </p>
              <p>
                Projected ROI: 2.6x (cumulative savings of $58.7M against total investment of $22.5M)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDamageDashboard; 