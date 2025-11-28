import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function ResponseViewer() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFormAndResponses();
  }, [formId]);

  const fetchFormAndResponses = async () => {
    try {
      const formResponse = await axios.get(`${process.env.WEB_SERVER_URL}/api/forms/${formId}`, { withCredentials: true });
      setForm(formResponse.data.form);

      const responsesResponse = await axios.get(`${process.env.WEB_SERVER_URL}/api/forms/${formId}/responses`, { withCredentials: true });
      setResponses(responsesResponse.data.responses);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load form responses');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getAnswerPreview = (answers) => {
    const keys = Object.keys(answers);
    if (keys.length === 0) return 'No answers';
    
    const preview = keys.slice(0, 2).map(key => {
      const value = answers[key];
      if (Array.isArray(value)) {
        return `${key}: [${value.join(', ')}]`;
      }
      return `${key}: ${String(value).substring(0, 50)}`;
    }).join(', ');
    
    return keys.length > 2 ? `${preview}...` : preview;
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading responses...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Form Responses: {form?.title}</h1>
      <p>Form ID: {formId}</p>
      <p>Total Responses: {responses.length}</p>

      {responses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No responses yet.</p>
          <p>Share your form to start collecting responses!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>ID</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Submitted</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Answers Preview</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Airtable Record</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response, index) => (
                <tr key={response._id}>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                    #{index + 1}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                    {formatDate(response.createdAt)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: response.deletedInAirtable ? '#fee' : '#efe',
                      color: response.deletedInAirtable ? '#c33' : '#363'
                    }}>
                      {response.deletedInAirtable ? 'Deleted in Airtable' : 'Active'}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                    {getAnswerPreview(response.answers)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                    {response.airtableRecordId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Detailed Responses</h3>
        {responses.map((response, index) => (
          <div key={response._id} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: response.deletedInAirtable ? '#fafafa' : 'white'
          }}>
            <h4>Response #{index + 1}</h4>
            <p><strong>Submitted:</strong> {formatDate(response.createdAt)}</p>
            <p><strong>Airtable Record ID:</strong> {response.airtableRecordId}</p>
            {response.deletedInAirtable && (
              <p style={{ color: '#c33' }}><strong>Status:</strong> Deleted in Airtable</p>
            )}
            
            <div style={{ marginTop: '10px' }}>
              <strong>Answers:</strong>
              <div style={{ marginTop: '5px', paddingLeft: '20px' }}>
                {Object.entries(response.answers).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '5px' }}>
                    <strong>{key}:</strong> {
                      Array.isArray(value) ? `[${value.join(', ')}]` : String(value)
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponseViewer;