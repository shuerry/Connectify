import { useMemo } from 'react';
import './PasswordStrength.css';

interface PasswordStrengthProps {
  password: string;
}

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: password => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: password => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: password => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'One number',
    test: password => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'One special character (!@#$%^&*)',
    test: password => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  },
];

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const analysis = useMemo(() => {
    const metRequirements = PASSWORD_REQUIREMENTS.filter(req => req.test(password));
    const strength = metRequirements.length;

    let strengthLevel: 'weak' | 'fair' | 'good' | 'strong';
    let strengthText: string;

    if (strength <= 1) {
      strengthLevel = 'weak';
      strengthText = 'Weak';
    } else if (strength <= 2) {
      strengthLevel = 'fair';
      strengthText = 'Fair';
    } else if (strength <= 3) {
      strengthLevel = 'good';
      strengthText = 'Good';
    } else {
      strengthLevel = 'strong';
      strengthText = 'Strong';
    }

    return {
      metRequirements,
      strength,
      strengthLevel,
      strengthText,
      percentage: (strength / PASSWORD_REQUIREMENTS.length) * 100,
    };
  }, [password]);

  // Don't show anything if password is empty
  if (!password) {
    return null;
  }

  return (
    <div className='password-strength'>
      <div className='strength-header'>
        <div className='strength-label'>Password strength:</div>
        <div className={`strength-text strength-${analysis.strengthLevel}`}>
          {analysis.strengthText}
        </div>
      </div>
      
      <div className='strength-bar-container'>
        <div 
          className={`strength-bar strength-${analysis.strengthLevel}`}
          style={{ width: `${analysis.percentage}%` }}
        />
      </div>
      
      <div className='requirements-list'>
        {PASSWORD_REQUIREMENTS.map((requirement: PasswordRequirement) => (
          <div
            key={requirement.id}
            className={`requirement ${analysis.metRequirements.includes(requirement) ? 'met' : 'unmet'}`}
          >
            <svg
              className='requirement-icon'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              {analysis.metRequirements.includes(requirement) ? (
                <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/>
              ) : (
                <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/>
              )}
            </svg>
            <span className='requirement-text'>{requirement.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;