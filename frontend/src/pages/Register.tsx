import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { graduationYears, covenantDepartments } from '../constants/covenantOptions';
import { COVENANT_LOGO_URL } from '../constants/branding';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    graduationYear: '',
    department: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.graduationYear) {
      setError('Graduation year is required');
      return;
    }
    if (!formData.department.trim()) {
      setError('Department is required');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        graduationYear: Number(formData.graduationYear),
        department: formData.department
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <img 
            src={COVENANT_LOGO_URL}
            alt="Covenant University Logo" 
            className="h-16 w-16 mx-auto mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h1 className="text-3xl font-bold text-center text-gray-800">
            Create Account
          </h1>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="Enter your password (min 6 characters)"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Input
            type="password"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Graduation Year
            </label>
            <select
              name="graduationYear"
              value={formData.graduationYear}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select graduation year</option>
              {graduationYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select department</option>
              {covenantDepartments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Register
          </Button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-semibold" style={{ color: '#6c4ecf' }}>
            Login here
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;
