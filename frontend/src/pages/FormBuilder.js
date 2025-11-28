import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FormBuilder() {
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBases();
  }, []);

  const fetchBases = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/bases', { withCredentials: true });
      setBases(response.data.bases || []);
    } catch (error) {
      console.error('Error fetching bases:', error);
    }
  };

  const fetchTables = async (baseId) => {
    try {
      const response = await axios.get(`http://localhost:4000/api/bases/${baseId}/tables`, { withCredentials: true });
      setTables(response.data.tables || []);
      setSelectedBase(baseId);
      setFields([]);
      setQuestions([]);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchFields = async (baseId, tableId) => {
    try {
      const response = await axios.get(`http://localhost:4000/api/bases/${baseId}/${tableId}/fields`, { withCredentials: true });
      setFields(response.data.fields || []);
      setSelectedTable(tableId);
      setQuestions([]);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const addQuestion = (field) => {
    const questionKey = `q_${Date.now()}`;
    const newQuestion = {
      questionKey,
      airtableFieldId: field.id,
      label: field.name,
      type: field.type,
      required: false,
      conditionalRules: null,
      options: field.options?.choices?.map(choice => choice.name) || []
    };
    setQuestions([...questions, newQuestion]);
    setSelectedFields([...selectedFields, field.id]);
  };

  const removeQuestion = (questionKey) => {
    const question = questions.find(q => q.questionKey === questionKey);
    setQuestions(questions.filter(q => q.questionKey !== questionKey));
    setSelectedFields(selectedFields.filter(id => id !== question.airtableFieldId));
  };

  const updateQuestion = (questionKey, updates) => {
    setQuestions(questions.map(q => 
      q.questionKey === questionKey ? { ...q, ...updates } : q
    ));
  };

  const addConditionalRule = (questionKey) => {
    updateQuestion(questionKey, {
      conditionalRules: {
        logic: 'AND',
        conditions: [{ questionKey: '', operator: 'equals', value: '' }]
      }
    });
  };

  const updateConditionalRule = (questionKey, ruleIndex, updates) => {
    const question = questions.find(q => q.questionKey === questionKey);
    if (question.conditionalRules) {
      const newConditions = [...question.conditionalRules.conditions];
      newConditions[ruleIndex] = { ...newConditions[ruleIndex], ...updates };
      updateQuestion(questionKey, {
        conditionalRules: {
          ...question.conditionalRules,
          conditions: newConditions
        }
      });
    }
  };

  const addCondition = (questionKey) => {
    const question = questions.find(q => q.questionKey === questionKey);
    if (question.conditionalRules) {
      updateQuestion(questionKey, {
        conditionalRules: {
          ...question.conditionalRules,
          conditions: [
            ...question.conditionalRules.conditions,
            { questionKey: '', operator: 'equals', value: '' }
          ]
        }
      });
    }
  };

  const removeCondition = (questionKey, ruleIndex) => {
    const question = questions.find(q => q.questionKey === questionKey);
    if (question.conditionalRules) {
      const newConditions = question.conditionalRules.conditions.filter((_, index) => index !== ruleIndex);
      if (newConditions.length === 0) {
        updateQuestion(questionKey, { conditionalRules: null });
      } else {
        updateQuestion(questionKey, {
          conditionalRules: {
            ...question.conditionalRules,
            conditions: newConditions
          }
        });
      }
    }
  };

  const saveForm = async () => {
    if (!formTitle || !selectedBase || !selectedTable || questions.length === 0) {
      alert('Please fill in all required fields and add at least one question');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:4000/api/forms', {
        title: formTitle,
        airtableBaseId: selectedBase,
        airtableTableId: selectedTable,
        questions
      }, { withCredentials: true });

      alert('Form created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Failed to create form');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Create New Form</h1>

      <div style={{ marginBottom: '20px' }}>
        <label>Form Title:</label>
        <input
          type="text"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="Enter form title"
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>1. Select Airtable Base</h3>
        <select
          value={selectedBase}
          onChange={(e) => fetchTables(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">Choose a base...</option>
          {bases.map(base => (
            <option key={base.id} value={base.id}>{base.name}</option>
          ))}
        </select>
      </div>

      {tables.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>2. Select Table</h3>
          <select
            value={selectedTable}
            onChange={(e) => fetchFields(selectedBase, e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">Choose a table...</option>
            {tables.map(table => (
              <option key={table.id} value={table.id}>{table.name}</option>
            ))}
          </select>
        </div>
      )}

      {fields.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>3. Add Fields to Form</h3>
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {fields.filter(field => !selectedFields.includes(field.id)).map(field => (
              <div key={field.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                <h4>{field.name}</h4>
                <p>Type: {field.type}</p>
                <button onClick={() => addQuestion(field)}>Add to Form</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>4. Configure Questions</h3>
          {questions.map((question) => (
            <div key={question.questionKey} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>{question.label}</h4>
                <button onClick={() => removeQuestion(question.questionKey)}>Remove</button>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(question.questionKey, { required: e.target.checked })}
                  />
                  Required
                </label>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Custom Label:</label>
                <input
                  type="text"
                  value={question.label}
                  onChange={(e) => updateQuestion(question.questionKey, { label: e.target.value })}
                  style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                />
              </div>

              {!question.conditionalRules ? (
                <button onClick={() => addConditionalRule(question.questionKey)}>
                  Add Conditional Logic
                </button>
              ) : (
                <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '3px' }}>
                  <h5>Conditional Logic</h5>
                  <div>
                    <label>Logic: </label>
                    <select
                      value={question.conditionalRules.logic}
                      onChange={(e) => updateQuestion(question.questionKey, {
                        conditionalRules: { ...question.conditionalRules, logic: e.target.value }
                      })}
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  </div>

                  {question.conditionalRules.conditions.map((condition, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                      <select
                        value={condition.questionKey}
                        onChange={(e) => updateConditionalRule(question.questionKey, index, { questionKey: e.target.value })}
                      >
                        <option value="">Select question...</option>
                        {questions.filter(q => q.questionKey !== question.questionKey).map(q => (
                          <option key={q.questionKey} value={q.questionKey}>{q.label}</option>
                        ))}
                      </select>

                      <select
                        value={condition.operator}
                        onChange={(e) => updateConditionalRule(question.questionKey, index, { operator: e.target.value })}
                      >
                        <option value="equals">equals</option>
                        <option value="notEquals">not equals</option>
                        <option value="contains">contains</option>
                      </select>

                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateConditionalRule(question.questionKey, index, { value: e.target.value })}
                        placeholder="Value"
                      />

                      <button onClick={() => removeCondition(question.questionKey, index)}>-</button>
                    </div>
                  ))}

                  <div style={{ marginTop: '10px' }}>
                    <button onClick={() => addCondition(question.questionKey)}>Add Condition</button>
                    <button onClick={() => updateQuestion(question.questionKey, { conditionalRules: null })}>
                      Remove All Rules
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <div>
          <button
            onClick={saveForm}
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Form...' : 'Create Form'}
          </button>
        </div>
      )}
    </div>
  );
}

export default FormBuilder;