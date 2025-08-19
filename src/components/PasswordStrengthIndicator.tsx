
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  onValidChange: (isValid: boolean) => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

export const PasswordStrengthIndicator = ({ password, onValidChange }: PasswordStrengthProps) => {
  const requirements: PasswordRequirement[] = [
    {
      label: 'At least 8 characters',
      test: (pwd) => pwd.length >= 8,
      met: password.length >= 8
    },
    {
      label: 'Contains uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd),
      met: /[A-Z]/.test(password)
    },
    {
      label: 'Contains lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd),
      met: /[a-z]/.test(password)
    },
    {
      label: 'Contains number',
      test: (pwd) => /\d/.test(pwd),
      met: /\d/.test(password)
    },
    {
      label: 'Contains special character',
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  ];

  const metRequirements = requirements.filter(req => req.met).length;
  const strength = (metRequirements / requirements.length) * 100;
  const isValid = metRequirements >= 4; // At least 4 out of 5 requirements

  React.useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  const getStrengthColor = () => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength < 40) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Password Strength</span>
          <span className={`font-medium ${
            strength < 40 ? 'text-red-500' : 
            strength < 60 ? 'text-yellow-500' : 
            strength < 80 ? 'text-blue-500' : 'text-green-500'
          }`}>
            {getStrengthText()}
          </span>
        </div>
        <Progress 
          value={strength} 
          className="h-2"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Requirements:</p>
        <ul className="space-y-1">
          {requirements.map((req, index) => (
            <li key={index} className="flex items-center text-sm">
              {req.met ? (
                <Check className="w-4 h-4 text-green-500 mr-2" />
              ) : (
                <X className="w-4 h-4 text-red-500 mr-2" />
              )}
              <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
