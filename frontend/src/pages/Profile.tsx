import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { alumniAPI } from '../services/apiService';
import { CompanySuggestion } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    graduationYear: user?.graduationYear || '',
    department: user?.department || '',
    employmentStatus: user?.employmentStatus || 'unemployed',
    jobTitle: user?.jobTitle || '',
    company: user?.company || '',
    location: user?.location || '',
    phone: user?.phone || '',
    linkedIn: user?.linkedIn || '',
    bio: user?.bio || '',
    openToMentorship: user?.openToMentorship || false,
    mentorshipTopics: (user?.mentorshipTopics || []).join(', '),
    skills: (user?.skills || []).join(', '),
    mentorshipAvailability: user?.mentorshipAvailability || 'not-available',
    mentorshipCapacity: String(user?.mentorshipCapacity || 1)
  });
  const [isLoading, setIsLoading] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<CompanySuggestion[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);

  React.useEffect(() => {
    const isCompanyEnabled = formData.employmentStatus === 'employed';
    const query = formData.company.trim();

    if (!isCompanyEnabled || query.length < 2) {
      setCompanySuggestions([]);
      setShowCompanyDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingCompany(true);
        const response = await alumniAPI.searchCompanies(query);
        const suggestions = response.data?.suggestions || [];
        setCompanySuggestions(suggestions);
        setShowCompanyDropdown(suggestions.length > 0);
      } catch (error) {
        console.error('Company search error:', error);
        setCompanySuggestions([]);
        setShowCompanyDropdown(false);
      } finally {
        setIsSearchingCompany(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [formData.company, formData.employmentStatus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value
    });

    if (e.target.name === 'employmentStatus' && e.target.value !== 'employed') {
      setCompanySuggestions([]);
      setShowCompanyDropdown(false);
    }
  };

  const parseCommaSeparated = (raw: string): string[] => {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  };

  const handleSelectCompany = (suggestion: CompanySuggestion) => {
    setFormData((prev) => ({
      ...prev,
      company: suggestion.name
    }));
    setCompanySuggestions([]);
    setShowCompanyDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateUser({
        name: formData.name,
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
        department: formData.department || undefined,
        employmentStatus: formData.employmentStatus as any,
        jobTitle: formData.employmentStatus === 'employed' ? (formData.jobTitle || undefined) : undefined,
        company: formData.employmentStatus === 'employed' ? (formData.company || undefined) : undefined,
        location: formData.location || undefined,
        phone: formData.phone || undefined,
        linkedIn: formData.linkedIn || undefined,
        bio: formData.bio || undefined,
        openToMentorship: Boolean(formData.openToMentorship),
        mentorshipTopics: formData.openToMentorship ? parseCommaSeparated(formData.mentorshipTopics) : [],
        skills: parseCommaSeparated(formData.skills),
        mentorshipAvailability: formData.openToMentorship
          ? (formData.mentorshipAvailability as 'not-available' | 'weekdays-evenings' | 'weekends' | 'flexible')
          : 'not-available',
        mentorshipCapacity: formData.openToMentorship ? Number(formData.mentorshipCapacity || 1) : 1
      });
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card title="My Profile">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              type="email"
              label="Email"
              value={user?.email}
              disabled
            />
            <Input
              type="number"
              name="graduationYear"
              label="Graduation Year"
              value={formData.graduationYear}
              onChange={handleChange}
            />
            <Input
              type="text"
              name="department"
              label="Department"
              value={formData.department}
              onChange={handleChange}
            />
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Employment Status</label>
              <select
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="employed">Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="self-employed">Self-employed</option>
                <option value="student">Student</option>
                <option value="seeking-opportunities">Seeking opportunities</option>
              </select>
            </div>
            <Input
              type="text"
              name="jobTitle"
              label="Job Title"
              value={formData.jobTitle}
              onChange={handleChange}
              disabled={formData.employmentStatus !== 'employed'}
              required={formData.employmentStatus === 'employed'}
            />
            <div className="mb-4 relative">
              <label className="block text-gray-700 font-medium mb-2">Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                onFocus={() => {
                  if (companySuggestions.length > 0) {
                    setShowCompanyDropdown(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowCompanyDropdown(false), 120);
                }}
                disabled={formData.employmentStatus !== 'employed'}
                required={formData.employmentStatus === 'employed'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Start typing company name..."
              />
              {isSearchingCompany && formData.employmentStatus === 'employed' && (
                <p className="text-xs text-gray-500 mt-1">Searching companies...</p>
              )}
              {showCompanyDropdown && companySuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {companySuggestions.map((suggestion, idx) => (
                    <button
                      key={`${suggestion.name}-${idx}`}
                      type="button"
                      onMouseDown={() => handleSelectCompany(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-800">{suggestion.name}</p>
                      {(suggestion.domain || suggestion.website) && (
                        <p className="text-xs text-gray-500">{suggestion.domain || suggestion.website}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Input
              type="text"
              name="location"
              label="Location"
              value={formData.location}
              onChange={handleChange}
            />
            <Input
              type="text"
              name="phone"
              label="Phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <Input
              type="text"
              name="linkedIn"
              label="LinkedIn Profile URL"
              value={formData.linkedIn}
              onChange={handleChange}
              className="md:col-span-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Bio</label>
            <textarea
              name="bio"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
            />
          </div>

          <Card className="mb-4" title="Mentorship Preferences">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 md:col-span-2">
                <input
                  type="checkbox"
                  name="openToMentorship"
                  checked={formData.openToMentorship}
                  onChange={handleChange}
                />
                <span className="text-gray-700">I am open to mentorship requests</span>
              </label>

              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2">Skills (comma-separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. React, Node.js, Product Design"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2">Mentorship Topics (comma-separated)</label>
                <input
                  type="text"
                  name="mentorshipTopics"
                  value={formData.mentorshipTopics}
                  onChange={handleChange}
                  disabled={!formData.openToMentorship}
                  placeholder="e.g. Career growth, Interview prep, Startup guidance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Mentorship Availability</label>
                <select
                  name="mentorshipAvailability"
                  value={formData.mentorshipAvailability}
                  onChange={handleChange}
                  disabled={!formData.openToMentorship}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                >
                  <option value="not-available">Not available</option>
                  <option value="weekdays-evenings">Weekdays evenings</option>
                  <option value="weekends">Weekends</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Mentorship Capacity</label>
                <input
                  type="number"
                  name="mentorshipCapacity"
                  min={1}
                  max={10}
                  value={formData.mentorshipCapacity}
                  onChange={handleChange}
                  disabled={!formData.openToMentorship}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </Card>

          <Button type="submit" isLoading={isLoading}>
            Update Profile
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
