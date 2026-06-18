import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alumniAPI } from '../services/apiService';
import { User } from '../types';
import Card from '../components/Card';
import Input from '../components/Input';
import Loading from '../components/Loading';
import { FaSearch, FaMapMarkerAlt, FaBriefcase, FaGraduationCap } from 'react-icons/fa';
import { graduationYears, covenantDepartments } from '../constants/covenantOptions';

const EaglesDirectory: React.FC = () => {
  const [alumni, setAlumni] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    graduationYear: '',
    department: '',
    location: ''
  });

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const response = await alumniAPI.getAll({
        search,
        ...filters
      });
      setAlumni(response.data?.alumni || []);
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchAlumni();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Eagles Directory</h1>

      {/* Search and Filters */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="text"
            placeholder="Search by name, company, job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:col-span-4"
          />
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.graduationYear}
            onChange={(e) => setFilters({ ...filters, graduationYear: e.target.value })}
          >
            <option value="">Graduation Year</option>
            {graduationYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          >
            <option value="">Department</option>
            {covenantDepartments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <Input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
          >
            <FaSearch />
            <span>Search</span>
          </button>
        </form>
      </Card>

      {/* Alumni List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alumni.map((member) => (
          <Card key={member._id}>
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-primary-200 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-primary-700">
                {member.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>

            <div className="space-y-2 text-sm">
              {member.jobTitle && member.company && (
                <div className="flex items-start space-x-2">
                  <FaBriefcase className="text-gray-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">
                    {member.jobTitle} at {member.company}
                  </span>
                </div>
              )}
              {member.graduationYear && member.department && (
                <div className="flex items-start space-x-2">
                  <FaGraduationCap className="text-gray-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">
                    {member.department}, Class of {member.graduationYear}
                  </span>
                </div>
              )}
              {member.location && (
                <div className="flex items-start space-x-2">
                  <FaMapMarkerAlt className="text-gray-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{member.location}</span>
                </div>
              )}
            </div>

            {member.bio && (
              <p className="mt-4 text-sm text-gray-600 border-t pt-3">{member.bio}</p>
            )}

            <div className="mt-4 pt-3 border-t">
              <Link
                to={`/eagles/${member.slug || member._id}`}
                className="text-primary-600 font-semibold hover:underline"
              >
                View Full Profile
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {alumni.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">
            No alumni found. Try adjusting your search criteria.
          </p>
        </Card>
      )}
    </div>
  );
};

export default EaglesDirectory;
