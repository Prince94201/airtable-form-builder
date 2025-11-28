import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [bases, setBases] = useState([]);
  const [selectedBase, setSelectedBase] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [records, setRecords] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('forms');

  useEffect(() => {
    axios.get(`${process.env.WEB_SERVER_URL}/auth/me`, { withCredentials: true })
      .then(res => {
        setUser(res.data.user);
        fetchBases();
        fetchForms();
      })
      .catch(err => {
        console.error(err);
        fetchBases();
        fetchForms();
      });
  }, []);

  const fetchBases = async () => {
    try {
      const response = await axios.get(`https://airtable-form-builder-xqkq.onrender.com/api/bases`, { withCredentials: true });
      setBases(response.data.bases || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bases:', error);
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      const response = await axios.get(`https://airtable-form-builder-xqkq.onrender.com/api/forms`, { withCredentials: true });
      setForms(response.data.forms || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const fetchTables = async (baseId) => {
    setDataLoading(true);
    try {
      const response = await axios.get(`https://airtable-form-builder-xqkq.onrender.com/api/bases/${baseId}/tables`, { withCredentials: true });
      setTables(response.data.tables || []);
      setSelectedBase(baseId);
      setSelectedTable(null);
      setRecords([]);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
    setDataLoading(false);
  };

  const fetchRecords = async (baseId, tableId) => {
    setDataLoading(true);
    try {
      const response = await axios.get(`https://airtable-form-builder-xqkq.onrender.com/api/bases/${baseId}/${tableId}/records`, { withCredentials: true });
      console.log('Raw Airtable response:', response.data); // Debug log
      setRecords(response.data.records || []);
      setSelectedTable(tableId);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
    setDataLoading(false);
  };

  const getAllFieldNames = (records) => {
    const allFields = new Set();
    records.forEach(record => {
      if (record.fields) {
        Object.keys(record.fields).forEach(fieldName => {
          allFields.add(fieldName);
        });
      }
    });
    return Array.from(allFields).sort();
  };

  const renderRecordValue = (value) => {
    if (value === undefined || value === null) {
      return '';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const copyFormLink = (formId) => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
    alert('Form link copied to clipboard!');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Airtable Form Builder Dashboard</h1>
      {user && <p>Welcome, {user.email}!</p>}
      
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('forms')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            border: 'none',
            backgroundColor: activeTab === 'forms' ? '#2563eb' : 'transparent',
            color: activeTab === 'forms' ? 'white' : '#2563eb',
            borderBottom: activeTab === 'forms' ? '2px solid #2563eb' : 'none',
            cursor: 'pointer'
          }}
        >
          My Forms
        </button>
        <button
          onClick={() => setActiveTab('airtable')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'airtable' ? '#2563eb' : 'transparent',
            color: activeTab === 'airtable' ? 'white' : '#2563eb',
            borderBottom: activeTab === 'airtable' ? '2px solid #2563eb' : 'none',
            cursor: 'pointer'
          }}
        >
          Airtable Data
        </button>
      </div>

      {activeTab === 'forms' && (
        <div>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Your Forms</h2>
            <Link 
              to="/form-builder"
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px'
              }}
            >
              Create New Form
            </Link>
          </div>

          {forms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No forms created yet.</p>
              <Link to="/form-builder">Create your first form</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {forms.map(form => (
                <div 
                  key={form._id} 
                  style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '8px', 
                    padding: '20px',
                    backgroundColor: 'white'
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0' }}>{form.title}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                    Created: {formatDate(form.createdAt)}
                  </p>
                  <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
                    Questions: {form.questions?.length || 0}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => copyFormLink(form.formId)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Copy Link
                    </button>
                    
                    <Link
                      to={`/form/${form.formId}`}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      Preview
                    </Link>
                    
                    <Link
                      to={`/forms/${form.formId}/responses`}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      View Responses
                    </Link>
                  </div>
                  
                  <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
                    <strong>Form ID:</strong> {form.formId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'airtable' && (
        <div>
          <div style={{ marginBottom: '30px' }}>
            <h2>Your Airtable Bases</h2>
            {bases.length === 0 ? (
              <p>No bases found or unable to fetch bases.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {bases.map(base => (
                  <div 
                    key={base.id} 
                    style={{ 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      padding: '15px',
                      cursor: 'pointer',
                      backgroundColor: selectedBase === base.id ? '#e3f2fd' : 'white'
                    }}
                    onClick={() => fetchTables(base.id)}
                  >
                    <h3 style={{ margin: '0 0 10px 0' }}>{base.name}</h3>
                    <p style={{ margin: 0, color: '#666' }}>Click to view tables</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedBase && tables.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2>Tables</h2>
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {tables.map(table => (
                  <div 
                    key={table.id} 
                    style={{ 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      padding: '10px',
                      cursor: 'pointer',
                      backgroundColor: selectedTable === table.id ? '#e8f5e8' : 'white'
                    }}
                    onClick={() => fetchRecords(selectedBase, table.id)}
                  >
                    <h4 style={{ margin: '0 0 5px 0' }}>{table.name}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                      {table.fields?.length || 0} fields
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dataLoading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading data...</div>}

          {selectedTable && records.length > 0 && !dataLoading && (
            <div>
              <h2>Records</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      {getAllFieldNames(records).map(fieldName => (
                        <th key={fieldName} style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>
                          {fieldName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(record => {
                      const allFieldNames = getAllFieldNames(records);
                      return (
                        <tr key={record.id}>
                          {allFieldNames.map(fieldName => (
                            <td key={fieldName} style={{ border: '1px solid #ddd', padding: '10px' }}>
                              {renderRecordValue(record.fields && record.fields[fieldName])}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: '10px', color: '#666' }}>
                Showing {records.length} records with {getAllFieldNames(records).length} fields
              </p>
            </div>
          )}

          {selectedTable && records.length === 0 && !dataLoading && (
            <div>
              <h2>Records</h2>
              <p>No records found in this table.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;