import React, { useState, useEffect } from 'react';
import './../../assets/css/hcmData.css';

const HcmData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://apisetu.gov.in/pt/5/srv/v1/hcm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-APISETU-CLIENTID': 'in.gov.uk.wecd',
            'X-APISETU-APIKEY': '4e29fb6ab061d4ef8665a90660ffe3963db7a55039d36e031f18298ad62adb14'
          },
          body: JSON.stringify({
            project_id: 1876,
            month: '4',
            year: '2026'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Extract data array from response
        let hcmData = [];
        if (result && result.data && Array.isArray(result.data)) {
          hcmData = result.data;
        } else if (Array.isArray(result)) {
          hcmData = result;
        }
        
        setData(hcmData);
      } catch (err) {
        setError('Failed to load data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="hcm-data-container">
      <h2>HCM Beneficiary Data</h2>
      {data.length === 0 ? (
        <p>No data available</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {Object.keys(data[0]).map(key => (
                <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                {Object.values(item).map((value, valIndex) => (
                  <td key={valIndex}>{value !== null && value !== undefined ? value : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HcmData;