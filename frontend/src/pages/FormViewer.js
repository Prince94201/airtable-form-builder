import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const shouldShowQuestion = (rules, answersSoFar) => {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const evaluateCondition = (condition) => {
    const { questionKey, operator, value } = condition;
    const answer = answersSoFar[questionKey];

    if (answer === undefined || answer === null) {
      return false;
    }

    switch (operator) {
      case 'equals':
        return answer === value;
      case 'notEquals':
        return answer !== value;
      case 'contains':
        if (typeof answer === 'string') {
          return answer.toLowerCase().includes(String(value).toLowerCase());
        }
        if (Array.isArray(answer)) {
          return answer.includes(value);
        }
        return false;
      default:
        return false;
    }
  };

  const results = rules.conditions.map(evaluateCondition);

  if (rules.logic === 'AND') {
    return results.every(result => result === true);
  } else if (rules.logic === 'OR') {
    return results.some(result => result === true);
  }

  return true;
};

function FormViewer() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const response = await axios.get(`${process.env.WEB_SERVER_URL}/api/forms/${formId}`);
      setForm(response.data.form);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching form:', error);
      setError('Form not found');
      setLoading(false);
    }
  };

  const handleInputChange = (questionKey, value) => {
    setAnswers({ ...answers, [questionKey]: value });
  };

  const validateForm = () => {
    if (!form) return false;

    const requiredQuestions = form.questions.filter(q => q.required);
    for (const question of requiredQuestions) {
      if (!shouldShowQuestion(question.conditionalRules, answers)) {
        continue;
      }
      
      if (!answers[question.questionKey] || answers[question.questionKey] === '') {
        setError(`Required field "${question.label}" is missing`);
        return false;
      }
    }
    return true;
  };

  const submitForm = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      await axios.post(`${process.env.WEB_SERVER_URL}/api/forms/${formId}/submit`, { answers });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.response?.data?.error || 'Failed to submit form');
    }
    setSubmitting(false);
  };

  const renderQuestion = (question) => {
    const isVisible = shouldShowQuestion(question.conditionalRules, answers);
    if (!isVisible) return null;

    const value = answers[question.questionKey] || '';

    switch (question.type) {
      case 'singleLineText':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(question.questionKey, e.target.value)}
            placeholder={`Enter ${question.label.toLowerCase()}`}
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          />
        );

      case 'multilineText':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(question.questionKey, e.target.value)}
            placeholder={`Enter ${question.label.toLowerCase()}`}
            rows={4}
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          />
        );

      case 'singleSelect':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(question.questionKey, e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          >
            <option value="">Choose an option...</option>
            {question.options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'multipleSelect':
        return (
          <div>
            {question.options.map((option, index) => (
              <label key={index} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleInputChange(question.questionKey, [...currentValues, option]);
                    } else {
                      handleInputChange(question.questionKey, currentValues.filter(v => v !== option));
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'attachment':
        return (
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleInputChange(question.questionKey, file.name);
              }
            }}
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          />
        );

      default:
        return <p>Unsupported question type: {question.type}</p>;
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading form...</div>;
  }

  if (error && !form) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  if (submitted) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Thank you!</h2>
        <p>Your form has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>{form.title}</h1>

      {error && (
        <div style={{ 
          backgroundColor: '#fee', 
          color: '#c33', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      <div>
        {form.questions.map((question) => {
          const isVisible = shouldShowQuestion(question.conditionalRules, answers);
          if (!isVisible) return null;

          return (
            <div key={question.questionKey} style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {question.label}
                {question.required && <span style={{ color: 'red' }}> *</span>}
              </label>
              {renderQuestion(question)}
            </div>
          );
        })}
      </div>

      <button
        onClick={submitForm}
        disabled={submitting}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: submitting ? 'not-allowed' : 'pointer',
          marginTop: '20px'
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Form'}
      </button>
    </div>
  );
}

export default FormViewer;