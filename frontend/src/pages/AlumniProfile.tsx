import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { alumniAPI } from '../services/apiService';
import { AlumniProfileData } from '../types';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Button from '../components/Button';
import { FaArrowLeft, FaBriefcase, FaMapMarkerAlt, FaGraduationCap, FaBuilding, FaGlobe, FaLinkedin, FaEnvelope, FaCalendarCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const AlumniProfile: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AlumniProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const response = await alumniAPI.getBySlug(slug);
        setProfile(response.data || null);
      } catch (error) {
        try {
          const fallbackResponse = await alumniAPI.getById(slug);
          setProfile(fallbackResponse.data || null);
        } catch (fallbackError) {
          console.error('Error fetching alumni profile:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [slug]);

  useEffect(() => {
    const alumni = profile?.alumni;
    if (!alumni) {
      return;
    }

    const previousTitle = document.title;
    const previousDescription = (document.head.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content || '';
    const previousOgTitle = (document.head.querySelector('meta[property="og:title"]') as HTMLMetaElement | null)?.content || '';
    const previousOgDescription = (document.head.querySelector('meta[property="og:description"]') as HTMLMetaElement | null)?.content || '';
    const previousOgUrl = (document.head.querySelector('meta[property="og:url"]') as HTMLMetaElement | null)?.content || '';

    const description = `${alumni.name} - ${alumni.jobTitle || alumni.department || 'Alumni'}${alumni.company ? ` at ${alumni.company}` : ''}`;
    const shareUrl = `${window.location.origin}/eagles/${alumni.slug || alumni._id}`;

    document.title = `${alumni.name} | Eagles Platform`;
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', `${alumni.name} | Eagles Platform`);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', shareUrl);

    return () => {
      document.title = previousTitle;
      setMetaTag('meta[name="description"]', 'name', 'description', previousDescription || 'Digital Alumni Relationship Management Platform');
      setMetaTag('meta[property="og:title"]', 'property', 'og:title', previousOgTitle || 'Eagles Platform');
      setMetaTag('meta[property="og:description"]', 'property', 'og:description', previousOgDescription || 'Digital Alumni Relationship Management Platform');
      setMetaTag('meta[property="og:url"]', 'property', 'og:url', previousOgUrl || window.location.origin);
    };
  }, [profile]);

  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/eagles/${profile?.alumni?.slug || profile?.alumni?._id}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied');
    } catch {
      toast.error('Unable to copy profile link');
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!profile?.alumni) {
    return (
      <Card>
        <p className="text-center text-gray-600 py-8">Profile not found.</p>
      </Card>
    );
  }

  const { alumni, activity } = profile;

  const formatDate = (dateValue?: string) => {
    if (!dateValue) {
      return 'N/A';
    }
    return new Date(dateValue).toLocaleDateString();
  };

  const logoCandidates = alumni.companyDomain
    ? [
        alumni.companyLogoUrl,
        `https://unavatar.io/${alumni.companyDomain}`,
        `https://www.google.com/s2/favicons?sz=128&domain=${alumni.companyDomain}`
      ].filter(Boolean) as string[]
    : (alumni.companyLogoUrl ? [alumni.companyLogoUrl] : []);

  const handleLogoFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const index = Number(img.dataset.logoIndex || '0') + 1;
    if (logoCandidates[index]) {
      img.dataset.logoIndex = String(index);
      img.src = logoCandidates[index];
      return;
    }
    img.style.display = 'none';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <FaArrowLeft className="inline mr-2" />
          Back
        </Button>
        <Button onClick={handleCopyProfileLink}>Copy Profile Link</Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="h-28 bg-gradient-to-r from-primary-700 via-primary-600 to-blue-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              {logoCandidates.length > 0 ? (
              <img
                src={logoCandidates[0]}
                data-logo-index="0"
                alt={`${alumni.company || 'Company'} logo`}
                className="w-20 h-20 rounded-xl object-contain bg-white border-2 border-white shadow"
                onError={handleLogoFallback}
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary-200 flex items-center justify-center text-2xl font-bold text-primary-700 border-2 border-white shadow">
                {alumni.name.charAt(0)}
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-gray-800 mt-2">{alumni.name}</h1>
              <p className="text-gray-600 mt-1">{alumni.email}</p>
              {alumni.employmentStatus && (
                <span className="inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {alumni.employmentStatus.replace('-', ' ')}
                </span>
              )}
              {alumni.location && <p className="text-sm text-gray-500 mt-2">{alumni.location}</p>}
            </div>
          </div>

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-center min-w-[110px]">
                <p className="text-xs text-gray-500">Events</p>
                <p className="text-xl font-bold text-gray-800">{activity?.stats.attendedEvents || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-center min-w-[110px]">
                <p className="text-xs text-gray-500">Messages</p>
                <p className="text-xl font-bold text-gray-800">{(activity?.stats.sentMessages || 0) + (activity?.stats.receivedMessages || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Professional Details">
        <div className="space-y-3 text-gray-700">
          {alumni.jobTitle && (
            <p>
              <FaBriefcase className="inline mr-2 text-gray-500" />
              {alumni.jobTitle}
            </p>
          )}
          {alumni.company && (
            <p>
              <FaBuilding className="inline mr-2 text-gray-500" />
              {alumni.company}
            </p>
          )}
          {alumni.companyWebsite && (
            <p>
              <FaGlobe className="inline mr-2 text-gray-500" />
              <a href={alumni.companyWebsite} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                {alumni.companyWebsite}
              </a>
            </p>
          )}
          {alumni.location && (
            <p>
              <FaMapMarkerAlt className="inline mr-2 text-gray-500" />
              {alumni.location}
            </p>
          )}
          {alumni.department && alumni.graduationYear && (
            <p>
              <FaGraduationCap className="inline mr-2 text-gray-500" />
              {alumni.department}, Class of {alumni.graduationYear}
            </p>
          )}
          {alumni.linkedIn && (
            <p>
              <FaLinkedin className="inline mr-2 text-gray-500" />
              <a href={alumni.linkedIn} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                LinkedIn Profile
              </a>
            </p>
          )}
        </div>
      </Card>

      {alumni.bio && (
        <Card title="About">
          <p className="text-gray-700 whitespace-pre-wrap">{alumni.bio}</p>
        </Card>
      )}

      <Card title="Activity & History">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-gray-500 flex items-center gap-2"><FaEnvelope /> Messages Sent</p>
              <p className="font-bold text-gray-800">{activity?.stats.sentMessages || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-gray-500 flex items-center gap-2"><FaCalendarCheck /> Events Attended</p>
              <p className="font-bold text-gray-800">{activity?.stats.attendedEvents || 0}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Timeline</h3>
            <div className="space-y-3">
              {(activity?.timeline || []).map((item, idx) => (
                <div key={`${item.type}-${idx}`} className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600 mt-2" />
                  <div>
                    <p className="font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AlumniProfile;
