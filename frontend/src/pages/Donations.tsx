import React, { useEffect, useState } from 'react';
import { donationsAPI } from '../services/apiService';
import { Donation } from '../types';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { FaDonate, FaPlus } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { formatNaira } from '../utils/currency';

const Donations: React.FC = () => {
  const { isAdmin } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    amount: '',
    paymentMethod: 'credit_card',
    purpose: 'General Fund',
    message: '',
    isAnonymous: false
  });

  useEffect(() => {
    fetchDonations();
  }, [isAdmin]);

  const fetchDonations = async () => {
    try {
      if (isAdmin) {
        const response = await donationsAPI.getAll();
        setDonations(response.data?.donations || []);
      } else {
        const response = await donationsAPI.getMyDonations();
        setDonations(response.data?.donations || []);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await donationsAPI.create({
        amount: Number(donationForm.amount),
        paymentMethod: donationForm.paymentMethod,
        purpose: donationForm.purpose,
        message: donationForm.message,
        isAnonymous: donationForm.isAnonymous
      });
      toast.success('Thank you for your donation!');
      setShowDonateModal(false);
      setDonationForm({
        amount: '',
        paymentMethod: 'credit_card',
        purpose: 'General Fund',
        message: '',
        isAnonymous: false
      });
      fetchDonations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Donation failed');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isAdmin ? 'All Donations' : 'My Donations'}
        </h1>
        {!isAdmin && (
          <Button onClick={() => setShowDonateModal(true)} variant="success">
            <FaPlus className="inline mr-2" />
            Make a Donation
          </Button>
        )}
      </div>

      {/* Donation List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donations.map((donation) => (
          <Card key={donation._id}>
            <div className="flex items-center justify-between mb-4">
              <FaDonate className="text-3xl text-green-600" />
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  donation.paymentStatus === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {donation.paymentStatus}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {formatNaira(donation.amount)}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Purpose:</strong> {donation.purpose || 'General Fund'}
            </p>
            {!donation.isAnonymous && isAdmin && (
              <p className="text-sm text-gray-600 mb-2">
                <strong>Donor:</strong> {(donation.alumniId as any)?.name || 'Unknown'}
              </p>
            )}
            {donation.message && (
              <p className="text-sm text-gray-600 mb-2 italic">"{donation.message}"</p>
            )}
            <p className="text-xs text-gray-500">
              {format(new Date(donation.createdAt), 'PPP')}
            </p>
            {donation.transactionId && (
              <p className="text-xs text-gray-400 mt-2">
                Transaction: {donation.transactionId}
              </p>
            )}
          </Card>
        ))}
      </div>

      {donations.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">
            {isAdmin ? 'No donations yet.' : 'You have not made any donations yet.'}
          </p>
        </Card>
      )}

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Make a Donation</h2>
            <form onSubmit={handleDonate}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Amount (NGN)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Payment Method</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  value={donationForm.paymentMethod}
                  onChange={(e) => setDonationForm({ ...donationForm, paymentMethod: e.target.value })}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Purpose</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={donationForm.purpose}
                  onChange={(e) => setDonationForm({ ...donationForm, purpose: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Message (Optional)</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  value={donationForm.message}
                  onChange={(e) => setDonationForm({ ...donationForm, message: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={donationForm.isAnonymous}
                    onChange={(e) => setDonationForm({ ...donationForm, isAnonymous: e.target.checked })}
                  />
                  <span className="text-gray-700">Make this donation anonymous</span>
                </label>
              </div>
              <div className="flex space-x-4">
                <Button type="submit" variant="success" className="flex-1">
                  Donate
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDonateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Donations;
