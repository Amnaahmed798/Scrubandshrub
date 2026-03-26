'use client';

import { useState, useEffect } from 'react';
import LayoutWrapper from '../components/layout/layout-wrapper';
import { FaUser, FaEdit, FaLock, FaTrash, FaStar, FaDownload, FaSignOutAlt, FaShieldAlt, FaHeadset, FaChevronRight, FaTimes } from 'react-icons/fa';
import { useI18n } from '@/lib/i18n';

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState<{make?: string; model?: string; license_plate?: string}>({});
  const [userRole, setUserRole] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showMembershipDetails, setShowMembershipDetails] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [membershipStatus, setMembershipStatus] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Helper function to get translated benefits for a membership level
  const getBenefitText = (benefitKey: string, params?: Record<string, string>): string => {
    const key = `profile.${benefitKey}`;
    return t(key, params);
  };

  // Benefit text component that handles translation
  const BenefitItem = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start">
      <span className="text-primary mr-2 mt-1">✓</span>
      <span className="text-gray-700">{children}</span>
    </li>
  );

  // Check authentication status and fetch user data
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        // In a real app, you would check for authentication token here
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

        if (token) {
          setIsAuthenticated(true);

          // Fetch user data from the backend using relative URL (Apache reverse proxy)
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
          const response = await fetch(`${apiUrl}/api/v1/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('Profile API response:', userData); // DEBUG
            setName(userData.full_name || userData.name || '');
            setEmail(userData.email || '');
            setPhone(userData.phone_number || '');
            setCnic(userData.cnic_id || '');
            setServiceArea(userData.service_area || '');
            setProfilePicture(userData.profile_picture || '');
            setVehicleDetails(
              typeof userData.vehicle_details === 'object' && userData.vehicle_details
                ? {
                    make: userData.vehicle_details.make || userData.vehicle_details.vehicle_type || '',
                    model: userData.vehicle_details.model || userData.vehicle_details.vehicle_model || '',
                    license_plate: userData.vehicle_details.license_plate || ''
                  }
                : { make: '', model: '', license_plate: '' }
            );
            setUserRole(userData.role || '');

            // Set membership status based on user data
            if (userData.membership_type) {
              setMembershipStatus(userData.membership_type);
              setIsPremium(true); // Any membership is considered premium
            } else if (userData.membership && userData.membership.type) {
              setMembershipStatus(userData.membership.type);
              setIsPremium(true); // Any membership is considered premium
            } else {
              setMembershipStatus('');
              setIsPremium(false);
            }
          } else {
            // Handle specific error cases
            if (response.status === 401) {
              // Token is invalid or expired, clear it
              localStorage.removeItem('access_token');
              sessionStorage.removeItem('access_token');
              setIsAuthenticated(false);
              setName('');
              setEmail('');
              setPhone('');
              setMembershipStatus('');
              setIsPremium(false);
            } else {
              // Other error occurred
              setName('');
              setEmail('');
              setPhone('');
              setMembershipStatus('');
              setIsPremium(false);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication or fetching user data:', error);
        setIsAuthenticated(false);
        setName('');
        setEmail('');
        setPhone('');
        setMembershipStatus('Basic Plan');
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      if (!token) {
        alert(t('profile.mustLogin'));
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: name,
          email: email,
          phone_number: phone,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        alert(t('profile.saveSuccess'));
      } else {
        alert(t('profile.saveFailed'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(t('profile.saveError'));
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingPicture(true);
      setUploadError('');

      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/profile/upload-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setProfilePicture(result.data.profile_picture || '');
        // Reset file input
        if (e.target) {
          e.target.value = '';
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setUploadError(errorData.detail || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setUploadError('An error occurred while uploading the image');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send the password change request to the backend
    setShowChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send the support request to the backend
    setShowSupport(false);
    setSupportMessage('');
  };

  const handleSignOut = () => {
    // In a real app, you would handle the sign out process
    console.log('Signing out...');
  };

  const handleCancelMembership = async () => {
    if (window.confirm(t('profile.confirmCancelMembership'))) {
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) {
          throw new Error('User not authenticated');
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        // Update the user's profile to remove the membership
        const response = await fetch(`${apiUrl}/api/v1/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            membership_type: 'Basic Plan',
            membership_status: 'inactive'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        setIsPremium(false);
        setMembershipStatus('Basic Plan');
        alert(t('profile.membershipCancelledSuccess'));
      } catch (error) {
        console.error('Error cancelling membership:', error);
        alert(t('profile.membershipCancelledFailed'));
      }
    }
  };

  const handlePlanChange = (newPlan: string) => {
    setMembershipStatus(newPlan);
    if (newPlan !== 'Basic Plan') {
      setIsPremium(true);
    } else {
      setIsPremium(false);
    }
  };

  // Function to update membership status in the backend
  const updateMembershipStatus = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membership_type: newStatus,
          membership_status: newStatus !== 'Basic Plan' ? 'active' : 'inactive'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update membership status');
      }

      const result = await response.json();
      console.log('Membership status updated successfully:', result);
    } catch (error) {
      console.error('Error updating membership status:', error);
      alert(t('profile.membershipUpdateFailed'));
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm(t('profile.confirmDeleteAccount'))) {
      // In a real app, you would send the delete account request to the backend
      console.log('Deleting account...');
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear your saved data?')) {
      // In a real app, you would clear user preferences/data
      console.log('Clearing data...');
    }
  };

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 pb-16">
        <div className="w-full max-w-md mx-auto px-3 sm:px-4 pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 sm:h-64">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
            </div>
          ) : isAuthenticated ? (
            <>
              {/* Profile Header */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <div className="relative flex-shrink-0 group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="text-white text-xl sm:text-2xl" />
                      )}
                    </div>
                    <button
                      onClick={() => document.getElementById('profilePictureInput')?.click()}
                      disabled={isUploadingPicture}
                      className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-secondary transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingPicture ? (
                        <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <FaEdit className="text-white text-xs sm:text-sm" />
                      )}
                    </button>
                    <input
                      id="profilePictureInput"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      disabled={isUploadingPicture}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{name}</h2>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{email}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto bg-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-secondary transition-colors active:scale-95"
                  >
                    {t('profile.editProfile')}
                  </button>
                </div>
              </div>

              {/* Upload Error Message */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 mb-3 sm:mb-4 rounded-lg text-xs sm:text-sm">
                  {uploadError}
                </div>
              )}

              {/* Account Card */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 shadow-sm border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">{t('profile.accountDetails')}</h3>

                {/* Account Details Section */}
                <div className="mb-3 sm:mb-4">
                  <button
                    onClick={() => setShowAccountDetails(!showAccountDetails)}
                    className="w-full text-left p-2.5 sm:p-3 md:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors active:scale-98"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">{t('profile.accountDetails')}</span>
                      <FaChevronRight className={`text-gray-500 w-4 h-4 sm:w-5 sm:h-5 transition-transform flex-shrink-0 ${showAccountDetails ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Account Details Content - Collapsible */}
                  {showAccountDetails && (
                    <div className="mt-3 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200">
                      <div className="space-y-3">
                        <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.name')}</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                            />
                          ) : (
                            <p className="text-sm sm:text-base text-gray-900 font-medium">{name}</p>
                          )}
                        </div>

                        <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.email')}</label>
                          {isEditing ? (
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                            />
                          ) : (
                            <p className="text-sm sm:text-base text-gray-900 font-medium">{email}</p>
                          )}
                        </div>

                        <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.phone')}</label>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                            />
                          ) : (
                            <p className="text-sm sm:text-base text-gray-900 font-medium">{phone}</p>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="flex space-x-2 sm:space-x-3 pt-2">
                            <button
                              onClick={handleSave}
                              className="flex-1 bg-primary text-white py-2 px-3 sm:px-4 rounded-lg text-sm font-medium hover:bg-secondary hover:text-primary"
                            >
                              {t('common.save')}
                            </button>
                            <button
                              onClick={() => setIsEditing(false)}
                              className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 sm:px-4 rounded-lg text-sm font-medium hover:bg-gray-200"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="w-full mt-3 bg-primary/10 text-primary py-2 px-4 rounded-lg text-sm font-medium hover:bg-secondary hover:text-secondary border border-primary/30"
                          >
                            {t('profile.editProfile')}
                          </button>
                        )}
                      </div>

                      {/* Washer Information Section - Only show for washers */}
                      {userRole === 'WASHER' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">{t('profile.vehicleDetails')}</h4>
                          <div className="space-y-2 sm:space-y-3">
                            <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.serviceArea')}</label>
                              <p className="text-xs sm:text-sm text-gray-900 font-medium">{serviceArea || 'Not set'}</p>
                            </div>
                            <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.cnic')}</label>
                              <p className="text-xs sm:text-sm text-gray-900 font-medium">{cnic || 'Not set'}</p>
                            </div>
                            <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.make')}</label>
                              <p className="text-xs sm:text-sm text-gray-900 font-medium">{vehicleDetails.make || 'Not set'}</p>
                            </div>
                            <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.model')}</label>
                              <p className="text-xs sm:text-sm text-gray-900 font-medium">{vehicleDetails.model || 'Not set'}</p>
                            </div>
                            <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.licensePlate')}</label>
                              <p className="text-xs sm:text-sm text-gray-900 font-medium">{vehicleDetails.license_plate || 'Not set'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Change Password Section */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowChangePassword(true)}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-medium text-gray-900 text-sm sm:text-base">{t('common.changePassword')}</span>
                          <FaChevronRight className="text-gray-500 w-4 h-4" />
                        </button>
                      </div>

                      {/* Delete Account Button */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={handleDeleteAccount}
                          className="w-full bg-red-50 text-red-600 py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-100 flex items-center justify-center"
                        >
                          <FaTrash className="mr-2 w-4 h-4" />
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-3 sm:mb-4">
                  <button
                    onClick={() => setShowMembershipDetails(!showMembershipDetails)}
                    className="w-full text-left p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{t('profile.membership')}</span>
                    <FaChevronRight className={`text-gray-500 w-4 h-4 sm:w-5 sm:h-5 transition-transform ${showMembershipDetails ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Membership Details Content - Collapsible */}
                  {showMembershipDetails && (
                    <div className="mt-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.membershipStatus')}</label>
                          <p className="text-base sm:text-lg font-semibold text-gray-900">{membershipStatus}</p>
                        </div>

                        <div className="p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('profile.membershipStatus')}</label>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                              isPremium
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isPremium ? t('profile.membershipStatus') : t('profile.basicPlan')}
                            </span>
                          </div>
                        </div>

                        {isPremium ? (
                          <>
                            <div className="p-4 bg-white rounded-lg shadow-sm">
                              <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">{t('profile.benefits')}</label>
                              <ul className="space-y-2">
                                {membershipStatus.toLowerCase() === 'silver' && (
                                  <>
                                    <BenefitItem>{t('profile.benefitDiscountAll', { percentage: '10' })}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitPriorityBooking')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitFreeCancellation')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitBasicAccess')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitLoyaltyMultiplier', { x: '1.2' })}</BenefitItem>
                                  </>
                                )}
                                {membershipStatus.toLowerCase() === 'gold' && (
                                  <>
                                    <BenefitItem>{t('profile.benefitDiscountAll', { percentage: '20' })}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitExtendedCancellation')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitExtendedAccess')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitComplimentaryBasic')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitLoyaltyMultiplier', { x: '1.5' })}</BenefitItem>
                                  </>
                                )}
                                {(membershipStatus.toLowerCase() === 'platinum' || membershipStatus.toLowerCase() === 'premium' || membershipStatus.toLowerCase() === 'vip') && (
                                  <>
                                    <BenefitItem>{t('profile.benefitDiscountAll', { percentage: '30' })}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitHighestPriority')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitAnytimeCancellation')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitPremiumAccess')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitLoyaltyMultiplier', { x: '2' })}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitComplimentaryPremium')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitQuarterlyAssessments')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitEarlyAccess')}</BenefitItem>
                                    <BenefitItem>{t('profile.benefitPersonalAdvisor')}</BenefitItem>
                                  </>
                                )}
                              </ul>
                            </div>

                            <button
                              onClick={handleCancelMembership}
                              className="w-full bg-white text-red-600 py-3 px-4 rounded-lg font-medium border border-red-200 hover:bg-red-50 flex items-center justify-center transition-colors"
                            >
                              <FaTrash className="mr-2" />
                              {t('profile.cancelMembership')}
                            </button>
                          </>
                        ) : (
                          // No membership - show option to get membership
                          <div className="p-4 bg-white rounded-lg shadow-sm">
                            <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">{t('profile.membershipDetails')}</label>
                            <p className="text-gray-600 text-sm mb-4">Join our membership program to enjoy exclusive benefits and discounts.</p>

                            <select
                              value={membershipStatus}
                              onChange={(e) => handlePlanChange(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white mb-3"
                            >
                              <option value="">Select a membership plan</option>
                              <option value="Silver">Silver Plan - SAR 89/month</option>
                              <option value="Gold">Gold Plan - SAR 149/month</option>
                              <option value="Platinum">Platinum Plan - SAR 199/month</option>
                            </select>

                            <button
                              onClick={async () => {
                                if (!membershipStatus) {
                                  alert('Please select a membership plan first');
                                  return;
                                }
                                // In a real app, this would handle the payment and plan upgrade
                                try {
                                  await updateMembershipStatus(membershipStatus);
                                  alert(`Plan changed to ${membershipStatus}. In a real app, payment would be processed.`);
                                  // Update the UI to reflect premium status
                                  setIsPremium(true);
                                } catch (error) {
                                  console.error('Error updating membership:', error);
                                }
                              }}
                              className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-secondary hover:text-primary"
                            >
                              {t('profile.membershipDetails')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Card */}
              <div className="bg-white rounded-2xl p-4 md:p-6 mb-3 md:mb-4 shadow-sm border border-gray-100">
                <h3 className="text-lg md:text-base font-semibold mb-3 md:mb-4 text-gray-900">{t('common.privacyPolicy')}</h3>

                <div className="mb-2 md:mb-3">
                  <a href="/privacy" className="block">
                    <button className="w-full text-left p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-between gap-2 active:scale-98">
                      <span className="font-medium text-gray-900 text-sm md:text-base">{t('common.privacyPolicy')}</span>
                      <FaChevronRight className="text-gray-500 flex-shrink-0" />
                    </button>
                  </a>
                </div>

                <button
                  onClick={() => setShowSupport(true)}
                  className="w-full text-left p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-between gap-2 active:scale-98"
                >
                  <span className="font-medium text-gray-900 text-sm md:text-base">{t('profile.contactSupport')}</span>
                  <FaChevronRight className="text-gray-500 flex-shrink-0" />
                </button>
              </div>

              {/* Sign Out Section */}
              <div className="bg-white rounded-2xl p-4 md:p-6 mb-20 md:mb-4 shadow-sm border border-gray-100">
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 text-white py-4 md:py-3 px-4 md:px-6 rounded-xl font-bold text-base md:text-lg hover:bg-red-700 active:bg-red-800 transition-colors active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <FaSignOutAlt className="text-lg md:text-base" />
                    {t('common.navLogout')}
                  </div>
                </button>
              </div>
            </>
          ) : (
            // Not authenticated - show welcome message
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 text-center w-full max-w-sm">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <FaUser className="text-white text-4xl sm:text-5xl" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome to Sandpiper</h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                  Your premium car wash & cleaning services app
                </p>
                <p className="text-xs text-gray-500 mb-6 sm:mb-8">
                  Login to access your profile and bookings
                </p>
                <div className="space-y-3">
                  <a href="/login" className="block">
                    <button className="w-full bg-primary text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl text-sm sm:text-base font-bold hover:bg-secondary hover:text-primary active:scale-95 transition-all">
                      {t('common.navLogin')}
                    </button>
                  </a>
                  <a href="/register" className="block">
                    <button className="w-full bg-white text-gray-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl text-sm sm:text-base font-bold border-2 border-gray-300 hover:bg-gray-50 active:scale-95 transition-all">
                      {t('common.navRegister')}
                    </button>
                  </a>
                </div>
                <p className="text-xs text-gray-400 mt-6">
                  Join thousands of satisfied customers
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('common.changePassword')}</h2>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('common.currentPassword')}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('common.newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('common.confirmPassword')}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium hover:bg-secondary hover:text-primary"
                >
                  {t('common.submit')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Support Modal */}
        {showSupport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('profile.contactSupport')}</h2>
                <button
                  onClick={() => setShowSupport(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSupportSubmit} className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('profile.sendMessage')}</label>
                  <textarea
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    placeholder={t('profile.sendMessage')}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium hover:bg-secondary hover:text-primary"
                >
                  {t('profile.sendMessage')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}

