import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft, ArrowRight, Mail, UserPlus } from 'lucide-react';

const RegistrationFlow = () => {
  const [currentStep, setCurrentStep] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    accountId: '',
    invoiceLast4: ''
  });

  const [validation, setValidation] = useState({
    email: { status: 'idle', message: '' },
    username: { status: 'idle', message: '' },
    password: { status: 'idle', message: '' }
  });

  const [errors, setErrors] = useState({});
  const [accountVerification, setAccountVerification] = useState({
    status: 'idle',
    attempts: 3,
    verified: false,
    message: ''
  });

  // Real-time validation for email
  useEffect(() => {
    if (formData.email && currentStep === 'step1') {
      setValidation(prev => ({ ...prev, email: { status: 'validating', message: '' } }));

      const timer = setTimeout(() => {
        if (formData.email.includes('test')) {
          setValidation(prev => ({
            ...prev,
            email: { status: 'error', message: 'Email already exists' }
          }));
        } else if (formData.email.includes('@')) {
          setValidation(prev => ({
            ...prev,
            email: { status: 'success', message: 'Email available' }
          }));
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formData.email, currentStep]);

  // Real-time validation for username
  useEffect(() => {
    if (formData.username && currentStep === 'step1') {
      setValidation(prev => ({ ...prev, username: { status: 'validating', message: '' } }));

      const timer = setTimeout(() => {
        if (formData.username === 'admin') {
          setValidation(prev => ({
            ...prev,
            username: { status: 'error', message: 'Username not available' }
          }));
        } else if (formData.username.length >= 3) {
          setValidation(prev => ({
            ...prev,
            username: { status: 'success', message: 'Username available' }
          }));
        } else {
          setValidation(prev => ({
            ...prev,
            username: { status: 'error', message: 'Username too short' }
          }));
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formData.username, currentStep]);

  // Password strength validation
  useEffect(() => {
    if (formData.password && currentStep === 'step1') {
      const hasUppercase = /[A-Z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);
      const isLongEnough = formData.password.length >= 8;

      if (isLongEnough && hasUppercase && hasNumber) {
        setValidation(prev => ({
          ...prev,
          password: { status: 'success', message: 'Strong password' }
        }));
      } else {
        setValidation(prev => ({
          ...prev,
          password: { status: 'error', message: 'Requires 8+ characters, uppercase, and number' }
        }));
      }
    }
  }, [formData.password, currentStep]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    // Check validation states
    if (validation.email.status === 'error') newErrors.email = validation.email.message;
    if (validation.username.status === 'error') newErrors.username = validation.username.message;
    if (validation.password.status === 'error') newErrors.password = validation.password.message;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep1()) {
      setCurrentStep('step2');
    }
  };

  const handleVerifyAccount = () => {
    if (!formData.accountId.trim() || formData.invoiceLast4.length !== 4) {
      setAccountVerification(prev => ({
        ...prev,
        status: 'error',
        message: 'Please fill in all fields correctly'
      }));
      return;
    }

    // Simulate verification
    const isValid = formData.accountId.trim() && /^\d{4}$/.test(formData.invoiceLast4);

    if (isValid) {
      setAccountVerification(prev => ({
        ...prev,
        status: 'success',
        verified: true,
        message: 'Account verified successfully!'
      }));
    } else {
      setAccountVerification(prev => ({
        ...prev,
        status: 'error',
        attempts: prev.attempts - 1,
        message: `Invalid account information. Attempts remaining: ${prev.attempts - 1}`
      }));
    }
  };

  const getValidationIcon = (field) => {
    const status = validation[field]?.status;
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    return null;
  };

  const renderLogin = () => (
    <div className="max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Sign in to your account</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            USERNAME
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none transition-colors text-base"
              placeholder="Enter username"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            PASSWORD
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none transition-colors text-base"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPassword ?
                <EyeOff className="h-5 w-5 text-gray-400" /> :
                <Eye className="h-5 w-5 text-gray-400" />
              }
            </button>
          </div>
        </div>

        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded transition-colors">
          Login
        </button>

        <div className="text-right">
          <a href="#" className="text-sm text-blue-500 hover:text-blue-600">
            Forgot Password?
          </a>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">Don't have an account?</p>
          <button
            onClick={() => setCurrentStep('step1')}
            className="w-full border-2 border-blue-500 text-blue-500 font-semibold py-3 rounded hover:bg-blue-50 transition-colors"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-lg mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
        <p className="text-gray-600">Step 1 of 2: Enter your information</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            FULL NAME
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className={`w-full px-3 py-3 border-2 rounded focus:outline-none transition-colors text-base ${
              errors.fullName ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
            }`}
            placeholder="Enter full name"
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-3 pr-10 border-2 rounded focus:outline-none transition-colors text-base ${
                errors.email ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Enter email address"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon('email')}
            </div>
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            USERNAME
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`w-full px-3 py-3 pr-10 border-2 rounded focus:outline-none transition-colors text-base ${
                errors.username ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Enter username"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon('username')}
            </div>
          </div>
          {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-3 pr-10 border-2 rounded focus:outline-none transition-colors text-base ${
                errors.password ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPassword ?
                <EyeOff className="h-5 w-5 text-gray-400" /> :
                <Eye className="h-5 w-5 text-gray-400" />
              }
            </button>
          </div>
          {validation.password.status !== 'idle' && (
            <div className={`mt-1 text-sm ${validation.password.status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {validation.password.message}
            </div>
          )}
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            CONFIRM PASSWORD
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full px-3 py-3 pr-10 border-2 rounded focus:outline-none transition-colors text-base ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Confirm password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showConfirmPassword ?
                <EyeOff className="h-5 w-5 text-gray-400" /> :
                <Eye className="h-5 w-5 text-gray-400" />
              }
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
        </div>
      </div>

      <div className="flex space-x-3 mt-8">
        <button
          onClick={() => setCurrentStep('login')}
          className="flex-1 border-2 border-gray-300 text-gray-600 font-semibold py-3 rounded hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded transition-colors flex items-center justify-center"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-lg mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Link to Your Account</h2>
        <p className="text-gray-600">Step 2 of 2: To access your invoices, please verify your account information</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            ACCOUNT ID
          </label>
          <input
            type="text"
            value={formData.accountId}
            onChange={(e) => handleInputChange('accountId', e.target.value)}
            className="w-full px-3 py-3 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none transition-colors text-base"
            placeholder="Enter account ID"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            LAST 4 DIGITS OF INVOICE #
          </label>
          <input
            type="text"
            value={formData.invoiceLast4}
            onChange={(e) => handleInputChange('invoiceLast4', e.target.value)}
            maxLength="4"
            className="w-full px-3 py-3 border-2 border-gray-200 rounded focus:border-blue-500 focus:outline-none transition-colors text-base"
            placeholder="0000"
          />
        </div>

        <button
          onClick={handleVerifyAccount}
          disabled={accountVerification.attempts === 0}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded transition-colors"
        >
          Verify Account
        </button>

        {accountVerification.status === 'success' && (
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-green-700 text-sm">Account verified! Click Complete Registration below.</span>
          </div>
        )}

        {accountVerification.status === 'error' && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded">
            <XCircle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-red-700 text-sm">{accountVerification.message}</span>
          </div>
        )}
      </div>

      <div className="flex space-x-3 mt-8">
        <button
          onClick={() => setCurrentStep('step1')}
          className="flex-1 border-2 border-gray-300 text-gray-600 font-semibold py-3 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </button>
        {accountVerification.verified && (
          <button
            onClick={() => setCurrentStep('success')}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded transition-colors"
          >
            Complete Registration
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Having trouble? <a href="#" className="text-blue-500 hover:text-blue-600">Contact Support</a>
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="max-w-lg mx-auto text-center">
      <div className="mb-8">
        <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
        <p className="text-gray-600">Welcome to the platform, {formData.fullName}!</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-gray-600">Username:</span>
            <span className="font-medium">{formData.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Linked Account:</span>
            <span className="font-medium">{formData.accountId}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-blue-500 mr-3" />
          <span className="text-blue-700 text-sm">📧 Confirmation email sent to {formData.email}</span>
        </div>
      </div>

      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded transition-colors">
        Go to Dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left side - Gradient with logo */}
      <div className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center text-white p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-6 mx-auto">
            <span className="text-2xl font-bold text-gray-900">$</span>
          </div>
          <h1 className="text-red-500 font-bold text-lg mb-2">SANDBOX QA ORG</h1>
          <p className="text-white text-base">BILLING</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-xl p-8">
            {currentStep === 'login' && renderLogin()}
            {currentStep === 'step1' && renderStep1()}
            {currentStep === 'step2' && renderStep2()}
            {currentStep === 'success' && renderSuccess()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationFlow;